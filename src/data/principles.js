// The integrity principles shown on the About page — the *words*, editable from the
// portfolio admin, not the guarantees the engine actually enforces. Each row carries
// an `icon` NAME (a string, not a component), which About.jsx maps to a lucide icon;
// keeping it a name lets the dataset round-trip through the DB as plain JSON.
//
// This module owns its own exported `let` (an ESM `let` can only be reassigned from
// within its own module). applyPrinciples() replaces the list and PRINCIPLES is read
// live, so a data-driven remount picks up edits. A missing or malformed dataset is a
// safe no-op that keeps the bundled copy — the About page is never left empty.

const DEFAULT_PRINCIPLES = [
  {
    icon: 'coins',
    title: 'Money is exact',
    body: 'Every amount is a whole number of minor units — cents, not dollars. There are no floats anywhere in the money path, so rounding drift is impossible.',
  },
  {
    icon: 'scale',
    title: 'Balances are derived',
    body: 'A balance is never stored as a number you must trust. It is folded from the account’s ledger on demand: replay the history from zero and you get the figure.',
  },
  {
    icon: 'scroll',
    title: 'The ledger is append-only',
    body: 'Movements are only ever appended. Nothing is edited or deleted, so any balance can be re-proven from the very first entry at any time.',
  },
  {
    icon: 'transfer',
    title: 'Transfers are atomic',
    body: 'A transfer validates both sides before touching either ledger. If anything fails, nothing moves — and a successful transfer conserves the bank’s total to the cent.',
  },
  {
    icon: 'shield',
    title: 'No overdraft, no overflow',
    body: 'Withdrawals can never exceed the balance, and checked 64-bit arithmetic refuses any amount that would overflow rather than silently wrapping.',
  },
]

export let PRINCIPLES = DEFAULT_PRINCIPLES

const str = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback)

// Replace the principles from an admin-edited list. A row needs both a title (its
// identity) and a body; a row missing either is dropped. `icon` is a name string
// (mapped to a component in About.jsx), defaulting to 'shield' when blank/unknown.
// Only replaces the bundled list when at least one valid row survives, so a bad
// dataset can never blank the page.
export function applyPrinciples(rows) {
  if (!Array.isArray(rows)) return
  const next = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const title = str(row.title)
    const body = str(row.body)
    if (!title || !body) continue
    next.push({ icon: str(row.icon, 'shield'), title, body })
  }
  if (next.length) PRINCIPLES = next
}
