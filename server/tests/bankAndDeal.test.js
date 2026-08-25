// Integration tests for Part 3: freelancer bank details and the closed
// deal / commission contract workflow. Requires the backend (and its
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

async function api(method, path, { token, body, form } = {}) {
  const options = { method, headers: {} }
  if (token) options.headers.Authorization = `Bearer ${token}`
  if (form) {
    options.body = form
  } else if (body) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE_URL}${path}`, options)
  const json = await res.json().catch(() => null)
  return { status: res.status, body: json }
}

let adminToken
let freelancerAToken
let freelancerBToken
let serviceName

before(async () => {
  const adminLogin = await api('POST', '/auth/login/admin', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  assert.equal(adminLogin.status, 200)
  adminToken = adminLogin.body.data.token

  const regA = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('deal-a'), password: 'TestPass123!', fullName: 'Deal Test A', mobile: '9000000040' },
  })
  assert.equal(regA.status, 201)
  freelancerAToken = regA.body.data.token

  const regB = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('deal-b'), password: 'TestPass123!', fullName: 'Deal Test B', mobile: '9000000041' },
  })
  assert.equal(regB.status, 201)
  freelancerBToken = regB.body.data.token

  serviceName = `DealTestService-${Date.now()}`
  const rule = await api('POST', '/admin/commissions/rules', {
    token: adminToken,
    body: { serviceName, rateType: 'PERCENTAGE', rateValue: 10 },
  })
  assert.equal(rule.status, 201)
})

async function createConvertedLead(token, conversionValue = 50000) {
  const lead = await api('POST', '/freelancer/leads', {
    token,
    body: { clientName: 'Deal Client', mobile: uniquePhone(), serviceInterested: serviceName },
  })
  assert.equal(lead.status, 201)
  const leadId = lead.body.data.lead.id
  const convert = await api('POST', `/freelancer/leads/${leadId}/status`, {
    token,
    body: { status: 'CONVERTED', conversionValue },
  })
  assert.equal(convert.status, 200)
  return leadId
}

// ---- Bank details ----

test('bank: freelancer can create and read their own bank details', async () => {
  const create = await api('PUT', '/freelancer/commissions/payment-details', {
    token: freelancerAToken,
    body: { accountHolderName: 'Deal Test A', bankAccountNumber: '123456789012', ifscCode: 'HDFC0001234', upiId: 'dealtesta@okhdfc' },
  })
  assert.equal(create.status, 200)
  assert.equal(create.body.data.paymentDetails.bank_account_number_masked, 'XXXXXXXX9012')
  assert.equal(create.body.data.paymentDetails.bank_account_number, undefined, 'raw account number must never be returned')

  const read = await api('GET', '/freelancer/commissions/payment-details', { token: freelancerAToken })
  assert.equal(read.status, 200)
  assert.equal(read.body.data.paymentDetails.ifsc_code, 'HDFC0001234')
  assert.equal(read.body.data.paymentDetails.bank_account_number_masked, 'XXXXXXXX9012')
})

test('bank: partial update leaves the account number unchanged when omitted', async () => {
  await api('PUT', '/freelancer/commissions/payment-details', {
    token: freelancerBToken,
    body: { accountHolderName: 'Deal Test B', bankAccountNumber: '987654321098', ifscCode: 'ICIC0005678' },
  })
  const update = await api('PUT', '/freelancer/commissions/payment-details', {
    token: freelancerBToken,
    body: { upiId: 'dealtestb@okicici' },
  })
  assert.equal(update.status, 200)
  assert.equal(update.body.data.paymentDetails.bank_account_number_masked, 'XXXXXXXX1098', 'account number preserved across partial update')
  assert.equal(update.body.data.paymentDetails.upi_id, 'dealtestb@okicici')
})

test('bank: invalid IFSC/account number/UPI/PAN are rejected', async () => {
  const badIfsc = await api('PUT', '/freelancer/commissions/payment-details', { token: freelancerAToken, body: { ifscCode: 'NOTVALID' } })
  assert.equal(badIfsc.status, 422)

  const badAccount = await api('PUT', '/freelancer/commissions/payment-details', { token: freelancerAToken, body: { bankAccountNumber: 'abc123' } })
  assert.equal(badAccount.status, 422)

  const badUpi = await api('PUT', '/freelancer/commissions/payment-details', { token: freelancerAToken, body: { upiId: 'not-a-upi' } })
  assert.equal(badUpi.status, 422)

  const badPan = await api('PUT', '/freelancer/commissions/payment-details', { token: freelancerAToken, body: { panNumber: '12345' } })
  assert.equal(badPan.status, 422)
})

test('bank: unauthenticated access is rejected', async () => {
  const get = await api('GET', '/freelancer/commissions/payment-details')
  assert.equal(get.status, 401)
  const put = await api('PUT', '/freelancer/commissions/payment-details', { body: { accountHolderName: 'x' } })
  assert.equal(put.status, 401)
})

test('bank: a freelancer cannot reach another freelancer\'s bank details (no such endpoint exists — own-profile only)', async () => {
  // There is no cross-freelancer GET route at all; ownership is derived
  // solely from the JWT, so a freelancer's own GET can only ever return
  // their own record — verified by checking A's IFSC never leaked into B's read.
  const readB = await api('GET', '/freelancer/commissions/payment-details', { token: freelancerBToken })
  assert.equal(readB.status, 200)
  assert.notEqual(readB.body.data.paymentDetails.ifsc_code, 'HDFC0001234')
})

test('bank: admin can view (masked) bank details through authorized admin endpoint; freelancer cannot', async () => {
  const meA = await api('GET', '/freelancer/leads', { token: freelancerAToken })
  assert.equal(meA.status, 200)

  const profileRes = await api('GET', '/admin/freelancers?search=Deal Test A', { token: adminToken })
  assert.equal(profileRes.status, 200)
  const freelancerId = profileRes.body.data.freelancers[0].id

  const adminView = await api('GET', `/admin/commissions/freelancers/${freelancerId}/payment-details`, { token: adminToken })
  assert.equal(adminView.status, 200)
  assert.equal(adminView.body.data.paymentDetails.bank_account_number, undefined)

  const freelancerDenied = await api('GET', `/admin/commissions/freelancers/${freelancerId}/payment-details`, { token: freelancerAToken })
  assert.equal(freelancerDenied.status, 403)
})

// ---- Closed deal contract ----

test('deal: ineligible lead (not converted) is rejected', async () => {
  const lead = await api('POST', '/freelancer/leads', { token: freelancerAToken, body: { clientName: 'Not Converted', mobile: uniquePhone() } })
  const res = await api('POST', `/freelancer/leads/${lead.body.data.lead.id}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  assert.equal(res.status, 409)
})

