import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import toast from 'react-hot-toast'
import type { Address } from 'viem'
import {
  useIsOwner,
  usePaused,
  useRewardPlans,
  useMemberInfo,
  useUSDTBalance,
  usePause,
  useUnpause,
  useAddPlan,
  useUpdatePlan,
  useAdminUpdateMember,
  useEmergencyWithdraw,
} from '../../hooks/useBlackVanta'
import {
  formatUSDT,
  parseUSDT,
  parseContractError,
} from '../../lib/utils'
import { CONTRACT_ADDRESS } from '../../config/contracts'
import type { RewardPlan, MemberInfoTuple } from '../../types/contracts'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, Badge, Divider, TxStatus } from '../ui/Card'

// ── Section wrapper ─────────────────────────────────────────────────────────
function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h3 className="font-serif text-xl font-normal text-white mb-5 pb-4 border-b border-[rgba(200,150,12,0.12)]">
        {title}
      </h3>
      {children}
    </Card>
  )
}

// ── Pause / Unpause ──────────────────────────────────────────────────────────
function PauseControl() {
  const { data: paused, refetch } = usePaused()
  const { pause, isPending: pp, isConfirming: pc, isSuccess: ps, error: pe } = usePause()
  const { unpause, isPending: up, isConfirming: uc, isSuccess: us, error: ue } = useUnpause()

  useEffect(() => { if (ps) { toast.success('Contract paused'); void refetch() } }, [ps, refetch])
  useEffect(() => { if (us) { toast.success('Contract unpaused'); void refetch() } }, [us, refetch])
  useEffect(() => { if (pe) toast.error(parseContractError(pe)) }, [pe])
  useEffect(() => { if (ue) toast.error(parseContractError(ue)) }, [ue])

  const isPaused = paused === true

  return (
    <AdminSection title="⚡ Contract State">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-[0.56rem] uppercase tracking-widest text-slate-muted mb-2">Current Status</p>
          <Badge variant={isPaused ? 'red' : 'green'} pulse>
            {isPaused ? 'PAUSED — all user functions frozen' : 'ACTIVE — protocol running normally'}
          </Badge>
        </div>
        <div className="flex gap-3">
          {isPaused ? (
            <Button onClick={() => unpause()} loading={up || uc} variant="gold">
              Unpause Contract
            </Button>
          ) : (
            <Button onClick={() => pause()} loading={pp || pc} variant="danger">
              Pause Contract
            </Button>
          )}
        </div>
      </div>
      <TxStatus isPending={pp || up} isConfirming={pc || uc} isSuccess={ps || us} />
      <p className="mt-4 text-[0.65rem] font-sans text-steel leading-relaxed">
        Pausing freezes all <code className="text-gold-300 bg-gold-400/8 px-1">whenNotPaused</code> functions:
        deposit, subscribe, claimROI, withdraw, register. Admin functions remain accessible.
      </p>
    </AdminSection>
  )
}

// ── Add Plan ─────────────────────────────────────────────────────────────────
function AddPlanPanel() {
  const [form, setForm] = useState({
    name: '', dailyROI: '', durationDays: '', minInvestment: '', maxInvestment: '',
  })
  const { addPlan, isPending, isConfirming, isSuccess, error, hash } = useAddPlan()

  useEffect(() => {
    if (isSuccess) {
      toast.success('Plan added!')
      setForm({ name: '', dailyROI: '', durationDays: '', minInvestment: '', maxInvestment: '' })
    }
  }, [isSuccess])
  useEffect(() => { if (error) toast.error(parseContractError(error)) }, [error])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handle = () => {
    if (!form.name || !form.dailyROI || !form.durationDays) {
      toast.error('Fill in all required fields'); return
    }
    addPlan(
      form.name,
      BigInt(form.dailyROI),
      BigInt(form.durationDays),
      parseUSDT(form.minInvestment || '0'),
      parseUSDT(form.maxInvestment || '0'),
    )
  }

  const previewCap = form.dailyROI && form.durationDays
    ? (Number(form.dailyROI) * Number(form.durationDays)) / 10000
    : null

  return (
    <AdminSection title="➕ Add New Vault Plan">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input label="Plan Name *" placeholder="Vault E" value={form.name} onChange={set('name')} />
        <Input label="Daily ROI (basis points) *" placeholder="150 = 1.5%/day" type="number" value={form.dailyROI} onChange={set('dailyROI')} />
        <Input label="Duration (days) *" placeholder="200" type="number" value={form.durationDays} onChange={set('durationDays')} />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input label="Min Investment (USDT)" placeholder="10" type="number" value={form.minInvestment} onChange={set('minInvestment')} />
          </div>
        </div>
        <Input label="Max Investment (USDT, 0 = unlimited)" placeholder="0" type="number" value={form.maxInvestment} onChange={set('maxInvestment')} />
        {previewCap !== null && (
          <div className="bg-gold-400/5 border border-[rgba(200,150,12,0.2)] px-4 py-3 flex items-center">
            <div>
              <p className="text-[0.52rem] uppercase tracking-wider text-slate-muted mb-1">Computed income cap multiplier</p>
              <p className="text-xl font-serif text-gold-300">{previewCap.toFixed(2)}× principal</p>
              <p className="text-[0.58rem] text-steel">{form.dailyROI} bp × {form.durationDays} days / 10,000</p>
            </div>
          </div>
        )}
      </div>
      <Button loading={isPending || isConfirming} onClick={handle}>Add Plan</Button>
      <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} hash={hash} />
    </AdminSection>
  )
}

