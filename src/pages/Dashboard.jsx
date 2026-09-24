import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Landmark,
  PlusCircle,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  Wallet,
  AlertTriangle,
} from 'lucide-react'
import { useBank } from '@/store/bank'
import { listAccounts, balanceOf, totalDeposits, STATUS, statusMessage } from '@/engine/banking'
import { usd, parseAmount } from '@/lib/money'
import {
  Button,
  Stat,
  Badge,
  SectionHeading,
  Callout,
  EmptyState,
  Field,
  Input,
} from '@/components/ui'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import Reveal from '@/components/Reveal'

function AccountRow({ account, index }) {
  const balance = balanceOf(account)
  const funded = balance > 0n
  const entries = account.ledger.length

  return (
    <Reveal delay={(index % 3) * 0.06}>
      <Link
        to={`/account/${account.id}`}
        className="group flex items-center justify-between gap-4 rounded-2xl border border-hair bg-fill p-4 transition-colors hover:border-neonCyan/40 hover:bg-fill-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neonCyan sm:p-5"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-hair bg-fill text-neonCyan">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-ink">{account.owner}</p>
            <p className="font-mono text-xs text-muted">
              #{account.id} · {entries} {entries === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-right">
            <p className="font-mono text-sm font-semibold tabular-nums text-ink sm:text-base">
              {usd(balance)}
            </p>
            <div className="mt-1 flex justify-end">
              <Badge tone={funded ? 'ok' : 'neutral'}>{funded ? 'Funded' : 'Empty'}</Badge>
            </div>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-neonCyan"
            aria-hidden="true"
          />
        </div>
      </Link>
    </Reveal>
  )
}

function OpenAccountDialog({ open, onClose }) {
  const navigate = useNavigate()
  const [owner, setOwner] = useState('')
  const [opening, setOpening] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setOwner('')
      setOpening('')
      setError(null)
    }
  }, [open])

  const submit = (e) => {
    e.preventDefault()
    setError(null)
    if (owner.trim() === '') {
      setError({ field: 'owner', msg: 'Enter the account holder name.' })
      return
    }
    const parsed = parseAmount(opening, { allowEmpty: true })
    if (parsed.error) {
      setError({ field: 'opening', msg: parsed.error })
      return
    }
    const res = useBank.getState().open(owner.trim(), parsed.units)
    if (res.status !== STATUS.Ok) {
      setError({ field: 'form', msg: statusMessage(res.status) })
      return
    }
    onClose()
    navigate(`/account/${res.accountId}`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Open an account"
      titleId="open-account-title"
      description="A new account starts with an OPEN entry — its ledger begins here."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          label="Account holder"
          htmlFor="oa-owner"
          error={error?.field === 'owner' ? error.msg : undefined}
        >
          <Input
            id="oa-owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="e.g. Ada Lovelace"
            autoComplete="off"
            invalid={error?.field === 'owner'}
          />
        </Field>
        <Field
          label="Opening balance (optional)"
          htmlFor="oa-open"
          hint="Leave blank for $0.00. Digits with up to two decimals."
          error={error?.field === 'opening' ? error.msg : undefined}
        >
          <Input
            id="oa-open"
            inputMode="decimal"
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            placeholder="0.00"
            invalid={error?.field === 'opening'}
          />
        </Field>
        {error?.field === 'form' && (
          <Callout tone="bad" icon={AlertTriangle}>
            {error.msg}
          </Callout>
        )}
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Open account
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-9 w-52 animate-pulse rounded-lg bg-fill" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-fill" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-fill" />
        ))}
      </div>
      <span className="sr-only">Loading accounts…</span>
    </div>
  )
}

export default function Dashboard() {
  const bank = useBank((s) => s.bank)
  const hydrated = useBank((s) => s.hydrated)
  const [openDialog, setOpenDialog] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  if (!hydrated) return <DashboardSkeleton />

  const accounts = listAccounts(bank)
  const total = totalDeposits(bank)

  return (
    <div className="space-y-8">
      <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="// ledger-backed banking"
          title="Accounts"
          sub="Every balance below is derived by folding an append-only ledger — never stored as a number you would have to trust."
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setOpenDialog(true)}>
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Open account
          </Button>
          <Button variant="outline" onClick={() => useBank.getState().resetSample()}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset to sample
          </Button>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Reveal className="h-full" delay={0}>
          <Stat className="h-full" label="Accounts" value={accounts.length} />
        </Reveal>
        <Reveal className="h-full" delay={0.06}>
          <Stat className="h-full" label="Total deposits" value={usd(total)} sub="Sum of every derived balance" />
        </Reveal>
        <Reveal className="h-full" delay={0.12}>
          <Stat className="h-full" label="Money model" value="Exact" sub="Integer minor units, never a float" />
        </Reveal>
      </div>

      <Reveal>
        <Callout tone="info" icon={ShieldCheck} title="How this bank keeps its books honest">
          Balances are computed by replaying each account&rsquo;s ledger from zero, and every amount is
          an exact integer number of cents.{' '}
          <Link to="/about" className="text-neonCyan underline-offset-4 hover:underline">
            See the integrity model →
          </Link>
        </Callout>
      </Reveal>

      {accounts.length === 0 ? (
        <Reveal>
          <EmptyState
            icon={Landmark}
            title="Open your first account"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setOpenDialog(true)}>
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Open account
                </Button>
                <Button variant="outline" onClick={() => useBank.getState().resetSample()}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Load sample bank
                </Button>
              </div>
            }
          >
            There are no accounts in this browser yet. Open one to start its ledger, or restore the two
            sample accounts.
          </EmptyState>
        </Reveal>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-3">
            {accounts.map((a, i) => (
              <li key={a.id}>
                <AccountRow account={a} index={i} />
              </li>
            ))}
          </ul>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="rounded-md font-mono text-xs text-muted underline-offset-4 transition-colors hover:text-red-400 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
            >
              Clear all accounts
            </button>
          </div>
        </div>
      )}

      <OpenAccountDialog open={openDialog} onClose={() => setOpenDialog(false)} />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => useBank.getState().clearAll()}
        title="Clear all accounts?"
        confirmLabel="Clear everything"
      >
        This removes every account and its ledger from this browser. It cannot be undone — though you
        can reload the sample bank afterwards.
      </ConfirmDialog>
    </div>
  )
}
