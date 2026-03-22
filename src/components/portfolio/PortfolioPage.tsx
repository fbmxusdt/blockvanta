import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import toast from 'react-hot-toast'
import { formatUnits } from 'viem'
import type { Address } from 'viem'
import {
  useMemberInfo,
  useMemberPlans,
  useRewardPlans,
  usePendingROI,
  useUSDTBalance,
  useUSDTAllowance,
  useRegister,
  useApproveUSDT,
  useDeposit,
  useSubscribe,
  useClaimROI,
  useWithdraw,
  useIsRegistered,
} from '../../hooks/useBlackVanta'
import {
  formatUSDT,
  parseUSDT,
  shortAddr,
  countdownFrom,
  formatROI,
  computeIncomeCap,
  parseContractError,
} from '../../lib/utils'
import { VAULT_TIER_LABELS } from '../../config/contracts'
import type { RewardPlan, PlanInvestment, MemberInfoTuple } from '../../types/contracts'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, StatCard, Badge, TxStatus, SectionTitle, Divider } from '../ui/Card'
import { Modal } from '../ui/Modal'

// ────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────────────────

// ── Register Panel ────────────────────────────────────────────────────────
function RegisterPanel({ address }: { address: Address }) {
  const [parent, setParent] = useState('')
  const { register, isPending, isConfirming, isSuccess, error } = useRegister()

  useEffect(() => { if (isSuccess) toast.success('Registration confirmed!') }, [isSuccess])
  useEffect(() => { if (error) toast.error(parseContractError(error)) }, [error])

  const handle = () => {
    if (!parent.startsWith('0x') || parent.length !== 42) {
      toast.error('Enter a valid referrer address'); return
    }
    if (parent.toLowerCase() === address.toLowerCase()) {
      toast.error('Cannot refer yourself'); return
    }
    register(parent as Address)
  }

  return (
    <Card className="p-8 max-w-lg mx-auto mt-12 text-center">
      <div className="text-3xl mb-4">🔗</div>
      <h2 className="font-serif text-2xl text-white mb-3">Register Your Wallet</h2>
      <p className="font-sans text-[0.78rem] text-steel leading-relaxed mb-6">
        Registration is one-time and irreversible. Provide a referrer address
        (a registered member or the contract owner). Your parent cannot be changed after registration.
      </p>
      <div className="text-left space-y-4">
        <Input
          label="Referrer Address"
          placeholder="0x..."
          value={parent}
          onChange={e => setParent(e.target.value)}
        />
        <Button className="w-full" size="lg" loading={isPending || isConfirming} onClick={handle}>
          {isPending ? 'Confirm in Wallet…' : isConfirming ? 'Registering…' : 'Register'}
        </Button>
        <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} />
      </div>
    </Card>
  )
}

