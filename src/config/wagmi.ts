import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { bsc, bscTestnet, hardhat } from 'wagmi/chains'
import type { Chain } from 'wagmi/chains'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Wallet connections will be limited.')
}

const metadata = {
  name: 'BlackVanta',
  description: 'Non-custodial DeFi vault protocol on BNB Smart Chain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://blackvanta.io',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
}

// ── Chain selection via VITE_CHAIN_ID env var ─────────────────────────────
//   31337 → Hardhat local node  (RPC: http://127.0.0.1:8545)
//   97    → BSC Testnet
//   56    → BSC Mainnet (default)
const chainId = Number(import.meta.env.VITE_CHAIN_ID ?? 56)

function resolveChains(): readonly [Chain, ...Chain[]] {
  switch (chainId) {
    case 31337: return [hardhat]
    case 97:    return [bscTestnet]
    default:    return [bsc]
  }
}

export const supportedChains = resolveChains()

export const wagmiConfig = defaultWagmiConfig({
  chains: supportedChains as readonly [Chain, ...Chain[]],
  projectId: projectId || 'demo-project-id',
  metadata,
  ssr: false,
})

export { projectId }

// ── Network metadata helpers ──────────────────────────────────────────────
export const NETWORK_LABEL = (() => {
  switch (chainId) {
    case 31337: return 'Hardhat Local'
    case 97:    return 'BSC Testnet'
    default:    return 'BNB Smart Chain'
  }
})()

export const IS_LOCAL = chainId === 31337

export const EXPLORER_URL = (() => {
  switch (chainId) {
    case 97:    return 'https://testnet.bscscan.com'
    case 31337: return ''   // No block explorer for local Hardhat
    default:    return 'https://bscscan.com'
  }
})()
