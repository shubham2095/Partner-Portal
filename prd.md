# PRD — Digital Marketing Partner Portal

## 1. Product Definition

**Product name:** Digital Marketing Partner Portal

The product is a centralized web application for recruiting, qualifying, certifying, training, activating, managing, and paying digital marketing freelancers/partners.

Core business loop:

**Webinar → Registration → Verification → Qualification Test → Certification → Training → Lead Allocation → Follow-up → Conversion → Commission → Payment → Reporting**

The platform has two primary application areas:

1. **Super Admin / Admin Portal**
2. **Freelancer / Marketing Partner Portal**

The system is designed from scratch using the approved technology stack in this specification.

---

## 2. Product Goals

### Business goals

- Digitize freelancer onboarding.
- Capture webinar registrations and recruitment leads.
- Qualify partners through online tests.
- Automatically generate certificates for qualified partners.
- Provide controlled training and marketing resources.
- Distribute sales leads to authorized freelancers.
- Track every lead from assignment to conversion/loss.
- Track follow-ups and accountability.
- Calculate commissions using configurable rules.
- Manage commission approvals and payments.
- Provide management reporting.
- Create a scalable partner sales network.

### User goals

A freelancer should be able to:

- Register and verify an account.
- Complete a professional profile.
- Upload required documents.
- Attend/track webinar participation.
- Take qualification tests.
- View results and certificate.
- Learn from videos/materials.
- Receive authorized leads.
- Update lead status.
- Add follow-up activities.
- Communicate with the company.
- View sales and commission information.
- Maintain payment details.
- Raise support requests.

An admin should be able to:

- Manage users and roles.
- Verify profiles and documents.
- Manage webinars.
- Manage tests/question banks.
- Manage certificates.
- Manage training and videos.
- Manage leads and assignments.
- Monitor follow-ups.
- Verify conversions.
- Configure commission rules.
- Approve payments.
- Communicate with partners.
- Generate reports.
- Review audit activity.

---

## 3. User Roles

### Super Admin

Full access to the platform.

Capabilities:

- Admin management
- Freelancer management
- Webinar management
- Test/question management
- Certification management
- Training/material management
- Video management
- Lead management
- Manual and automatic assignment configuration
- Commission rule management
- Commission approval/payment management
- Reports
- Notifications
- System settings
- Audit logs

### Marketing/Admin Team

Operational access only.

Capabilities:

- View/verify freelancers
- Review test results
- Manage training material
- Manage webinar recordings
- Create/manage leads
- Assign leads
- Monitor follow-ups
- Update lead information
- Review conversions
- Communicate with freelancers

### Freelancer / Marketing Partner

Restricted self-service access.

Capabilities:

- Registration/login
- Profile management
- Document upload
- Qualification test
- Results
- Certificate
- Training/video access
- Assigned leads
- Lead updates
- Follow-ups
- Timeline
- Internal communication
- Sales/conversion view
- Commission view
- Payment details
- Support tickets

---

## 4. Functional Requirements

### 4.1 Authentication

- Registration
- Login
- Logout
- JWT authentication
- Password hashing with bcryptjs
- Email verification
- Mobile OTP architecture
- Forgot/reset password
- Protected routes
- Role-based authorization
- Session/token expiry
- Account status controls

### 4.2 Freelancer Registration

Fields:

- Name
- Mobile
- Email
- Location
- Profile photo
- Date of birth, if required
- Experience
- Digital marketing experience
- Sales experience
- Current occupation
- Skills
- Specializations
- Preferred working areas
- Previous agency/client experience
- Required verification documents
- Bank/payment details

After registration, generate a unique Partner ID, e.g.:

`HTG-FR-000125`

### 4.3 Webinar Management

Admin can create:

- Title
- Description
- Date/time
- Speaker
- Registration URL
- Meeting URL
- Status
- Recording
- Related training material
- Related qualification test

Track:

- Registrations
- Attendance
- Test participation
- Qualified users
- Certified users
- Activation rate

### 4.4 Webinar Registration / Lead Capture

Capture:

- Name
- Mobile
- Email
- City
- Profession
- Experience
- Interest
- Selected webinar
- Lead source
- Campaign
- Registration date

Design APIs so future Meta Lead Ads and Google Lead Forms can feed the same registration pipeline.

### 4.5 Qualification Test

Support:

- Question bank
- MCQ questions
- Randomized questions
- Configurable test duration
- Configurable passing percentage
- Optional negative marking
- Automatic evaluation
- Attempt history
- Result generation
- Test status
- Retake policy

Example:

30 questions, 70% pass threshold.

### 4.6 Certification

Qualified users become eligible for certification.

Certificate data:

- Freelancer name
- Partner ID
- Course/webinar
- Certification title
- Date
- Certificate number
- Authorized company
- Signature
- QR verification code

Actions:

- View
- Download PDF
- Share
- Verify via QR/public verification page

### 4.7 Training & Material Library

Categories:

- Digital Marketing
- SEO
- Google Ads
- Meta Ads
- Social Media
- Website Development
- Local SEO
- Lead Generation
- Sales
- Client Communication
- Proposal Templates
- Pricing
- Case Studies
- Company Information

Types:

- PDF
- PPT
- Images
- Videos
- Documents
- Sales scripts
- Proposal templates
- Brochures
- FAQs

