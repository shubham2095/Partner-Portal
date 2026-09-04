# Digital Marketing Partner Portal

Full-stack partner sales platform (Phases 0–7 complete, plus a post-7
enhancement pass — see `memory.md` §16).

## Stack

- Frontend: React 19, Vite 8, Tailwind CSS 3 (dark mode), React Router DOM 7, Zustand, react-hook-form, react-hot-toast, framer-motion, recharts, axios, lucide-react. Fonts: Inter + Plus Jakarta Sans (Google Fonts).
- Backend: Node.js, Express 5, MySQL (mysql2), JWT, bcryptjs, multer, nodemailer, express-validator, cors, helmet, express-rate-limit, PDFKit, qrcode, node-cron, google-auth-library.
- Database: MySQL (XAMPP / phpMyAdmin locally; Hostinger-managed in production).
- Auth: email + password with **enforced email verification** for freelancers, plus **Google Sign-In**.

## Getting started

### 1. Database

Start MySQL (e.g. via XAMPP), then run migrations:

```bash
cd server
cp .env.example ../server/.env   # or edit server/.env directly
npm run migrate
```

### 2. Backend

```bash
cd server
npm install
npm run dev
```

Runs at `http://localhost:5000`, API base `http://localhost:5000/api/v1`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### 4. Verify

Open `http://localhost:5173` — the landing page shows an "API status" badge that
calls `GET /api/v1/health` and reports Online/Offline.

## Project structure

See `architecture.md` for the full folder structure and technology decisions.

## Specification files

- `prd.md` — product requirements
- `architecture.md` — technical architecture
- `rules.md` — development rules
- `phases.md` — implementation phases
- `design.md` — design system
- `memory.md` — persistent project memory/source of truth (see **§16** for everything added after Phase 7)
- `HOSTINGER_DEPLOYMENT.md` — production deployment guide

## Extra environment variables (post-Phase-7)

```bash
# Google Sign-In (OAuth 2.0 Web client id — not a secret)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com   # client/.env — baked in at build

# Email (required for freelancer email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM_NAME=Heltog Partner Portal
SMTP_FROM_EMAIL=you@gmail.com

# Production only
RATE_LIMIT_MAX_REQUESTS=1500   # 100 is far too low for an authenticated SPA
```

Run `npm run migrate` (or apply migration `0057`) after pulling — it adds
`auth_provider` / `google_sub` to `users`.
