import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react'
import { useBank } from '@/store/bank'
import { listAccounts, balanceOf, STATUS, statusMessage } from '@/engine/banking'
import { usd, parseAmount } from '@/lib/money'
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Callout,
  EmptyState,
  SectionHeading,
} from '@/components/ui'
import Reveal from '@/components/Reveal'

export default function Transfer() {
  const bank = useBank((s) => s.bank)
  const hydrated = useBank((s) => s.hydrated)
  const accounts = listAccounts(bank)

  const [fromId, setFromId] = useState(() => {
    const accs = listAccounts(useBank.getState().bank)
    return accs[0] ? String(accs[0].id) : ''
  })
  const [toId, setToId] = useState(() => {
    const accs = listAccounts(useBank.getState().bank)
    return accs[1] ? String(accs[1].id) : ''
  })
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState(null)

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-fill" aria-busy="true" />
  }

  if (accounts.length < 2) {
    return (
      <div className="space-y-8">
        <Reveal>
          <SectionHeading
            eyebrow="// transfer"
            title="Move money between accounts"
            sub="Transfers are atomic — checked before either ledger is touched, so the bank's total is always conserved."
          />
        </Reveal>
        <Reveal>
          <EmptyState
            icon={ArrowLeftRight}
            title="You need at least two accounts"
            action={
              <Button as={Link} to="/">
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Go to accounts
              </Button>
            }
          >
            A transfer moves money from one account to another. Open a second account to get started.
          </EmptyState>
        </Reveal>
      </div>
    )
  }

  const from = accounts.find((a) => String(a.id) === fromId)
  const toOptions = accounts.filter((a) => String(a.id) !== fromId)

  const onFromChange = (value) => {
    setFromId(value)
    if (value === toId) setToId('')
    setResult(null)
  }

  const submit = (e) => {
    e.preventDefault()
    setResult(null)

    if (!fromId) return setResult({ tone: 'bad', msg: 'Choose the account to send from.' })
    if (!toId) return setResult({ tone: 'bad', msg: 'Choose the account to send to.' })

    const parsed = parseAmount(amount)
    if (parsed.error) return setResult({ tone: 'bad', msg: parsed.error })

    const res = useBank.getState().transfer(Number(fromId), Number(toId), parsed.units, note.trim())
    if (res.status !== STATUS.Ok) {
      const detail =
        res.status === STATUS.InsufficientFunds && from
          ? ` Balance is ${usd(balanceOf(from))}.`
          : ''
      return setResult({ tone: 'bad', msg: statusMessage(res.status) + detail })
    }

    setResult({
      tone: 'ok',
      msg: `Moved ${usd(parsed.units)} from #${fromId} to #${toId}. Sender balance is now ${usd(res.balance)}.`,
    })
    setAmount('')
    setNote('')
  }

  return (
    <div className="space-y-8">
      <Reveal>
        <SectionHeading
          eyebrow="// transfer"
          title="Move money between accounts"
          sub="Transfers are atomic — insufficient funds or overflow are rejected before either ledger is touched, so the bank's total is always conserved."
        />
      </Reveal>

      <Reveal className="mx-auto w-full max-w-xl">
        <Card className="p-5 sm:p-6">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="From" htmlFor="tf-from">
              <Select id="tf-from" value={fromId} onChange={(e) => onFromChange(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} — {a.owner} ({usd(balanceOf(a))})
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex justify-center" aria-hidden="true">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-hair bg-fill text-neonCyan">
                <ArrowDown className="h-4 w-4" />
              </span>
            </div>

            <Field label="To" htmlFor="tf-to">
              <Select
                id="tf-to"
                value={toId}
                onChange={(e) => {
                  setToId(e.target.value)
                  setResult(null)
                }}
              >
                <option value="">Select an account…</option>
                {toOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} — {a.owner}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Amount" htmlFor="tf-amount" hint="Exact to the cent. Up to two decimals.">
              <Input
                id="tf-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                invalid={result?.tone === 'bad'}
              />
            </Field>

            <Field label="Note (optional)" htmlFor="tf-note">
              <Input
                id="tf-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. split dinner"
                autoComplete="off"
              />
            </Field>

            <Button type="submit" className="w-full">
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              Send transfer
            </Button>
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
      </Reveal>
    </div>
  )
}
