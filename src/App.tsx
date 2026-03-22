import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { wagmiConfig, projectId } from './config/wagmi'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { LandingPage, PortfolioPage, AdminPage } from './pages'

// ── React Query client ───────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
})

// ── Web3Modal init ───────────────────────────────────────────────────────────
// chains are derived from wagmiConfig automatically — no separate prop needed
createWeb3Modal({
  wagmiConfig,
  projectId: projectId || 'demo-project-id',
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#C8960C',
    '--w3m-color-mix': '#010A18',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '0px',
    '--w3m-font-family': '"IBM Plex Mono", monospace',
  },
})

// ── App shell ────────────────────────────────────────────────────────────────
// HashRouter is required for GitHub Pages static hosting.
// GitHub Pages can't handle HTML5 pushState — a hard refresh on /portfolio
// returns 404 because there is no portfolio/index.html on the server.
// HashRouter puts the route in the URL fragment (/#/portfolio) which is never
// sent to the server, so index.html always loads correctly.
function AppShell() {
  return (
    <HashRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </HashRouter>
  )
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppShell />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#06142C',
              color: '#EEE5CC',
              border: '1px solid rgba(200,150,12,0.22)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.72rem',
              borderRadius: '0',
            },
            success: {
              iconTheme: { primary: '#2DBF8A', secondary: '#06142C' },
            },
            error: {
              iconTheme: { primary: '#C84040', secondary: '#06142C' },
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
