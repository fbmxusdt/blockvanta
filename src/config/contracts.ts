import type { Address } from 'viem'
import BlackVantaABIJson from '../abi/BlackVanta.json'

// ── Contract address — set via .env ────────────────────────────────────────
export const CONTRACT_ADDRESS = (
  import.meta.env.VITE_CONTRACT_ADDRESS ?? '0x0000000000000000000000000000000000000000'
) as Address

// ── USDT BEP20 on BSC ──────────────────────────────────────────────────────
export const USDT_ADDRESS = (
  import.meta.env.VITE_USDT_ADDRESS ?? '0x55d398326f99059fF775485246999027B3197955'
) as Address

// ── ABI — typed as const for Wagmi v2 inference ────────────────────────────
export const BlackVantaABI = BlackVantaABIJson as typeof BlackVantaABIJson

// ── Minimal ERC20 ABI for approve + allowance ──────────────────────────────
export const ERC20_ABI = [
  {
    type: 'function', name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const

// ── On-chain constant mirrors ──────────────────────────────────────────────
export const BASIS_POINTS = 10_000n
export const REFERRAL_RATE = 2_000n       // 20%
export const SECONDS_PER_DAY = 86_400n
export const WITHDRAW_COOLDOWN = 86_400n

// ── Vault tier metadata (mirrors _initializePlans) ─────────────────────────
export const VAULT_ACCENTS = [
  'from-[#7A9E7A]',
  'from-[#7A99BE]',
  'from-gold-400',
  'from-[#C87A30]',
]

export const VAULT_TIER_LABELS = [
  'Tier I · Entry',
  'Tier II · Growth',
  'Tier III · Premium',
  'Tier IV · Institutional',
]
