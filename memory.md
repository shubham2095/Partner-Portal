# Memory — Digital Marketing Partner Portal

## 1. Project Identity

Project:

**Digital Marketing Partner Portal**

Purpose:

A partner sales network where digital marketing freelancers can:

**Learn → Get Certified → Receive Leads → Sell → Earn Commission → Grow**

The agency can:

**Recruit → Train → Distribute Leads → Track Sales → Control Quality → Pay Commission → Scale**

---

## 2. Permanent Product Principles

- This is a software product, not just a dashboard.
- Freelancer experience and admin control are equally important.
- Lead ownership and financial data require strict server-side authorization.
- Business rules must be configurable.
- The product should support future integrations without architectural rewrites.
- Every major operational/financial action should be traceable.
- The freelancer portal is mobile-first.
- The admin portal is operational and data-focused.

---

## 3. Canonical Technology Stack

### Frontend

```text
React 18
Vite
Tailwind CSS 3
React Router DOM
react-hook-form
framer-motion
axios
Zustand
react-hot-toast
recharts
```

### Backend

```text
Node.js
Express
mysql2
jsonwebtoken
bcryptjs
multer
nodemailer
express-validator
cors
helmet
PDFKit or Puppeteer
qrcode
```

### Database

```text
MySQL
XAMPP
phpMyAdmin
```

### Future

```text
WhatsApp Business API
Razorpay/Stripe
AWS S3/Cloudinary
socket.io
node-cron
Meta Lead Ads
Google Lead Forms
```

---

## 4. Canonical Architecture

```text
partner-portal/
├── client/
│   └── src/
│       ├── landing/
│       ├── admin/
│       ├── freelancer/
│       └── auth/
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── models/
│   ├── validators/
│   └── database/
└── docs/
```

Do not replace this with an unrelated framework architecture.

---

## 5. Core Journey

```text
Webinar Advertisement
↓
Registration
↓
Verification
↓
Webinar
↓
Qualification Test
↓
Qualified
↓
Certificate
↓
Freelancer Activation
↓
Training
↓
Marketing/Sales Material
↓
Lead Assignment
↓
Follow-up
↓
Conversion
↓
Company Verification
↓
Commission
↓
Approval
↓
Payment
```

---

## 6. Roles

```text
SUPER_ADMIN
ADMIN
FREELANCER
```

The role model should remain extensible.

---

## 7. Core Business Objects

```text
User
Role
Freelancer Profile
Freelancer Document
Webinar
Webinar Registration
Webinar Attendance
Question
Test
Test Attempt
Certificate
Training Category
Training Material
Video
Lead
Lead Assignment
Lead Activity
Follow-up
Client
Opportunity
Service
Sale
Commission Rule
Commission
Payment
Message
Notification
Support Ticket
Audit Log
```

---

## 8. Core Lead States

```text
NEW
CONTACT_ATTEMPTED
CONTACTED
INTERESTED
MEETING_SCHEDULED
PROPOSAL_SENT
NEGOTIATION
FOLLOW_UP
CONVERTED
NOT_INTERESTED
WRONG_NUMBER
LOST
FUTURE_OPPORTUNITY
```

---

## 9. Commission Lifecycle

```text
POTENTIAL
→ EARNED
→ APPROVED
→ PAYABLE
→ PAID
```

The original rule used for a historical commission must remain traceable.

---

## 10. Partner Levels

```text
STARTER
CERTIFIED_PARTNER
PREMIUM_PARTNER
ELITE_PARTNER
```

Levels can control access, lead priority, commission and support.

---

## 11. Certificate Requirements

Certificate contains:

- Name
- Partner ID
- Course/webinar
- Certification title
- Date
- Certificate number
- Authorized company
- Signature
- QR verification

Certificate numbers must be unique.

---

## 12. Dashboard KPIs

### Freelancer

```text
Total Leads
New Leads
Follow-ups Today
Hot Leads
Converted Leads
Revenue
Commission Earned
Commission Pending
Commission Paid
```

### Admin

```text
Total Freelancers
Active Freelancers
Certified Freelancers
Pending Qualification
Top Performers
Inactive Freelancers
Total Leads
Unassigned Leads
Assigned Leads
Active Leads
Converted Leads
Lost Leads
Total Sales
Revenue
Commission Payable
Commission Paid
Outstanding Commission
```

---

## 13. Important Security Memory

Never trust frontend ownership identifiers.

The backend must derive access from:

```text
authenticated user
role
resource ownership
explicit permissions
```

A freelancer must never see another freelancer's leads, commissions or confidential client information.

---

## 14. Future Product Direction

Possible future AI capabilities:

- AI lead scoring
- AI follow-up suggestions
- AI sales assistant
- AI lead summaries
- AI proposal generation

AI is optional and must not bypass core authorization or financial business rules.

---

## 15. Claude Working Memory Instructions

When working on this project:

- Treat these six specification files as the project source of truth.
- Preserve the agreed architecture.
- Implement phase-by-phase.
- Do not skip dependencies.
- Do not build future-phase features early unless explicitly requested.
- Before changing an architectural decision, explain the reason and ask for approval.
- When a requirement is ambiguous, choose the smallest implementation consistent with the PRD and mark the assumption.
- Never remove existing working functionality while adding a feature.
- Keep API contracts documented.
- Keep database changes explicit.
- Keep security checks on the server.
- Keep financial calculations on the server.
- Keep auditability for important business actions.
