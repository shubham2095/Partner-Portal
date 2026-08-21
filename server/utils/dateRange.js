/**
 * Resolves a validated dateFrom/dateTo query pair into concrete Date
 * boundaries, defaulting to the trailing 30 days when omitted. Future
 * dates are clamped to "now" so a caller cannot request data past the
 * current moment.
 */
export function resolveDateRange({ dateFrom, dateTo }, defaultDays = 30) {
  const now = new Date()
  let to = dateTo ? new Date(dateTo) : now
  if (to > now) to = now

  let from = dateFrom ? new Date(dateFrom) : new Date(to.getTime() - defaultDays * 24 * 60 * 60 * 1000)
  if (from > to) from = to

  return { from, to }
}

export function toMysqlDate(date) {
  return date.toISOString().slice(0, 10)
}
