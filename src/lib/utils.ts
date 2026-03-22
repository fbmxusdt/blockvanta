import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatUnits } from 'viem'

// ── Tailwind class merger ──────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── USDT formatting (18 decimals) ─────────────────────────────────────────
export function formatUSDT(wei: bigint, decimals = 2): string {
  const val = formatUnits(wei, 18)
  const num = parseFloat(val)
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// ── Parse USDT string to wei ──────────────────────────────────────────────
export function parseUSDT(amount: string): bigint {
  const num = parseFloat(amount)
  if (isNaN(num) || num < 0) return 0n
  return BigInt(Math.floor(num * 1e18))
}

// ── Shorten Ethereum address ──────────────────────────────────────────────
export function shortAddr(addr: string, chars = 4): string {
  if (!addr) return ''
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`
}

// ── Format timestamp to human-readable ───────────────────────────────────
export function formatDate(ts: bigint): string {
  if (ts === 0n) return '—'
  return new Date(Number(ts) * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Countdown from a unix timestamp ──────────────────────────────────────
export function countdownFrom(ts: bigint, addSeconds: bigint): string {
  const end = Number(ts + addSeconds) * 1000
  const now = Date.now()
  const diff = end - now
  if (diff <= 0) return 'Available'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}

// ── Format daily ROI basis points to percentage string ───────────────────
export function formatROI(bp: bigint): string {
  return (Number(bp) / 100).toFixed(2) + '%'
}

// ── Compute income cap: amount × days × roi / 10000 ──────────────────────
export function computeIncomeCap(amount: bigint, durationDays: bigint, dailyROI: bigint): bigint {
  if (amount === 0n || durationDays === 0n || dailyROI === 0n) return 0n
  return (amount * durationDays * dailyROI) / 10_000n
}

// ── Parse contract error names ─────────────────────────────────────────────
export function parseContractError(err: unknown): string {
  if (!err) return 'Unknown error'
  const msg = (err as Error).message ?? String(err)

  const errorMap: Record<string, string> = {
    CallerNotEOA: 'Only EOA wallets are allowed (no smart contracts)',
    TransactionCooldown: 'Please wait 10 seconds between transactions',
    AlreadyRegistered: 'This wallet is already registered',
    InvalidReferrer: 'Referrer address is not registered',
    SelfReferral: 'You cannot refer yourself',
    NotRegistered: 'Please register before proceeding',
    InvalidAmount: 'Invalid amount (cannot be zero)',
    InsufficientBalance: 'Insufficient internal balance',
    PlanNotActive: 'This vault plan is not available',
    AmountBelowMin: 'Amount is below the vault minimum',
    AmountAboveMax: 'Amount exceeds the vault maximum',
    NoPendingROI: 'No ROI available to claim yet (wait 24h)',
    PlanExpiredOrInactive: 'This subscription has expired or is inactive',
    WithdrawCooldownActive: 'Withdrawal cooldown active — try again after 24h',
    ZeroAddress: 'Address cannot be zero',
    NoIncomeCap: 'Your income cap is exhausted',
    InvalidPlanConfig: 'Invalid plan configuration',
    EnforcedPause: 'Contract is paused by admin',
    OwnableUnauthorizedAccount: 'Not authorized — owner only',
    UserRejectedRequest: 'Transaction rejected in wallet',
    InsufficientFunds: 'Insufficient BNB for gas',
  }

  for (const [key, label] of Object.entries(errorMap)) {
    if (msg.includes(key)) return label
  }

  if (msg.includes('User rejected') || msg.includes('user rejected')) {
    return 'Transaction rejected in wallet'
  }

  return msg.length > 100 ? msg.slice(0, 100) + '…' : msg
}
