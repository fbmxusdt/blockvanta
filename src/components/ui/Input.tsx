import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  suffix?: string
  error?: string
}

export function Input({ label, suffix, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.58rem] uppercase tracking-widest text-steel">{label}</label>
      )}
      <div className="flex items-center bg-navy-800 border border-gold-400/20 focus-within:border-gold-400/60 transition-colors">
        <input
          className={cn(
            'flex-1 bg-transparent font-mono text-[0.78rem] text-ivory px-3 py-2.5 outline-none placeholder:text-slate-muted',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="pr-3 text-[0.6rem] text-steel uppercase tracking-wider">{suffix}</span>
        )}
      </div>
      {error && <p className="text-[0.6rem] text-danger">{error}</p>}
    </div>
  )
}
