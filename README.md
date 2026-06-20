# CertStudyHub — Multi-Certification Study Platform

A production-quality, **multi-certification** study platform with user accounts
and server-synced progress. Ships two hubs of **original** content — **Microsoft
AZ-104** (Azure Administrator) and **CompTIA Security+ (SY0-701)** — and is built
to add more.

- **Frontend:** React 19 + Vite + TypeScript + TailwindCSS + Framer Motion +
  @dnd-kit + Zustand + Recharts.
- **Backend** (`server/`): Node + Express + SQLite (`better-sqlite3`) with
  `bcryptjs`-hashed passwords and JWT-in-httpOnly-cookie auth.
- **Auth + sync:** register/login; exam history, flashcard progress, and results
  persist per account, per certification, so they follow you across devices.
  localStorage is used as an offline cache.

All questions, flashcards and case studies are **original** content written for
this project.

---

## Features

- **Randomized exam engine** — choose 25 / 40 / 65 / 100 questions, weighted to
  the official AZ-104 domain blueprint, with optional domain/difficulty filters.
- **Every question type** — single choice, multi-select, choose-2, choose-3,
  Yes/No configuration tables, drag-and-drop **ordering**, drag-and-drop
  **matching**, and full **case study** layout (left tab nav + right scenario
  pane + center question, like the real exam).
- **Exam UX** — countdown timer, confidence rating (1–5★), bookmark, flag,
  color-coded question palette, progress bar, keyboard shortcuts
  (`A`–`F` answer, `N`/`P` navigate, `B` bookmark, `F` flag), and
  **auto-save / resume after refresh**.
- **Review screen** before submission with answered / unanswered / flagged /
  bookmarked counts and a confirmation modal.
- **Accounts & multi-cert** — open registration, then choose a certification
  hub. Each cert tracks its own progress and uses its own scoring (AZ-104:
  x/1000, pass 700 · Security+: x/900, pass 750).
- **Results** — vendor-specific scaled score, pass/fail, per-domain bar chart,
  weakest objectives, full per-question explanations, retry, and JSON export.
- **Analytics** — score trend (line), domain mastery (radar), study-streak
  heatmap, and headline totals.
- **Flashcards** — simplified **SM-2 spaced repetition**, 3D flip animation,
  domain filter, shuffle, due-first queue, New → Learning → Review → Mastered.
- **Settings** — dark/light theme, timer toggle, font size, instant feedback,
  reset-with-confirmation, and full data export/import.

---

## 1. Install

> Requires Node.js 18+ and npm.

```bash
npm install
```

This installs all dependencies:

```
react react-dom react-router-dom zustand framer-motion recharts
@dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities
# dev: vite @vitejs/plugin-react typescript tailwindcss postcss autoprefixer
#      @types/react @types/react-dom
```

## 2. Run

```bash
# Backend API (terminal 1)
cd server && npm install && JWT_SECRET=dev-secret npm start   # http://127.0.0.1:3001

# Frontend (terminal 2) — Vite proxies /api to the backend in dev
npm run dev      # start the dev server (opens http://localhost:5173)
npm run build    # type-check (tsc --noEmit) and produce a production build in dist/
npm run preview  # preview the production build
npm run lint     # type-check only (tsc --noEmit)
```

## Deployment (single Linux host)

The reference deployment serves the static build via **nginx over HTTPS** and
runs the API as a **systemd** service behind an nginx `/api` reverse proxy.

1. **Build the frontend:** `npm install && npm run build` → deploy `dist/` to the
   nginx web root (e.g. `/var/www/cert-study-hub`).
2. **Backend:** `cd server && npm install`. Provide env (see
   [`server/.env.example`](server/.env.example)) via an `EnvironmentFile`, set
   `COOKIE_SECURE=true` when on HTTPS, and run `node server/index.js` under
   systemd as a non-root user. Store the SQLite DB outside the repo (e.g.
   `/var/lib/cert-study-hub/data.sqlite`).
3. **nginx:** reverse-proxy `location /api/` → `http://127.0.0.1:3001`, serve the
   SPA with `try_files $uri $uri/ /index.html`, terminate TLS, and redirect
   HTTP → HTTPS. For a public domain, use a Let's Encrypt certificate; for a
   LAN/IP-only host, a self-signed certificate (with the IP in `subjectAltName`)
   provides encryption.

> Security: registration is open by default. Before exposing the app publicly,
> serve it over HTTPS (so the `Secure` session cookie applies), set a strong
> persistent `JWT_SECRET`, and consider restricting registration.

You can also validate the seed-data integrity at any time:

```bash
node scripts/validate-data.mjs
```

---

## 3. How to add new questions

