import { cn } from '../../lib/utils'
import { EXPLORER_URL } from '../../config/wagmi'

// ── Card ──────────────────────────────────────────────────────────────────
interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
}
export function Card({ className, children, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'relative bg-navy-900 border border-[rgba(200,150,12,0.12)]',
        hover && 'transition-colors duration-200 hover:bg-navy-850',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────
interface BadgeProps {
  variant?: 'gold' | 'green' | 'red' | 'steel'
  pulse?: boolean
  children: React.ReactNode
  className?: string
}
export function Badge({ variant = 'gold', pulse = false, children, className }: BadgeProps) {
  const colors = {
    gold: 'border-gold-400/30 text-gold-400',
    green: 'border-emerald/30 text-emerald',
    red: 'border-danger/30 text-danger',
    steel: 'border-steel/30 text-steel',
  }
  const dotColors = {
    gold: 'bg-gold-400',
    green: 'bg-emerald',
    red: 'bg-danger',
    steel: 'bg-steel',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2.5 py-1 text-[0.55rem] uppercase tracking-widest font-mono',
        colors[variant],
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant], pulse && 'blink')} />
      {children}
    </span>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string
  sub?: string
  className?: string
  highlight?: boolean
}
export function StatCard({ label, value, sub, className, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 px-4 py-5 border-r border-[rgba(200,150,12,0.12)] last:border-r-0',
        className,
      )}
    >
      <span className="text-[0.52rem] uppercase tracking-widest text-slate-muted">{label}</span>
      <span
        className={cn(
          'font-serif text-2xl font-normal leading-tight',
          highlight ? 'text-gold-300' : 'text-ivory',
        )}
      >
        {value}
      </span>
      {sub && <span className="text-[0.58rem] text-steel">{sub}</span>}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px bg-[rgba(200,150,12,0.12)]', className)} />
}

// ── Section title ─────────────────────────────────────────────────────────
interface SectionTitleProps {
  eyebrow?: string
  title: React.ReactNode
  description?: string
  className?: string
}
export function SectionTitle({ eyebrow, title, description, className }: SectionTitleProps) {
  return (
    <div className={cn('mb-8', className)}>
      {eyebrow && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[0.58rem] uppercase tracking-[0.22em] text-gold-500">{eyebrow}</span>
          <div className="h-px w-12 bg-gold-600" />
        </div>
      )}
      <h2 className="font-serif text-2xl md:text-3xl font-normal text-white leading-tight mb-2">
        {title}
      </h2>
      {description && (
        <p className="font-sans text-sm leading-relaxed text-steel font-light max-w-xl">
          {description}
        </p>
      )}
    </div>
  )
}

// ── TxStatus — shows pending/confirming/success inline ───────────────────
interface TxStatusProps {
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  hash?: string
}
export function TxStatus({ isPending, isConfirming, isSuccess, hash }: TxStatusProps) {
  if (!isPending && !isConfirming && !isSuccess) return null
  return (
    <div className="mt-3 text-[0.65rem] font-mono">
      {isPending && <span className="text-gold-300 flex items-center gap-2"><span className="blink">●</span> Waiting for wallet confirmation…</span>}
      {isConfirming && <span className="text-gold-300 flex items-center gap-2"><span className="blink">●</span> Broadcasting transaction…</span>}
      {isSuccess && (
        <span className="text-emerald flex items-center gap-2">
          ✓ Confirmed
          {hash && EXPLORER_URL && (
            <a
              href={`${EXPLORER_URL}/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 underline"
            >
              View on Explorer ↗
            </a>
          )}
          {hash && !EXPLORER_URL && (
            <span className="text-steel font-mono text-[0.6rem]">{hash.slice(0, 18)}…</span>
          )}
        </span>
      )}
    </div>
  )
}
