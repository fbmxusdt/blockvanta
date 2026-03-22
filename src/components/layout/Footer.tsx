import { Link } from 'react-router-dom'
import { CONTRACT_ADDRESS, USDT_ADDRESS } from '../../config/contracts'
import { EXPLORER_URL } from '../../config/wagmi'
import { shortAddr } from '../../lib/utils'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[rgba(200,150,12,0.12)] mt-20">
      <div className="max-w-7xl mx-auto px-5 py-8 flex flex-wrap gap-6 justify-between items-start">
        {/* Brand */}
        <div>
          <div className="font-serif text-lg text-gold-300 mb-1">
            Black<span className="text-ivory font-normal">Vanta</span>
          </div>
          <p className="text-[0.56rem] text-slate-muted tracking-widest">
            BNB Smart Chain · USDT BEP20 · Solidity ^0.8.20
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-6 items-center">
          {[
            { to: '/', label: 'Protocol' },
            { to: '/portfolio', label: 'Portfolio' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-[0.56rem] uppercase tracking-widest text-slate-muted hover:text-gold-300 transition-colors"
            >
              {label}
            </Link>
          ))}
          {EXPLORER_URL && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' && (
            <a
              href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.56rem] uppercase tracking-widest text-slate-muted hover:text-gold-300 transition-colors"
            >
              Contract ↗
            </a>
          )}
        </div>

        {/* Addresses */}
        <div className="space-y-1">
          <p className="text-[0.56rem] text-slate-muted">
            Contract: <span className="text-steel font-mono">{shortAddr(CONTRACT_ADDRESS, 6)}</span>
          </p>
          <p className="text-[0.56rem] text-slate-muted">
            USDT: <span className="text-steel font-mono">{shortAddr(USDT_ADDRESS, 6)}</span>
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-[0.56rem] text-slate-muted/50 font-sans font-light leading-relaxed max-w-xs">
          Non-custodial protocol. Participation involves financial risk. Not financial advice.
        </p>
      </div>
    </footer>
  )
}
