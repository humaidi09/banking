import { Link } from 'react-router-dom'
import {
  Coins,
  Scale,
  ScrollText,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react'
import { Money, INT64_MAX } from '@/engine/banking'
import { usd } from '@/lib/money'
import { PRINCIPLES } from '@/data/principles'
import { Card, Callout, SectionHeading, Button, Badge } from '@/components/ui'
import Reveal from '@/components/Reveal'

// Principle icons live here (not in the data) so the dataset can carry a plain
// name string; a name the map doesn't know falls back to the shield.
const ICONS = {
  coins: Coins,
  scale: Scale,
  scroll: ScrollText,
  transfer: ArrowLeftRight,
  shield: ShieldCheck,
}

export default function About() {
  // Live, not hand-typed: the classic float error vs. the exact integer result.
  // Computed on each mount (not at module load) so an edited currency symbol —
  // applied via a remount — is reflected here too.
  const FLOAT_SUM = (0.1 + 0.2).toString()
  const EXACT_SUM = usd(Money.parse('0.10') + Money.parse('0.20'))
  const CEILING = usd(INT64_MAX)

  return (
    <div className="space-y-8">
      <Reveal>
        <SectionHeading
          eyebrow="// integrity model"
          title="Why you can trust the numbers"
          sub="This console is a faithful port of a C++ banking core, built around two invariants it never breaks: money is exact, and every balance is proven by its ledger."
        />
      </Reveal>

      {/* The thesis, made visible */}
      <Reveal>
        <Card glow className="p-6 sm:p-8">
          <p className="eyebrow">The 0.1 + 0.2 problem</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
            The same sum, two ways
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Floating-point money is wrong in ways that compound. Integer minor units are not.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-5">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-400" aria-hidden="true" />
                <span className="font-mono text-xs text-muted">IEEE-754 float</span>
              </div>
              <p className="mt-3 font-mono text-lg font-semibold tabular-nums text-ink">
                0.1 + 0.2 = {FLOAT_SUM}
              </p>
            </div>
            <div className="rounded-xl border border-neonCyan/25 bg-neonCyan/[0.06] p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-neonCyan" aria-hidden="true" />
                <span className="font-mono text-xs text-muted">Exact minor units</span>
              </div>
              <p className="mt-3 font-mono text-lg font-semibold tabular-nums text-ink">
                10¢ + 20¢ = {EXACT_SUM}
              </p>
            </div>
          </div>
        </Card>
      </Reveal>

      {/* Principles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PRINCIPLES.map((p, i) => {
          const Icon = ICONS[p.icon] || ShieldCheck
          return (
            <Reveal key={i} className="h-full" delay={(i % 2) * 0.06}>
              <Card className="h-full p-5 sm:p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-hair bg-fill text-neonCyan">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
              </Card>
            </Reveal>
          )
        })}
      </div>

      <Reveal>
        <Callout tone="info" icon={ShieldCheck} title="Checked 64-bit arithmetic">
          Amounts live in a signed 64-bit range, exactly like the C++ core&rsquo;s{' '}
          <code className="rounded bg-fill px-1 py-0.5 font-mono text-[13px] text-ink">int64_t</code>.
          The largest representable balance is{' '}
          <span className="font-mono tabular-nums text-ink">{CEILING}</span> — go past it and the
          operation is refused, never wrapped.
        </Callout>
      </Reveal>

      <Reveal className="flex flex-wrap items-center gap-3">
        <Badge tone="accent">C++17 → JavaScript</Badge>
        <span className="text-sm text-muted">
          The money math is the ported engine, unchanged.
        </span>
        <Button as={Link} to="/" variant="outline" size="sm" className="ml-auto">
          Back to accounts
        </Button>
      </Reveal>
    </div>
  )
}