test('deal: eligible lead can be submitted and commission is calculated server-side', async () => {
  const leadId = await createConvertedLead(freelancerAToken, 50000)
  const res = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, {
    token: freelancerAToken,
    body: { declarationNote: 'Client signed the contract', termsAccepted: true },
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.data.commission.status, 'POTENTIAL')
  assert.equal(Number(res.body.data.commission.commission_amount), 5000, '10% of 50000, computed server-side from the existing rule engine')
})

test('deal: duplicate submission for the same lead is rejected', async () => {
  const leadId = await createConvertedLead(freelancerAToken)
  const first = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  assert.equal(first.status, 201)
  const second = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  assert.equal(second.status, 409)
})

test('deal: freelancer cannot submit a closed deal for another freelancer\'s lead', async () => {
  const leadId = await createConvertedLead(freelancerAToken)
  const res = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerBToken, body: { termsAccepted: true } })
  assert.equal(res.status, 404, 'ownership must be enforced as a 404, not leaking that the lead exists')
})

test('deal: forged fields in the submission body are ignored (no freelancerId/status/amount are accepted)', async () => {
  const leadId = await createConvertedLead(freelancerAToken, 20000)
  const res = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, {
    token: freelancerAToken,
    body: { declarationNote: 'legit', termsAccepted: true, freelancerId: 999, status: 'APPROVED', commissionAmount: 999999 },
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.data.commission.status, 'POTENTIAL', 'forged status ignored')
  assert.equal(Number(res.body.data.commission.commission_amount), 2000, 'forged amount ignored — recalculated from the rule (10% of 20000)')
})

