// Integration tests for the Part 2 follow-up management enhancement:
// bucketed listing, filters, reschedule, complete, cancel, and the
// authorization boundaries around them. Requires the backend (and its
// database) to already be running.

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
let freelancerBToken
let leadAId // owned by freelancer A

before(async () => {
  const adminLogin = await api('POST', '/auth/login/admin', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  assert.equal(adminLogin.status, 200)
  adminToken = adminLogin.body.data.token

  const regA = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('fu-a'), password: 'TestPass123!', fullName: 'FollowUp Test A', mobile: '9000000030' },
  })
  assert.equal(regA.status, 201)
  freelancerAToken = regA.body.data.token

  const regB = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('fu-b'), password: 'TestPass123!', fullName: 'FollowUp Test B', mobile: '9000000031' },
  })
  assert.equal(regB.status, 201)
  freelancerBToken = regB.body.data.token

  const lead = await api('POST', '/freelancer/leads', {
    token: freelancerAToken,
    body: { clientName: 'FollowUp Owner Test', mobile: uniquePhone() },
  })
  assert.equal(lead.status, 201)
  leadAId = lead.body.data.lead.id
})

test('freelancer: can create a follow-up on their own lead', async () => {
  const res = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-01T10:00:00', followUpType: 'PHONE_CALL', notes: 'first contact' },
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.data.followUp.status, 'PENDING')
})

test('freelancer: cannot create a follow-up on a lead they do not own', async () => {
  const res = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerBToken,
    body: { scheduledAt: '2026-11-01T10:00:00', followUpType: 'PHONE_CALL' },
  })
  assert.equal(res.status, 404, 'ownership must be enforced as a 404, not leaking that the lead exists')
})

test('freelancer: invalid follow-up type is rejected', async () => {
  const res = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-01T10:00:00', followUpType: 'CARRIER_PIGEON' },
  })
  assert.equal(res.status, 422)
})

test('freelancer: invalid date/time is rejected', async () => {
  const res = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: 'not-a-date', followUpType: 'EMAIL' },
  })
  assert.equal(res.status, 422)
})

test('bucket filters: today/overdue/upcoming return only matching pending follow-ups', async () => {
  const overdue = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2020-01-01T10:00:00', followUpType: 'EMAIL' },
  })
  assert.equal(overdue.status, 201)

  const overdueList = await api('GET', '/freelancer/leads/followups?bucket=overdue', { token: freelancerAToken })
  assert.equal(overdueList.status, 200)
  assert.ok(overdueList.body.data.followUps.some((fu) => fu.id === overdue.body.data.followUp.id))
  assert.ok(overdueList.body.data.followUps.every((fu) => new Date(fu.scheduled_at) < new Date()))

  const upcomingList = await api('GET', '/freelancer/leads/followups?bucket=upcoming', { token: freelancerAToken })
  assert.ok(!upcomingList.body.data.followUps.some((fu) => fu.id === overdue.body.data.followUp.id))
})

test('type filter: only returns follow-ups of the requested type', async () => {
  const res = await api('GET', '/freelancer/leads/followups?followUpType=EMAIL', { token: freelancerAToken })
  assert.equal(res.status, 200)
  assert.ok(res.body.data.followUps.every((fu) => fu.follow_up_type === 'EMAIL'))
})

test('search filter: matches by client name', async () => {
  const res = await api('GET', '/freelancer/leads/followups?search=FollowUp Owner Test', { token: freelancerAToken })
  assert.equal(res.status, 200)
  assert.ok(res.body.data.followUps.length > 0)
  assert.ok(res.body.data.followUps.every((fu) => fu.client_name.includes('FollowUp Owner Test')))
})

test('reschedule: freelancer can update their own pending follow-up', async () => {
  const create = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-05T10:00:00', followUpType: 'MEETING' },
  })
  const id = create.body.data.followUp.id

  const reschedule = await api('PATCH', `/freelancer/leads/followups/${id}`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-06T14:00:00' },
  })
  assert.equal(reschedule.status, 200)
  assert.equal(reschedule.body.data.followUp.scheduled_at, '2026-11-06 14:00:00')
})

test('reschedule: freelancer B cannot reschedule freelancer A\'s follow-up (ID guessing)', async () => {
  const create = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-07T10:00:00', followUpType: 'MEETING' },
  })
  const id = create.body.data.followUp.id

  const res = await api('PATCH', `/freelancer/leads/followups/${id}`, {
    token: freelancerBToken,
    body: { scheduledAt: '2026-11-08T10:00:00' },
  })
  assert.equal(res.status, 404)
})