Access must support partner level/role restrictions.

### 4.8 Video Library

Fields:

- Thumbnail
- Title
- Description
- Category
- Duration
- Access level
- Upload date
- Video/file reference

Track viewing history.

### 4.9 Freelancer Dashboard

Show:

- Total leads
- New leads
- Follow-ups today
- Hot leads
- Converted leads
- Total revenue
- Commission earned
- Commission pending
- Commission paid

Performance:

- Assigned leads
- Active leads
- Follow-ups
- Converted
- Revenue generated
- Commission earned
- Commission paid
- Pending commission
- Partner score

### 4.10 CRM / Lead Management

Lead fields:

- Lead ID
- Client name
- Company
- Mobile
- Email
- Location
- Business category
- Service interested in
- Lead source
- Lead date
- Assigned freelancer
- Lead status
- Expected value
- Follow-up date
- Notes
- Conversion value

Statuses:

1. New
2. Contact Attempted
3. Contacted
4. Interested
5. Meeting Scheduled
6. Proposal Sent
7. Negotiation
8. Follow-up
9. Converted
10. Not Interested
11. Wrong Number
12. Lost
13. Future Opportunity

Every lead must have an activity timeline.

### 4.11 Follow-up Management

Each follow-up contains:

- Lead
- Date/time
- Follow-up type
- Notes
- Outcome
- Next follow-up date

Types:

- Phone Call
- WhatsApp
- Email
- Meeting
- Video Call
- Site Visit

Dashboard buckets:

- Overdue
- Today
- Tomorrow
- Upcoming

### 4.12 Lead Assignment Engine

Manual assignment:

`Lead → Freelancer → Assign`

Automatic assignment should support configurable strategies:

- Location
- Service expertise
- Availability
- Performance
- Lead capacity
- Round-robin
- Partner level

Every assignment must be logged.

### 4.13 Communication

Freelancer → Company:

- Messages
- Sales support
- Lead clarification
- Payment questions
- Support tickets

Company → Freelancer:

- Announcements
- New lead notifications
- Training updates
- Webinar notifications
- Policy updates
- Sales campaigns
- Commission updates

### 4.14 Commission Management

Commission rules must be configurable without code changes.

Example:

| Service | Sale Value | Commission |
|---|---:|---:|
| Website | ₹50,000 | 10% |
| SEO | ₹25,000 | 15% |
| Google Ads | ₹20,000 | 10% |
| Social Media | ₹30,000 | 12% |

Lifecycle:

**Potential → Earned → Approved → Payable → Paid**

Store:

- Commission amount
- Rule used
- Sale reference
- Status
- Approval
- Payment date
- Transaction/reference number
- Payment proof

### 4.15 Payment Details

Freelancer can maintain:

- Account holder name
- Bank account
- IFSC
- UPI ID
- PAN/GST information, if required

Admin can mark payment as paid and attach proof/reference.

### 4.16 Partner Levels

Initial configurable levels:

- Starter
- Certified Partner
- Premium Partner
- Elite Partner

Levels may control:

- Training access
- Lead limits
- Lead priority
- Commission rate
- Support level
- Incentives

### 4.17 Performance Score

Score inputs:

- Lead response time
- Follow-up activity
- Conversion rate
- Revenue generated
- Test/certification
- Client feedback
- Lead quality
- Follow-up consistency

Score example: `87/100`

The score may later influence automatic lead distribution.

### 4.18 Reports

Freelancer reports:

- Performance
- Leads handled
- Conversion rate
- Revenue
- Commission

Lead reports:

- Source-wise
- Freelancer-wise
- Service-wise
- Conversion
- Lost leads

Financial reports:

- Revenue
- Commission
- Paid commission
- Pending commission

Webinar reports:

- Registrations
- Attendance
- Test participation
- Qualified users
- Certified users
- Activation rate

### 4.19 Notifications

Events:

- Registration
- OTP verification
- Test availability
- Test result
- Certificate generation
- New material
- New webinar
- New lead
- Follow-up reminder
- Lead conversion
- Commission approval
- Commission payment
- Company announcement

Phase 1 delivery: in-app.
Later: email, WhatsApp and SMS.

---

## 5. Non-Functional Requirements

### Security

- JWT authentication
- bcryptjs password hashing
- Helmet
- CORS configuration
- Input validation
- RBAC
- Resource-level authorization
- Secure uploads
- Audit logs
- Rate limiting architecture
- Secure certificate verification
- No cross-freelancer lead access
- No cross-freelancer commission access
- No unauthorized document access

### Performance

- Paginated API lists
- Server-side filtering
- Indexed MySQL columns
- Lazy loading for large libraries
- Optimized dashboard queries
- File storage separated from relational data

### Responsive design

- Desktop-first admin experience
- Mobile-first freelancer dashboard
- Tablet support
- Touch-friendly controls

### Maintainability

- Modular React feature folders
- Modular Express routes/controllers/services
- Centralized validation
- Centralized API error handling
- Reusable UI components
- Database migrations/schema scripts
- Environment-based configuration

---

## 6. Success Metrics

- Registration completion rate
- Profile verification rate
- Test completion rate
- Qualification rate
- Certification rate
- Training engagement
- Lead response time
- Follow-up completion rate
- Lead conversion rate
- Revenue generated
- Commission paid
- Active partner rate
- Partner retention
