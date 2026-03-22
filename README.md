# BlackVanta — DeFi Frontend

React 19 + Vite + TailwindCSS + Wagmi v2 frontend for the BlackVanta smart contract on BNB Smart Chain.

## Stack

| Layer | Package |
|---|---|
| Framework | React 19 + Vite 6 |
| Styling | TailwindCSS v3 |
| Web3 Core | Wagmi v2 + Viem |
| Wallet Modal | Web3Modal (WalletConnect AppKit) |
| Data Caching | TanStack Query v5 |
| Routing | React Router v7 |
| Notifications | react-hot-toast |

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — full protocol explainer with live vault calculators |
| `/portfolio` | User dashboard — register, deposit, subscribe, claim ROI, withdraw, referral |
| `/admin` | Owner-only panel — pause/unpause, add/update plans, member override, emergency withdraw |

## Quick Start

```bash
# 1. Install dependencies
pnpm install   # or: npm install

# 2. Set environment variables
cp .env.example .env
# → Fill in VITE_WALLETCONNECT_PROJECT_ID and VITE_CONTRACT_ADDRESS

# 3. Run dev server
pnpm dev

# 4. Build for production
pnpm build
```

## Environment Variables

```env
VITE_WALLETCONNECT_PROJECT_ID=   # from cloud.walletconnect.com (required for full wallet support)
VITE_CONTRACT_ADDRESS=           # deployed BlackVanta contract address
VITE_USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955   # BSC Mainnet USDT
VITE_CHAIN_ID=56                 # 56 = BSC Mainnet, 97 = BSC Testnet
```

## Project Structure

```
src/
├── abi/
│   └── BlackVanta.json          ← Full contract ABI
├── config/
│   ├── wagmi.ts                 ← Wagmi + Web3Modal config
│   └── contracts.ts             ← Addresses, ABI exports, constants
├── hooks/
│   └── useBlackVanta.ts         ← All read/write Wagmi hooks
├── lib/
│   └── utils.ts                 ← Formatting helpers, error parsing
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx             ← Card, Badge, StatCard, TxStatus, SectionTitle
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── landing/
│   │   └── LandingPage.tsx      ← Protocol explainer (React version of HTML explainer)
│   ├── portfolio/
│   │   └── PortfolioPage.tsx    ← Full user dApp
│   └── admin/
│       └── AdminPage.tsx        ← Owner-only controls
├── pages/
│   └── index.ts                 ← Re-exports all pages
├── App.tsx                      ← Providers + router
├── main.tsx                     ← Entry point
└── index.css                    ← Tailwind + global styles
```

## Contract Interaction Flow

### User Journey
1. **Connect Wallet** — WalletConnect modal (MetaMask, Trust Wallet, etc.)
2. **Register** — `register(parentAddress)` — one-time, sets referrer
3. **Deposit** → Approve USDT → `deposit(amount)` (two-step)
4. **Subscribe** → `subscribe(planId, amount)` — from internal balance
5. **Claim ROI** → `claimROI(planIndex)` — once per 24h per plan
6. **Withdraw** → `withdraw(amount)` — 24h cooldown per withdrawal

### Admin Journey (Owner only)
- Pause / Unpause — `pause()` / `unpause()`
- Add Plan — `addPlan(name, dailyROI, durationDays, minInvestment, maxInvestment)`
- Update Plan — `updatePlan(planId, ...params, active)`
- Member Override — `adminUpdateMember(member, balance, incomeCap, totalIncome, coolDown)`
- Emergency Drain — `emergencyWithdraw(to)` — drains entire contract balance

## Key Contract Constants (mirrored in frontend)

| Constant | Value | Meaning |
|---|---|---|
| `BASIS_POINTS` | 10,000 | Percentage denominator |
| `REFERRAL_RATE` | 2,000 bp | 20% referral commission |
| `SECONDS_PER_DAY` | 86,400 | ROI claim interval |
| `WITHDRAW_COOLDOWN` | 86,400 | 24h between withdrawals |
| `RATE_LIMIT_INTERVAL` | 10 | Seconds between any two calls |

## Income Cap Formula (on-chain)

```
maxIncomeCap = investedAmount × durationDays × dailyROI / 10,000
```

All four vaults: `durationDays × dailyROI = 30,000` → always **3.0× invested amount**.

## WalletConnect Project ID

Get yours free at [cloud.walletconnect.com](https://cloud.walletconnect.com).
Without it, wallet connections are limited to injected providers (MetaMask).