test('complete: marks completed, records outcome/completed_at, ignores forged status fields', async () => {
  const create = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-09T10:00:00', followUpType: 'PHONE_CALL' },
  })
  const id = create.body.data.followUp.id

  const complete = await api('POST', `/freelancer/leads/followups/${id}/complete`, {
    token: freelancerAToken,
    body: { outcome: 'Client interested', status: 'PENDING', completedAt: '2000-01-01', isCompleted: false },
  })
  assert.equal(complete.status, 200)
  assert.equal(complete.body.data.followUp.status, 'COMPLETED')
  assert.equal(complete.body.data.followUp.outcome, 'Client interested')
  assert.ok(complete.body.data.followUp.completed_at)
})

test('complete: an already-completed follow-up cannot be completed again', async () => {
  const create = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-10T10:00:00', followUpType: 'PHONE_CALL' },
  })
  const id = create.body.data.followUp.id
  await api('POST', `/freelancer/leads/followups/${id}/complete`, { token: freelancerAToken, body: { outcome: 'done' } })

  const again = await api('POST', `/freelancer/leads/followups/${id}/complete`, { token: freelancerAToken, body: { outcome: 'again' } })
  assert.equal(again.status, 409)
})

test('freelancer B cannot complete freelancer A\'s follow-up', async () => {
  const create = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-11T10:00:00', followUpType: 'PHONE_CALL' },
  })
  const id = create.body.data.followUp.id

  const res = await api('POST', `/freelancer/leads/followups/${id}/complete`, { token: freelancerBToken, body: { outcome: 'x' } })
  assert.equal(res.status, 404)
})

test('cancel: marks cancelled and records cancelled_at', async () => {
  const create = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-12T10:00:00', followUpType: 'PHONE_CALL' },
  })
  const id = create.body.data.followUp.id

  const cancel = await api('POST', `/freelancer/leads/followups/${id}/cancel`, { token: freelancerAToken })
  assert.equal(cancel.status, 200)
  assert.equal(cancel.body.data.followUp.status, 'CANCELLED')
  assert.ok(cancel.body.data.followUp.cancelled_at)
})

test('freelancer B cannot cancel freelancer A\'s follow-up', async () => {
  const create = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-13T10:00:00', followUpType: 'PHONE_CALL' },
  })
  const id = create.body.data.followUp.id

  const res = await api('POST', `/freelancer/leads/followups/${id}/cancel`, { token: freelancerBToken })
  assert.equal(res.status, 404)
})

test('cancelled follow-up cannot be rescheduled or completed again', async () => {
  const create = await api('POST', `/freelancer/leads/${leadAId}/followups`, {
    token: freelancerAToken,
    body: { scheduledAt: '2026-11-14T10:00:00', followUpType: 'PHONE_CALL' },
  })
  const id = create.body.data.followUp.id
  await api('POST', `/freelancer/leads/followups/${id}/cancel`, { token: freelancerAToken })

  const reschedule = await api('PATCH', `/freelancer/leads/followups/${id}`, { token: freelancerAToken, body: { scheduledAt: '2026-12-01T10:00:00' } })
  assert.equal(reschedule.status, 409)

  const complete = await api('POST', `/freelancer/leads/followups/${id}/complete`, { token: freelancerAToken, body: { outcome: 'x' } })
  assert.equal(complete.status, 409)
})

test('unauthenticated follow-up requests are rejected', async () => {
  const list = await api('GET', '/freelancer/leads/followups')
  assert.equal(list.status, 401)
  const create = await api('POST', `/freelancer/leads/${leadAId}/followups`, { body: { scheduledAt: '2026-11-01T10:00:00', followUpType: 'EMAIL' } })
  assert.equal(create.status, 401)
})

test('admin: can list follow-ups filtered by freelancer and see freelancer identity', async () => {
  const res = await api('GET', '/admin/leads/followups?page=1&limit=50', { token: adminToken })
  assert.equal(res.status, 200)
  const forLeadA = res.body.data.followUps.filter((fu) => fu.lead_id === leadAId)
  assert.ok(forLeadA.length > 0)
  assert.ok('assigned_freelancer_name' in forLeadA[0])
})

test('admin: freelancer cannot access admin follow-up monitoring endpoint', async () => {
  const res = await api('GET', '/admin/leads/followups', { token: freelancerAToken })
  assert.equal(res.status, 403)
})
