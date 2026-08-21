import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

// Client-supplied MIME type (multipart Content-Type) is attacker-controlled,
// so it is cross-checked against the file extension rather than trusted
// alone — both must agree with an allowed type before the file is accepted.
const ALLOWED_EXTENSIONS_BY_MIME = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

function buildStorage(subFolder) {
  const destination = path.join(process.cwd(), env.upload.dir, subFolder)

  return multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(destination, { recursive: true })
      cb(null, destination)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
      cb(null, safeName)
    },
  })
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new ApiError(422, `File type ${file.mimetype} is not allowed`))
  }

  const ext = path.extname(file.originalname).toLowerCase()
  const allowedExtensions = ALLOWED_EXTENSIONS_BY_MIME[file.mimetype] ?? []
  if (!allowedExtensions.includes(ext)) {
    return cb(new ApiError(422, 'File extension does not match its content type'))
  }

  cb(null, true)
}

export function createUploadHandler(subFolder) {
  return multer({
    storage: buildStorage(subFolder),
    fileFilter,
    limits: { fileSize: env.upload.maxFileSizeMb * 1024 * 1024 },
  })
}
