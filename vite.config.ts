import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the CertStudyHub platform. The frontend is static; the
// auth/progress API is a separate Node service proxied under /api.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // In development, proxy API calls to the local backend. In production nginx
    // performs the equivalent reverse proxy for /api.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
