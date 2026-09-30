# Hostel Management System (MERN Stack)

A full-featured Hostel Management System built with **MongoDB, Express, React (Vite), Node.js**, and **TailwindCSS**.

## Features

- **Room Allocation** — real-time room availability, preference-based room suggestions, check-in/check-out, room changes.
- **Maintenance Requests** — residents submit requests with priority/category and optional photos, staff assign & track status, threaded comments.
- **Billing & Payments** — itemized invoices (room fee, utilities, services), discounts & late fees, multi-installment payment plans, manual payment recording, and full Stripe card checkout.
- **Resident Information Management** — full resident profiles, emergency contacts, room preferences, room history.
- **Financial Reporting** — dashboard KPIs, revenue over time, occupancy by type/block, maintenance analytics (charts via Recharts).
- **User Roles & Permissions** — `admin`, `staff`, `resident` roles enforced on both API and UI.
- **Notifications** — in-app notification center; email (Nodemailer) and SMS (Twilio) hooks wired in for key events (room assignment, invoice issued, payment received, maintenance updates, payment plan created).
- **Server-side validation** — `express-validator` rule sets on auth, rooms, residents, maintenance, and billing endpoints.
- **Pagination** — list views (Residents, Invoices, Maintenance, Users) paginate through the API's `page`/`limit` support.
- **Database backups** — `npm run backup` wraps `mongodump` into timestamped local backups.

## Tech Stack

- **Frontend:** React 18 + Vite, TailwindCSS, React Router, Recharts, Axios, react-hot-toast, react-icons, @stripe/react-stripe-js
- **Backend:** Node.js + Express, MongoDB + Mongoose, JWT auth (httpOnly cookie + bearer), bcrypt, express-validator, Multer
- **Integrations:** Stripe (payments, fully wired end-to-end), Nodemailer (email), Twilio (SMS)

## Project Structure

```
hostel-management-system/
├── backend/
│   ├── config/db.js
│   ├── models/            # User, Room, Resident, MaintenanceRequest, Invoice, Payment, Notification
│   ├── controllers/       # business logic per module
│   ├── routes/            # Express routers
│   ├── middleware/        # auth (JWT), role guard, upload (Multer), validate, error handler
│   ├── validators/        # express-validator rule sets per module
│   ├── utils/              # email, sms, stripe, notification dispatcher, seed script, backup script
│   ├── uploads/            # uploaded maintenance-request photos (served at /uploads)
│   ├── backups/            # local mongodump output (created by `npm run backup`)
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js
    │   ├── context/AuthContext.jsx
    │   ├── components/    # Layout, Sidebar (+ mobile drawer), Navbar, Modal, Badge, StatCard,
    │   │                   # Pagination, StripeCheckout, ProtectedRoute
    │   └── pages/         # Login, Register, Dashboard, Rooms, Residents, ResidentDetail, Maintenance,
    │                       # Billing, Reports, Users, Notifications, Profile
    ├── tailwind.config.js
    ├── vite.config.js
    └── .env.example
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string
- (Optional) Stripe test API keys, SMTP credentials, Twilio credentials for full integration
- (Optional, for backups) [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/installation/) (`mongodump`) on your PATH

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and optionally Stripe/SMTP/Twilio keys
npm run seed     # creates demo admin/staff/resident + sample rooms
npm run dev      # starts API on http://localhost:5000
```

Demo accounts created by the seed script (password for all: `password123`):
- `admin@hostel.com` — full access
- `staff@hostel.com` — operational access
- `resident@hostel.com` — resident portal (not yet assigned a room)

### 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
# edit .env: set VITE_STRIPE_PUBLISHABLE_KEY (same Stripe account/mode as the backend's secret key)
npm run dev       # starts Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`, so no CORS config is needed locally.

### 3. Log in

Open http://localhost:5173, log in with one of the seed accounts above, or register a new resident account.

## Role Permissions Overview

| Feature                | Admin | Staff | Resident |
|-------------------------|:---:|:---:|:---:|
| View/manage rooms       | ✅ | ✅ | view only |
| Assign / check-in / checkout / preference-matched suggestions | ✅ | ✅ | ❌ |
| Manage resident profiles | ✅ | ✅ | own profile only |
| Submit maintenance request (with photos) | ✅ (as resident) | ✅ (as resident) | ✅ |
| Manage maintenance queue | ✅ | ✅ | ❌ |
| Create/manage invoices, payment plans | ✅ | ✅ | view/pay own |
| Financial reports        | ✅ | ✅ | ❌ |
| User management          | ✅ | ❌ | ❌ |

## Room Allocation & Preference Matching

Residents (or staff on their behalf) can record a preferred room `type` and `block` on the resident profile. From a resident's detail page, staff can click **"Find Matching Room"**, which calls `GET /api/residents/:id/suggested-rooms` — this ranks all rooms with free capacity by how well they match the resident's stated preference (type + block), so the best-fit rooms surface first, with an "Assign" button that performs the check-in in one step.

## Billing: Payment Plans & Online Payments

- **Payment plans:** staff can split an invoice's outstanding balance into 2–12 scheduled installments (`POST /api/billing/invoices/:id/payment-plan`), and mark each installment paid individually (`POST /api/billing/invoices/:id/installments/:installmentId/pay`). The installment schedule and status is shown directly in the invoice detail view.
- **Online card payments:** `POST /api/billing/invoices/:id/create-payment-intent` creates a Stripe PaymentIntent for the outstanding balance; the frontend mounts Stripe Elements (`StripeCheckout.jsx`) with the returned `clientSecret` to collect card details in-app, then reconciles via `POST /api/billing/payments/confirm`. Use Stripe's test card `4242 4242 4242 4242` with any future expiry/CVC.

## Maintenance Request Photos

Residents can attach up to 5 photos when submitting a maintenance request. Files are uploaded via `POST /api/uploads` (Multer, 5MB/file limit, image types only) and the returned URLs are attached to the request; staff can view them full-size from the request detail modal.

## Notifications

`backend/utils/notify.js` centralizes notification dispatch: every key event (room assignment/checkout/change, new maintenance request, status updates, invoice issued, payment plan created, payment/installment received) creates an in-app `Notification` document and optionally sends email/SMS based on the configured channels. Email and SMS silently no-op (and log) if SMTP/Twilio credentials aren't set, so the app works out of the box without them.

## Database Backups

```bash
cd backend
npm run backup
```

This wraps `mongodump` and writes a timestamped snapshot to `backend/backups/<timestamp>/`. For production, schedule it on a daily cron job and ship the output to off-site storage (S3, Backblaze, etc.) — this script handles the local dump; off-site shipping is left to your infrastructure of choice.

## Security Notes

- Passwords hashed with bcrypt.
- JWT stored in an httpOnly cookie (plus returned in the response body for bearer-token use, e.g. mobile clients).
- `helmet` for secure headers, rate limiting on auth routes.
- Role-based middleware (`protect`, `authorize`) guards every sensitive route.
- Server-side request validation (`express-validator`) on auth, room, resident, maintenance, and billing write endpoints.
- Update `JWT_SECRET` and all API keys before deploying — never commit `.env`.

## Known Limitations / Possible Next Steps

- No automated test suite (Jest/Supertest for the API, React Testing Library for the UI) — recommended before production use.
- Backups are local-only; wire the `backups/` output to off-site storage for real disaster recovery.
- The Stripe integration uses `automatic_payment_methods`, which supports cards and any other method enabled on your Stripe account — verify your Stripe dashboard settings match what you want to offer.
- No CI/CD pipeline included.
