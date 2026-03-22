import { Link, useLocation } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { cn, shortAddr } from '../../lib/utils'
import { useIsOwner, usePaused } from '../../hooks/useBlackVanta'
import { Badge } from '../ui/Card'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useWeb3Modal()
  const { pathname } = useLocation()
  const { isOwner } = useIsOwner()
  const { data: paused } = usePaused()

  const links = [
    { to: '/', label: 'Protocol' },
    { to: '/portfolio', label: 'Portfolio' },
    ...(isOwner ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <nav className="glass-nav sticky top-0 z-50 px-5vw">
      <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-0 shrink-0">
          <span className="font-serif text-[1.3rem] font-bold tracking-wide text-gold-300">
            Black
          </span>
          <span className="font-serif text-[1.3rem] font-normal tracking-wide text-ivory">
            Vanta
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'text-[0.62rem] uppercase tracking-widest transition-colors duration-150',
                pathname === to ? 'text-gold-300' : 'text-steel hover:text-ivory',
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {paused === true && (
            <Badge variant="red" pulse>Paused</Badge>
          )}
          {isOwner && paused !== true && (
            <Badge variant="gold">Owner</Badge>
          )}

          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => open({ view: 'Account' })}
                className="text-[0.62rem] font-mono tracking-wider text-ivory border border-[rgba(200,150,12,0.22)] px-3 py-1.5 hover:border-gold-400/50 transition-colors"
              >
                {shortAddr(address)}
              </button>
              <button
                onClick={() => disconnect()}
                className="text-[0.55rem] uppercase tracking-widest text-steel hover:text-danger transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => open()}
              className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-medium font-mono text-[0.65rem] uppercase tracking-widest px-4 py-2 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