test('deal: freelancer cannot approve or reject their own submission', async () => {
  const leadId = await createConvertedLead(freelancerAToken)
  const submit = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  const commissionId = submit.body.data.commission.id

  const approve = await api('POST', `/admin/commissions/${commissionId}/status`, { token: freelancerAToken, body: { status: 'EARNED' } })
  assert.equal(approve.status, 403)

  const reject = await api('POST', `/admin/commissions/${commissionId}/reject`, { token: freelancerAToken, body: { reason: 'x' } })
  assert.equal(reject.status, 403)
})

test('deal: admin review — reject with reason, then freelancer can resubmit', async () => {
  const leadId = await createConvertedLead(freelancerAToken, 30000)
  const submit = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  const commissionId = submit.body.data.commission.id

  const missingReason = await api('POST', `/admin/commissions/${commissionId}/reject`, { token: adminToken, body: {} })
  assert.equal(missingReason.status, 422)

  const reject = await api('POST', `/admin/commissions/${commissionId}/reject`, {
    token: adminToken,
    body: { reason: 'Deal value could not be verified' },
  })
  assert.equal(reject.status, 200)
  assert.equal(reject.body.data.commission.status, 'REJECTED')
  assert.equal(reject.body.data.commission.rejection_reason, 'Deal value could not be verified')

  const duplicateBeforeResubmit = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, {
    token: freelancerAToken,
    body: { declarationNote: 'resubmitting with more info', termsAccepted: true },
  })
  assert.equal(duplicateBeforeResubmit.status, 201, 'resubmission after rejection is allowed')
  assert.equal(duplicateBeforeResubmit.body.data.commission.id, commissionId, 'resubmission reuses the same row, not a new one')
  assert.equal(duplicateBeforeResubmit.body.data.commission.status, 'POTENTIAL')
  assert.equal(duplicateBeforeResubmit.body.data.commission.rejection_reason, null)
})

test('deal: admin can approve through the existing commission lifecycle (reused, not duplicated)', async () => {
  const leadId = await createConvertedLead(freelancerAToken, 40000)
  const submit = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  const commissionId = submit.body.data.commission.id

  const toEarned = await api('POST', `/admin/commissions/${commissionId}/status`, { token: adminToken, body: { status: 'EARNED' } })
  assert.equal(toEarned.status, 200)

  const confirmPayment = await api('POST', `/admin/commissions/${commissionId}/confirm-client-payment`, { token: adminToken, body: {} })
  assert.equal(confirmPayment.status, 200)
  assert.ok(confirmPayment.body.data.commission.client_payment_received_at)

  const toApproved = await api('POST', `/admin/commissions/${commissionId}/status`, { token: adminToken, body: { status: 'APPROVED' } })
  assert.equal(toApproved.status, 200)
  assert.equal(toApproved.body.data.commission.status, 'APPROVED')

  // Once approved, the dedicated reject endpoint no longer applies.
  const rejectAfterApproval = await api('POST', `/admin/commissions/${commissionId}/reject`, { token: adminToken, body: { reason: 'too late' } })
  assert.equal(rejectAfterApproval.status, 409)
})

// ---- Part 6: client payment confirmation gate + contract generation ----

test('contract: APPROVED transition is blocked until client payment is confirmed by admin', async () => {
  const leadId = await createConvertedLead(freelancerAToken, 25000)
  const submit = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  const commissionId = submit.body.data.commission.id

  await api('POST', `/admin/commissions/${commissionId}/status`, { token: adminToken, body: { status: 'EARNED' } })

  const blocked = await api('POST', `/admin/commissions/${commissionId}/status`, { token: adminToken, body: { status: 'APPROVED' } })
  assert.equal(blocked.status, 409, 'approval must be blocked until client payment is confirmed')
})

