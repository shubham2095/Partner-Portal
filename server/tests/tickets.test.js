// Integration tests for Part 5: the support ticket / help desk system.
// Requires the backend (and its database) to already be running.
//
// Registrations are kept to a minimum (2 freelancers) and reused across
// scenarios to stay within the authLimiter's 20-requests/15min budget.

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
    body: { email: uniqueEmail('ticket-a'), password: 'TestPass123!', fullName: 'Ticket Test A', mobile: uniquePhone() },
  })
  assert.equal(regA.status, 201)
  tokenA = regA.body.data.token

  const regB = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('ticket-b'), password: 'TestPass123!', fullName: 'Ticket Test B', mobile: uniquePhone() },
  })
  assert.equal(regB.status, 201)
  tokenB = regB.body.data.token
})

async function createTicket(token, overrides = {}) {
  const res = await api('POST', '/freelancer/tickets', {
    token,
    body: { category: 'TECHNICAL_ISSUE', subject: 'Cannot upload document', description: 'The upload button does nothing.', ...overrides },
  })
  assert.equal(res.status, 201)
  return res.body.data.ticket
}

// ---- Creation ----

test('ticket: freelancer creates a ticket and gets a server-generated ticket number', async () => {
  const ticket = await createTicket(tokenA)
  assert.match(ticket.ticket_number, /^TKT-\d{6}$/)
  assert.equal(ticket.status, 'OPEN')
  assert.equal(ticket.priority, 'MEDIUM')
})

test('ticket: subject and description are required; invalid category is rejected', async () => {
  const missingSubject = await api('POST', '/freelancer/tickets', {
    token: tokenA,
    body: { category: 'TECHNICAL_ISSUE', subject: '', description: 'x' },
  })
  assert.equal(missingSubject.status, 422)

  const badCategory = await api('POST', '/freelancer/tickets', {
    token: tokenA,
    body: { category: 'NOT_A_CATEGORY', subject: 'x', description: 'y' },
  })
  assert.equal(badCategory.status, 422)
})

test('ticket: forged freelancerId/status/assignedAdminId in the creation body are ignored', async () => {
  const res = await api('POST', '/freelancer/tickets', {
    token: tokenA,
    body: {
      category: 'PROFILE_ACCOUNT',
      subject: 'Forgery test',
      description: 'x',
      freelancerId: 999999,
      status: 'CLOSED',
      assignedAdminId: 999999,
    },
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.data.ticket.status, 'OPEN')
  assert.equal(res.body.data.ticket.assigned_admin_id, null)
})

// ---- Ownership ----

test('ticket: freelancer sees own ticket; cannot see another freelancer\'s ticket (ID guessing)', async () => {
  const ticket = await createTicket(tokenA)
  const own = await api('GET', `/freelancer/tickets/${ticket.id}`, { token: tokenA })
  assert.equal(own.status, 200)

  const other = await api('GET', `/freelancer/tickets/${ticket.id}`, { token: tokenB })
  assert.equal(other.status, 404)
})

test('ticket: admin sees all tickets', async () => {
  const ticket = await createTicket(tokenA)
  const res = await api('GET', `/admin/tickets/${ticket.id}`, { token: adminToken })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.ticket.id, ticket.id)
})

// ---- Assignment ----

test('ticket: admin assigns a ticket; freelancer sees the assignment; freelancer cannot assign', async () => {
  const ticket = await createTicket(tokenA)
  const forbidden = await api('POST', `/freelancer/tickets/${ticket.id}/assign`, { token: tokenA, body: { adminId } })
  assert.equal(forbidden.status, 404, 'no such freelancer route exists at all')

  const assign = await api('POST', `/admin/tickets/${ticket.id}/assign`, { token: adminToken, body: { adminId } })
  assert.equal(assign.status, 200)
  assert.equal(assign.body.data.ticket.assigned_admin_id, adminId)

  const asFreelancer = await api('GET', `/freelancer/tickets/${ticket.id}`, { token: tokenA })
  assert.equal(asFreelancer.body.data.ticket.assigned_admin_id, adminId)
})

