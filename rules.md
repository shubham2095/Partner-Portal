# Rules — Digital Marketing Partner Portal

## 1. Development Rules

1. Build the system from scratch according to this specification.
2. Do not introduce an alternative primary architecture without explicit approval.
3. Use React 18 + Vite on the frontend.
4. Use Node.js + Express on the backend.
5. Use MySQL through mysql2.
6. Use Tailwind CSS 3.
7. Use React Router DOM for routing.
8. Use Zustand for application state.
9. Use axios for API communication.
10. Use react-hook-form for forms.
11. Use framer-motion for meaningful UI motion.
12. Use recharts for analytics.
13. Use react-hot-toast for user notifications.

---

## 2. Code Quality Rules

- Prefer small reusable components.
- Avoid giant components.
- Avoid duplicated API logic.
- Avoid duplicated validation logic.
- Use meaningful filenames.
- Use consistent naming.
- Keep controllers thin.
- Keep services responsible for business rules.
- Keep SQL/database access isolated.
- Add comments only where they explain non-obvious logic.
- Do not leave placeholder functions that appear complete.
- Do not silently remove requested functionality.

---

## 3. Frontend Rules

### Routing

Use protected routes for authenticated pages.

Use role guards:

```text
SUPER_ADMIN
ADMIN
FREELANCER
```

Never assume that hiding a menu item provides security.

### Forms

Use:

- react-hook-form
- client-side validation
- server-side validation

Show field-level validation errors.

### API

All API calls go through a centralized axios client.

Handle:

- 401
- 403
- 404
- 422
- 429
- 500

### UI

- Responsive.
- Accessible labels.
- Clear empty states.
- Loading states.
- Error states.
- Confirmation before destructive actions.
- Pagination for large tables.
- Search/filter where operationally useful.

---

## 4. Backend Rules

Every protected endpoint must authenticate the user.

Every sensitive endpoint must authorize the user's role and resource ownership.

Never trust:

- user_id sent from frontend
- freelancer_id sent from frontend
- commission amount sent from frontend
- conversion amount sent from frontend
- role sent from frontend

The backend derives sensitive ownership and financial values from trusted records.

---

## 5. Authentication Rules

- Passwords are hashed using bcryptjs.
- Plain-text passwords are never stored.
- JWT payload contains only necessary identity/role information.
- Expired/invalid JWT returns 401.
- Unauthorized role returns 403.
- Password reset tokens must expire.
- Verification states must be stored explicitly.

---

## 6. Freelancer Data Rules

Every freelancer has one unique Partner ID.

Partner ID example:

```text
HTG-FR-000125
```

Partner IDs must be unique.

Freelancer account states should support:

```text
PENDING
VERIFIED
QUALIFIED
CERTIFIED
ACTIVE
SUSPENDED
INACTIVE
```

---

## 7. Lead Security Rules

A freelancer can access only:

- leads assigned to them
- activities belonging to those leads
- follow-ups belonging to those leads

A freelancer must never access another freelancer's confidential lead information.

Admin permissions may override ownership based on role.

---

## 8. Lead Status Rules

Valid statuses:

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

Status changes must create an activity/timeline record.

A conversion should require appropriate verification before becoming commission-eligible.

---

## 9. Follow-up Rules

A follow-up must have:

- lead
- date/time
- type
- notes/outcome
- creator

Past-due follow-ups appear as overdue.

Completed follow-ups remain in the lead timeline.

---

## 10. Test Rules

- Test questions come from a controlled question bank.
- Questions may be randomized.
- Test duration is configurable.
- Passing percentage is configurable.
- Negative marking is optional.
- Answers are evaluated server-side.
- Attempt history is immutable after submission except through explicit admin correction.
- Results are generated from stored answers and test configuration.

---

## 11. Certificate Rules

Certificates are generated only when eligibility requirements are satisfied.

Every certificate has:

- unique certificate number
- partner ID
- recipient name
- course/webinar
- date
- QR verification code

Public verification must not expose unnecessary private information.

Certificate generation must be repeat-safe.

---

## 12. Training Rules

Every material has:

- title
- category
- type
- access level
- status
- creator
- created date

Freelancers can only access materials permitted for their level/role.

---

## 13. Commission Rules

Commission values must be calculated by backend business logic.

Commission lifecycle:

```text
POTENTIAL
→ EARNED
→ APPROVED
→ PAYABLE
→ PAID
```

The frontend must never calculate the final payable commission.

Commission rules must be versionable or traceable so historical commissions remain explainable if rules change later.

A paid commission should not be silently recalculated.

---

## 14. Payment Rules

Payment records must contain:

- commission reference
- amount
- payment date
- transaction/reference number
- proof if uploaded
- approving/admin user

Payment status changes must be audited.

---

## 15. Partner Level Rules

Levels are configurable.

Default:

```text
STARTER
CERTIFIED_PARTNER
PREMIUM_PARTNER
ELITE_PARTNER
```

Level changes should create history.

Do not hard-code lead or commission privileges directly into React components.

---

## 16. Audit Rules

Audit important actions:

- login
- logout
- role changes
- profile verification
- document verification
- test configuration
- certificate generation
- lead creation
- lead assignment
- lead reassignment
- lead status changes
- conversion approval
- commission changes
- payment changes
- admin settings changes

Audit record:

```text
actor
action
entity
entity_id
old_value
new_value
IP if available
timestamp
```

---

## 17. File Upload Rules

Allowed file types must be explicit.

Validate:

- extension
- MIME type
- size
- filename
- storage path

Never execute uploaded files.

Do not expose private documents through unrestricted public URLs.

---

## 18. Notification Rules

Create in-app notifications for important events.

Notification must have:

- recipient
- type
- title
- message
- read state
- created date

Future channels:

- Email
- WhatsApp
- SMS

---

## 19. Database Rules

- Use foreign keys where appropriate.
- Add indexes for frequently filtered fields.
- Add unique constraints for unique business identifiers.
- Use created_at/updated_at consistently.
- Avoid storing derived values unless there is a clear reason.
- Use transactions for multi-step financial operations.
- Never delete important financial/audit records without an explicit retention policy.

---

## 20. Error Handling

Backend errors must be normalized.

Do not expose:

- SQL errors
- stack traces
- secrets
- internal filesystem paths

to end users in production.

---

## 21. Phase Rules

Do not start Phase N+1 until Phase N has:

- working UI
- working API
- database integration
- validation
- authorization
- error handling
- basic tests
- manual acceptance check
- no known blocker

---

## 22. Claude Execution Rules

When implementing:

1. Read `prd.md`.
2. Read `architecture.md`.
3. Read `rules.md`.
4. Read `phases.md`.
5. Read `design.md`.
6. Read `memory.md`.
7. Implement only the current phase.
8. Show files changed.
9. Explain database changes.
10. Explain API changes.
11. Explain how to run/test the phase.
12. Do not silently move into future phases.
13. Preserve working functionality from completed phases.