// ── Update Plan ───────────────────────────────────────────────────────────────
function UpdatePlanPanel() {
  const { data: plans } = useRewardPlans()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', dailyROI: '', durationDays: '', minInvestment: '', maxInvestment: '', active: true,
  })
  const { updatePlan, isPending, isConfirming, isSuccess, error, hash } = useUpdatePlan()

  // Pre-fill form when a plan is selected
  useEffect(() => {
    if (selectedId === null || !plans) return
    const p: RewardPlan | undefined = plans[selectedId]
    if (!p) return
    setForm({
      name: p.name,
      dailyROI: String(p.dailyROI),
      durationDays: String(p.durationDays),
      minInvestment: formatUSDT(p.minInvestment, 0),
      maxInvestment: p.maxInvestment === 0n ? '0' : formatUSDT(p.maxInvestment, 0),
      active: p.active,
    })
  }, [selectedId, plans])

  useEffect(() => { if (isSuccess) toast.success('Plan updated!') }, [isSuccess])
  useEffect(() => { if (error) toast.error(parseContractError(error)) }, [error])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handle = () => {
    if (selectedId === null) { toast.error('Select a plan'); return }
    updatePlan(
      BigInt(selectedId),
      form.name,
      BigInt(form.dailyROI),
      BigInt(form.durationDays),
      parseUSDT(form.minInvestment || '0'),
      parseUSDT(form.maxInvestment || '0'),
      form.active,
    )
  }

  return (
    <AdminSection title="✏️ Update Existing Plan">
      <div className="mb-5">
        <p className="text-[0.56rem] uppercase tracking-widest text-slate-muted mb-2">Select Plan</p>
        <div className="flex flex-wrap gap-2">
          {(plans ?? []).map((p: RewardPlan, i: number) => (
            <button
              key={i}
              onClick={() => setSelectedId(i)}
              className={`px-4 py-2 text-[0.65rem] font-mono border transition-colors ${
                selectedId === i
                  ? 'bg-gold-400 text-navy-950 border-gold-400'
                  : 'border-[rgba(200,150,12,0.2)] text-steel hover:text-ivory hover:border-gold-400/40'
              }`}
            >
              {p.name} {!p.active && '(inactive)'}
            </button>
          ))}
        </div>
      </div>

      {selectedId !== null && (
        <>
          <Divider className="mb-5" />
          <div className="bg-gold-400/5 border border-[rgba(200,150,12,0.15)] px-4 py-2.5 mb-5 text-[0.65rem] font-sans text-steel">
            ⚠ <strong className="text-ivory">Warning:</strong> Changing{' '}
            <code className="text-gold-300">dailyROI</code> retroactively affects pending ROI on
            existing active subscriptions, as <code className="text-gold-300">claimROI()</code> reads
            the live plan value.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input label="Plan Name" value={form.name} onChange={set('name')} />
            <Input label="Daily ROI (bp)" type="number" value={form.dailyROI} onChange={set('dailyROI')} />
            <Input label="Duration (days)" type="number" value={form.durationDays} onChange={set('durationDays')} />
            <Input label="Min Investment (USDT)" type="number" value={form.minInvestment} onChange={set('minInvestment')} />
            <Input label="Max Investment (USDT, 0 = unlimited)" type="number" value={form.maxInvestment} onChange={set('maxInvestment')} />
            <div className="flex items-center gap-3">
              <label className="text-[0.56rem] uppercase tracking-widest text-slate-muted">Active</label>
              <button
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.active ? 'bg-gold-400' : 'bg-navy-700'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.active ? 'left-7' : 'left-1'}`} />
              </button>
              <span className="text-[0.6rem] text-steel">
                {form.active ? 'Accepting new subscriptions' : 'No new subscriptions'}
              </span>
            </div>
          </div>
          <Button loading={isPending || isConfirming} onClick={handle}>Update Plan</Button>
          <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} hash={hash} />
        </>
      )}
    </AdminSection>
  )
}

// ── Member Lookup + Override ─────────────────────────────────────────────────
function MemberAdmin() {
  const [lookup, setLookup] = useState('')
  const [memberAddr, setMemberAddr] = useState<Address | undefined>()
  const { data: info } = useMemberInfo(memberAddr)
  const [form, setForm] = useState({ balance: '', incomeCap: '', totalIncome: '', coolDown: '' })
  const { adminUpdateMember, isPending, isConfirming, isSuccess, error, hash } = useAdminUpdateMember()

  // info is MemberInfoTuple | undefined — destructure safely
  const memberData = info as MemberInfoTuple | undefined
  const [parent, balance, incomeCap, totalIncome, coolDown] = memberData ?? []

  useEffect(() => {
    if (balance === undefined) return
    setForm({
      balance: formatUSDT(balance, 4),
      incomeCap: formatUSDT(incomeCap ?? 0n, 4),
      totalIncome: formatUSDT(totalIncome ?? 0n, 4),
      coolDown: String(coolDown ?? 0n),
    })
  }, [balance, incomeCap, totalIncome, coolDown])

  useEffect(() => { if (isSuccess) toast.success('Member updated!') }, [isSuccess])
  useEffect(() => { if (error) toast.error(parseContractError(error)) }, [error])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handle = () => {
    if (!memberAddr) { toast.error('Look up a member first'); return }
    adminUpdateMember(
      memberAddr,
      parseUSDT(form.balance),
      parseUSDT(form.incomeCap),
      parseUSDT(form.totalIncome),
      BigInt(form.coolDown || '0'),
    )
  }

  const hasData = memberAddr !== undefined && memberData !== undefined

  return (
    <AdminSection title="👤 Member Override">
      <p className="text-[0.65rem] font-sans text-steel leading-relaxed mb-5">
        Read any member&apos;s on-chain state and override their fields.
        <strong className="text-ivory"> Note:</strong> The{' '}
        <code className="text-gold-300">parent</code> field cannot be modified — enforced by the contract.
      </p>
      <div className="flex gap-3 mb-6">
        <input
          className="flex-1 bg-navy-800 border border-[rgba(200,150,12,0.2)] text-ivory font-mono text-[0.73rem] px-3 py-2.5 outline-none focus:border-gold-400/50 transition-colors"
          placeholder="0x... member address"
          value={lookup}
          onChange={e => setLookup(e.target.value)}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (lookup.startsWith('0x') && lookup.length === 42) {
              setMemberAddr(lookup as Address)
            } else {
              toast.error('Invalid address')
            }
          }}
        >
          Look Up
        </Button>
      </div>

      {hasData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[rgba(200,150,12,0.12)] mb-5">
            {([
              ['Parent', parent ? `${parent.slice(0, 10)}…` : '—'],
              ['Balance', balance !== undefined ? `${formatUSDT(balance)} USDT` : '—'],
              ['Income Cap', incomeCap !== undefined ? `${formatUSDT(incomeCap)} USDT` : '—'],
              ['Total Income', totalIncome !== undefined ? `${formatUSDT(totalIncome)} USDT` : '—'],
              ['Cooldown TS', String(coolDown ?? '—')],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="bg-navy-850 px-3 py-2.5">
                <p className="text-[0.5rem] uppercase tracking-wider text-slate-muted mb-0.5">{k}</p>
                <p className="text-[0.72rem] text-ivory font-mono">{v}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="Balance (USDT)" type="number" value={form.balance} onChange={set('balance')} />
            <Input label="Income Cap (USDT)" type="number" value={form.incomeCap} onChange={set('incomeCap')} />
            <Input label="Total Income (USDT)" type="number" value={form.totalIncome} onChange={set('totalIncome')} />
            <Input label="Cool Down (Unix timestamp)" type="number" value={form.coolDown} onChange={set('coolDown')} />
          </div>
          <Button loading={isPending || isConfirming} onClick={handle}>Save Changes</Button>
          <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} hash={hash} />
        </>
      )}
    </AdminSection>
  )
}

// ── Emergency Withdraw ────────────────────────────────────────────────────────
function EmergencyPanel() {
  const [to, setTo] = useState('')
  const [confirm, setConfirm] = useState(false)
  const { data: contractBal } = useUSDTBalance(CONTRACT_ADDRESS)
  const { emergencyWithdraw, isPending, isConfirming, isSuccess, error, hash } = useEmergencyWithdraw()

  useEffect(() => { if (isSuccess) toast.success('Emergency withdrawal executed!') }, [isSuccess])
  useEffect(() => { if (error) toast.error(parseContractError(error)) }, [error])

  const handle = () => {
    if (!confirm) { toast.error('Check the confirmation box first'); return }
    if (!to.startsWith('0x') || to.length !== 42) { toast.error('Invalid address'); return }
    emergencyWithdraw(to as Address)
  }

  return (
    <AdminSection title="🚨 Emergency Withdraw">
      <div className="bg-danger/10 border border-danger/30 px-4 py-3 mb-5 text-[0.68rem] font-sans text-ivory leading-relaxed">
        <strong className="text-danger">CRITICAL OPERATION.</strong> This drains the entire contract
        USDT balance to the specified address. Only use during a security incident. Pair with{' '}
        <code className="text-gold-300">pause()</code> first.
      </div>
      <div className="mb-3">
        <p className="text-[0.56rem] uppercase tracking-widest text-slate-muted mb-1">Contract USDT Balance</p>
        <p className="font-serif text-2xl text-danger">
          {contractBal !== undefined ? formatUSDT(contractBal) : '—'} USDT
        </p>
      </div>
      <div className="space-y-4">
        <Input
          label="Recipient Address"
          placeholder="0x... safe wallet"
          value={to}
          onChange={e => setTo(e.target.value)}
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} className="accent-danger" />
          <span className="text-[0.65rem] font-sans text-steel">I understand this drains all contract funds immediately.</span>
        </label>
        <Button
          variant="danger"
          loading={isPending || isConfirming}
          disabled={!confirm}
          onClick={handle}
        >
          Execute Emergency Withdraw
        </Button>
        <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} hash={hash} />
      </div>
    </AdminSection>
  )
}

// ── Main Admin Page ──────────────────────────────────────────────────────────
export function AdminPage() {
  const { isConnected } = useAccount()
  const { isOwner } = useIsOwner()

  if (!isConnected) {
    return (
      <div className="relative z-10 min-h-[60vh] flex flex-col items-center justify-center text-center px-5">
        <div className="text-5xl mb-6">🔐</div>
        <h1 className="font-serif text-3xl text-white mb-3">Connect Your Wallet</h1>
        <p className="font-sans text-steel text-[0.83rem] font-light">Connect to access admin controls.</p>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="relative z-10 min-h-[60vh] flex flex-col items-center justify-center text-center px-5">
        <div className="text-5xl mb-6">⛔</div>
        <h1 className="font-serif text-3xl text-white mb-3">Access Restricted</h1>
        <p className="font-sans text-steel text-[0.83rem] font-light max-w-sm">
          This page is only accessible by the contract owner address.
          Your connected wallet does not match the owner.
        </p>
      </div>
    )
  }

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-5 py-10">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[0.58rem] uppercase tracking-[0.22em] text-gold-500">Owner Access</span>
          <div className="h-px w-12 bg-gold-600" />
        </div>
        <h1 className="font-serif text-3xl font-normal text-white mb-2">
          Admin <em className="text-gold-300">Control Panel</em>
        </h1>
        <p className="font-sans text-[0.78rem] text-steel font-light">
          All functions below are{' '}
          <code className="text-gold-300 bg-gold-400/8 px-1 text-[0.8em]">onlyOwner</code> — enforced
          by the smart contract. Each action requires a wallet signature and on-chain confirmation.
        </p>
      </div>

      <div className="space-y-6">
        <PauseControl />
        <AddPlanPanel />
        <UpdatePlanPanel />
        <MemberAdmin />
        <EmergencyPanel />
      </div>
    </div>
  )
}
