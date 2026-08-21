// Integration regression suite — exercises the live API over HTTP.
// Requires the backend (and its database) to already be running:
//   npm run dev   (in another terminal)
//   npm run test  (runs this suite against it)
//
// Covers the areas called out in the Phase 7 hardening audit: auth, RBAC,
// ownership isolation, financial/analytics authorization, certificate
// verification, and webhook signature enforcement. Not a substitute for
// exhaustive coverage — it is meant to catch regressions in the security
// boundaries that must never regress silently.

import { test, before } from 'node:test'
import assert from 'node:assert/strict'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api/v1'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@partnerportal.local'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
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
let freelancerALeadId

before(async () => {
  const adminLogin = await api('POST', '/auth/login/admin', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })
  assert.equal(adminLogin.status, 200, 'seed admin credentials must be valid for the test suite to run')
  adminToken = adminLogin.body.data.token

  const regA = await api('POST', '/auth/register', {
    body: {
      email: uniqueEmail('freelancer-a'),
      password: 'TestPass123!',
      fullName: 'Regression Freelancer A',
      mobile: '9000000010',
    },
  })
  assert.equal(regA.status, 201)
  freelancerAToken = regA.body.data.token

  const regB = await api('POST', '/auth/register', {
    body: {
      email: uniqueEmail('freelancer-b'),
      password: 'TestPass123!',
      fullName: 'Regression Freelancer B',
      mobile: '9000000011',
    },
  })
  assert.equal(regB.status, 201)
  freelancerBToken = regB.body.data.token

  const leads = await api('GET', '/admin/leads?page=1&limit=1', { token: adminToken })
  freelancerALeadId = leads.body?.data?.leads?.[0]?.id ?? null
})

test('auth: unauthenticated request is rejected', async () => {
  const res = await api('GET', '/auth/me')
  assert.equal(res.status, 401)
})

test('auth: invalid credentials are rejected', async () => {
  const res = await api('POST', '/auth/login/admin', { body: { email: ADMIN_EMAIL, password: 'wrong-password' } })
  assert.equal(res.status, 401)
})

test('auth: tampered JWT is rejected', async () => {
  const [header, payload] = freelancerAToken.split('.')
  const forgedPayload = Buffer.from(JSON.stringify({ sub: 1, role: 'ADMIN' })).toString('base64url')
  const forged = `${header}.${forgedPayload}.forgedsignature`
  const res = await api('GET', '/auth/me', { token: forged })
  assert.equal(res.status, 401)
})

test('auth: freshly registered freelancer can fetch their own identity', async () => {
  const res = await api('GET', '/auth/me', { token: freelancerAToken })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.user.role, 'FREELANCER')
})

test('rbac: freelancer cannot access admin-only endpoints', async () => {
  const res = await api('GET', '/admin/freelancers', { token: freelancerAToken })
  assert.equal(res.status, 403)
})

test('rbac: freelancer cannot access admin analytics', async () => {
  const res = await api('GET', '/admin/analytics/overview', { token: freelancerAToken })
  assert.equal(res.status, 403)
})

test('rbac: admin token works on an admin-only endpoint', async () => {
  const res = await api('GET', '/admin/freelancers?page=1&limit=1', { token: adminToken })
  assert.equal(res.status, 200)
})

test('ownership: a freelancer with no leads sees an empty list, not another freelancer\'s data', async () => {
  const res = await api('GET', '/freelancer/leads?page=1&limit=20', { token: freelancerAToken })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.leads.length, 0)
})

test('ownership: freelancer cannot fetch a lead not assigned to them by guessing its ID', async (t) => {
  if (!freelancerALeadId) {
    t.skip('no leads exist in this database to test against')
    return
  }
  const res = await api('GET', `/freelancer/leads/${freelancerALeadId}`, { token: freelancerAToken })
  assert.ok([403, 404].includes(res.status), `expected 403 or 404, got ${res.status}`)
})

test('ownership: freelancer analytics summary ignores a spoofed freelancerId query param', async () => {
  const res = await api('GET', '/freelancer/analytics/summary?freelancerId=999999', { token: freelancerAToken })
  assert.equal(res.status, 200)
  // Should not error or reflect the spoofed id — the service derives the
  // freelancer strictly from the authenticated user, so a fresh freelancer
  // with no leads always gets zeroed totals regardless of the query string.
  assert.equal(res.body.data.totalLeads, 0)
})

test('ownership: freelancer A and freelancer B are distinct identities', async () => {
  const meA = await api('GET', '/auth/me', { token: freelancerAToken })
  const meB = await api('GET', '/auth/me', { token: freelancerBToken })
  assert.notEqual(meA.body.data.user.id, meB.body.data.user.id)
})

test('financial: freelancer cannot access the commission report', async () => {
  const res = await api('GET', '/admin/analytics/reports/commission', { token: freelancerAToken })
  assert.equal(res.status, 403)
})

test('financial: freelancer cannot read another freelancer\'s commissions via admin endpoint', async () => {
  const res = await api('GET', '/admin/commissions', { token: freelancerAToken })
  assert.equal(res.status, 403)
})

test('certificate verification: public endpoint is reachable without auth', async () => {
  const res = await api('GET', '/verify/certificate/CERT-2026-999999')
  assert.equal(res.status, 200)
  assert.equal(res.body.data.verified, false)
})

test('webhooks: Meta webhook without a valid signature is rejected', async () => {
  const res = await fetch(`${BASE_URL}/webhooks/meta-lead-ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entry: [] }),
  })
  assert.ok([401, 403].includes(res.status), `expected signature rejection, got ${res.status}`)
})

test('validation: excessive analytics date range is rejected', async () => {
  const res = await api('GET', '/admin/analytics/leads-over-time?dateFrom=2000-01-01&dateTo=2026-01-01', {
    token: adminToken,
  })
  assert.equal(res.status, 422)
})

test('rate limiting: auth endpoints advertise a rate limit', async () => {
  const res = await fetch(`${BASE_URL}/auth/login/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong' }),
  })
  assert.ok(res.headers.get('ratelimit-limit'), 'expected a RateLimit-Limit response header')
})
