import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { VAULT_TIER_LABELS } from '../../config/contracts'
import { Card } from '../ui/Card'

// ── Vault plan data mirrors the contract constructor ───────────────────────
const VAULTS = [
  { name: 'Vault A', dailyROI: 150, durationDays: 200, min: 10, max: 99,        tier: VAULT_TIER_LABELS[0] },
  { name: 'Vault B', dailyROI: 200, durationDays: 150, min: 100, max: 999,      tier: VAULT_TIER_LABELS[1] },
  { name: 'Vault C', dailyROI: 250, durationDays: 120, min: 1000, max: 9999,    tier: VAULT_TIER_LABELS[2] },
  { name: 'Vault D', dailyROI: 300, durationDays: 100, min: 10000, max: 0,      tier: VAULT_TIER_LABELS[3] },
]

const ACCENT_CLASSES = [
  'bg-gradient-to-r from-transparent via-[#7A9E7A] to-transparent',
  'bg-gradient-to-r from-transparent via-[#7A99BE] to-transparent',
  'bg-gradient-to-r from-transparent via-gold-400 to-transparent',
  'bg-gradient-to-r from-transparent via-[#C87A30] to-transparent',
]

const SECURITY_CARDS = [
  {
    icon: '🔒',
    title: 'Reentrancy Guard',
    desc: 'OpenZeppelin nonReentrant on every user function. State updated before any token transfer (CEI pattern).',
    spec: 'modifier: nonReentrant · Pattern: Checks-Effects-Interactions',
  },
  {
    icon: '🤖',
    title: 'EOA-Only Guard',
    desc: 'msg.sender == tx.origin check blocks all smart-contract callers — preventing flash-loan amplification and proxy abuse.',
    spec: 'CallerNotEOA revert · Applied via: rateLimited modifier',
  },
  {
    icon: '⏱',
    title: '10-Second Rate Limiter',
    desc: 'RATE_LIMIT_INTERVAL = 10 seconds between any two calls per address. Throttles bots in consecutive blocks.',
    spec: 'Constant: RATE_LIMIT_INTERVAL = 10 · Error: TransactionCooldown',
  },
  {
    icon: '⏳',
    title: '24h Withdrawal Cooldown',
    desc: 'WITHDRAW_COOLDOWN = 86,400 seconds after each withdrawal. Limits drain speed and provides incident response time.',
    spec: 'Constant: WITHDRAW_COOLDOWN = 86,400 · Error: WithdrawCooldownActive',
  },
  {
    icon: '💳',
    title: 'SafeERC20 Transfers',
    desc: 'All USDT flows use safeTransfer / safeTransferFrom. Handles non-standard tokens that return false instead of reverting.',
    spec: 'Library: using SafeERC20 for IERC20',
  },
  {
    icon: '🌐',
    title: 'No Upgradeable Proxy',
    desc: 'Plain immutable deployment — no delegatecall, no transparent proxy, no UUPS. Deployed logic never changes.',
    spec: 'No: delegatecall, transparent proxy, UUPS, beacon',
  },
  {
    icon: '🌲',
    title: 'Referral Abuse Prevention',
    desc: 'Self-referral blocked. Parent address immutable. Commission silently dropped if referrer income cap is zero.',
    spec: 'Errors: SelfReferral, InvalidReferrer · Cap gate: if (ref.incomeCap == 0) return',
  },
  {
    icon: '🏛',
    title: 'Per-Plan Income Cap',
    desc: 'maxIncomeCap = amount × days × roi / 10,000 — computed at subscribe time, decremented on every claim, triggers deactivation at zero.',
    spec: 'Effect: if (inv.maxIncomeCap == 0) inv.active = false',
  },
]

