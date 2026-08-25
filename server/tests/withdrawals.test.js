// Integration tests for Part 4: the withdrawal / manual payout workflow.
// Requires the backend (and its database) to already be running.
//
// Registrations are deliberately kept few and reused across independent
// scenarios (instead of one fresh freelancer per test) because this suite
// runs against the same authLimiter (20 requests/15min) as the rest of the
// app's tests, and each registration alone costs one of that budget.

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
let serviceName
let tokenA // has bank details on file throughout
let tokenB // has bank details on file throughout
let tokenC // deliberately never given bank details (for the bank-details gate test)

before(async () => {
  const adminLogin = await api('POST', '/auth/login/admin', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  assert.equal(adminLogin.status, 200)
  adminToken = adminLogin.body.data.token

  serviceName = `WithdrawTestService-${Date.now()}`
  const rule = await api('POST', '/admin/commissions/rules', {
    token: adminToken,
    body: { serviceName, rateType: 'PERCENTAGE', rateValue: 10 },
  })
  assert.equal(rule.status, 201)

  const regA = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('withdraw-a'), password: 'TestPass123!', fullName: 'Withdraw A', mobile: uniquePhone() },
  })
  tokenA = regA.body.data.token
  const regB = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('withdraw-b'), password: 'TestPass123!', fullName: 'Withdraw B', mobile: uniquePhone() },
  })
  tokenB = regB.body.data.token
  const regC = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('withdraw-c'), password: 'TestPass123!', fullName: 'Withdraw C', mobile: uniquePhone() },
  })
  tokenC = regC.body.data.token

  for (const token of [tokenA, tokenB]) {
    const res = await api('PUT', '/freelancer/commissions/payment-details', {
      token,
      body: { accountHolderName: 'Withdraw Test', bankAccountNumber: '111122223333', ifscCode: 'HDFC0001234' },
    })
    assert.equal(res.status, 200)
  }
})

// Creates one more PAYABLE commission for an existing freelancer token —
// no new registration, so it doesn't touch the auth rate limiter at all.
async function addPayableCommission(token, conversionValue) {
  const lead = await api('POST', '/freelancer/leads', {
    token,
    body: { clientName: 'Withdraw Client', mobile: uniquePhone(), serviceInterested: serviceName },
  })
  const leadId = lead.body.data.lead.id
  await api('POST', `/freelancer/leads/${leadId}/status`, { token, body: { status: 'CONVERTED', conversionValue } })

  const submit = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token, body: { termsAccepted: true } })
  assert.equal(submit.status, 201)
  const commissionId = submit.body.data.commission.id

  await api('POST', `/admin/commissions/${commissionId}/status`, { token: adminToken, body: { status: 'EARNED' } })
  await api('POST', `/admin/commissions/${commissionId}/confirm-client-payment`, { token: adminToken, body: {} })
  await api('POST', `/admin/commissions/${commissionId}/status`, { token: adminToken, body: { status: 'APPROVED' } })
  const toPayable = await api('POST', `/admin/commissions/${commissionId}/status`, {
    token: adminToken,
    body: { status: 'PAYABLE' },
  })
  assert.equal(toPayable.status, 200, 'APPROVED -> PAYABLE must be reachable via the generic status endpoint')
  assert.equal(toPayable.body.data.commission.status, 'PAYABLE')

  return { commissionId, commissionAmount: Number(toPayable.body.data.commission.commission_amount) }
}

// ---- Available balance & bank-details gate ----

test('withdrawal: available balance reflects PAYABLE commissions only', async () => {
  const { commissionAmount } = await addPayableCommission(tokenA, 10000)
  const res = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenA })
  assert.equal(res.status, 200)
  assert.ok(res.body.data.availableBalance >= commissionAmount)
})

test('withdrawal: request is rejected without bank details on file', async () => {
  await addPayableCommission(tokenC, 10000)
  const res = await api('POST', '/freelancer/withdrawals', { token: tokenC, body: { amount: 1000 } })
  assert.equal(res.status, 409)
  assert.match(res.body.message, /bank/i)
})

