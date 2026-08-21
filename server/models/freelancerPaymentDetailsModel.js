import { pool } from '../config/database.js'

export async function findPaymentDetailsByFreelancerId(freelancerId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM freelancer_payment_details WHERE freelancer_id = ? LIMIT 1', [
    freelancerId,
  ])
  return rows[0] ?? null
}

export async function upsertPaymentDetails(freelancerId, fields, executor = pool) {
  const {
    accountHolderName,
    bankAccountNumber,
    ifscCode,
    upiId,
    panNumber,
    gstNumber,
  } = fields

  await executor.query(
    `INSERT INTO freelancer_payment_details
       (freelancer_id, account_holder_name, bank_account_number, ifsc_code, upi_id, pan_number, gst_number)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       account_holder_name = VALUES(account_holder_name),
       bank_account_number = VALUES(bank_account_number),
       ifsc_code = VALUES(ifsc_code),
       upi_id = VALUES(upi_id),
       pan_number = VALUES(pan_number),
       gst_number = VALUES(gst_number)`,
    [
      freelancerId,
      accountHolderName ?? null,
      bankAccountNumber ?? null,
      ifscCode ?? null,
      upiId ?? null,
      panNumber ?? null,
      gstNumber ?? null,
    ]
  )
  return findPaymentDetailsByFreelancerId(freelancerId, executor)
}
