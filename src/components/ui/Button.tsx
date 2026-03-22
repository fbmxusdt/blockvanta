import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'gold',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-mono tracking-widest uppercase text-xs transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none'

  const variants = {
    gold: 'bg-gold-400 text-navy-950 font-medium hover:bg-gold-300 active:scale-[.98]',
    outline: 'border border-gold-400/40 text-gold-300 hover:border-gold-400 hover:text-gold-200 bg-transparent',
    ghost: 'text-steel hover:text-ivory bg-transparent hover:bg-navy-800',
    danger: 'bg-danger text-white hover:bg-red-500 active:scale-[.98]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-[0.6rem]',
    md: 'px-5 py-2.5',
    lg: 'px-7 py-3.5',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
