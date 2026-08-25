import { pool } from '../config/database.js'

export async function findPaymentDetailsByFreelancerId(freelancerId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM freelancer_payment_details WHERE freelancer_id = ? LIMIT 1', [
    freelancerId,
  ])
  return rows[0] ?? null
}

const FIELD_COLUMNS = {
  accountHolderName: 'account_holder_name',
  bankName: 'bank_name',
  bankAccountNumber: 'bank_account_number',
  accountType: 'account_type',
  ifscCode: 'ifsc_code',
  upiId: 'upi_id',
  panNumber: 'pan_number',
  gstNumber: 'gst_number',
}

// A PUT only overwrites fields the caller actually sent — bank_account_number
// in particular is never round-tripped back to the client (it's masked on
// read), so an edit that only changes e.g. the UPI ID must not blank out the
// account number just because the form didn't resend it.
export async function upsertPaymentDetails(freelancerId, fields, executor = pool) {
  const providedKeys = Object.keys(fields).filter((key) => FIELD_COLUMNS[key] && fields[key] !== undefined)

  if (providedKeys.length === 0) {
    return findPaymentDetailsByFreelancerId(freelancerId, executor)
  }

  const columns = providedKeys.map((key) => FIELD_COLUMNS[key])
  const values = providedKeys.map((key) => fields[key] ?? null)
  const placeholders = columns.map(() => '?').join(', ')
  const updateClause = columns.map((column) => `${column} = VALUES(${column})`).join(', ')

  await executor.query(
    `INSERT INTO freelancer_payment_details (freelancer_id, ${columns.join(', ')})
     VALUES (?, ${placeholders})
     ON DUPLICATE KEY UPDATE ${updateClause}`,
    [freelancerId, ...values]
  )
  return findPaymentDetailsByFreelancerId(freelancerId, executor)
}
