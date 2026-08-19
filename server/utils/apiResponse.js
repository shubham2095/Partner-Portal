export function sendSuccess(res, { message = 'Operation completed', data = {}, meta = {}, statusCode = 200 } = {}) {
  return res.status(statusCode).json({ success: true, message, data, meta })
}

export function sendError(res, { message = 'Something went wrong', errors = {}, statusCode = 500 } = {}) {
  return res.status(statusCode).json({ success: false, message, errors })
}
