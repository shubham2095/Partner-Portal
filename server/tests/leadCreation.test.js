// Integration tests for the Part 1 CRM enhancement: lead creation
// (admin + freelancer) and server-side duplicate-lead detection.
// Requires the backend (and its database) to already be running.

import { test, before } from 'node:test'
import assert from 'node:assert/strict'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api/v1'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@partnerportal.local'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
}

function uniquePhone() {
  // 10-digit, starts 9 to look like a real Indian mobile number.
  return '9' + String(Math.floor(100000000 + Math.random() * 899999999))
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, body: json }
}

let adminToken
let freelancerAToken
let freelancerAProfileId // filled in after creating the first lead, from its response
let freelancerBToken

before(async () => {
  const adminLogin = await api('POST', '/auth/login/admin', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  assert.equal(adminLogin.status, 200)
  adminToken = adminLogin.body.data.token

  const regA = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('lead-a'), password: 'TestPass123!', fullName: 'Lead Test A', mobile: '9000000020' },
  })
  assert.equal(regA.status, 201)
  freelancerAToken = regA.body.data.token

  const regB = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('lead-b'), password: 'TestPass123!', fullName: 'Lead Test B', mobile: '9000000021' },
  })
  assert.equal(regB.status, 201)
  freelancerBToken = regB.body.data.token
})

test('admin: can create a valid lead', async () => {
  const res = await api('POST', '/admin/leads', {
    token: adminToken,
    body: { clientName: 'Admin Test Client', mobile: uniquePhone(), serviceInterested: 'SEO' },
  })
  assert.equal(res.status, 201)
  assert.ok(Number.isInteger(res.body.data.lead.created_by), 'created_by must be derived server-side from the JWT')
  assert.ok(res.body.data.lead.lead_number)
})

test('admin: missing required field is rejected', async () => {
  const res = await api('POST', '/admin/leads', { token: adminToken, body: { clientName: 'No Mobile' } })
  assert.equal(res.status, 422)
})

test('admin: duplicate phone is rejected with 409 and safe reference', async () => {
  const phone = uniquePhone()
  const first = await api('POST', '/admin/leads', { token: adminToken, body: { clientName: 'Original', mobile: phone } })
  assert.equal(first.status, 201)

  const dup = await api('POST', '/admin/leads', { token: adminToken, body: { clientName: 'Duplicate Attempt', mobile: phone } })
  assert.equal(dup.status, 409)
  assert.equal(dup.body.errors.duplicate, true)
  assert.equal(dup.body.errors.matches[0].id, first.body.data.lead.id)
})

test('admin: duplicate email (different phone) is rejected with 409', async () => {
  const email = uniqueEmail('dup-email')
  const first = await api('POST', '/admin/leads', {
    token: adminToken,
    body: { clientName: 'Email Original', mobile: uniquePhone(), email },
  })
  assert.equal(first.status, 201)

  const dup = await api('POST', '/admin/leads', {
    token: adminToken,
    body: { clientName: 'Email Duplicate', mobile: uniquePhone(), email: email.toUpperCase() },
  })
  assert.equal(dup.status, 409)
})

test('admin: unauthorized (freelancer) cannot create via admin endpoint', async () => {
  const res = await api('POST', '/admin/leads', {
    token: freelancerAToken,
    body: { clientName: 'x', mobile: uniquePhone() },
  })
  assert.equal(res.status, 403)
})

test('freelancer: can create their own lead, auto-assigned to themselves', async () => {
  const res = await api('POST', '/freelancer/leads', {
    token: freelancerAToken,
    body: { clientName: 'Freelancer Own Client', mobile: uniquePhone(), serviceInterested: 'Google Ads' },
  })
  assert.equal(res.status, 201)
  assert.ok(res.body.data.lead.assigned_freelancer_id, 'lead should be auto-assigned to the creating freelancer')
  freelancerAProfileId = res.body.data.lead.assigned_freelancer_id
})

test('freelancer: invalid lead (missing mobile) is rejected', async () => {
  const res = await api('POST', '/freelancer/leads', { token: freelancerAToken, body: { clientName: 'No mobile' } })
  assert.equal(res.status, 422)
})

test('freelancer: duplicate of own lead is rejected with full safe reference', async () => {
  const phone = uniquePhone()
  const first = await api('POST', '/freelancer/leads', { token: freelancerAToken, body: { clientName: 'Own Dup', mobile: phone } })
  assert.equal(first.status, 201)

  const dup = await api('POST', '/freelancer/leads', { token: freelancerAToken, body: { clientName: 'Own Dup Retry', mobile: phone } })
  assert.equal(dup.status, 409)
  assert.equal(dup.body.errors.matches.length, 1)
  assert.equal(dup.body.errors.matches[0].id, first.body.data.lead.id)
})

test('freelancer: duplicate against ANOTHER freelancer\'s lead is rejected but leaks nothing', async () => {
  const phone = uniquePhone()
  const first = await api('POST', '/freelancer/leads', { token: freelancerAToken, body: { clientName: 'Cross FL Client', mobile: phone } })
  assert.equal(first.status, 201)

  const dup = await api('POST', '/freelancer/leads', { token: freelancerBToken, body: { clientName: 'Someone Else', mobile: phone } })
  assert.equal(dup.status, 409)
  assert.equal(dup.body.errors.matches.length, 0, 'a duplicate against another freelancer\'s lead must not expose any lead reference')
})

test('freelancer: forged freelancerId/userId in body is ignored — ownership derives from JWT only', async () => {
  const res = await api('POST', '/freelancer/leads', {
    token: freelancerBToken,
    body: { clientName: 'Forged Owner', mobile: uniquePhone(), freelancerId: freelancerAProfileId, userId: 1 },
  })
  assert.equal(res.status, 201)
  assert.notEqual(res.body.data.lead.assigned_freelancer_id, freelancerAProfileId)
})

test('freelancer: unauthenticated lead creation is rejected', async () => {
  const res = await api('POST', '/freelancer/leads', { body: { clientName: 'x', mobile: uniquePhone() } })
  assert.equal(res.status, 401)
})

test('lead creation with nextFollowUpDate creates a real follow-up via the existing follow-up system', async () => {
  const create = await api('POST', '/freelancer/leads', {
    token: freelancerAToken,
    body: {
      clientName: 'FollowUp Test',
      mobile: uniquePhone(),
      nextFollowUpDate: '2026-12-01T10:00:00',
      followUpType: 'EMAIL',
    },
  })
  assert.equal(create.status, 201)
  const leadId = create.body.data.lead.id

  const followUps = await api('GET', `/freelancer/leads/${leadId}/followups`, { token: freelancerAToken })
  assert.equal(followUps.status, 200)
  assert.equal(followUps.body.data.followUps.length, 1)
  assert.equal(followUps.body.data.followUps[0].follow_up_type, 'EMAIL')
})

test('concurrent identical submissions: exactly one succeeds, others get 409', async () => {
  const phone = uniquePhone()
  const attempt = () =>
    api('POST', '/admin/leads', { token: adminToken, body: { clientName: 'Race Test', mobile: phone } })

  const results = await Promise.all([attempt(), attempt(), attempt()])
  const statuses = results.map((r) => r.status).sort()
  assert.deepEqual(statuses, [201, 409, 409])
})
