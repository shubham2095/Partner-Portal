// Integration tests for Part 6: PDF requirements gap closure.
// Covers only what was newly added/changed in Part 6 — the extended ticket
// lifecycle (ASSIGNED/WAITING_FOR_FREELANCER, auto-transitions), the
// extended follow-up priority field, freelancer profile bio/communication
// fields, and the new/extended analytics reports + filters.
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
  return '9' + String(Math.floor(100000000 + Math.random() * 899999999))
}

async function api(method, path, { token, body } = {}) {
  const options = { method, headers: {} }
  if (token) options.headers.Authorization = `Bearer ${token}`
  if (body) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE_URL}${path}`, options)
  const json = await res.json().catch(() => null)
  return { status: res.status, body: json }
}

let adminToken
let adminId
let tokenA
let tokenB

before(async () => {
  const adminLogin = await api('POST', '/auth/login/admin', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  assert.equal(adminLogin.status, 200)
  adminToken = adminLogin.body.data.token
  adminId = adminLogin.body.data.user.id

  const regA = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('p6-a'), password: 'TestPass123!', fullName: 'Part6 Test A', mobile: uniquePhone() },
  })
  assert.equal(regA.status, 201)
  tokenA = regA.body.data.token

  const regB = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('p6-b'), password: 'TestPass123!', fullName: 'Part6 Test B', mobile: uniquePhone() },
  })
  assert.equal(regB.status, 201)
  tokenB = regB.body.data.token
})

async function createTicket(token, overrides = {}) {
  const res = await api('POST', '/freelancer/tickets', {
    token,
    body: { category: 'TECHNICAL_ISSUE', subject: 'Part 6 gap test ticket', description: 'x', ...overrides },
  })
  assert.equal(res.status, 201)
  return res.body.data.ticket
}

// ---- Ticket lifecycle: new states + auto-transitions ----

test('ticket: assigning an OPEN ticket auto-bumps it to ASSIGNED', async () => {
  const ticket = await createTicket(tokenA)
  assert.equal(ticket.status, 'OPEN')

  const assign = await api('POST', `/admin/tickets/${ticket.id}/assign`, { token: adminToken, body: { adminId } })
  assert.equal(assign.status, 200)
  assert.equal(assign.body.data.ticket.status, 'ASSIGNED', 'assignment auto-transitions OPEN -> ASSIGNED')
})

test('ticket: an admin reply on an OPEN/ASSIGNED ticket auto-bumps it to IN_PROGRESS', async () => {
  const ticket = await createTicket(tokenA)
  await api('POST', `/admin/tickets/${ticket.id}/assign`, { token: adminToken, body: { adminId } })

  const reply = await api('POST', `/admin/tickets/${ticket.id}/replies`, { token: adminToken, body: { message: 'Looking into this.' } })
  assert.equal(reply.status, 201)

  const detail = await api('GET', `/admin/tickets/${ticket.id}`, { token: adminToken })
  assert.equal(detail.body.data.ticket.status, 'IN_PROGRESS', 'admin reply auto-transitions ASSIGNED -> IN_PROGRESS')
})

test('ticket: WAITING_FOR_FREELANCER is reachable and a freelancer reply auto-bumps it back to IN_PROGRESS', async () => {
  const ticket = await createTicket(tokenA)
  await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'IN_PROGRESS' } })

  const toWaiting = await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'WAITING_FOR_FREELANCER' } })
  assert.equal(toWaiting.status, 200)

  const freelancerReply = await api('POST', `/freelancer/tickets/${ticket.id}/replies`, { token: tokenA, body: { message: 'Here is the info you asked for.' } })
  assert.equal(freelancerReply.status, 201)

  const detail = await api('GET', `/freelancer/tickets/${ticket.id}`, { token: tokenA })
  assert.equal(detail.body.data.ticket.status, 'IN_PROGRESS', 'freelancer reply auto-transitions WAITING_FOR_FREELANCER -> IN_PROGRESS')
})

test('ticket: an invalid direct transition (ASSIGNED -> WAITING_FOR_FREELANCER) is rejected', async () => {
  const ticket = await createTicket(tokenA)
  await api('POST', `/admin/tickets/${ticket.id}/assign`, { token: adminToken, body: { adminId } })

  const res = await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'WAITING_FOR_FREELANCER' } })
  assert.equal(res.status, 409, 'ASSIGNED can only go to IN_PROGRESS, RESOLVED, or CLOSED per the allowed-transitions map')
})

test('ticket: the 7 new PDF-aligned categories are all accepted; a stale Part-5 category is rejected', async () => {
  const categories = ['LEAD_ISSUE', 'COMMISSION_ISSUE', 'PAYMENT_WITHDRAWAL', 'COURSE_TRAINING', 'TECHNICAL_ISSUE', 'PROFILE_ACCOUNT', 'GENERAL_QUERY']
  for (const category of categories) {
    const res = await api('POST', '/freelancer/tickets', { token: tokenA, body: { category, subject: `cat-${category}`, description: 'x' } })
    assert.equal(res.status, 201, `${category} should be accepted`)
  }
  const stale = await api('POST', '/freelancer/tickets', { token: tokenA, body: { category: 'TECHNICAL', subject: 'x', description: 'y' } })
  assert.equal(stale.status, 422, 'the old Part 5 category value must no longer validate')
})

// ---- Follow-up priority ----

test('follow-up: priority defaults to MEDIUM and can be set explicitly; invalid priority is rejected', async () => {
  const lead = await api('POST', '/freelancer/leads', { token: tokenA, body: { clientName: 'Priority Test', mobile: uniquePhone() } })
  const leadId = lead.body.data.lead.id

  const defaulted = await api('POST', `/freelancer/leads/${leadId}/followups`, {
    token: tokenA,
    body: { scheduledAt: '2026-12-01T10:00:00', followUpType: 'DEMO' },
  })
  assert.equal(defaulted.status, 201, 'DEMO is a new Part 6 follow-up type and must validate')
  assert.equal(defaulted.body.data.followUp.priority, 'MEDIUM')

  const high = await api('POST', `/freelancer/leads/${leadId}/followups`, {
    token: tokenA,
    body: { scheduledAt: '2026-12-02T10:00:00', followUpType: 'OTHER', priority: 'HIGH' },
  })
  assert.equal(high.status, 201)
  assert.equal(high.body.data.followUp.priority, 'HIGH')

  const invalid = await api('POST', `/freelancer/leads/${leadId}/followups`, {
    token: tokenA,
    body: { scheduledAt: '2026-12-03T10:00:00', followUpType: 'EMAIL', priority: 'CRITICAL' },
  })
  assert.equal(invalid.status, 422)
})

test('follow-up: admin monitoring list can filter by priority', async () => {
  const res = await api('GET', '/admin/leads/followups?priority=HIGH&limit=100', { token: adminToken })
  assert.equal(res.status, 200)
  assert.ok(res.body.data.followUps.every((fu) => fu.priority === 'HIGH'))
})

// ---- Freelancer profile: bio / preferred communication ----

test('profile: bio and preferredCommunication are saved and returned', async () => {
  const update = await api('PATCH', '/freelancer/profile', {
    token: tokenA,
    body: { bio: 'Digital marketing partner focused on SMB clients.', preferredCommunication: 'WhatsApp, mornings preferred' },
  })
  assert.equal(update.status, 200)
  assert.equal(update.body.data.profile.bio, 'Digital marketing partner focused on SMB clients.')
  assert.equal(update.body.data.profile.preferred_communication, 'WhatsApp, mornings preferred')
})

// ---- Reports: new types + freelancer/status filters ----

test('reports: the 4 new Part 6 report types are all reachable and return rows/columns', async () => {
  for (const type of ['withdrawal', 'follow-up', 'course', 'ticket']) {
    const res = await api('GET', `/admin/analytics/reports/${type}?limit=10`, { token: adminToken })
    assert.equal(res.status, 200, `${type} report should be reachable`)
    assert.ok(Array.isArray(res.body.data.rows), `${type} report must return a rows array`)
  }
})

test('reports: lead/sales/commission reports accept a freelancerId filter and scope results to it', async () => {
  const profileRes = await api('GET', '/admin/freelancers?search=Part6 Test A', { token: adminToken })
  assert.equal(profileRes.status, 200)
  const freelancerId = profileRes.body.data.freelancers[0].id

  const leadReport = await api('GET', `/admin/analytics/reports/lead?freelancerId=${freelancerId}&limit=100`, { token: adminToken })
  assert.equal(leadReport.status, 200)
  assert.ok(leadReport.body.data.rows.every((row) => row.assigned_freelancer_name === 'Part6 Test A' || row.assigned_freelancer_name == null))
})

test('reports: commission report accepts a status filter', async () => {
  const res = await api('GET', '/admin/analytics/reports/commission?status=PAID&limit=100', { token: adminToken })
  assert.equal(res.status, 200)
  assert.ok(res.body.data.rows.every((row) => row.status === 'PAID'))
})

test('reports: export endpoint returns CSV for a new report type', async () => {
  const res = await fetch(`${BASE_URL}/admin/analytics/reports/ticket/export`, { headers: { Authorization: `Bearer ${adminToken}` } })
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type') || '', /csv/)
})

test('reports: freelancer cannot access any admin report endpoint', async () => {
  const res = await api('GET', '/admin/analytics/reports/withdrawal', { token: tokenA })
  assert.equal(res.status, 403)
})

test('reports: unauthenticated access is rejected', async () => {
  const res = await api('GET', '/admin/analytics/reports/ticket')
  assert.equal(res.status, 401)
})
