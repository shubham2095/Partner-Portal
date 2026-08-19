import { pool } from '../config/database.js'

export async function createDocument(
  { freelancerId, documentType, filePath, originalFilename, mimeType, fileSize },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO freelancer_documents
       (freelancer_id, document_type, file_path, original_filename, mime_type, file_size)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [freelancerId, documentType, filePath, originalFilename, mimeType, fileSize]
  )
  return result.insertId
}

export async function findDocumentsByFreelancerId(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM freelancer_documents WHERE freelancer_id = ? ORDER BY created_at DESC',
    [freelancerId]
  )
  return rows
}

export async function findDocumentById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM freelancer_documents WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function updateDocumentStatus(id, { status, verifiedBy, verifiedAt }, executor = pool) {
  await executor.query(
    'UPDATE freelancer_documents SET status = ?, verified_by = ?, verified_at = ? WHERE id = ?',
    [status, verifiedBy, verifiedAt, id]
  )
}