// ── Vault Calculator Card ─────────────────────────────────────────────────
function VaultCard({ vault, index }: { vault: typeof VAULTS[0]; index: number }) {
  const [amount, setAmount] = useState(vault.min.toString())
  const num = parseFloat(amount) || 0
  const daily = (num * vault.dailyROI) / 10000
  const cap = (num * vault.durationDays * vault.dailyROI) / 10000
  const outOfRange = num < vault.min || (vault.max > 0 && num > vault.max)

  return (
    <div className="vault-card relative bg-navy-900 border border-[rgba(200,150,12,0.12)] hover:bg-navy-850 transition-colors duration-200 overflow-hidden group">
      {/* Accent line */}
      <div className={`vault-card-accent ${ACCENT_CLASSES[index]} h-0.5`} />

      <div className="p-6">
        <p className="text-[0.52rem] uppercase tracking-widest text-slate-muted mb-1">{vault.tier}</p>
        <h3 className="font-serif text-2xl font-normal text-white mb-4">{vault.name}</h3>

        <div className="mb-0.5">
          <span className="font-serif text-4xl font-normal text-gold-300">
            {(vault.dailyROI / 100).toFixed(2)}%
          </span>
        </div>
        <p className="text-[0.55rem] tracking-wider text-slate-muted mb-5">
          Per day · {vault.dailyROI} bp · {vault.durationDays} days
        </p>

        <div className="h-px bg-[rgba(200,150,12,0.12)] mb-4" />

        {[
          ['minInvestment', `${vault.min.toLocaleString()} USDT`],
          ['maxInvestment', vault.max === 0 ? 'Unlimited' : `${vault.max.toLocaleString()} USDT`],
          ['durationDays', `${vault.durationDays} days`],
          ['maxIncomeCap', '3.0× invested'],
          ['claimROI interval', '≥ 86,400 sec'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between items-baseline mb-2.5">
            <span className="text-[0.55rem] uppercase tracking-wider text-slate-muted">{k}</span>
            <span className={`text-[0.73rem] ${k === 'maxIncomeCap' ? 'text-gold-300' : 'text-ivory'}`}>{v}</span>
          </div>
        ))}

        {/* Calculator */}
        <div className="mt-4 bg-navy-800/60 border border-[rgba(200,150,12,0.12)] p-3.5">
          <p className="text-[0.52rem] uppercase tracking-widest text-gold-500 mb-2.5">
            📐 Income Cap Calculator
          </p>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-[0.56rem] text-steel whitespace-nowrap">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={vault.min}
              max={vault.max || undefined}
              className="flex-1 bg-navy-800 border border-[rgba(200,150,12,0.2)] text-ivory font-mono text-[0.73rem] px-2.5 py-1.5 outline-none focus:border-gold-400/50 transition-colors min-w-0"
            />
            <span className="text-[0.56rem] text-steel">USDT</span>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[rgba(200,150,12,0.12)]">
            {[
              ['Daily ROI', `${daily.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`],
              ['Income Cap', `${cap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`],
            ].map(([k, v]) => (
              <div key={k} className="bg-navy-800 px-2.5 py-2">
                <p className="text-[0.5rem] uppercase tracking-wider text-slate-muted mb-1">{k}</p>
                <p className="text-[0.8rem] text-gold-300 font-medium">{v}</p>
              </div>
            ))}
          </div>
          {outOfRange && num > 0 && (
            <p className="mt-2 text-[0.56rem] text-danger">
              ⚠ Amount outside {vault.min.toLocaleString()}–{vault.max > 0 ? vault.max.toLocaleString() : '∞'} USDT range
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── FAQ item ──────────────────────────────────────────────────────────────
function FAQItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[rgba(200,150,12,0.12)]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center py-5 text-left text-[0.77rem] font-sans text-ivory hover:text-gold-300 transition-colors"
      >
        {q}
        <span className="font-serif text-xl text-gold-400 ml-4 shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && (
        <div className="pb-5 text-[0.73rem] font-sans leading-relaxed text-steel font-light">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Reveal wrapper ─────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { threshold: 0.08 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
    >
      {children}
    </div>
  )
}

// ── Main Landing Page ──────────────────────────────────────────────────────
export function LandingPage() {
  const { isConnected } = useAccount()
  const { open } = useWeb3Modal()

  return (
    <div className="relative z-10">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="min-h-[88vh] flex flex-col justify-center px-5 max-w-7xl mx-auto py-28">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-px w-8 bg-gold-500" />
          <span className="text-[0.6rem] uppercase tracking-[0.22em] text-gold-400">
            BNB Smart Chain · Solidity ^0.8.20 · OpenZeppelin v5
          </span>
        </div>
        <h1 className="font-serif text-[clamp(2.8rem,7vw,5.5rem)] font-normal leading-[1.07] text-white max-w-4xl mb-5">
          Every Return.<br /><em className="text-gold-300 font-normal">Mathematically</em><br />Defined On-Chain.
        </h1>
        <p className="font-sans text-[0.9rem] leading-[1.9] text-steel font-light max-w-xl mb-10">
          BlackVanta is a non-custodial DeFi vault protocol where your maximum earnable amount
          is computed by the smart contract at subscription time — not estimated, not approximated.
          The formula is open, auditable, and immutable.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#vaults" className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-medium font-mono text-[0.68rem] uppercase tracking-widest px-6 py-3 transition-colors">
            Explore Vaults
          </a>
          {isConnected ? (
            <Link to="/portfolio" className="border border-[rgba(200,150,12,0.3)] text-gold-300 hover:border-gold-400 hover:text-gold-200 font-mono text-[0.68rem] uppercase tracking-widest px-6 py-3 transition-colors">
              My Portfolio
            </Link>
          ) : (
            <button onClick={() => open()} className="border border-[rgba(200,150,12,0.3)] text-gold-300 hover:border-gold-400 hover:text-gold-200 font-mono text-[0.68rem] uppercase tracking-widest px-6 py-3 transition-colors">
              Connect Wallet
            </button>
          )}
        </div>
      </section>

      {/* ── PROTO STRIP ──────────────────────────────────────────────────── */}
      <Reveal>
        <div className="border-t border-b border-[rgba(200,150,12,0.12)] grid grid-cols-2 md:grid-cols-5">
          {[
            ['4', 'Vault Tiers'],
            ['3×', 'Max Payout — All Vaults'],
            ['20%', 'Referral Commission'],
            ['24h', 'Withdrawal Cooldown'],
            ['USDT', 'BEP20 · 18 Decimals'],
          ].map(([val, key]) => (
            <div key={key} className="px-4 py-6 text-center border-r border-[rgba(200,150,12,0.12)] last:border-r-0">
              <div className="font-serif text-2xl text-gold-300 mb-1">{val}</div>
              <div className="text-[0.52rem] uppercase tracking-widest text-slate-muted">{key}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── FORMULA ──────────────────────────────────────────────────────── */}
      <section id="formula" className="max-w-7xl mx-auto px-5 pt-24">
        <Reveal>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[0.58rem] uppercase tracking-[0.22em] text-gold-500">The Income Cap Formula</span>
            <div className="h-px w-12 bg-gold-600" />
          </div>
          <h2 className="font-serif text-3xl font-normal text-white mb-3">
            Your Maximum Earnings,<br /><em className="text-gold-300">Computed at Subscription</em>
          </h2>
          <p className="font-sans text-[0.83rem] leading-relaxed text-steel font-light max-w-xl mb-10">
            When you call <code className="text-gold-300 bg-gold-400/10 px-1.5 py-0.5 text-[0.8em]">subscribe()</code>,
            the contract calculates <code className="text-gold-300 bg-gold-400/10 px-1.5 py-0.5 text-[0.8em]">maxIncomeCap</code> and
            stores it in your <code className="text-gold-300 bg-gold-400/10 px-1.5 py-0.5 text-[0.8em]">PlanInvestment</code> struct — permanently on-chain.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <Card className="p-8 mb-6">
            <p className="text-[0.58rem] uppercase tracking-widest text-gold-500 mb-5">
              Solidity · subscribe() — exact on-chain computation
            </p>
            {/* Formula display */}
            <div className="font-serif text-xl md:text-2xl text-white mb-8 leading-relaxed">
              <span className="text-gold-300 italic">maxIncomeCap</span>
              <span className="text-steel mx-3">=</span>
              <span className="inline-flex flex-col text-center mx-2 align-middle">
                <span className="border-b border-gold-500 pb-1 mb-1 text-ivory">
                  <span className="text-gold-300 italic">investedAmount</span>
                  <span className="text-steel mx-1.5">×</span>
                  <span className="text-gold-300 italic">durationDays</span>
                  <span className="text-steel mx-1.5">×</span>
                  <span className="text-gold-300 italic">dailyROI</span>
                </span>
                <span className="text-steel text-base">10,000 (BASIS_POINTS)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(200,150,12,0.12)]">
              {[
                { tag: 'Input', val: 'investedAmount', note: 'USDT allocated. Deducted from your balance at subscribe time.' },
                { tag: 'Plan Config', val: 'durationDays', note: 'Fixed days per vault (100–200). Set at deployment, immutable.' },
                { tag: 'Plan Config', val: 'dailyROI', note: 'Vault A=150 bp, B=200, C=250, D=300. 10,000 bp = 100%.' },
                { tag: 'Constant', val: 'BASIS_POINTS = 10,000', note: 'Denominator for all percentage math in the contract.', highlight: true },
              ].map(({ tag, val, note, highlight }) => (
                <div key={val} className="bg-navy-850 p-4">
                  <p className="text-[0.52rem] uppercase tracking-wider text-slate-muted mb-1.5">{tag}</p>
                  <p className={`font-serif text-lg mb-1.5 ${highlight ? 'text-gold-400' : 'text-gold-200'}`}>{val}</p>
                  <p className="text-[0.62rem] font-sans text-steel leading-relaxed">{note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gold-400/5 border-l-2 border-gold-400 text-[0.73rem] font-sans text-ivory leading-relaxed">
              <strong className="text-gold-300">Why this always equals exactly 3×:</strong> Every vault satisfies{' '}
              <strong>durationDays × dailyROI = 30,000</strong> (e.g. 200×150=30,000; 100×300=30,000).
              Dividing by BASIS_POINTS (10,000) = <strong>3.0 exactly</strong>.
            </div>
          </Card>
        </Reveal>
      </section>

      {/* ── 3x BAND ──────────────────────────────────────────────────────── */}
      <Reveal delay={50}>
        <div className="max-w-7xl mx-auto px-5 my-10">
          <div className="border border-[rgba(200,150,12,0.22)] bg-gradient-to-br from-gold-400/8 to-gold-400/2 p-8 flex flex-wrap gap-8 items-start">
            <span className="font-serif text-7xl font-normal text-gold-400 shrink-0">3×</span>
            <div className="flex-1 min-w-[240px]">
              <h3 className="font-serif text-xl font-normal text-white mb-2">Every Vault. The Same Ceiling.</h3>
              <p className="font-sans text-[0.8rem] text-steel leading-relaxed font-light mb-5">
                Higher-ROI vaults run fewer days — calibrated so total earnable is identical across all tiers.
                Choose based on capital size and preferred timeline, not the return multiple.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(200,150,12,0.12)]">
                {VAULTS.map(v => (
                  <div key={v.name} className="bg-navy-850 p-3 text-center">
                    <p className="text-[0.56rem] uppercase tracking-wider text-slate-muted mb-1">{v.name}</p>
                    <p className="font-serif text-base text-ivory">{v.durationDays} × {v.dailyROI}</p>
                    <p className="text-[0.6rem] text-gold-400 mt-1">= 30,000 bp → <strong>3.0×</strong></p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── VAULTS ───────────────────────────────────────────────────────── */}
      <section id="vaults" className="max-w-7xl mx-auto px-5 pt-16">
        <Reveal>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[0.58rem] uppercase tracking-[0.22em] text-gold-500">Investment Tiers</span>
            <div className="h-px w-12 bg-gold-600" />
          </div>
          <h2 className="font-serif text-3xl font-normal text-white mb-2">Choose Your <em className="text-gold-300">Vault</em></h2>
          <p className="font-sans text-[0.83rem] text-steel font-light mb-10 max-w-xl">
            Each vault specifies its own daily ROI, duration, and deposit bounds. The calculator uses the exact on-chain formula.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-[rgba(200,150,12,0.12)] border border-[rgba(200,150,12,0.12)]">
          {VAULTS.map((v, i) => (
            <Reveal key={v.name} delay={i * 80}>
              <VaultCard vault={v} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how" className="max-w-7xl mx-auto px-5 pt-24">
        <Reveal>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[0.58rem] uppercase tracking-[0.22em] text-gold-500">Protocol Flow</span>
            <div className="h-px w-12 bg-gold-600" />
          </div>
          <h2 className="font-serif text-3xl font-normal text-white mb-10">Six Contract Calls.<br /><em className="text-gold-300">All On-Chain.</em></h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[rgba(200,150,12,0.12)] border border-[rgba(200,150,12,0.12)]">
          {[
            { icon: '🔗', title: 'Register', desc: 'Call register(parent). One-time, irreversible. member.parent set permanently.', n: '01' },
            { icon: '💵', title: 'Deposit', desc: 'Call deposit(amount). USDT pulled to contract. member.balance increases.', n: '02' },
            { icon: '🏦', title: 'Subscribe', desc: 'Call subscribe(planId, amount). maxIncomeCap computed & stored. Referral paid atomically.', n: '03' },
            { icon: '📈', title: 'Claim ROI', desc: 'Call claimROI(index) after 86,400s. Earned = amount × roi × days / 10,000. Decrements maxIncomeCap.', n: '04' },
            { icon: '💸', title: 'Withdraw', desc: 'Call withdraw(amount). USDT sent to wallet. 24h cooldown activates. CEI pattern.', n: '05' },
            { icon: '✅', title: 'Plan Ends', desc: 'When maxIncomeCap == 0 or duration elapses, inv.active = false. Subscribe again to restart.', n: '06' },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 60}>
              <div className="bg-navy-900 hover:bg-navy-850 p-5 relative min-h-[180px] border-r border-[rgba(200,150,12,0.12)] last:border-r-0 transition-colors">
                <div className="text-xl mb-3">{step.icon}</div>
                <h4 className="font-serif text-base font-normal text-white mb-2">{step.title}</h4>
                <p className="text-[0.65rem] font-sans text-steel leading-relaxed">{step.desc}</p>
                <span className="absolute bottom-3 right-4 font-serif text-4xl text-gold-400/8 leading-none">{step.n}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── SECURITY ─────────────────────────────────────────────────────── */}
      <section id="security" className="max-w-7xl mx-auto px-5 pt-24">
        <Reveal>
          <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[0.58rem] uppercase tracking-[0.22em] text-gold-500">Security Architecture</span>
                <div className="h-px w-12 bg-gold-600" />
              </div>
              <h2 className="font-serif text-3xl font-normal text-white mb-2">
                Every Attack Vector.<br /><em className="text-gold-300">Addressed in Code.</em>
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 border border-emerald/25 text-emerald text-[0.55rem] uppercase tracking-widest px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald blink" />
              OpenZeppelin v5 · Production Patterns
            </span>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(200,150,12,0.12)] border border-[rgba(200,150,12,0.12)]">
          {SECURITY_CARDS.map((c, i) => (
            <Reveal key={c.title} delay={i * 40}>
              <div className="bg-navy-900 hover:bg-navy-850 transition-colors p-5">
                <div className="text-xl mb-3">{c.icon}</div>
                <h4 className="font-serif text-base font-normal text-white mb-2">{c.title}</h4>
                <p className="text-[0.68rem] font-sans text-steel leading-relaxed mb-3">{c.desc}</p>
                <div className="bg-navy-800 border border-[rgba(200,150,12,0.12)] px-3 py-2 text-[0.6rem] leading-relaxed text-ivory font-mono">
                  {c.spec}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-7xl mx-auto px-5 pt-24">
        <Reveal>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[0.58rem] uppercase tracking-[0.22em] text-gold-500">Frequently Asked</span>
            <div className="h-px w-12 bg-gold-600" />
          </div>
          <h2 className="font-serif text-3xl font-normal text-white mb-10">Precise Answers.<br /><em className="text-gold-300">No Ambiguity.</em></h2>
        </Reveal>
        <div className="max-w-3xl border-t border-[rgba(200,150,12,0.12)]">
          {[
            {
              q: 'How is my income cap calculated — exactly?',
              a: 'When you call subscribe(planId, amount), the contract computes: planCap = investedAmount × durationDays × dailyROI / BASIS_POINTS. Because every vault has durationDays × dailyROI = 30,000, the cap always equals exactly 3× your invested amount. It is stored in PlanInvestment.maxIncomeCap and decremented on every ROI claim.',
            },
            {
              q: 'What is the exact ROI formula per claim?',
              a: 'claimROI() computes: pendingROI = investedAmount × dailyROI × daysSinceLastClaim / 10,000. daysSinceLastClaim uses integer division by 86,400 — only whole 24h periods count. Claimable = min(pendingROI, inv.maxIncomeCap). Unclaimed days accumulate.',
            },
            {
              q: 'Why do all four vaults cap at exactly the same 3× return?',
              a: 'Each vault satisfies durationDays × dailyROI = 30,000 bp (Vault A: 200×150, B: 150×200, C: 120×250, D: 100×300). Dividing by BASIS_POINTS (10,000) = 3.0. Higher ROI vaults run fewer days — the total earnable ceiling is identical. The difference is pace.',
            },
            {
              q: 'How does referral commission interact with the income cap?',
              a: 'Inside subscribe(), _payReferral() runs atomically. Commission = subscriptionAmount × 2,000 / 10,000 (20%). Payable = min(commission, referrer.incomeCap). Referrer\'s incomeCap is decremented. If incomeCap == 0, returns silently — no cascade, single-level only.',
            },
            {
              q: 'What happens when my plan\'s duration expires?',
              a: 'On the next claimROI() call after durationDays × 86,400 seconds have elapsed, the contract sets inv.active = false and reverts with PlanExpiredOrInactive. Any ROI earned within the valid duration but not yet claimed is forfeited. Claim before the plan expires.',
            },
            {
              q: 'Can I have multiple active subscriptions at the same time?',
              a: 'Yes. Each subscribe() appends a new PlanInvestment to member.plans[]. Each entry has its own maxIncomeCap, totalClaimed, and lastClaimTimestamp. Claim each plan separately by index: claimROI(0), claimROI(1), etc. member.incomeCap is the aggregate sum.',
            },
            {
              q: 'Is the contract upgradeable? Can the admin change my plan retroactively?',
              a: 'No. No proxy, no delegatecall, no upgrade mechanism. Your PlanInvestment.maxIncomeCap is computed and stored at subscribe time — immutable. Exception: dailyROI changes via updatePlan() retroactively affect pending ROI calculations on active subscriptions, as claimROI() reads the live plan value.',
            },
          ].map(({ q, a }) => (
            <FAQItem key={q} q={q}>{a}</FAQItem>
          ))}
        </div>
      </section>

    </div>
  )
}