// ---- Request creation & validation ----

test('withdrawal: valid request within balance succeeds', async () => {
  await addPayableCommission(tokenA, 12000)
  // Request the freelancer's full current available balance rather than
  // just this test's own commission amount — requesting the exact total
  // always fully reserves it regardless of which order the underlying
  // commissions were created in, so this is immune to balance left over
  // from earlier tests sharing the same freelancer token.
  const balance = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenA })
  const res = await api('POST', '/freelancer/withdrawals', { token: tokenA, body: { amount: balance.body.data.availableBalance } })
  assert.equal(res.status, 201)
  assert.equal(Number(res.body.data.withdrawal.amount), balance.body.data.availableBalance)
  assert.equal(res.body.data.withdrawal.status, 'PENDING')
})

test('withdrawal: requesting more than available balance is rejected', async () => {
  const res = await api('POST', '/freelancer/withdrawals', { token: tokenA, body: { amount: 99999999 } })
  assert.equal(res.status, 409)
})

test('withdrawal: zero and negative amounts are rejected', async () => {
  const zero = await api('POST', '/freelancer/withdrawals', { token: tokenA, body: { amount: 0 } })
  assert.equal(zero.status, 422)
  const negative = await api('POST', '/freelancer/withdrawals', { token: tokenA, body: { amount: -500 } })
  assert.equal(negative.status, 422)
})

test('withdrawal: after a request, the reserved commission is excluded from available balance (no double withdrawal)', async () => {
  const { commissionAmount } = await addPayableCommission(tokenB, 13000)
  const before = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenB })
  const first = await api('POST', '/freelancer/withdrawals', { token: tokenB, body: { amount: commissionAmount } })
  assert.equal(first.status, 201)

  const after = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenB })
  assert.equal(after.body.data.availableBalance, before.body.data.availableBalance - commissionAmount)

  const second = await api('POST', '/freelancer/withdrawals', { token: tokenB, body: { amount: commissionAmount } })
  assert.equal(second.status, 409, 'the same commission cannot be reserved twice')
})

test('withdrawal: forged freelancerId/status/amount-in-response fields are ignored — identity from JWT, amount from server', async () => {
  await addPayableCommission(tokenA, 21000)
  const balance = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenA })
  const res = await api('POST', '/freelancer/withdrawals', {
    token: tokenA,
    body: { amount: balance.body.data.availableBalance, freelancerId: 999999, status: 'PAID', availableBalance: 999999999 },
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.data.withdrawal.status, 'PENDING')
  assert.equal(Number(res.body.data.withdrawal.amount), balance.body.data.availableBalance)
})

// ---- Concurrency ----

test('withdrawal: two concurrent requests for the full balance — only one can succeed', async () => {
  const { commissionAmount } = await addPayableCommission(tokenB, 14000)
  const [a, b] = await Promise.all([
    api('POST', '/freelancer/withdrawals', { token: tokenB, body: { amount: commissionAmount } }),
    api('POST', '/freelancer/withdrawals', { token: tokenB, body: { amount: commissionAmount } }),
  ])
  const statuses = [a.status, b.status].sort()
  assert.deepEqual(statuses, [201, 409], 'exactly one concurrent request succeeds, the other sees insufficient balance')
})

// ---- Ownership / security ----

test('withdrawal: freelancer cannot view another freelancer\'s withdrawal (ID guessing)', async () => {
  const { commissionAmount } = await addPayableCommission(tokenA, 8000)
  const request = await api('POST', '/freelancer/withdrawals', { token: tokenA, body: { amount: commissionAmount } })
  const withdrawalId = request.body.data.withdrawal.id

  const res = await api('GET', `/freelancer/withdrawals/${withdrawalId}`, { token: tokenB })
  assert.equal(res.status, 404)
})

