// Single entry point that applies the portfolio admin's edits to this app's two
// editable content surfaces: the currency mark (lib/money) and the About-page
// integrity principles (data/principles). Each of those modules owns the
// reassignment of its own exported binding (an ESM `let` can only be reassigned from
// within its module), so this just routes each dataset to the right setter. Guards
// live in the setters, so a missing or malformed dataset is a safe no-op that keeps
// the bundled content.
//
// IMPORTANT: this never touches the persisted account ledger (store/bank). Balances
// and movements are the user's own data — rehydrated from localStorage and proven by
// replay — so remote edits are display/copy only and must never reseed or overwrite
// a returning user's bank.

import { applyCurrency } from '@/lib/money'
import { applyPrinciples } from '@/data/principles'

export function applyRemoteData(datasets) {
  if (!datasets || typeof datasets !== 'object') return
  applyCurrency(datasets.settings)
  applyPrinciples(datasets.principles)
}
