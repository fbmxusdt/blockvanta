import type { Address } from 'viem'

// ── RewardPlan — mirrors BlackVanta.sol struct RewardPlan ─────────────────
export interface RewardPlan {
  name: string
  dailyROI: bigint
  durationDays: bigint
  minInvestment: bigint
  maxInvestment: bigint
  active: boolean
}

// ── PlanInvestment — mirrors BlackVanta.sol struct PlanInvestment ─────────
export interface PlanInvestment {
  planId: bigint
  investedAmount: bigint
  maxIncomeCap: bigint
  totalClaimed: bigint
  lastClaimTimestamp: bigint
  startTimestamp: bigint
  active: boolean
}

// ── getMemberInfo() return tuple ──────────────────────────────────────────
export type MemberInfoTuple = readonly [
  parent: Address,
  balance: bigint,
  incomeCap: bigint,
  totalIncome: bigint,
  coolDown: bigint,
  planCounts: bigint,
]
