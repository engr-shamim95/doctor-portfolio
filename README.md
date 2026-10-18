# doctor-portfolio

Professional Doctor Personal Portfolio with Real-time Appointment Booking System & Self-Managed Admin CMS.

## Tech Stack
- **Framework:** Next.js 15 (App Router, Server Components, TypeScript)
- **CMS & Backend:** Payload CMS 3.x (embedded)
- **Database:** PostgreSQL (with Drizzle ORM and partial unique index concurrency protection)
- **Styling:** Tailwind CSS, Lucide icons, accessible UI primitives
- **Localization:** Bilingual support (Bengali `/bn` primary, English `/en`)
- **Testing:** Comprehensive 132-test automated suite (Tiers 1-4) & programmatic booking verification

## Features
- **Public Website:**
  - Hero section with verified BMDC credentials, degrees, and clinical experience stats
  - Responsive bilingual pages (Home, About, Services, Chambers, Health Blog, Contact & FAQ)
  - Persistent sticky mobile action bar (`Call`, `WhatsApp`, `Book Appointment`)
  - Emergency 999 helpline disclaimer banner
- **Appointment Booking Engine:**
  - Asia/Dhaka timezone calendar slot calculator
  - Dual-mode chamber support: SLOT mode (time-specific) and SERIAL mode (queue number)
  - 2-Phase reservation hold with 5-minute TTL
  - PostgreSQL partial unique index preventing double-booking race conditions
  - OTP phone verification workflow
  - Cryptographically signed (HMAC-SHA256) patient self-cancellation & management links
- **Admin Dashboard:**
  - Embedded Payload CMS at `/admin`
  - Role-Based Access Control (`super-admin`, `doctor`, `assistant`)
  - Real-time chamber schedule & leave exception rules management
  - Clinic receptionist fast walk-in entry modal
  - Immutable audit logs for all data mutations

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Ensure `DATABASE_URI` and `PAYLOAD_SECRET` are configured.

### 3. Run Development Server
```bash
pnpm dev
```
- Public Portal: [http://localhost:3000/bn](http://localhost:3000/bn)
- Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin)

### 4. Run Tests & Verification
```bash
# Typecheck
pnpm typecheck

# Linting
pnpm lint

# Run all 132 automated tests
pnpm test

# Programmatic E2E Booking Journey Verification
pnpm run verify:booking

# Production Build
pnpm build
```

## Deployment
Recommended hosting on **Vercel** with a managed PostgreSQL instance (e.g. Neon, Supabase).
