// Deterministic duplicate-lead detection helpers.
//
// Rule (documented, not fuzzy): a new lead is a likely duplicate if any
// existing lead has an EXACT normalized-phone match OR an EXACT
// normalized-email match. Client/company name alone is never used to flag a
// duplicate — unrelated clients frequently share a name, so name-only
// matching would produce false positives.
//
// Normalization is deterministic and server-side only:
//   phone — strip everything but digits, then drop a leading India country
//           code ('91') or a leading trunk '0' so "+91 98765 43210",
//           "09876543210" and "9876543210" all normalize to the same
//           10-digit core value.
//   email — trim + lowercase.
//
// No UNIQUE database constraint is added on these columns: existing
// business rules (multiple leads may legitimately share one office phone
// number or a shared inbox) make a hard uniqueness constraint unsafe. See
// findDuplicateLeadCandidates in leadModel.js for how the race window around
// this check-then-insert is narrowed instead.
//
// That narrowing is done with MySQL named locks (GET_LOCK/RELEASE_LOCK),
// not InnoDB row/gap locks. A `SELECT ... FOR UPDATE` on a not-yet-existing
// value was tried first and confirmed (via load testing) to still deadlock:
// when several transactions concurrently check-then-insert the exact same
// new normalized value, each acquires a gap lock from its locking SELECT,
// then each needs an insert-intention lock on that same gap for its INSERT
// — a textbook InnoDB deadlock cycle, independent of indexing. Named locks
// are a session-level mutex outside InnoDB's row-locking system entirely,
// so they fully serialize same-value concurrent submissions without ever
// participating in InnoDB's deadlock graph.
export async function withDuplicateCheckLock(connection, { normalizedPhoneDigits, normalizedEmail }, fn) {
  // Fixed acquisition order (mobile, then email) regardless of which values
  // are present — this is what prevents the two lock names themselves from
  // forming an ABBA cycle across concurrent requests.
  const names = []
  if (normalizedPhoneDigits) names.push(`lead_dup:mobile:${normalizedPhoneDigits}`)
  if (normalizedEmail) names.push(`lead_dup:email:${normalizedEmail}`)

  const acquired = []
  try {
    for (const name of names) {
      const [[result]] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [name])
      if (Number(result.acquired) !== 1) {
        throw new Error(`Could not acquire duplicate-check lock for ${name} within timeout`)
      }
      acquired.push(name)
    }
    return await fn()
  } finally {
    for (const name of acquired) {
      await connection.query('SELECT RELEASE_LOCK(?)', [name]).catch(() => {})
    }
  }
}

export function normalizePhoneDigits(mobile) {
  if (!mobile) return null
  const digits = String(mobile).replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

export function normalizeEmail(email) {
  if (!email) return null
  const trimmed = String(email).trim().toLowerCase()
  return trimmed || null
}
