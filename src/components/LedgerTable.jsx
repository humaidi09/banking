import { foldLedger, ENTRY, ENTRY_LABEL, isCredit } from '@/engine/banking'
import { usd, signedUsd } from '@/lib/money'
import { Badge } from '@/components/ui'
import { cx } from '@/lib/cx'
import { ArrowDownLeft, ArrowUpRight, PlusCircle } from 'lucide-react'

// Renders an account's append-only ledger with a running-balance column. The
// running balance is produced by foldLedger — replaying the history from zero —
// so what the table shows is literally how the headline balance is derived.
const ENTRY_TONE = {
  [ENTRY.Open]: 'neutral',
  [ENTRY.Deposit]: 'ok',
  [ENTRY.Withdrawal]: 'warn',
  [ENTRY.TransferIn]: 'ok',
  [ENTRY.TransferOut]: 'warn',
}

function EntryIcon({ type }) {
  if (type === ENTRY.Open) return <PlusCircle className="h-3 w-3" aria-hidden="true" />
  return isCredit(type) ? (
    <ArrowDownLeft className="h-3 w-3" aria-hidden="true" />
  ) : (
    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
  )
}

export function LedgerTable({ account }) {
  const rows = foldLedger(account.ledger)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-sm">
        <caption className="sr-only">
          Append-only ledger for account #{account.id}. The balance is this history folded from zero.
        </caption>
        <thead>
          <tr className="border-b border-hair text-left font-mono text-[11px] uppercase tracking-wide text-muted">
            <th scope="col" className="py-2.5 pr-4 font-medium">#</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">Entry</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">Detail</th>
            <th scope="col" className="py-2.5 pr-4 text-right font-medium">Amount</th>
            <th scope="col" className="py-2.5 text-right font-medium">Balance after</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const credit = isCredit(r.type)
            const open = r.type === ENTRY.Open
            return (
              <tr key={r.seq} className="border-b border-hair/60 last:border-0">
                <td className="py-3 pr-4 font-mono text-xs text-muted tabular-nums">{r.seq}</td>
                <td className="py-3 pr-4">
                  <Badge tone={ENTRY_TONE[r.type]}>
                    <EntryIcon type={r.type} />
                    {ENTRY_LABEL[r.type]}
                  </Badge>
                </td>
                <td className="py-3 pr-4 text-muted">
                  {r.counterparty ? (
                    <span>
                      {credit ? 'from' : 'to'} #{r.counterparty}
                      {r.note ? ` — ${r.note}` : ''}
                    </span>
                  ) : (
                    r.note || <span className="text-muted/60">—</span>
                  )}
                </td>
                <td
                  className={cx(
                    'py-3 pr-4 text-right font-mono tabular-nums',
                    open ? 'text-muted' : credit ? 'text-emerald-400' : 'text-ink',
                  )}
                >
                  {open ? usd(r.amount) : signedUsd(r.amount, credit)}
                </td>
                <td className="py-3 text-right font-mono font-medium tabular-nums text-ink">
                  {usd(r.balanceAfter)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