// ── Deposit Modal ─────────────────────────────────────────────────────────
function DepositModal({
  open, onClose, address,
}: { open: boolean; onClose: () => void; address: Address }) {
  const [amt, setAmt] = useState('')
  const { data: usdtBal } = useUSDTBalance(address)
  const { data: allowance } = useUSDTAllowance(address)
  const { approve, isPending: approvePending, isConfirming: approveConfirming, isSuccess: approveSuccess } = useApproveUSDT()
  const { deposit, isPending: depositPending, isConfirming: depositConfirming, isSuccess: depositSuccess, hash } = useDeposit()

  const amountWei = parseUSDT(amt)
  const needsApprove = allowance === undefined || allowance < amountWei

  useEffect(() => {
    if (depositSuccess) { toast.success('Deposit confirmed!'); onClose(); setAmt('') }
  }, [depositSuccess, onClose])
  useEffect(() => { if (approveSuccess) toast.success('USDT approved! Now click Deposit.') }, [approveSuccess])

  const handleAction = () => {
    if (!amt || amountWei === 0n) { toast.error('Enter an amount'); return }
    if (needsApprove) { approve(amountWei) } else { deposit(amountWei) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Deposit USDT">
      <div className="space-y-4">
        <div className="bg-navy-800 border border-[rgba(200,150,12,0.12)] px-4 py-3 text-[0.68rem] text-steel font-sans">
          Wallet Balance:{' '}
          <span className="text-ivory">{usdtBal !== undefined ? formatUSDT(usdtBal) : '—'} USDT</span>
        </div>
        <Input label="Amount (USDT)" type="number" min="0" placeholder="0.00"
          value={amt} onChange={e => setAmt(e.target.value)} suffix="USDT" />
        {allowance !== undefined && (
          <p className="text-[0.6rem] text-steel">
            Current allowance: {formatUSDT(allowance)} USDT
            {needsApprove && <span className="text-gold-400 ml-2">→ Approve required first</span>}
          </p>
        )}
        <Button className="w-full"
          loading={approvePending || approveConfirming || depositPending || depositConfirming}
          onClick={handleAction}>
          {needsApprove
            ? (approvePending || approveConfirming ? 'Approving…' : 'Step 1: Approve USDT')
            : (depositPending || depositConfirming ? 'Depositing…' : 'Step 2: Deposit')}
        </Button>
        <TxStatus
          isPending={depositPending || approvePending}
          isConfirming={depositConfirming || approveConfirming}
          isSuccess={depositSuccess}
          hash={hash}
        />
      </div>
    </Modal>
  )
}

// ── Subscribe Modal ────────────────────────────────────────────────────────
function SubscribeModal({
  open, onClose, planId, plan, internalBalance,
}: {
  open: boolean
  onClose: () => void
  planId: number
  plan: RewardPlan
  internalBalance: bigint
}) {
  const [amt, setAmt] = useState('')
  const { subscribe, isPending, isConfirming, isSuccess, error, hash } = useSubscribe()

  useEffect(() => { if (isSuccess) { toast.success('Subscribed!'); onClose(); setAmt('') } }, [isSuccess, onClose])
  useEffect(() => { if (error) toast.error(parseContractError(error)) }, [error])

  const amountWei = parseUSDT(amt)
  const previewCap = computeIncomeCap(amountWei, plan.durationDays, plan.dailyROI)
  const previewDaily = amountWei > 0n ? (amountWei * plan.dailyROI) / 10_000n : 0n

  const handle = () => {
    if (!amt || amountWei === 0n) { toast.error('Enter an amount'); return }
    if (amountWei < plan.minInvestment) {
      toast.error(`Minimum is ${formatUSDT(plan.minInvestment)} USDT`); return
    }
    if (plan.maxInvestment > 0n && amountWei > plan.maxInvestment) {
      toast.error(`Maximum is ${formatUSDT(plan.maxInvestment)} USDT`); return
    }
    if (amountWei > internalBalance) {
      toast.error('Exceeds internal balance — deposit first'); return
    }
    subscribe(BigInt(planId), amountWei)
  }

  return (
    <Modal open={open} onClose={onClose} title={`Subscribe to ${plan.name}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-px bg-[rgba(200,150,12,0.12)]">
          {([
            ['Daily ROI', formatROI(plan.dailyROI)],
            ['Duration', `${String(plan.durationDays)} days`],
            ['Min', `${formatUSDT(plan.minInvestment)} USDT`],
            ['Max', plan.maxInvestment === 0n ? 'Unlimited' : `${formatUSDT(plan.maxInvestment)} USDT`],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="bg-navy-800 px-3 py-2">
              <p className="text-[0.52rem] uppercase tracking-wider text-slate-muted mb-0.5">{k}</p>
              <p className="text-[0.78rem] text-ivory">{v}</p>
            </div>
          ))}
        </div>
        <div className="bg-navy-800 border border-[rgba(200,150,12,0.12)] px-4 py-2.5 text-[0.65rem] text-steel">
          Internal Balance: <span className="text-ivory">{formatUSDT(internalBalance)} USDT</span>
        </div>
        <Input label="Subscribe Amount (USDT)" type="number" placeholder="0.00"
          value={amt} onChange={e => setAmt(e.target.value)} suffix="USDT" />
        {amountWei > 0n && (
          <div className="grid grid-cols-2 gap-px bg-[rgba(200,150,12,0.12)]">
            <div className="bg-gold-400/5 px-3 py-2.5">
              <p className="text-[0.52rem] uppercase tracking-wider text-slate-muted mb-0.5">Est. Daily ROI</p>
              <p className="text-[0.85rem] text-gold-300 font-medium">{formatUSDT(previewDaily)} USDT</p>
            </div>
            <div className="bg-gold-400/5 px-3 py-2.5">
              <p className="text-[0.52rem] uppercase tracking-wider text-slate-muted mb-0.5">Income Cap (3×)</p>
              <p className="text-[0.85rem] text-gold-300 font-medium">{formatUSDT(previewCap)} USDT</p>
            </div>
          </div>
        )}
        <Button className="w-full" loading={isPending || isConfirming} onClick={handle}>
          {isPending ? 'Confirm in Wallet…' : isConfirming ? 'Subscribing…' : 'Subscribe'}
        </Button>
        <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} hash={hash} />
      </div>
    </Modal>
  )
}

// ── Active Plan Row ───────────────────────────────────────────────────────
function PlanRow({
  inv, index, address, plans,
}: {
  inv: PlanInvestment
  index: number
  address: Address
  plans: RewardPlan[]
}) {
  const plan: RewardPlan | undefined = plans[Number(inv.planId)]
  const { data: pending } = usePendingROI(address, index)
  const { claimROI, isPending, isConfirming, isSuccess, error, hash } = useClaimROI()

  useEffect(() => { if (isSuccess) toast.success('ROI claimed!') }, [isSuccess])
  useEffect(() => { if (error) toast.error(parseContractError(error)) }, [error])

  const canClaim = (pending ?? 0n) > 0n
  const progressPct = inv.maxIncomeCap > 0n
    ? Number((inv.totalClaimed * 100n) / (inv.totalClaimed + inv.maxIncomeCap))
    : 100

  if (!plan) return null

  return (
    <div className={`border border-[rgba(200,150,12,0.12)] p-4 ${!inv.active ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
        <div>
          <p className="text-[0.52rem] uppercase tracking-widest text-slate-muted mb-0.5">
            {VAULT_TIER_LABELS[Number(inv.planId)]}
          </p>
          <h4 className="font-serif text-xl text-white">{plan.name}</h4>
        </div>
        <Badge variant={inv.active ? 'green' : 'steel'} pulse={inv.active}>
          {inv.active ? 'Active' : 'Ended'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(200,150,12,0.12)] mb-4">
        {([
          ['Invested', `${formatUSDT(inv.investedAmount)} USDT`],
          ['Daily ROI', `${formatUSDT((inv.investedAmount * plan.dailyROI) / 10_000n)} USDT`],
          ['Total Claimed', `${formatUSDT(inv.totalClaimed)} USDT`],
          ['Cap Remaining', `${formatUSDT(inv.maxIncomeCap)} USDT`],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} className="bg-navy-850 px-3 py-2.5">
            <p className="text-[0.5rem] uppercase tracking-wider text-slate-muted mb-0.5">{k}</p>
            <p className="text-[0.75rem] text-ivory">{v}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[0.55rem] text-steel mb-1">
          <span>Cap consumed</span><span>{progressPct}%</span>
        </div>
        <div className="h-1 bg-navy-800 rounded-full overflow-hidden">
          <div className="h-full bg-gold-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {canClaim && (
          <div className="bg-gold-400/8 border border-gold-400/20 px-3 py-1.5 text-[0.65rem] text-gold-300">
            Pending: <strong>{formatUSDT(pending ?? 0n)} USDT</strong>
          </div>
        )}
        {inv.active && (
          <Button size="sm" loading={isPending || isConfirming} disabled={!canClaim}
            onClick={() => claimROI(BigInt(index))}>
            {isPending || isConfirming
              ? 'Claiming…'
              : canClaim
                ? 'Claim ROI'
                : `Next claim: ${countdownFrom(inv.lastClaimTimestamp, 86_400n)}`}
          </Button>
        )}
      </div>
      <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} hash={hash} />
    </div>
  )
}

// ── Withdraw Panel ────────────────────────────────────────────────────────
function WithdrawPanel({ balance, coolDown }: { balance: bigint; coolDown: bigint }) {
  const [amt, setAmt] = useState('')
  const { withdraw, isPending, isConfirming, isSuccess, error, hash } = useWithdraw()

  const now = BigInt(Math.floor(Date.now() / 1000))
  const cooldownActive = coolDown > 0n && now < coolDown + 86_400n

  useEffect(() => { if (isSuccess) { toast.success('Withdrawal confirmed!'); setAmt('') } }, [isSuccess])
  useEffect(() => { if (error) toast.error(parseContractError(error)) }, [error])

  const handle = () => {
    const wei = parseUSDT(amt)
    if (wei === 0n) { toast.error('Enter an amount'); return }
    if (wei > balance) { toast.error('Exceeds internal balance'); return }
    withdraw(wei)
  }

  return (
    <Card className="p-6">
      <h3 className="font-serif text-lg text-white mb-4">Withdraw USDT</h3>
      {cooldownActive && (
        <div className="bg-navy-800 border border-[rgba(200,150,12,0.12)] px-4 py-3 mb-4 text-[0.65rem] font-sans text-steel">
          ⏳ Cooldown active. Next withdrawal in{' '}
          <strong className="text-gold-300">{countdownFrom(coolDown, 86_400n)}</strong>
        </div>
      )}
      <div className="space-y-4">
        <div className="bg-navy-800 border border-[rgba(200,150,12,0.12)] px-4 py-2.5 text-[0.65rem] text-steel">
          Available Balance: <span className="text-ivory font-medium">{formatUSDT(balance)} USDT</span>
        </div>
        <Input label="Amount (USDT)" type="number" placeholder="0.00"
          value={amt} onChange={e => setAmt(e.target.value)} suffix="USDT" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAmt(formatUnits(balance, 18))}>Max</Button>
          <Button className="flex-1" loading={isPending || isConfirming}
            disabled={cooldownActive || balance === 0n} onClick={handle}>
            {isPending ? 'Confirm in Wallet…' : isConfirming ? 'Withdrawing…' : 'Withdraw'}
          </Button>
        </div>
        <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} hash={hash} />
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────────
//  MAIN PORTFOLIO PAGE
// ────────────────────────────────────────────────────────────────────────────
export function PortfolioPage() {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  const [depositOpen, setDepositOpen] = useState(false)
  const [subscribeOpen, setSubscribeOpen] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'plans' | 'withdraw' | 'referral'>('plans')

  const isRegistered = useIsRegistered(address)
  const { data: memberInfo } = useMemberInfo(address)
  const { data: memberPlans } = useMemberPlans(address)
  const { data: rewardPlans } = useRewardPlans()

  // Destructure the typed MemberInfoTuple
  const [parent, balance, incomeCap, totalIncome, coolDown, planCounts] =
    (memberInfo as MemberInfoTuple | undefined) ?? []

  // ── Not connected ──────────────────────────────────────────────────────
  if (!isConnected || !address) {
    return (
      <div className="relative z-10 min-h-[70vh] flex flex-col items-center justify-center text-center px-5">
        <div className="text-5xl mb-6">🔐</div>
        <h1 className="font-serif text-3xl text-white mb-3">Connect Your Wallet</h1>
        <p className="font-sans text-steel text-[0.83rem] font-light mb-8 max-w-sm">
          Connect a BSC-compatible wallet to access your BlackVanta portfolio.
        </p>
        <Button size="lg" onClick={() => open()}>Connect Wallet</Button>
      </div>
    )
  }

  // ── Not registered ────────────────────────────────────────────────────
  if (!isRegistered) {
    return (
      <div className="relative z-10 max-w-7xl mx-auto px-5 py-12">
        <SectionTitle eyebrow="Portfolio" title={<>Welcome to <em className="text-gold-300">BlackVanta</em></>} />
        <RegisterPanel address={address} />
      </div>
    )
  }

  const plans = rewardPlans ?? []
  const allPlans = memberPlans ?? []
  const activePlans = allPlans.filter(p => p.active)
  const inactivePlans = allPlans.filter(p => !p.active)

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-5 py-10">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[0.58rem] uppercase tracking-[0.22em] text-gold-500">Portfolio</span>
            <div className="h-px w-12 bg-gold-600" />
          </div>
          <h1 className="font-serif text-3xl font-normal text-white">
            My <em className="text-gold-300">Portfolio</em>
          </h1>
          <p className="text-[0.6rem] font-mono text-steel mt-1">{address}</p>
        </div>
        <Button onClick={() => setDepositOpen(true)} size="lg">+ Deposit USDT</Button>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-[rgba(200,150,12,0.12)] mb-8">
        <StatCard label="Internal Balance"
          value={balance !== undefined ? formatUSDT(balance) : '—'}
          sub="USDT · withdrawable" highlight />
        <StatCard label="Income Cap Left"
          value={incomeCap !== undefined ? formatUSDT(incomeCap) : '—'}
          sub="Max remaining earnings" />
        <StatCard label="Total Earned"
          value={totalIncome !== undefined ? formatUSDT(totalIncome) : '—'}
          sub="Lifetime USDT" />
        <StatCard label="Active Plans"
          value={String(activePlans.length)}
          sub={`of ${planCounts !== undefined ? String(planCounts) : '—'} total`} />
        <StatCard label="Referrer"
          value={parent ? shortAddr(parent) : '—'}
          sub="Your parent address" />
      </div>

      {/* ── Tab nav ──────────────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-[rgba(200,150,12,0.12)] mb-8">
        {([['plans', 'My Plans'], ['withdraw', 'Withdraw'], ['referral', 'Referral']] as const).map(
          ([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-[0.62rem] uppercase tracking-widest font-mono transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-gold-300 border-gold-400'
                  : 'text-steel border-transparent hover:text-ivory'
              }`}>
              {label}
            </button>
          ),
        )}
      </div>

      {/* ── PLANS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          {/* Vault subscription options */}
          <div>
            <SectionTitle eyebrow="Available Vaults"
              title={<>Subscribe to a <em className="text-gold-300">Vault</em></>}
              description="Allocate from your internal balance to start earning daily ROI." />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-[rgba(200,150,12,0.12)] border border-[rgba(200,150,12,0.12)]">
              {plans.map((plan: RewardPlan, i: number) => (
                <div key={i} className="bg-navy-900 hover:bg-navy-850 transition-colors p-5">
                  <p className="text-[0.52rem] uppercase tracking-widest text-slate-muted mb-1">
                    {VAULT_TIER_LABELS[i]}
                  </p>
                  <h3 className="font-serif text-xl text-white mb-1">{plan.name}</h3>
                  <p className="font-serif text-3xl text-gold-300 mb-0.5">{formatROI(plan.dailyROI)}</p>
                  <p className="text-[0.55rem] text-slate-muted mb-4">
                    per day · {String(plan.durationDays)} days
                  </p>
                  <Divider className="mb-4" />
                  {([
                    ['Min', `${formatUSDT(plan.minInvestment)} USDT`],
                    ['Max', plan.maxInvestment === 0n ? 'Unlimited' : `${formatUSDT(plan.maxInvestment)} USDT`],
                    ['Cap', '3× invested'],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between mb-2">
                      <span className="text-[0.55rem] uppercase text-slate-muted">{k}</span>
                      <span className="text-[0.72rem] text-ivory">{v}</span>
                    </div>
                  ))}
                  <Button className="w-full mt-4" size="sm"
                    disabled={!plan.active || balance === undefined || balance === 0n}
                    onClick={() => setSubscribeOpen(i)}>
                    {!plan.active ? 'Unavailable' : balance === 0n ? 'Deposit First' : 'Subscribe'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Active subscriptions */}
          <div>
            <SectionTitle eyebrow="Active Subscriptions"
              title={<>Your <em className="text-gold-300">Active Plans</em></>} />
            {activePlans.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="font-sans text-steel text-[0.78rem]">No active plan subscriptions yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {allPlans.map((inv: PlanInvestment, i: number) =>
                  inv.active ? (
                    <PlanRow key={i} inv={inv} index={i} address={address} plans={plans} />
                  ) : null,
                )}
              </div>
            )}
          </div>

          {/* Inactive subscriptions */}
          {inactivePlans.length > 0 && (
            <div>
              <SectionTitle eyebrow="Completed" title="Inactive Plans" />
              <div className="space-y-3 opacity-60">
                {allPlans.map((inv: PlanInvestment, i: number) =>
                  !inv.active ? (
                    <PlanRow key={i} inv={inv} index={i} address={address} plans={plans} />
                  ) : null,
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WITHDRAW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'withdraw' && (
        <div className="max-w-lg">
          <SectionTitle eyebrow="Withdraw"
            title={<>Transfer to <em className="text-gold-300">Wallet</em></>}
            description="Move USDT from your internal BlackVanta balance to your wallet. Subject to the 24-hour withdrawal cooldown." />
          <div className="bg-navy-900 border border-[rgba(200,150,12,0.12)] p-4 mb-6 text-[0.68rem] font-sans text-steel leading-relaxed">
            <strong className="text-ivory">Cooldown rule:</strong> After each withdrawal,{' '}
            <code className="text-gold-300 mx-1 bg-gold-400/10 px-1">member.coolDown = block.timestamp</code>{' '}
            is set. Next withdrawal allowed after <strong className="text-ivory">86,400 seconds</strong>.
          </div>
          <WithdrawPanel balance={balance ?? 0n} coolDown={coolDown ?? 0n} />
        </div>
      )}

      {/* ── REFERRAL TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'referral' && (
        <div className="max-w-2xl">
          <SectionTitle eyebrow="Referral"
            title={<>Your <em className="text-gold-300">Referral Link</em></>}
            description="Share your wallet address as a referrer. When they subscribe to any vault, you earn 20% commission — instantly, on-chain." />
          <div className="space-y-4">
            <Card className="p-6">
              <p className="text-[0.58rem] uppercase tracking-widest text-gold-500 mb-3">Your Referral Address</p>
              <div className="bg-navy-800 border border-[rgba(200,150,12,0.22)] px-4 py-3 font-mono text-[0.75rem] text-ivory break-all mb-3">
                {address}
              </div>
              <button
                onClick={() => { void navigator.clipboard.writeText(address); toast.success('Copied!') }}
                className="text-[0.6rem] uppercase tracking-widest text-gold-400 hover:text-gold-300 transition-colors border border-[rgba(200,150,12,0.22)] px-3 py-1.5"
              >
                Copy Address
              </button>
            </Card>

            <Card className="p-6">
              <p className="text-[0.58rem] uppercase tracking-widest text-gold-500 mb-3">Referral Mechanics</p>
              <div className="space-y-2">
                {([
                  ['Commission rate', '20% (REFERRAL_RATE = 2,000 bp)'],
                  ['When paid', 'Atomically inside subscribe() — same transaction'],
                  ['Your parent', parent ? shortAddr(parent) : '—'],
                  ['Commission source', "Subscriber's investment amount"],
                  ['Cap interaction', 'Deducted from your income cap. Stops if cap = 0.'],
                  ['Levels', 'Single-level only. No upline propagation.'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2 border-b border-[rgba(200,150,12,0.08)] last:border-0">
                    <span className="text-[0.62rem] uppercase tracking-wider text-slate-muted shrink-0">{k}</span>
                    <span className="text-[0.68rem] text-ivory text-right">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="bg-gold-400/5 border border-[rgba(200,150,12,0.22)] p-4 text-[0.7rem] font-sans text-ivory leading-relaxed">
              <strong className="text-gold-300">Formula:</strong>{' '}
              <code className="text-gold-400">commission = subscriptionAmount × 2,000 / 10,000</code>
              {' → '}
              <code className="text-gold-400">payable = min(commission, yourIncomeCap)</code>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} address={address} />

      {subscribeOpen !== null && plans[subscribeOpen] !== undefined && (
        <SubscribeModal
          open
          onClose={() => setSubscribeOpen(null)}
          planId={subscribeOpen}
          plan={plans[subscribeOpen]}
          internalBalance={balance ?? 0n}
        />
      )}
    </div>
  )
}
