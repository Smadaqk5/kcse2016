# kcse2016

# KCSE leakage Portal Exam Access Platform

Production-focused MVP for selling and controlling access to exam papers and study PDFs with:
- Next.js full-stack app router
- MySQL + Prisma
- Admin-created users only (no public registration)
- Role-based auth (Admin and Subscriber)
- Lipana STK Push flow + webhook callback
- Subscription and pay-per-paper access control
- View-only secure PDF streaming with watermark and anti-leak deterrents

## Key Features

- Public navbar includes `Home`, `Pricing`, `Papers`, `User Login`, `Admin Login`, `Contact`
- Explicit admin login page at `/admin/login`
- Admin dashboard:
  - create users
  - upload papers/PDFs
  - see payment list and revenue metrics
- User dashboard:
  - check subscription status
  - trigger Lipana STK payment
  - view accessible papers
- Protected PDF stream endpoint: no direct public file URL exposure
- Activity logs for suspicious behavior (shortcut attempts, hidden tab events)

## Project Structure

- `src/app` - pages and API routes
- `src/components` - UI and forms
- `src/lib` - auth, access checks, Prisma, M-Pesa helper, rate limit
- `prisma/schema.prisma` - database schema
- `prisma/seed.js` - admin seeding script
- `storage/papers` - local secure PDF storage

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update MySQL and Lipana credentials
3. Set your Lipana webhook URL to `POST /api/payments/callback`

## Install and Run

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`

## Default Credentials

Seed script creates admin and subscriber from env values:
- `DEFAULT_ADMIN_USERNAME` (default: `admin`)
- `DEFAULT_ADMIN_PASSWORD` (default: `Admin@12345`)
- `DEFAULT_USER_USERNAME` (default: `student`)
- `DEFAULT_USER_PASSWORD` (default: `Student@12345`)

## Lipana Notes

- Use `LIPANA_SECRET_KEY` in server-side env only
- `MPESA_SIMULATE_SUCCESS=true` allows local MVP flow without waiting for webhook
- Set `MPESA_SIMULATE_SUCCESS=false` in production and rely on webhook endpoint:
  - `POST /api/payments/callback`

## Security Implemented

- bcrypt password hashing
- JWT session cookies (httpOnly, secure in production)
- Role-gated dashboard/API routes
- Rate limit on login endpoints
- PDF access checks by active subscription or per-paper purchase
- Basic anti-copy deterrents:
  - disable right-click
  - block save/print shortcuts
  - per-view watermark (username, phone, timestamp)
  - warning banner + blur on tab switch

## Production Hardening Checklist

- Deploy behind HTTPS
- Use Redis-backed rate limiter
- Add CSRF protection and stricter CSP headers
- Move file storage to S3-compatible private bucket + signed stream access
- Add audit alerts and SIEM integration
- Add automated tests (unit + integration + e2e)
