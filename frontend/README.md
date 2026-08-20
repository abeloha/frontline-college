# Frontline College — Frontend

Next.js 16 (App Router, TypeScript, Tailwind CSS v4) marketing site, online application, student
portal and admin portal for Frontline College of Health Sciences and Technology.

See the [repo root README](../README.md) for the full project overview and quickstart.

## Local development

```bash
npm install
npm run dev
```

Requires the backend API running (see `../backend`) and `NEXT_PUBLIC_API_URL` in `.env.local`
pointing at it (defaults to `http://localhost:8080/api`).

## Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS v4
- Framer Motion for scroll reveals, page/element animation and the multi-step application wizard
- Lenis for smooth scrolling
- react-hook-form + zod for the application form
- lucide-react for icons

## Structure

- `src/app/` — routes (marketing pages, `/apply`, `/login`, `/portal`, `/admin/*`)
- `src/components/` — `layout/` (nav, footer, providers), `ui/` (design-system primitives),
  `home/`, `programs/`, `forms/`, `portal/`, `admin/`
- `src/lib/` — API client (`api.ts`), auth token storage (`auth.ts`), types, validation schemas
