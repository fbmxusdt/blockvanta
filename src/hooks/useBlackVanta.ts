import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi'
import type { Address } from 'viem'
import {
  BlackVantaABI,
  CONTRACT_ADDRESS,
  ERC20_ABI,
  USDT_ADDRESS,
} from '../config/contracts'
import type { RewardPlan, PlanInvestment, MemberInfoTuple } from '../types/contracts'

// ─────────────────────────────────────────────────────────────────────────────
//  READ HOOKS — all return data with explicit types, never `unknown`
// ─────────────────────────────────────────────────────────────────────────────

export function useOwner() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BlackVantaABI,
    functionName: 'owner',
  }) as { data: Address | undefined; isLoading: boolean; error: Error | null }
}

export function usePaused() {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BlackVantaABI,
    functionName: 'paused',
    query: { refetchInterval: 15_000 },
  })
  return { ...result, data: result.data as boolean | undefined }
}

export function useRewardPlans() {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BlackVantaABI,
    functionName: 'getRewardPlans',
    query: { staleTime: 60_000 },
  })
  return { ...result, data: result.data as RewardPlan[] | undefined }
}

export function useMemberInfo(address?: Address) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BlackVantaABI,
    functionName: 'getMemberInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 20_000,
    },
  })
  return { ...result, data: result.data as MemberInfoTuple | undefined }
}

export function useMemberPlans(address?: Address) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BlackVantaABI,
    functionName: 'getMemberPlans',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 20_000,
    },
  })
  return { ...result, data: result.data as PlanInvestment[] | undefined }
}

export function usePendingROI(address?: Address, planIndex?: number) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BlackVantaABI,
    functionName: 'getPendingROI',
    args:
      address !== undefined && planIndex !== undefined
        ? [address, BigInt(planIndex)]
        : undefined,
    query: {
      enabled: !!address && planIndex !== undefined,
      refetchInterval: 30_000,
    },
  })
  return { ...result, data: result.data as bigint | undefined }
}

export function useUSDTBalance(address?: Address) {
  const result = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  })
  return { ...result, data: result.data as bigint | undefined }
}

export function useUSDTAllowance(owner?: Address) {
  const result = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner ? [owner, CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!owner,
      refetchInterval: 10_000,
    },
  })
  return { ...result, data: result.data as bigint | undefined }
}

// ─────────────────────────────────────────────────────────────────────────────
//  WRITE HOOKS — each returns { write, isPending, isConfirming, isSuccess, hash, error }
// ─────────────────────────────────────────────────────────────────────────────

function useTx() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  return { writeContract, hash, isPending, isConfirming, isSuccess, error, reset }
}

// ── Register ──────────────────────────────────────────────────────────────
export function useRegister() {
  const tx = useTx()
  const register = (parent: Address) =>
    tx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: BlackVantaABI,
      functionName: 'register',
      args: [parent],
    })
  return { ...tx, register }
}

// ── Approve USDT ──────────────────────────────────────────────────────────
export function useApproveUSDT() {
  const tx = useTx()
  const approve = (amount: bigint) =>
    tx.writeContract({
      address: USDT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, amount],
    })
  return { ...tx, approve }
}

// ── Deposit ───────────────────────────────────────────────────────────────
export function useDeposit() {
  const tx = useTx()
  const deposit = (amount: bigint) =>
    tx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: BlackVantaABI,
      functionName: 'deposit',
      args: [amount],
    })
  return { ...tx, deposit }
}

// ── Subscribe ─────────────────────────────────────────────────────────────
export function useSubscribe() {
  const tx = useTx()
  const subscribe = (planId: bigint, amount: bigint) =>
    tx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: BlackVantaABI,
      functionName: 'subscribe',
      args: [planId, amount],
    })
  return { ...tx, subscribe }
}

// ── Claim ROI ─────────────────────────────────────────────────────────────
export function useClaimROI() {
  const tx = useTx()
  const claimROI = (planIndex: bigint) =>
    tx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: BlackVantaABI,
      functionName: 'claimROI',
      args: [planIndex],
    })
  return { ...tx, claimROI }
}

// ── Withdraw ──────────────────────────────────────────────────────────────
export function useWithdraw() {
  const tx = useTx()
  const withdraw = (amount: bigint) =>
    tx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: BlackVantaABI,
      functionName: 'withdraw',
      args: [amount],
    })
  return { ...tx, withdraw }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN WRITE HOOKS (onlyOwner)
// ─────────────────────────────────────────────────────────────────────────────

export function usePause() {
  const tx = useTx()
  const pause = () =>
    tx.writeContract({ address: CONTRACT_ADDRESS, abi: BlackVantaABI, functionName: 'pause' })
  return { ...tx, pause }
}

export function useUnpause() {
  const tx = useTx()
  const unpause = () =>
    tx.writeContract({ address: CONTRACT_ADDRESS, abi: BlackVantaABI, functionName: 'unpause' })
  return { ...tx, unpause }
}

export function useAddPlan() {
  const tx = useTx()
  const addPlan = (
    name: string,
    dailyROI: bigint,
    durationDays: bigint,
    minInvestment: bigint,
    maxInvestment: bigint,
  ) =>
    tx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: BlackVantaABI,
      functionName: 'addPlan',
      args: [name, dailyROI, durationDays, minInvestment, maxInvestment],
    })
  return { ...tx, addPlan }
}

export function useUpdatePlan() {
  const tx = useTx()
  const updatePlan = (
    planId: bigint,
    name: string,
    dailyROI: bigint,
    durationDays: bigint,
    minInvestment: bigint,
    maxInvestment: bigint,
    active: boolean,
  ) =>
    tx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: BlackVantaABI,
      functionName: 'updatePlan',
      args: [planId, name, dailyROI, durationDays, minInvestment, maxInvestment, active],
    })
  return { ...tx, updatePlan }
}

export function useAdminUpdateMember() {
  const tx = useTx()
  const adminUpdateMember = (
    member: Address,
    balance: bigint,
    incomeCap: bigint,
    totalIncome: bigint,
    coolDown: bigint,
  ) =>
    tx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: BlackVantaABI,
      functionName: 'adminUpdateMember',
      args: [member, balance, incomeCap, totalIncome, coolDown],
    })
  return { ...tx, adminUpdateMember }
}

export function useEmergencyWithdraw() {
  const tx = useTx()
  const emergencyWithdraw = (to: Address) =>
    tx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: BlackVantaABI,
      functionName: 'emergencyWithdraw',
      args: [to],
    })
  return { ...tx, emergencyWithdraw }
}

// ── Derived helpers ────────────────────────────────────────────────────────

/** Returns true if the connected wallet is the contract owner. */
export function useIsOwner() {
  const { address } = useAccount()
  const { data: owner } = useOwner()
  return {
    isOwner: !!address && !!owner && address.toLowerCase() === owner.toLowerCase(),
    owner: owner as Address | undefined,
  }
}

/** Returns true if the given address is registered (parent != address(0)). */
export function useIsRegistered(address?: Address) {
  const { data } = useMemberInfo(address)
  if (!data) return false
  const [parent] = data
  return parent !== '0x0000000000000000000000000000000000000000'
}
