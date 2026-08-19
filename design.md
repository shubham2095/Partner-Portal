# Design System — Digital Marketing Partner Portal

## 1. Design Direction

The product should feel like a professional SaaS platform for a digital marketing agency.

Design priorities:

1. Clean
2. Modern
3. Professional
4. Fast to understand
5. Data-focused
6. Mobile-friendly for freelancers
7. Efficient for admin operations

Do not make the UI look like a generic template dashboard.

---

## 2. Application Layouts

### Admin

```text
┌──────────────────────────────────────────────────────────────┐
│ Topbar: Search | Notifications | Profile                    │
├───────────────┬──────────────────────────────────────────────┤
│ Sidebar       │ Page Header                                  │
│ Dashboard     │ Breadcrumbs                                  │
│ Freelancers   │                                              │
│ Webinars      │ Main Content                                 │
│ Tests         │                                              │
│ Certificates  │ Cards / Tables / Charts / Forms              │
│ Training      │                                              │
│ Leads         │                                              │
│ Sales         │                                              │
│ Commissions   │                                              │
│ Reports       │                                              │
│ Settings      │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

### Freelancer

Mobile-first:

```text
Header
↓
Performance summary
↓
Action cards
↓
Today's follow-ups
↓
Lead pipeline
↓
Recent activity
↓
Bottom/mobile navigation
```

---

## 3. Visual Hierarchy

Use:

- Strong page titles
- Clear section headings
- Compact metadata
- Consistent cards
- Tables for operational data
- Charts for trends
- Badges for statuses
- Progress indicators for tests/training
- Timeline for lead history

Do not overload screens with decorative elements.

---

## 4. Color System

Create semantic design tokens rather than hard-coding colors.

Required semantic tokens:

```text
primary
primary-hover
secondary
success
warning
danger
info
background
surface
surface-muted
border
text-primary
text-secondary
text-muted
```

The exact visual palette should be centralized in Tailwind configuration.

---

## 5. Typography

Use a modern sans-serif UI font stack.

Hierarchy:

```text
Page title
Section heading
Card heading
Body
Metadata
Caption
```

Avoid excessive font sizes.

---

## 6. Components

Build reusable components:

```text
Button
Input
Select
Textarea
Checkbox
Radio
DatePicker
FileUpload
Modal
Drawer
Dropdown
Tabs
Badge
Card
Table
Pagination
SearchBar
FilterBar
StatCard
ChartCard
EmptyState
LoadingState
ErrorState
ConfirmDialog
Toast
Timeline
ProgressBar
Avatar
Breadcrumb
```

---

## 7. Status Badge Rules

Use consistent semantic labels.

Examples:

```text
New
Contacted
Interested
Meeting
Proposal
Negotiation
Follow-up
Converted
Lost
Pending
Approved
Paid
Active
Inactive
Certified
Suspended
```

Status styling must be consistent throughout the application.

---

## 8. Dashboard Design

### Admin dashboard

Top metrics:

- Total freelancers
- Active freelancers
- Certified freelancers
- Total leads
- Unassigned leads
- Converted leads
- Revenue
- Commission payable

Charts:

- Leads over time
- Conversion funnel
- Revenue trend
- Freelancer performance
- Webinar funnel

### Freelancer dashboard

Top:

- Leads
- Follow-ups
- Conversions
- Revenue
- Commission

Middle:

- Today's follow-ups
- Lead pipeline
- Recent activity

Bottom:

- Training
- Announcements
- Support

---

## 9. Lead Detail Design

Lead page should contain:

### Header

- Lead ID
- Client
- Company
- Service
- Value
- Current status

### Quick actions

- Call
- WhatsApp
- Email
- Add follow-up
- Update status

### Information

- Contact
- Business
- Source
- Assigned freelancer

### Timeline

A chronological activity feed.

### Follow-up panel

Show:

- Next follow-up
- Type
- Notes
- Outcome

---

## 10. Freelancer Onboarding UX

Use a step-based flow:

```text
Account
→ Verification
→ Professional Profile
→ Documents
→ Payment Details
→ Review
→ Activation
```

Show progress clearly.

Do not put every field on one giant form.

---

## 11. Test UX

Before test:

- Instructions
- Number of questions
- Duration
- Passing percentage
- Attempts

During test:

- Question counter
- Timer
- Progress
- Answer navigation
- Submit confirmation

After test:

- Score
- Percentage
- Qualified/Not Qualified
- Correct/incorrect summary where permitted
- Next action

---

## 12. Certificate UX

Certificate page:

- Large certificate preview
- Certificate ID
- Partner ID
- Course
- Date
- Verification status
- Download button
- Share button
- QR code

Public verification page should be clean and minimal.

---

## 13. Tables

Tables must support:

- Search
- Filters
- Sort
- Pagination
- Row actions
- Responsive behavior

On mobile, convert wide tables into stacked cards where appropriate.

---

## 14. Forms

Every form must have:

- Label
- Input
- Validation
- Helpful placeholder where needed
- Error state
- Save/cancel actions

Long forms should use sections.

---

## 15. Motion

Use framer-motion for:

- Page transitions
- Modal entrance
- Drawer entrance
- Card hover where useful
- Dashboard number reveal where useful
- Success states

Avoid excessive animations in CRM screens.

---

## 16. Responsive Rules

Breakpoints must support:

- Mobile
- Tablet
- Desktop
- Large desktop

Freelancer portal must be fully usable on mobile.

Admin can prioritize desktop but must remain responsive.

---

## 17. Accessibility

- Keyboard navigation
- Visible focus states
- Proper labels
- Sufficient contrast
- Alt text
- Semantic buttons/links
- Error announcements where appropriate
- Do not rely on color alone for status

---

## 18. Design Implementation Rules

All colors, spacing, radii and typography must be centralized.

Do not create one-off styles repeatedly.

Prefer:

```text
components/ui/
components/forms/
components/data-display/
components/navigation/
```

Feature-specific components stay inside their feature folder.

---

## 19. Empty and Loading States

Every data-heavy page must have:

- Loading state
- Empty state
- Error state
- Retry action where appropriate

Example empty state:

“No leads assigned yet.”

with a useful explanation/action rather than a blank screen.
