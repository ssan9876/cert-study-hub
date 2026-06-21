# Connecting a Web Server to a Cloudflare Tunnel

A practical, reproducible guide for publishing a self-hosted web app (a static
SPA + an API) to the internet through a **Cloudflare Tunnel** — including the fix
for the common **`ERR_TOO_MANY_REDIRECTS`** loop.

This is the exact setup used to publish CertStudyHub from a LAN VM to a public
hostname. Replace the placeholders with your own values:

| Placeholder | Meaning | Example |
| --- | --- | --- |
| `<ORIGIN_IP>` | LAN IP of the server running nginx | `192.0.2.10` |
| `<DOMAIN>` | Public hostname routed by the tunnel | `app.example.com` |
| `<APP_DIR>` | Built SPA web root | `/var/www/myapp` |
| `<API_PORT>` | Local port the API listens on | `3001` |

> **No secrets are stored in this repo.** The JWT secret, TLS private key, the
> database, and the Cloudflare tunnel token all live only on the server. Generate
> your own as shown below.

---

## Architecture

```
Browser ──HTTPS──▶ Cloudflare edge ──(encrypted tunnel)──▶ cloudflared ──HTTP/HTTPS──▶ nginx (origin)
                                                                                   ├── /        → static SPA
                                                                                   └── /api/*   → Node API (localhost:<API_PORT>)
```

- **Cloudflare terminates public TLS** at its edge; the browser only ever speaks
  HTTPS to Cloudflare.
- **`cloudflared`** holds an outbound-only connection to Cloudflare, so the origin
  needs **no inbound ports open to the internet** and no public IP.
- **nginx** serves the static build and reverse-proxies `/api` to the local API.

---

## 1. Serve the app with nginx

Build the frontend and copy it to the web root (`<APP_DIR>`), then run the API as
a service (example uses systemd + a Node/Express service on `<API_PORT>`).

### API as a systemd service

Store config/secrets in an `EnvironmentFile` (root-only), never in the repo:

```bash
# /etc/myapp.env  (chmod 600)
JWT_SECRET=<paste output of: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
PORT=<API_PORT>
HOST=127.0.0.1
DB_PATH=/var/lib/myapp/data.sqlite
COOKIE_SECURE=true   # cookie is Secure because the public connection is HTTPS
```

```ini
# /etc/systemd/system/myapp-api.service
[Unit]
Description=MyApp API
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/myapp/server
EnvironmentFile=/etc/myapp.env
ExecStart=/usr/bin/node /opt/myapp/server/index.js
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/myapp

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now myapp-api
```

### (Optional) self-signed TLS on the origin

Useful if you also want HTTPS for direct LAN access, or if you point the tunnel at
the origin over HTTPS. Not required when the tunnel uses the HTTP origin.

```bash
sudo install -d -m 700 /etc/ssl/myapp
sudo openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout /etc/ssl/myapp/key.pem -out /etc/ssl/myapp/cert.pem -days 3650 \
  -subj "/CN=<ORIGIN_IP>" -addext "subjectAltName=IP:<ORIGIN_IP>,DNS:<DOMAIN>"
sudo chmod 600 /etc/ssl/myapp/key.pem
```

### nginx config

Shared serving block (`/etc/nginx/snippets/myapp-app.conf`):

```nginx
root <APP_DIR>;
index index.html;

location /api/ {
    proxy_pass http://127.0.0.1:<API_PORT>;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    try_files $uri $uri/ /index.html;   # SPA fallback for client-side routes
}

location /assets/ {
    try_files $uri =404;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/javascript application/json image/svg+xml;
```

Site (`/etc/nginx/sites-available/myapp`):

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name <DOMAIN> _;

    # KEY LINE (see "Fixing too many redirects" below): serve Cloudflare traffic
    # directly; only redirect direct plain-HTTP LAN visitors to HTTPS.
    if ($http_cf_connecting_ip = "") {
        return 301 https://$host$request_uri;
    }

    include snippets/myapp-app.conf;
}

server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    http2 on;
    server_name <DOMAIN> _;

    ssl_certificate     /etc/ssl/myapp/cert.pem;
    ssl_certificate_key /etc/ssl/myapp/key.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    include snippets/myapp-app.conf;
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/myapp
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## 2. Create the Cloudflare Tunnel

You can use the dashboard (Zero Trust → Networks → Tunnels) or the CLI. The
tunnel makes an **outbound** connection, so no firewall/router changes are needed.

### Dashboard (remotely-managed tunnel)