test('contract: freelancer cannot confirm client payment (admin-only, financial state)', async () => {
  const leadId = await createConvertedLead(freelancerAToken, 25000)
  const submit = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  const commissionId = submit.body.data.commission.id

  const res = await api('POST', `/admin/commissions/${commissionId}/confirm-client-payment`, { token: freelancerAToken, body: {} })
  assert.equal(res.status, 403)
})

test('contract: a PDF contract is generated and downloadable by both admin and the owning freelancer once APPROVED', async () => {
  const leadId = await createConvertedLead(freelancerAToken, 60000)
  const submit = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  const commissionId = submit.body.data.commission.id

  await api('POST', `/admin/commissions/${commissionId}/status`, { token: adminToken, body: { status: 'EARNED' } })
  await api('POST', `/admin/commissions/${commissionId}/confirm-client-payment`, { token: adminToken, body: {} })
  await api('POST', `/admin/commissions/${commissionId}/status`, { token: adminToken, body: { status: 'APPROVED' } })

  const adminDownload = await fetch(`${BASE_URL}/admin/commissions/${commissionId}/contract`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  assert.equal(adminDownload.status, 200)
  assert.equal(adminDownload.headers.get('content-type'), 'application/pdf')

  const ownerDownload = await fetch(`${BASE_URL}/freelancer/commissions/${commissionId}/contract`, {
    headers: { Authorization: `Bearer ${freelancerAToken}` },
  })
  assert.equal(ownerDownload.status, 200)

  const otherFreelancerDownload = await fetch(`${BASE_URL}/freelancer/commissions/${commissionId}/contract`, {
    headers: { Authorization: `Bearer ${freelancerBToken}` },
  })
  assert.equal(otherFreelancerDownload.status, 404, 'a non-owning freelancer must not be able to download the contract')
})

test('bank: bankName and accountType are stored and returned unmasked (non-sensitive fields)', async () => {
  const update = await api('PUT', '/freelancer/commissions/payment-details', {
    token: freelancerAToken,
    body: { bankName: 'HDFC Bank', accountType: 'SAVINGS' },
  })
  assert.equal(update.status, 200)
  assert.equal(update.body.data.paymentDetails.bank_name, 'HDFC Bank')
  assert.equal(update.body.data.paymentDetails.account_type, 'SAVINGS')

  const badType = await api('PUT', '/freelancer/commissions/payment-details', {
    token: freelancerAToken,
    body: { accountType: 'CRYPTO' },
  })
  assert.equal(badType.status, 422)
})

test('deal: termsAccepted is required to submit a closed deal', async () => {
  const leadId = await createConvertedLead(freelancerAToken, 10000)
  // The frontend always sends termsAccepted, but the server must enforce it independently.
  const res = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, {
    token: freelancerAToken,
    body: { declarationNote: 'no terms flag sent' },
  })
  // termsAccepted defaults to absent -> validator rejects
  assert.equal(res.status, 422)
})

test('deal: no duplicate commission is created for the same lead across submit + admin create', async () => {
  const leadId = await createConvertedLead(freelancerAToken, 15000)
  const submit = await api('POST', `/freelancer/leads/${leadId}/closed-deal`, { token: freelancerAToken, body: { termsAccepted: true } })
  assert.equal(submit.status, 201)
  const adminCreate = await api('POST', '/admin/commissions', { token: adminToken, body: { leadId } })
  assert.equal(adminCreate.status, 409, 'the existing admin-create path also respects the one-commission-per-lead rule')
})

test('deal: unauthenticated closed-deal submission is rejected', async () => {
  const res = await api('POST', '/freelancer/leads/1/closed-deal', { body: {} })
  assert.equal(res.status, 401)
})