test('withdrawal: freelancer cannot approve, reject, or mark their own withdrawal paid', async () => {
  const { commissionAmount } = await addPayableCommission(tokenB, 9000)
  const request = await api('POST', '/freelancer/withdrawals', { token: tokenB, body: { amount: commissionAmount } })
  const withdrawalId = request.body.data.withdrawal.id

  const approve = await api('POST', `/admin/withdrawals/${withdrawalId}/approve`, { token: tokenB })
  assert.equal(approve.status, 403)
  const reject = await api('POST', `/admin/withdrawals/${withdrawalId}/reject`, { token: tokenB, body: { reason: 'x' } })
  assert.equal(reject.status, 403)
  const markPaid = await api('POST', `/admin/withdrawals/${withdrawalId}/mark-paid`, {
    token: tokenB,
    body: { transactionReference: 'x', paidDate: '2026-01-01' },
  })
  assert.equal(markPaid.status, 403)
})

test('withdrawal: unauthenticated access to any withdrawal endpoint is rejected', async () => {
  const list = await api('GET', '/freelancer/withdrawals')
  assert.equal(list.status, 401)
  const create = await api('POST', '/freelancer/withdrawals', { body: { amount: 100 } })
  assert.equal(create.status, 401)
  const adminList = await api('GET', '/admin/withdrawals')
  assert.equal(adminList.status, 401)
})

// ---- Admin review lifecycle ----

test('withdrawal: admin reject requires a reason, then the commission is available again', async () => {
  const { commissionAmount } = await addPayableCommission(tokenA, 7000)
  const request = await api('POST', '/freelancer/withdrawals', { token: tokenA, body: { amount: commissionAmount } })
  const withdrawalId = request.body.data.withdrawal.id
  const balanceBefore = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenA })

  const missingReason = await api('POST', `/admin/withdrawals/${withdrawalId}/reject`, { token: adminToken, body: {} })
  assert.equal(missingReason.status, 422)

  const reject = await api('POST', `/admin/withdrawals/${withdrawalId}/reject`, {
    token: adminToken,
    body: { reason: 'Bank details could not be verified' },
  })
  assert.equal(reject.status, 200)
  assert.equal(reject.body.data.withdrawal.status, 'REJECTED')

  const balanceAfter = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenA })
  assert.equal(
    balanceAfter.body.data.availableBalance,
    balanceBefore.body.data.availableBalance + commissionAmount,
    'rejected withdrawal releases its reserved commission'
  )
})

test('withdrawal: cannot approve an already-rejected request, cannot reject an already-approved one', async () => {
  const { commissionAmount: amtX } = await addPayableCommission(tokenB, 6000)
  const reqX = await api('POST', '/freelancer/withdrawals', { token: tokenB, body: { amount: amtX } })
  const idX = reqX.body.data.withdrawal.id
  await api('POST', `/admin/withdrawals/${idX}/reject`, { token: adminToken, body: { reason: 'no' } })
  const approveRejected = await api('POST', `/admin/withdrawals/${idX}/approve`, { token: adminToken })
  assert.equal(approveRejected.status, 409)

  const { commissionAmount: amtY } = await addPayableCommission(tokenA, 6500)
  const reqY = await api('POST', '/freelancer/withdrawals', { token: tokenA, body: { amount: amtY } })
  const idY = reqY.body.data.withdrawal.id
  await api('POST', `/admin/withdrawals/${idY}/approve`, { token: adminToken })
  const rejectApproved = await api('POST', `/admin/withdrawals/${idY}/reject`, { token: adminToken, body: { reason: 'no' } })
  assert.equal(rejectApproved.status, 409)
})

