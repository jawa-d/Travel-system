# TRINSU Travel Insurance Management Platform

Production-oriented Arabic RTL platform for issuing and managing travel insurance policies.

## Stack

- Next.js 16, React, TypeScript
- Tailwind CSS and shadcn/ui-style components
- Prisma ORM with PostgreSQL
- NextAuth credentials authentication
- React Hook Form and Zod validation
- QR code generation and PDF utility

## Setup

1. Install Node.js 22+ and PostgreSQL.
2. Copy `.env.example` to `.env` and update `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL`.
3. Install dependencies:

```bash
npm install
```

4. Create database tables and seed initial data:

```bash
npm run db:push
npm run db:seed
```

5. Start development:

```bash
npm run dev
```

No default credentials are stored in source code. To create the first administrator, set
`BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, and optionally `BOOTSTRAP_ADMIN_NAME`
in your local environment before running the seed or first credentials login.

## Vercel authentication

Configure these variables for the Production environment:

```text
DATABASE_URL=postgresql://...
AUTH_SECRET=<a cryptographically random value of at least 32 characters>
AUTH_URL=https://your-production-domain.example
AUTH_TRUST_HOST=true
BOOTSTRAP_ADMIN_NAME=System Administrator
BOOTSTRAP_ADMIN_EMAIL=<administrator email>
BOOTSTRAP_ADMIN_PASSWORD=<a strong password of at least 12 characters>
POLICY_VERIFICATION_SECRET=<a separate cryptographically random value>
```

## Motor Insurance Portal

Configure these variables in Vercel for the external Motor Insurance Portal:

```text
MOTOR_API_KEY=generate_secure_random_key
MOTOR_PORTAL_ORIGIN=https://motor-insurance-portal-delta.vercel.app
PUBLIC_API_MAX_FILE_SIZE_MB=5
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

`MOTOR_API_KEY` is checked against the `x-api-key` request header for public motor request endpoints, including `POST /api/public/motor-requests` and `GET /api/public/motor-requests/track/:trackingNumber`.
`MOTOR_PORTAL_ORIGIN` is the only browser origin allowed by CORS for the public motor request API.
`BLOB_READ_WRITE_TOKEN` is required by Vercel Blob Storage for vehicle image and customer document uploads.

`NEXTAUTH_SECRET` and `NEXTAUTH_URL` remain supported as legacy aliases. Do not configure
`AUTH_URL` and `NEXTAUTH_URL` with different values, and never use a localhost URL in Vercel.
Auth.js v5 can infer the Vercel host, so `AUTH_URL` may be omitted when no custom base path is used.

The bootstrap administrator is created lazily on the first credentials login attempt only when
the configured account does not already exist. Existing users are never overwritten or reset.
Remove `BOOTSTRAP_ADMIN_PASSWORD` from Vercel after the account has been created.

The Vercel build command runs `prisma migrate deploy` before `next build`, applying only reviewed
production migrations. The existing Neon database has been baselined in Prisma migration history.

## Main Modules

- Authentication with role-based API authorization
- Dashboard metrics and recent activity feed
- Customer management with passport duplicate prevention
- Customer profile and policy history
- Travel plan CRUD API and management UI
- Country category/risk management
- Premium pricing engine
- Multi-step policy issuance workflow
- Professional policy PDF with logo area, QR, electronic signature, and electronic stamp
- PDF download, print, and email delivery through SMTP
- QR and policy-number verification
- Claims management
- Reports and analytics with Excel/PDF export
- Audit trail for login, policy, claim, print, cancellation, and endorsement actions
- Notifications for system events, email events, and policy expiry schedules
- Agency portal with own policies, PDF downloads, and commission summary
- Endorsements and cancellation management with generated certificates
- Arabic RTL layout with an English navigation foundation through a locale cookie

## API Surface

- `GET/POST /api/customers`
- `GET/PUT /api/customers/:id`
- `GET/POST /api/plans`
- `PUT/DELETE /api/plans/:id`
- `GET/POST /api/countries`
- `PUT/DELETE /api/countries/:id`
- `POST /api/pricing`
- `GET/POST /api/policies`
- `GET/PATCH /api/policies/:id`
- `GET /api/policies/:id/pdf`
- `POST /api/policies/:id/email`
- `GET/POST /api/claims`
- `GET/PATCH /api/claims/:id`
- `GET /api/reports?period=daily|monthly|yearly&format=json|xlsx|pdf`
- `GET /api/audit`
- `GET /api/notifications`
- `GET/POST /api/endorsements`
- `GET /api/endorsements/:id/pdf`
- `GET/POST /api/cancellations`
- `GET /api/cancellations/:id/pdf`
- `GET /api/verify?policyNumber=...`
- `POST /api/public/motor-requests`
- `POST/DELETE /api/public/motor-request-uploads`
- `POST /api/v1/public/motor-requests` legacy compatibility
- `GET /api/public/motor-requests/track/:trackingNumber`
- `GET /api/v1/public/motor-requests/track/:trackingNumber`
- `GET /api/v1/public/motor-requests/:requestNumber`
- `GET /api/v1/public/motor-requests/:requestNumber/documents`
- `GET /api/v1/public/motor-requests/:requestNumber/policy`

Tracking example response:

```json
{
  "trackingNumber": "MTR-REQ-2026-000001",
  "requestNumber": "MTR-REQ-2026-000001",
  "status": "UNDER_REVIEW",
  "statusLabel": "قيد المراجعة",
  "updatedAt": "2026-07-03T12:00:00.000Z",
  "customerName": "Ahmed Ali",
  "vehicle": "Toyota Camry 2024"
}
```

Public motor API documentation is available in `docs/public-motor-api-v1.md`.

## Enterprise Notes

- Configure `SMTP_*` variables to enable real email sending.
- `/verify` and `/verify/:policyNumber` are public verification pages; the rest of the application is protected.
- Use `/api/language?locale=ar|en&redirectTo=/path` to switch the locale cookie.
- In-memory rate limiting is included for verification APIs. For multi-instance production, replace it with Redis or an edge-compatible store.
- Initial SQL migration is included under `prisma/migrations/202606150001_enterprise_modules`.
