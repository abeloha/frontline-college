# Frontline College of Medical and Health Sciences

A full admissions platform for Frontline College — a private tertiary healthcare training
institute in Chikuku, Kuje Area Council, FCT Abuja. Built as a modern marketing site with a real
online application, applicant portal, and admin review workflow behind it.

- **`/frontend`** — Next.js 16 (App Router, TypeScript, Tailwind CSS v4, Framer Motion, GSAP-ready, Lenis smooth scroll)
- **`/backend`** — Go API (Gin, GORM, MySQL, JWT auth, go-mail)

## What's included

**Marketing site** — Home, About, Programmes (list + detail), Admissions process, Contact —
all served from real content in the database (seeded from `docs/about.md` and the admissions
flyer), with a motion-driven, non-template design (custom cursor, scroll reveals, animated hero,
bento-grid facilities gallery, marquee admissions CTA).

**Online application** (`/apply`) — a free, four-step application wizard (programme → personal
details → academic background → account creation). No payment is required to submit.

**Applicant portal** (`/login`, `/portal`) — after applying, students log in to:
- track their application status on a visual timeline
- view the (configurable) application-fee bank account details and upload proof of payment
- download their admission letter once accepted, and accept the offer
- view school-fee account details and upload proof of school-fee payment once admitted

**Admin portal** (`/admin/login`, `/admin`) — admissions staff can:
- see dashboard stats and a searchable/filterable table of every application
- verify or reject uploaded payment proofs (application fee and school fee)
- accept or reject applications, with a reason recorded for rejections
- upload the admission letter for accepted applicants

**Backend** — Gin REST API, GORM models migrated automatically against MySQL, JWT auth for two
roles (student/admin), file uploads stored on disk with access-controlled downloads, and
transactional emails via go-mail (falls back to logging the email to the console when no SMTP
server is configured, so it runs out of the box with zero external services).

## Quickstart (no Docker — runs directly on your machine)

### Prerequisites
- Go 1.25+
- Node.js 20+
- A MySQL server already running locally (e.g. `brew services start mysql`, or your own install)

### 1. Backend

```bash
cd backend
cp .env.example .env   # edit DB_USER / DB_PASSWORD to match your local MySQL
mysql -uroot -p -e "CREATE DATABASE frontline_college CHARACTER SET utf8mb4;"
go run ./cmd/api
```

The API starts on `http://localhost:8080`, auto-migrates all tables, and seeds:
- the 6 programmes (from `docs/about.md` + the admissions flyer)
- a default admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`, defaults to
  `admin@frontlinecollege.edu.ng` / `ChangeMe123!` — **change this before going live**)

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. `.env.local` already points `NEXT_PUBLIC_API_URL` at the local
backend.

## Configuration you'll want to change before launch

All in `backend/.env` (copy from `.env.example`):

| Variable | Purpose |
|---|---|
| `PAYMENT_BANK_NAME`, `PAYMENT_ACCOUNT_NAME`, `PAYMENT_ACCOUNT_NUMBER` | The real account applicants pay fees into — shown in the student portal |
| `APPLICATION_FEE_AMOUNT`, `SCHOOL_FEE_AMOUNT` | In `PAYMENT_CURRENCY` (defaults to NGN) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Seeded on first run only — change the password and re-seed (or update via DB) for production |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_*` | Leave `SMTP_HOST` blank in dev — emails are logged to the console instead of sent. Fill in for real notifications. |
| `JWT_SECRET` | Set to a long random string in production |

## Content & images

- Programme copy, categories and durations live in `backend/internal/seed/seed.go` — edit and
  restart the API to update (existing rows are updated in place by slug, so it's safe to re-run).
- All photography in `frontend/public/images/` is placeholder stock photography, downloaded for
  this build — swap in real campus/classroom/lab photos any time by replacing files of the same
  name (no code changes needed).
- The real crest (`logo.jpeg`) and admissions flyer (`flyer.jpeg`) are used as provided.

## Architecture notes / decisions made along the way

- **Applying is free and ungated.** The requirement doc's "the application may be free, so the
  UI [should] not ask for pop[up]" was read as: the application form itself never blocks on
  payment. Fee payment happens afterward, from the portal, and is what moves the status from
  "Submitted" to "Under Review" once an admin verifies it.
- **One application per student** in this version — a student who has already applied is told to
  log in rather than being able to submit a second one. Multi-cycle re-application would be a
  reasonable future extension.
- **Files** (payment proofs, admission letters) are stored on local disk under `backend/uploads/`
  and served through an authenticated endpoint (`/api/files/*`) — never publicly, and a student
  can only fetch their own files.
- **No Docker** — everything runs directly with `go run` / `npm run dev` against a MySQL server
  you already have. A Dockerized setup could be added later if useful for deployment.

## Status flow

```
submitted → application_fee_review → under_review → accepted → admission_accepted
                                                    ↘ rejected      → school_fee_review → enrolled
```