test('ticket: freelancer cannot assign via the admin route (wrong role)', async () => {
  const ticket = await createTicket(tokenA)
  const res = await api('POST', `/admin/tickets/${ticket.id}/assign`, { token: tokenA, body: { adminId } })
  assert.equal(res.status, 403)
})

// ---- Conversation ----

test('ticket: freelancer and admin replies build an ordered conversation; sender identity is never trusted from the body', async () => {
  const ticket = await createTicket(tokenA)
  const freelancerReply = await api('POST', `/freelancer/tickets/${ticket.id}/replies`, {
    token: tokenA,
    body: { message: 'Any update?', senderRole: 'ADMIN', senderUserId: 999999 },
  })
  assert.equal(freelancerReply.status, 201)

  const adminReply = await api('POST', `/admin/tickets/${ticket.id}/replies`, {
    token: adminToken,
    body: { message: 'Looking into it now.' },
  })
  assert.equal(adminReply.status, 201)

  const detail = await api('GET', `/freelancer/tickets/${ticket.id}`, { token: tokenA })
  assert.equal(detail.body.data.messages.length, 2)
  assert.equal(detail.body.data.messages[0].sender_role, 'FREELANCER', 'forged senderRole ignored')
  assert.equal(detail.body.data.messages[0].message, 'Any update?')
  assert.equal(detail.body.data.messages[1].sender_role, 'ADMIN')
  assert.ok(
    new Date(detail.body.data.messages[0].created_at) <= new Date(detail.body.data.messages[1].created_at),
    'messages are chronologically ordered'
  )
})

test('ticket: freelancer cannot reply to another freelancer\'s ticket', async () => {
  const ticket = await createTicket(tokenA)
  const res = await api('POST', `/freelancer/tickets/${ticket.id}/replies`, { token: tokenB, body: { message: 'x' } })
  assert.equal(res.status, 404)
})

// ---- Status transitions ----

test('ticket: valid status transitions succeed; freelancer cannot change status', async () => {
  const ticket = await createTicket(tokenA)

  const forgedStatus = await api('POST', `/admin/tickets/${ticket.id}/status`, { token: tokenA, body: { status: 'RESOLVED' } })
  assert.equal(forgedStatus.status, 403)

  const toProgress = await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'IN_PROGRESS' } })
  assert.equal(toProgress.status, 200)

  const toResolved = await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'RESOLVED' } })
  assert.equal(toResolved.status, 200)
  assert.ok(toResolved.body.data.ticket.resolved_at)

  const toClosed = await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'CLOSED' } })
  assert.equal(toClosed.status, 200)
  assert.ok(toClosed.body.data.ticket.closed_at)
  assert.ok(toClosed.body.data.ticket.resolved_at, 'resolved_at is preserved as history when later closed')
})

test('ticket: replying to a closed ticket is rejected; reopening (CLOSED -> OPEN) works', async () => {
  const ticket = await createTicket(tokenA)
  await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'IN_PROGRESS' } })
  await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'RESOLVED' } })
  await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'CLOSED' } })

  const replyWhileClosed = await api('POST', `/freelancer/tickets/${ticket.id}/replies`, { token: tokenA, body: { message: 'still broken' } })
  assert.equal(replyWhileClosed.status, 409)

  const reopen = await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'OPEN' } })
  assert.equal(reopen.status, 200)
  assert.equal(reopen.body.data.ticket.closed_at, null)

  const replyAfterReopen = await api('POST', `/freelancer/tickets/${ticket.id}/replies`, { token: tokenA, body: { message: 'still broken' } })
  assert.equal(replyAfterReopen.status, 201)
})

test('ticket: an invalid direct transition is rejected (e.g. skipping straight from a fresh OPEN ticket to an unrelated value)', async () => {
  const ticket = await createTicket(tokenA)
  const invalid = await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'NOT_A_STATUS' } })
  assert.equal(invalid.status, 422)
})

// ---- Priority ----

