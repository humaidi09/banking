import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Landmark,
} from 'lucide-react'
import { useBank } from '@/store/bank'
import {
  findAccount,
  listAccounts,
  balanceOf,
  ENTRY,
  STATUS,
  statusMessage,
} from '@/engine/banking'
import { usd, parseAmount } from '@/lib/money'
import {
  Button,
  Card,
  Panel,
  Badge,
  Callout,
  EmptyState,
  Field,
  Input,
  Select,
  SectionHeading,
  Divider,
} from '@/components/ui'
import { LedgerTable } from '@/components/LedgerTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import Reveal from '@/components/Reveal'
import { cx } from '@/lib/cx'

const MODES = [
  { key: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
  { key: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
  { key: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
]

// Sum the ledger into the figures a paper statement would show. Every line is a
// fold over the same append-only history the table renders.
function summarise(account) {
  const totals = {
    opening: 0n,
    deposits: 0n,
    withdrawals: 0n,
    transfersIn: 0n,
    transfersOut: 0n,
  }
  for (const e of account.ledger) {
    if (e.type === ENTRY.Open) totals.opening = e.amount
    else if (e.type === ENTRY.Deposit) totals.deposits += e.amount
    else if (e.type === ENTRY.Withdrawal) totals.withdrawals += e.amount
    else if (e.type === ENTRY.TransferIn) totals.transfersIn += e.amount
    else if (e.type === ENTRY.TransferOut) totals.transfersOut += e.amount
  }
  return totals
}

function StatementRow({ label, value, sign }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-mono tabular-nums text-ink">
        {sign && <span className="mr-1 text-muted">{sign}</span>}
        {value}
      </span>
    </div>
  )
}

function ActionPanel({ account, others }) {
  const [mode, setMode] = useState('deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [toId, setToId] = useState('')
  const [result, setResult] = useState(null)

  const active = MODES.find((m) => m.key === mode)
  const canTransfer = others.length > 0

  const reset = (nextMode) => {
    setMode(nextMode)
    setResult(null)
  }

  const submit = (e) => {
    e.preventDefault()
    setResult(null)

    const parsed = parseAmount(amount)
    if (parsed.error) {
      setResult({ tone: 'bad', msg: parsed.error })
      return
    }

    const api = useBank.getState()
    let res
    if (mode === 'deposit') {
      res = api.deposit(account.id, parsed.units, note.trim())
    } else if (mode === 'withdraw') {
      res = api.withdraw(account.id, parsed.units, note.trim())
    } else {
      if (!toId) {
        setResult({ tone: 'bad', msg: 'Choose an account to transfer to.' })
        return
      }
      res = api.transfer(account.id, Number(toId), parsed.units, note.trim())
    }

    if (res.status !== STATUS.Ok) {
      const detail =
        res.status === STATUS.InsufficientFunds
          ? ` Balance is ${usd(balanceOf(account))}.`
          : ''
      setResult({ tone: 'bad', msg: statusMessage(res.status) + detail })
      return
    }

    const verb =
      mode === 'deposit' ? 'Deposited' : mode === 'withdraw' ? 'Withdrew' : `Sent`
    const dest = mode === 'transfer' ? ` to #${toId}` : ''
    setResult({
      tone: 'ok',
      msg: `${verb} ${usd(parsed.units)}${dest}. New balance is ${usd(res.balance)}.`,
    })
    setAmount('')
    setNote('')
  }

  return (
    <Card className="p-5 sm:p-6">
      <SectionHeading eyebrow="// teller" title="Move money" />
      <div
        role="group"
        aria-label="Choose an action"
        className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-hair bg-fill p-1"
      >
        {MODES.map((m) => {
          const on = m.key === mode
          const Icon = m.icon
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={on}
              onClick={() => reset(m.key)}
              className={cx(
                'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neonCyan',
                on ? 'bg-neonCyan text-void' : 'text-muted hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {m.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        {mode === 'transfer' && !canTransfer ? (
          <Callout tone="warn" icon={AlertTriangle} title="No destination available">
            Open a second account before you can transfer out of this one.
          </Callout>
        ) : (
          <>
            {mode === 'transfer' && (
              <Field label="To account" htmlFor="ac-to">
                <Select id="ac-to" value={toId} onChange={(e) => setToId(e.target.value)}>
                  <option value="">Select an account…</option>
                  {others.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} — {o.owner}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Amount" htmlFor="ac-amount" hint="Exact to the cent. Up to two decimals.">
              <Input
                id="ac-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                invalid={result?.tone === 'bad'}
              />
            </Field>
            <Field label="Note (optional)" htmlFor="ac-note">
              <Input
                id="ac-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={mode === 'withdraw' ? 'e.g. rent' : 'e.g. salary'}
                autoComplete="off"
              />
            </Field>
            <Button type="submit" className="w-full">
              <active.icon className="h-4 w-4" aria-hidden="true" />
              {active.label}
            </Button>
          </>
        )}
      </form>

      {result && (
        <div className="mt-4" aria-live="polite">
          <Callout
            tone={result.tone}
            icon={result.tone === 'ok' ? CheckCircle2 : AlertTriangle}
          >
            {result.msg}
          </Callout>
        </div>
      )}
    </Card>
  )
}

export default function AccountDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bank = useBank((s) => s.bank)
  const hydrated = useBank((s) => s.hydrated)
  const [confirmClose, setConfirmClose] = useState(false)
  const [closeError, setCloseError] = useState(null)

  const accountId = Number(id)
  const account = Number.isNaN(accountId) ? undefined : findAccount(bank, accountId)

  // If this account is closed while open (or never existed), fall back cleanly.
  useEffect(() => {
    setCloseError(null)
  }, [id])

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-fill" aria-busy="true" />
  }

  if (!account) {
    return (
      <EmptyState
        icon={Landmark}
        title="Account not found"
        action={
          <Button as={Link} to="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to accounts
          </Button>
        }
      >
        No account with number #{id} exists in this browser. It may have been closed.
      </EmptyState>
    )
  }

  const balance = balanceOf(account)
  const entries = account.ledger.length
  const others = listAccounts(bank).filter((a) => a.id !== account.id)
  const totals = summarise(account)

  const closeAccount = () => {
    const res = useBank.getState().closeAccount(account.id)
    if (res.ok) navigate('/')
    else setCloseError(res.reason)
  }

  return (
    <div className="space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-md font-mono text-sm text-muted transition-colors hover:text-neonCyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neonCyan"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Accounts
      </Link>

      {/* Header — the derived balance */}
      <Reveal>
        <Card glow className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Account #{account.id}</p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {account.owner}
              </h1>
            </div>
            <Badge tone={balance > 0n ? 'ok' : 'neutral'}>{balance > 0n ? 'Funded' : 'Empty'}</Badge>
          </div>
          <div className="mt-6">
            <p className="font-mono text-xs uppercase tracking-wide text-muted">Current balance</p>
            <motion.p
              key={balance.toString()}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gradient font-display text-5xl font-bold tracking-tight tabular-nums sm:text-6xl"
            >
              {usd(balance)}
            </motion.p>
            <p className="mt-2 font-mono text-xs text-muted">
              Derived by folding {entries} ledger {entries === 1 ? 'entry' : 'entries'} from $0.00 —
              never stored.
            </p>
          </div>
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(320px,380px)]">
        {/* Ledger */}
        <Reveal className="order-2 h-full lg:order-1">
          <Card className="h-full p-5 sm:p-6">
            <SectionHeading
              eyebrow="// append-only"
              title="Ledger"
              sub="Entries are only ever appended. The balance above equals the last running total below."
            />
            <div className="mt-5">
              <LedgerTable account={account} />
            </div>
          </Card>
        </Reveal>

        {/* Actions */}
        <Reveal className="order-1 lg:order-2" delay={0.06}>
          <ActionPanel account={account} others={others} />
        </Reveal>
      </div>

      {/* Statement */}
      <Reveal>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="// statement" title="Statement summary" />
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print
            </Button>
          </div>
          <Panel className="mt-5 p-5 font-mono text-sm">
            <div className="flex items-center justify-between border-b border-hair pb-3">
              <div>
                <p className="font-display text-base font-semibold text-ink">Banking System</p>
                <p className="text-xs text-muted">{account.owner}</p>
              </div>
              <p className="text-xs text-muted">#{account.id}</p>
            </div>
            <div className="py-3">
              <StatementRow label="Opening balance" value={usd(totals.opening)} />
              <StatementRow label="Deposits" value={usd(totals.deposits)} sign="+" />
              <StatementRow label="Withdrawals" value={usd(totals.withdrawals)} sign="−" />
              <StatementRow label="Transfers in" value={usd(totals.transfersIn)} sign="+" />
              <StatementRow label="Transfers out" value={usd(totals.transfersOut)} sign="−" />
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-hair pt-3">
              <span className="font-semibold text-ink">Current balance</span>
              <span className="font-mono text-base font-bold tabular-nums text-neonCyan">
                {usd(balance)}
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Balance verified by folding {entries} ledger {entries === 1 ? 'entry' : 'entries'}. All
              figures are exact integer minor units.
            </p>
          </Panel>
        </Card>
      </Reveal>

      {/* Danger zone */}
      <Divider />
      <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Close account</p>
          <p className="text-sm text-muted">
            An account can be closed only when its balance is $0.00, so no money is ever lost.
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            setCloseError(null)
            setConfirmClose(true)
          }}
          disabled={balance !== 0n}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Close account
        </Button>
      </Reveal>
      {balance !== 0n && (
        <p className="-mt-4 font-mono text-xs text-muted">
          Withdraw or transfer out the remaining {usd(balance)} to enable closing.
        </p>
      )}
      {closeError && (
        <Callout tone="bad" icon={AlertTriangle}>
          {closeError}
        </Callout>
      )}

      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={closeAccount}
        title={`Close account #${account.id}?`}
        confirmLabel="Close account"
      >
        This removes {account.owner}&rsquo;s account and its ledger. The account number will not be
        reused.
      </ConfirmDialog>
    </div>
  )
}
