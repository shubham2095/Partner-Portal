# Digital Marketing Partner Portal

Phase 0 — Foundation & Project Setup.

## Stack

- Frontend: React 18, Vite, Tailwind CSS 3, React Router DOM, Zustand, react-hook-form, react-hot-toast, framer-motion, recharts, axios
- Backend: Node.js, Express, MySQL (mysql2), JWT, bcryptjs, multer, nodemailer, express-validator, cors, helmet, PDFKit, qrcode
- Database: MySQL (XAMPP / phpMyAdmin)

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
- `memory.md` — persistent project memory/source of truth