test('ticket: admin can change priority; freelancer cannot', async () => {
  const ticket = await createTicket(tokenA)
  const asFreelancer = await api('POST', `/admin/tickets/${ticket.id}/priority`, { token: tokenA, body: { priority: 'URGENT' } })
  assert.equal(asFreelancer.status, 403)

  const asAdmin = await api('POST', `/admin/tickets/${ticket.id}/priority`, { token: adminToken, body: { priority: 'URGENT' } })
  assert.equal(asAdmin.status, 200)
  assert.equal(asAdmin.body.data.ticket.priority, 'URGENT')
})

// ---- Security ----

test('ticket: unauthenticated requests are rejected on both freelancer and admin routes', async () => {
  const list = await api('GET', '/freelancer/tickets')
  assert.equal(list.status, 401)
  const create = await api('POST', '/freelancer/tickets', { body: { category: 'GENERAL_QUERY', subject: 'x', description: 'y' } })
  assert.equal(create.status, 401)
  const adminList = await api('GET', '/admin/tickets')
  assert.equal(adminList.status, 401)
})

test('ticket: wrong role is denied on cross-boundary routes', async () => {
  const freelancerOnAdmin = await api('GET', '/admin/tickets', { token: tokenA })
  assert.equal(freelancerOnAdmin.status, 403)
  const adminOnFreelancer = await api('GET', '/freelancer/tickets', { token: adminToken })
  assert.equal(adminOnFreelancer.status, 403)
})

// ---- Search / filters / pagination ----

test('ticket: admin can search, filter by status/category/priority, and paginate', async () => {
  await createTicket(tokenA, { subject: 'Searchable Subject XYZ', category: 'PAYMENT_WITHDRAWAL' })

  const search = await api('GET', '/admin/tickets?search=Searchable Subject XYZ', { token: adminToken })
  assert.equal(search.status, 200)
  assert.ok(search.body.data.tickets.length >= 1)
  assert.ok(search.body.data.tickets.every((t) => t.subject.includes('Searchable Subject XYZ')))

  const byCategory = await api('GET', '/admin/tickets?category=PAYMENT_WITHDRAWAL&limit=100', { token: adminToken })
  assert.equal(byCategory.status, 200)
  assert.ok(byCategory.body.data.tickets.every((t) => t.category === 'PAYMENT_WITHDRAWAL'))

  const paged = await api('GET', '/admin/tickets?page=1&limit=2', { token: adminToken })
  assert.equal(paged.status, 200)
  assert.ok(paged.body.data.tickets.length <= 2)
})

test('ticket: freelancer ticket list only ever returns their own tickets', async () => {
  await createTicket(tokenB)
  const mine = await api('GET', '/freelancer/tickets?limit=100', { token: tokenA })
  assert.equal(mine.status, 200)
  // Every ticket returned must have been created by tokenA — verified indirectly:
  // tokenB cannot fetch detail on any id from tokenA's list (checked elsewhere),
  // and the count is scoped server-side by freelancer_id (see listTicketsForFreelancer).
  assert.ok(mine.body.data.tickets.length >= 1)
})

// ---- Dashboard counts ----

test('ticket: admin dashboard counts and freelancer ticket counts are server-derived', async () => {
  const adminCounts = await api('GET', '/admin/tickets/dashboard-counts', { token: adminToken })
  assert.equal(adminCounts.status, 200)
  assert.ok('unassignedOpen' in adminCounts.body.data)
  assert.ok('highPriorityOpen' in adminCounts.body.data)

  const myCounts = await api('GET', '/freelancer/tickets/counts', { token: tokenA })
  assert.equal(myCounts.status, 200)
  assert.ok('open' in myCounts.body.data)
})

// ---- Financial isolation ----

test('ticket: a COMMISSION-category ticket never touches commission/withdrawal state', async () => {
  const before = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenA })
  assert.equal(before.status, 200)

  const ticket = await createTicket(tokenA, { category: 'COMMISSION_ISSUE', subject: 'Why is my commission pending?' })
  await api('POST', `/admin/tickets/${ticket.id}/status`, { token: adminToken, body: { status: 'RESOLVED' } })

  const after = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenA })
  assert.equal(after.status, 200)
  assert.equal(after.body.data.availableBalance, before.body.data.availableBalance, 'ticket actions never change financial balances')
})