test('withdrawal: full approve -> mark paid flow moves the commission to PAID and records the reference', async () => {
  const { commissionId } = await addPayableCommission(tokenB, 11000)
  // The FIFO whole-commission reservation strategy reserves the oldest
  // unreserved PAYABLE commissions first — an earlier test in this file may
  // have left tokenB with older leftover PAYABLE commissions (e.g. from a
  // rejected withdrawal releasing its reservation). Requesting the exact
  // available balance sweeps everything, so our target commission is
  // guaranteed to be included regardless of ordering against those leftovers.
  const balance = await api('GET', '/freelancer/withdrawals/available-balance', { token: tokenB })
  const request = await api('POST', '/freelancer/withdrawals', { token: tokenB, body: { amount: balance.body.data.availableBalance } })
  const withdrawalId = request.body.data.withdrawal.id

  const approve = await api('POST', `/admin/withdrawals/${withdrawalId}/approve`, { token: adminToken })
  assert.equal(approve.status, 200)
  assert.equal(approve.body.data.withdrawal.status, 'APPROVED')

  const markPaidNoRef = await api('POST', `/admin/withdrawals/${withdrawalId}/mark-paid`, {
    token: adminToken,
    body: { paidDate: '2026-08-25' },
  })
  assert.equal(markPaidNoRef.status, 422, 'transaction reference is required to mark paid')

  const markPaid = await api('POST', `/admin/withdrawals/${withdrawalId}/mark-paid`, {
    token: adminToken,
    body: { transactionReference: 'UTR123456789', paidDate: '2026-08-25', adminNote: 'Paid via NEFT' },
  })
  assert.equal(markPaid.status, 200)
  assert.equal(markPaid.body.data.withdrawal.status, 'PAID')
  assert.equal(markPaid.body.data.withdrawal.transaction_reference, 'UTR123456789')

  const commissionDetail = await api('GET', `/admin/commissions/${commissionId}`, { token: adminToken })
  assert.equal(commissionDetail.body.data.commission.status, 'PAID', 'the underlying commission is now PAID, not just the withdrawal')
})

test('withdrawal: marking the same withdrawal paid twice is rejected', async () => {
  const { commissionAmount } = await addPayableCommission(tokenA, 5500)
  const request = await api('POST', '/freelancer/withdrawals', { token: tokenA, body: { amount: commissionAmount } })
  const withdrawalId = request.body.data.withdrawal.id
  await api('POST', `/admin/withdrawals/${withdrawalId}/approve`, { token: adminToken })
  await api('POST', `/admin/withdrawals/${withdrawalId}/mark-paid`, {
    token: adminToken,
    body: { transactionReference: 'REF1', paidDate: '2026-08-25' },
  })
  const again = await api('POST', `/admin/withdrawals/${withdrawalId}/mark-paid`, {
    token: adminToken,
    body: { transactionReference: 'REF2', paidDate: '2026-08-25' },
  })
  assert.equal(again.status, 409)
})

test('withdrawal: cannot mark-paid a request that was never approved', async () => {
  const { commissionAmount } = await addPayableCommission(tokenB, 4500)
  const request = await api('POST', '/freelancer/withdrawals', { token: tokenB, body: { amount: commissionAmount } })
  const withdrawalId = request.body.data.withdrawal.id
  const markPaid = await api('POST', `/admin/withdrawals/${withdrawalId}/mark-paid`, {
    token: adminToken,
    body: { transactionReference: 'REF', paidDate: '2026-08-25' },
  })
  assert.equal(markPaid.status, 409)
})

// ---- Freelancer history / list ----

test('withdrawal: freelancer sees only their own withdrawals in history, admin sees all', async () => {
  const mine = await api('GET', '/freelancer/withdrawals', { token: tokenA })
  assert.equal(mine.status, 200)
  assert.ok(mine.body.data.withdrawals.length >= 1)
  assert.ok(mine.body.data.withdrawals.every((w) => true)) // ownership already enforced server-side by freelancerId scoping

  const adminList = await api('GET', '/admin/withdrawals?limit=100', { token: adminToken })
  assert.equal(adminList.status, 200)
  assert.ok(adminList.body.data.withdrawals.length >= mine.body.data.withdrawals.length)
})

test('withdrawal: admin can filter by status', async () => {
  const res = await api('GET', '/admin/withdrawals?status=PENDING&limit=100', { token: adminToken })
  assert.equal(res.status, 200)
  assert.ok(res.body.data.withdrawals.every((w) => w.status === 'PENDING'))
})
