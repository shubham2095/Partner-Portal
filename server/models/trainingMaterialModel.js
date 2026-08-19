import { pool } from '../config/database.js'

export async function createMaterial(
  { lessonId, title, materialType, filePath, originalFilename, mimeType, fileSize, displayOrder, createdBy },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO training_materials
       (lesson_id, title, material_type, file_path, original_filename, mime_type, file_size, display_order, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lessonId,
      title,
      materialType ?? 'OTHER',
      filePath,
      originalFilename ?? null,
      mimeType ?? null,
      fileSize ?? null,
      displayOrder ?? 0,
      createdBy,
    ]
  )
  return result.insertId
}

export async function findMaterialById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM training_materials WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function deleteMaterial(id, executor = pool) {
  await executor.query('DELETE FROM training_materials WHERE id = ?', [id])
}

export async function listMaterialsByLesson(lessonId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM training_materials WHERE lesson_id = ? ORDER BY display_order ASC, id ASC',
    [lessonId]
  )
  return rows
}

export async function findMaterialWithTraining(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT tmat.*, tm.training_id AS training_id
     FROM training_materials tmat
     INNER JOIN training_lessons tl ON tl.id = tmat.lesson_id
     INNER JOIN training_modules tm ON tm.id = tl.module_id
     WHERE tmat.id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}
