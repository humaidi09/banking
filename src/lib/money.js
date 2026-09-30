import { Money } from '@/engine/banking'

// Display helpers around the engine's exact minor-unit integers. The engine's
// Money.format gives grouped digits ("1,234.50"); here we add the currency mark
// and keep the sign hugging it, so a debit reads "-$12.30", never "$-12.30".

// The currency mark shown on every formatted amount — a display concern only. The
// engine stores exact minor units and never a symbol, so the portfolio admin can
// safely change this (e.g. to ৳ or €) without touching a single stored balance or
// ledger entry. applyCurrency() reassigns it; usd() reads it live, so a remount
// after an edit shows the new mark everywhere amounts appear.
export let CURRENCY_SYMBOL = '$'

// Escape a string for literal use inside a RegExp.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Apply the admin's money settings. Only a non-empty string symbol is accepted;
// anything else is ignored, so a missing/malformed dataset keeps the bundled "$".
export function applyCurrency(settings) {
  if (!settings || typeof settings !== 'object') return
  const sym = settings.currencySymbol
  if (typeof sym === 'string' && sym.trim()) CURRENCY_SYMBOL = sym.trim()
}

export function usd(units) {
  const negative = units < 0n
  return `${negative ? '-' : ''}${CURRENCY_SYMBOL}${Money.format(negative ? -units : units)}`
}

// A signed amount for ledger rows: "+$500.00" for credits, "-$150.00" for debits.
export function signedUsd(units, credit) {
  return `${credit ? '+' : '-'}${usd(units < 0n ? -units : units)}`
}

// Parse a user-typed amount into exact minor units. Returns { units } or a
// specific { error }. Commas, spaces, a leading "$" and the configured currency
// symbol are tolerated on input (the engine's own parser is strict — two decimals
// max — so it stays exact).
export function parseAmount(text, { allowEmpty = false } = {}) {
  const trimmed = (text ?? '').trim()
  if (trimmed === '') {
    return allowEmpty ? { units: 0n } : { error: 'Enter an amount.' }
  }
  const cleaned = trimmed.replace(new RegExp(`[$,\\s]|${escapeRe(CURRENCY_SYMBOL)}`, 'g'), '')
  const units = Money.parse(cleaned)
  if (units === null) {
    return { error: 'Enter an amount like 1,000 or 49.99 — digits with up to two decimals.' }
  }
  if (units < 0n) return { error: 'Amount cannot be negative.' }
  return { units }
}
