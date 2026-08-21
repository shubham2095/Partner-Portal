function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Builds a CSV string from an array of row objects, restricted to an
 * explicit column allowlist — never dumps whatever fields happen to be
 * on the row, so internal-only fields never leak into an export just
 * because a query happened to select them.
 */
export function buildCsv(rows, columns) {
  const header = columns.join(',')
  const lines = rows.map((row) => columns.map((column) => escapeCsvValue(row[column])).join(','))
  return [header, ...lines].join('\n')
}