Add objects to [`src/data/questions.json`](src/data/questions.json). Schema:

```jsonc
{
  "id": "q-net-13",                       // unique, kebab-case
  "domain": "Networking",                 // must match a name in domains.json
  "domainWeight": 23,
  "difficulty": "medium",                 // easy | medium | hard
  "objective": "Configure and manage virtual networks",
  "type": "single",                       // see types below
  "question": "…",
  "answers": [{ "id": "a", "text": "…" }],// for choice types
  "correct": ["a"],                       // answer ids (NOT indexes)
  "explanation": "…",
  "references": ["https://learn.microsoft.com/…"],
  "tags": ["vnet"],
  "estimatedTime": 75                     // seconds
}
```

**Per-type extra fields**

| `type`      | Required fields                                                        |
| ----------- | --------------------------------------------------------------------- |
| `single`    | `answers`, `correct` (exactly 1)                                       |
| `multi`     | `answers`, `correct` (1+)                                              |
| `choose2`   | `answers`, `correct` (exactly 2)                                       |
| `choose3`   | `answers`, `correct` (exactly 3)                                       |
| `yesno`     | `statements: [{ id, text, correct:boolean }]`                         |
| `ordering`  | `steps: [{ id, text }]` (correct order), `correctOrder: [stepId,…]`    |
| `matching`  | `terms`, `definitions`, `correctPairs: [{ termId, definitionId }]`    |
| `casestudy` | like `single`/`multi`, plus `caseStudyId` (lives inside a case study)  |

After editing, run `node scripts/validate-data.mjs` to confirm integrity
(counts, distribution, and referential checks).

## 4. How to add new case studies

Add an object to [`src/data/caseStudies.json`](src/data/caseStudies.json):

```jsonc
{
  "id": "cs-acme",
  "title": "Acme Cloud Adoption",
  "summary": "…",
  "domain": "Compute",
  "sections": [                           // tabs shown in the left nav
    { "id": "overview", "title": "Overview", "body": "Paragraph.\n- bullet" }
  ],
  "questionIds": ["cs-acme-q1"],          // must equal the embedded question ids
  "questions": [                          // full question objects, type:"casestudy"
    { "id": "cs-acme-q1", "caseStudyId": "cs-acme", "type": "casestudy", … }
  ]
}
```

`QuestionService` automatically flattens `questions` into the global pool, so
case study questions appear in exams when "Include case study questions" is on.

---

## 5. Folder structure

```
src/
  components/
    Analytics/      ActivityHeatmap.tsx        # study-streak calendar
    CaseStudy/      CaseStudyLayout.tsx        # exam-style 3-pane layout
    Charts/         Charts.tsx                 # Recharts wrappers
    Dashboard/      DashboardStats.tsx, RecentExams.tsx
    Exam/           QuestionCard.tsx, ExamControls.tsx
    Flashcards/     FlashcardDeck.tsx, FlashcardCard.tsx
    QuestionPalette/QuestionPalette.tsx
    QuestionTypes/  SingleChoice, MultiSelect, YesNoGrid, Ordering,
                    Matching, QuestionRenderer, types.ts
    Results/        ResultsScreen.tsx, DomainBreakdown.tsx
    Review/         ReviewScreen.tsx, Explanation.tsx
    Settings/       SettingsPanel.tsx
    Sidebar/        Sidebar.tsx                # rail (desktop) + bottom tabs (mobile)
    Timer/          Timer.tsx
    common/         ui.tsx                     # Card, badges, stars, progress, tiles
  context/          ExamContext.tsx            # exam facade provider
  data/             questions.json, flashcards.json, caseStudies.json, domains.json
  hooks/            useExam.ts, useTimer.ts, useQuestions.ts, useLocalStorage.ts
  pages/            Home, Exam, Review, Results, Flashcards, Statistics, Settings
  services/         QuestionService.ts, ExamGenerator.ts, AnalyticsService.ts,
                    SpacedRepetition.ts
  store/            useAppStore.ts             # Zustand + localStorage persistence
  types/            Question.ts, CaseStudy.ts, Exam.ts, Flashcard.ts
  App.tsx, main.tsx, index.css
scripts/            validate-data.mjs
```

### Architecture notes

- **State** — a single Zustand store (`src/store/useAppStore.ts`) persisted to
  `localStorage` is the source of truth (settings, exam history, the active
  session, and flashcard SM-2 progress). Hooks (`useExam`) and `ExamContext`
  are thin facades over it.
- **Grading** is partial-credit aware: multi/yesno/ordering/matching award a
  0–1 score, which feeds the overall percentage and the 1–1000 scaled score.
- **Offline-first** — everything is bundled; the app works with no network.