1. **Zero Trust → Networks → Tunnels → Create a tunnel** (Cloudflared type).
2. Install the connector on a host that can reach `<ORIGIN_IP>` (it can be the
   web server itself or any other box on the LAN). The dashboard gives you an
   install command containing a **tunnel token — keep it secret**.
3. **Public Hostnames → Add a public hostname:**
   - **Subdomain/Domain** → `<DOMAIN>`
   - **Service** → `http://<ORIGIN_IP>:80`  *(recommended, simplest)*
     - or `https://<ORIGIN_IP>:443` **with** *Additional application settings →
       TLS → **No TLS Verify = ON*** (required for a self-signed origin cert).

Cloudflare automatically creates the `CNAME` DNS record for `<DOMAIN>` → the
tunnel.

### CLI (locally-managed tunnel) — equivalent `config.yml`

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /etc/cloudflared/<TUNNEL_UUID>.json   # secret — do not commit

ingress:
  - hostname: <DOMAIN>
    service: http://<ORIGIN_IP>:80
    # For an HTTPS origin with a self-signed cert use instead:
    # service: https://<ORIGIN_IP>:443
    # originRequest:
    #   noTLSVerify: true
  - service: http_status:404
```

```bash
cloudflared tunnel route dns <TUNNEL_UUID> <DOMAIN>
sudo systemctl enable --now cloudflared
```

---

## 3. Fixing `ERR_TOO_MANY_REDIRECTS`

This is the most common failure when fronting an origin with a tunnel.

### Why it happens

The browser ↔ Cloudflare connection is **HTTPS**, but the tunnel typically
reaches the origin over **HTTP** (`http://<ORIGIN_IP>:80`). If the origin blindly
redirects **all** HTTP to HTTPS:

```
browser →(https)→ Cloudflare →(tunnel, http)→ origin
origin responds: 301 → https://<DOMAIN>/
browser →(https)→ Cloudflare →(tunnel, http)→ origin → 301 → … ∞   ← loop
```

### The fix (origin-side, used here)

Cloudflare sets the **`CF-Connecting-IP`** header on every request it proxies.
Use it to tell tunnel traffic apart from direct LAN traffic:

```nginx
# Serve Cloudflare traffic (already HTTPS at the edge); only redirect
# direct plain-HTTP visitors to HTTPS.
if ($http_cf_connecting_ip = "") {
    return 301 https://$host$request_uri;
}
```

Result: tunnel requests are **served (200)** with no redirect, while a human
typing `http://<ORIGIN_IP>` on the LAN is still pushed to HTTPS.

### Alternative fixes

- **Point the tunnel at the HTTPS origin** (`https://<ORIGIN_IP>:443` + No TLS
  Verify) so the origin never needs to redirect.
- **Remove the origin redirect entirely** and enable **Cloudflare → SSL/TLS →
  Edge Certificates → "Always Use HTTPS"** so the edge enforces HTTPS.
- If you use a *proxied DNS record* instead of a tunnel, also set **SSL/TLS mode
  to "Full"** (not "Flexible") — "Flexible" causes the same loop.

---

## 4. Verify

From any host that can reach the origin, simulate what the tunnel sends:

```bash
# Cloudflare-style request MUST return 200 with 0 redirects (no loop):
curl -s -o /dev/null -w "%{http_code} redirects=%{num_redirects}\n" \
  -L --max-redirs 5 \
  -H "Host: <DOMAIN>" -H "CF-Connecting-IP: 203.0.113.50" \
  http://<ORIGIN_IP>/

# Direct plain-HTTP LAN visitor SHOULD redirect to HTTPS:
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" \
  -H "Host: <DOMAIN>" http://<ORIGIN_IP>/

# API health through the same path:
curl -s -H "Host: <DOMAIN>" -H "CF-Connecting-IP: 203.0.113.50" \
  http://<ORIGIN_IP>/api/health
```

Then load `https://<DOMAIN>` in a browser.

---

## Security checklist

- [ ] `JWT_SECRET` is long, random, and only in the server's env file (not the repo).
- [ ] TLS private key (`/etc/ssl/myapp/key.pem`) and the SQLite DB are outside the repo.
- [ ] The Cloudflare **tunnel token / credentials file** is never committed.
- [ ] Session cookies are `HttpOnly; Secure; SameSite=Lax` (the public connection is HTTPS).
- [ ] The origin has **no inbound internet ports** open — only the outbound tunnel.
- [ ] Consider Cloudflare **Access** policies if the app should not be fully public.
