# Architecture — Digital Marketing Partner Portal

## 1. Architecture Decision

Use a **monorepo-style two-application structure**:

```text
partner-portal/
├── client/
│   ├── src/
│   │   ├── landing/
│   │   ├── admin/
│   │   ├── freelancer/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── routes/
│   │   └── assets/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── models/
│   ├── validators/
│   ├── database/
│   ├── uploads/
│   ├── utils/
│   ├── config/
│   ├── app.js
│   └── server.js
│
├── docs/
├── .env.example
└── README.md
```

The requested application areas remain:

- `client/src/landing/`
- `client/src/admin/`
- `client/src/freelancer/`
- `client/src/auth/`

---

## 2. Technology Stack

### Frontend

- React 18
- Vite
- Tailwind CSS 3
- React Router DOM
- react-hook-form
- framer-motion
- axios
- Zustand
- react-hot-toast
- recharts

### Backend

- Node.js
- Express
- MySQL
- mysql2
- jsonwebtoken
- bcryptjs
- multer
- nodemailer
- express-validator
- cors
- helmet
- PDFKit or Puppeteer
- qrcode

### Database

- MySQL
- XAMPP
- phpMyAdmin

### Future integrations

- WhatsApp Business API
- Razorpay/Stripe
- AWS S3/Cloudinary
- socket.io
- node-cron
- Meta Lead Ads
- Google Lead Forms

---

## 3. Request Flow

```text
React UI
   ↓
React Router
   ↓
Protected Route / Role Guard
   ↓
Zustand State
   ↓
Axios API Client
   ↓
Express Route
   ↓
Auth/RBAC Middleware
   ↓
Validator
   ↓
Controller
   ↓
Service Layer
   ↓
Model/Repository
   ↓
MySQL
```

For files:

```text
React Upload
   ↓
Axios multipart/form-data
   ↓
Multer
   ↓
File Validation
   ↓
Storage
   ↓
Database Metadata
```

For certificates:

```text
Qualified Test
   ↓
Certification Service
   ↓
Certificate Number
   ↓
QR Generator
   ↓
PDF Generator
   ↓
Certificate Storage
   ↓
Public Verification URL
```

---

## 4. Frontend Architecture

### `auth/`

- Login
- Registration
- Forgot password
- Reset password
- Verification
- Auth guards

### `admin/`

Recommended modules:

```text
admin/
├── dashboard/
├── freelancers/
├── webinars/
├── tests/
├── certificates/
├── training/
├── videos/
├── leads/
├── assignments/
├── followups/
├── communications/
├── sales/
├── commissions/
├── payments/
├── reports/
├── notifications/
├── support/
├── settings/
└── audit/
```

### `freelancer/`

```text
freelancer/
├── dashboard/
├── profile/
├── documents/
├── webinars/
├── tests/
├── certificates/
├── training/
├── videos/
├── leads/
├── followups/
├── communications/
├── sales/
├── commissions/
├── payments/
├── support/
└── notifications/
```

---

## 5. Backend Architecture

Use separation of responsibilities.

### Routes

Routes define HTTP endpoints only.

Example:

```text
/routes/auth.routes.js
/routes/admin.routes.js
/routes/freelancer.routes.js
/routes/webinar.routes.js
/routes/test.routes.js
/routes/certificate.routes.js
/routes/training.routes.js
/routes/video.routes.js
/routes/lead.routes.js
/routes/followup.routes.js
/routes/commission.routes.js
/routes/payment.routes.js
/routes/report.routes.js
/routes/notification.routes.js
/routes/support.routes.js
```

### Controllers

Controllers:

- Read request
- Call service
- Return response

Controllers must not contain large business rules.

### Services

Business logic belongs here:

- Test scoring
- Certificate generation
- Lead assignment
- Commission calculation
- Performance score
- Notification creation
- Partner level logic

### Middleware

At minimum:

- `authenticate`
- `authorizeRole`
- `validateRequest`
- `uploadHandler`
- `errorHandler`
- `notFound`
- `requestLogger`

---

## 6. Database Architecture

Major entities from the product specification:

```text
users
roles
permissions
role_permissions
freelancer_profiles
freelancer_documents
webinars
webinar_registrations
webinar_attendance
questions
tests
test_questions
test_attempts
test_answers
certificates
training_categories
training_materials
videos
video_watch_history
leads
lead_assignments
lead_activities
follow_ups
clients
opportunities
services
sales
commission_rules
commissions
payments
messages
message_threads
notifications
support_tickets
audit_logs
system_settings
```

Target: 25+ tables.

All foreign-key relationships, indexes, unique constraints and timestamps must be explicitly designed before implementation.

---

## 7. Data Ownership Rules

A freelancer can read/write only resources belonging to the authenticated freelancer unless an explicit permission says otherwise.

For example:

```text
lead.freelancer_id = authenticatedUser.freelancer_id
```

must be enforced server-side.

Never rely only on React route hiding.

---

## 8. API Design

Base:

```text
/api/v1
```

Example:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/admin/dashboard
GET    /api/v1/admin/freelancers

GET    /api/v1/webinars
POST   /api/v1/webinars

GET    /api/v1/tests/:id
POST   /api/v1/tests/:id/attempts

GET    /api/v1/certificates/:id
GET    /api/v1/certificates/verify/:certificateNumber

GET    /api/v1/leads
POST   /api/v1/leads
PATCH  /api/v1/leads/:id

GET    /api/v1/leads/:id/timeline
POST   /api/v1/leads/:id/followups

GET    /api/v1/commissions
GET    /api/v1/payments
```

Use consistent JSON responses:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

---

## 9. State Management

Use Zustand.

Suggested stores:

```text
authStore
uiStore
notificationStore
adminStore
freelancerStore
leadStore
```

Do not put all server data permanently into global state. Use local component state for temporary UI state and stores for cross-page/session state.

---

## 10. File Storage

Phase 1 can use controlled local storage for development.

Database stores metadata, not large binary files.

Example:

```text
storage/
├── certificates/
├── documents/
├── training/
├── videos/
└── images/
```

Production storage can later move to S3 or Cloudinary without changing business entities.

---

## 11. Security Architecture

Required:

- JWT
- bcryptjs
- Helmet
- CORS
- express-validator
- RBAC
- ownership checks
- secure file validation
- audit logging
- password reset token expiry
- certificate verification controls
- protected admin APIs
- protected freelancer APIs

Sensitive information must never be exposed through unauthorized endpoints.

---

## 12. Deployment Architecture

Development:

```text
React/Vite → localhost:5173
Express    → localhost:5000
MySQL/XAMPP → localhost:3306
```

Production:

```text
Browser
  ↓
Web Server / Reverse Proxy
  ↓
React Static Build
  +
Express API
  ↓
MySQL
  +
File Storage
```

Keep frontend and backend independently deployable.

---

## 13. Architecture Principles

1. API-first.
2. Server-side authorization is mandatory.
3. Business rules belong in services.
4. Database writes must be validated.
5. Every important business action should be auditable.
6. Avoid hard-coded commission rules.
7. Avoid hard-coded partner levels.
8. Avoid hard-coded lead assignment rules.
9. Use reusable UI components.
10. Build each phase so later integrations can be added without rewriting the core.
