# Phases — Digital Marketing Partner Portal

## Phase Strategy

The complete product should be built in **7 implementation phases**, followed by optional AI expansion.

This sequence converts the product specification into progressively usable software.

---

# Phase 0 — Foundation & Project Setup

### Goal

Create the working application foundation.

### Frontend

- React 18 + Vite
- Tailwind CSS 3
- React Router DOM
- Axios client
- Zustand
- react-hook-form
- react-hot-toast
- framer-motion
- recharts
- Base layout
- Responsive navigation
- Reusable buttons/forms/modals/tables
- Error/loading/empty states

### Backend

- Express server
- Environment configuration
- CORS
- Helmet
- Error handler
- API versioning
- MySQL connection
- mysql2
- Base route structure
- Validation system
- Authentication middleware skeleton

### Database

Create initial schema/migration structure.

### Deliverable

Both client and server run locally and communicate successfully.

---

# Phase 1 — Authentication, Roles & Freelancer Onboarding

### Goal

Create a secure identity and onboarding system.

### Features

- Freelancer registration
- Admin login
- Freelancer login
- JWT authentication
- Password hashing
- Forgot/reset password
- Email verification architecture
- Role-based access
- Protected routes
- Partner ID generation
- Freelancer profile
- Profile photo
- Professional details
- Document upload
- Admin profile verification
- Account status

### Admin

- Freelancer list
- Search/filter
- Freelancer detail
- Verify/reject profile
- Account activation/suspension

### Acceptance

A freelancer can register, receive a unique Partner ID, complete profile, upload documents, and log in. Admin can verify the account.

---

# Phase 2 — Webinar, Qualification Test & Certification

### Goal

Build the qualification pipeline.

### Webinar

- Create/edit/delete
- Status
- Date/time
- Speaker
- Registration URL
- Meeting URL
- Recording
- Related test/material

### Webinar registration

- Registration form
- Source
- Campaign
- Webinar mapping

### Tests

- Question bank
- Test creation
- Question selection
- Randomization
- Time limit
- Passing percentage
- Optional negative marking
- Attempt history
- Server-side evaluation

### Certification

- Eligibility
- Certificate number
- PDF generation
- QR code
- Verification page
- Download

### Acceptance

Qualified freelancers can automatically become certificate eligible and receive a verifiable certificate.

---

# Phase 3 — Training, Materials, Videos & Freelancer Dashboard

### Goal

Create the partner learning and resource center.

### Training

- Categories
- Materials
- Upload
- Access levels
- Search/filter
- Download/view

### Video library

- Thumbnail
- Video
- Category
- Description
- Duration
- Access level
- Viewing history

### Freelancer dashboard

Cards:

- Total leads
- New leads
- Follow-ups
- Hot leads
- Converted
- Revenue
- Commission earned
- Pending
- Paid

Also show:

- Certification state
- Partner level
- Training progress
- Recent activity

### Acceptance

A verified/certified freelancer can access only the resources allowed for their level.

---

# Phase 4 — CRM, Lead Management & Follow-ups

### Goal

Build the operational sales engine.

### Leads

- Create
- Import-ready structure
- Search
- Filter
- Detail
- Edit
- Status
- Expected value
- Service
- Source

### Assignment

- Manual assignment
- Reassignment
- Assignment history

### Follow-ups

- Create
- Edit
- Complete
- Reschedule
- Overdue
- Today
- Tomorrow
- Upcoming

### Timeline

Record:

- Assignment
- Calls
- Messages
- Meetings
- Proposal
- Follow-up
- Conversion
- Loss

### Freelancer restrictions

Freelancers only see authorized leads.

### Acceptance

Admin can assign leads; freelancer can work only assigned leads and maintain complete follow-up history.

---

# Phase 5 — Sales, Commission, Payments & Performance

### Goal

Turn CRM activity into measurable revenue.

### Sales

- Client
- Service
- Sale amount
- Conversion date
- Verification
- Revenue

### Commission engine

- Configurable service rules
- Percentage/fixed rule architecture
- Commission calculation
- Lifecycle
- Rule history

### Payments

- Bank details
- UPI
- PAN/GST
- Payment records
- Payment proof
- Transaction reference

### Performance

- Response time
- Follow-up completion
- Conversion rate
- Revenue
- Commission
- Partner score

### Partner levels

- Starter
- Certified Partner
- Premium Partner
- Elite Partner

### Acceptance

A verified conversion produces a traceable commission record and admin can approve/pay it.

---

# Phase 6 — Automation, Notifications & External Integrations

### Goal

Reduce manual operations.

### Notifications

- In-app
- Email

### Automation

- Follow-up reminders
- New lead alerts
- Conversion notifications
- Commission updates
- Webinar notifications
- Training updates

### Integrations

Build adapters/interfaces for:

- Meta Lead Ads
- Google Lead Forms
- WhatsApp Business API
- SMS
- Email provider
- Razorpay/Stripe
- S3/Cloudinary
- socket.io
- node-cron

Integrations should be isolated so a provider can be changed later.

### Automatic lead distribution

Rules:

- Location
- Expertise
- Availability
- Performance
- Capacity
- Round-robin
- Partner level

### Acceptance

A lead can enter from an integration and be routed through configurable assignment rules with notifications.

---

# Phase 7 — Advanced Analytics, Admin Control & Production Hardening

### Goal

Make the platform production-ready and management-friendly.

### Admin analytics

- Freelancer statistics
- Lead statistics
- Revenue
- Commission
- Webinar funnel
- Conversion funnel
- Source performance
- Service performance
- Freelancer performance

### Reports

- Freelancer
- Lead
- Sales
- Revenue
- Commission
- Webinar
- Conversion
- Lost leads

### Security hardening

- Rate limiting
- Strong upload validation
- Security headers
- Audit review
- Backup strategy
- Permission review
- Data retention strategy
- Error monitoring
- Production logging

### QA

- Authentication tests
- Authorization tests
- Ownership tests
- Test scoring tests
- Commission calculation tests
- Certificate verification tests
- Lead assignment tests
- Payment workflow tests

### Acceptance

The application is suitable for controlled production deployment.

---

# Optional Phase 8 — AI Partner Sales Layer

This is optional and should be built only after the core product is stable.

### AI Lead Scoring

Classify:

- Hot
- Warm
- Cold

### AI Follow-up Suggestions

Example:

“Client has not responded for 4 days. Suggest a relevant follow-up.”

### AI Sales Assistant

Example:

“How should I pitch SEO to this client?”

### AI Lead Summary

Summarize:

- business
- service interest
- budget
- latest activity
- next action

### AI Proposal Generator

Inputs:

- client
- service
- budget

Output:

- company-approved proposal draft

AI must never directly change financial records or commission values.

---

# MVP Definition

The practical MVP is:

1. Registration
2. Login/profile
3. Webinar management
4. Qualification test
5. Certificate
6. Training/material library
7. Video library
8. Freelancer dashboard
9. Lead management
10. Lead assignment
11. Follow-ups
12. Internal communication
13. Commission dashboard
14. Admin dashboard
15. Basic reports

MVP should be considered complete after **Phase 5** for the core business workflow.

Phase 6–7 make the product operationally scalable.

Phase 8 is optional AI expansion.

---

# Dependency Map

```text
Phase 0
   ↓
Phase 1
   ↓
Phase 2
   ↓
Phase 3
   ↓
Phase 4
   ↓
Phase 5
   ↓
Phase 6
   ↓
Phase 7
   ↓
Optional Phase 8
```

Some UI work may be parallelized, but business dependencies must remain intact.
