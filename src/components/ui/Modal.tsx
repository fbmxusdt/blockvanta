import { useEffect } from 'react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative z-10 bg-navy-900 border border-[rgba(200,150,12,0.22)] w-full max-w-lg max-h-[90vh] overflow-y-auto',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(200,150,12,0.12)]">
          {title && (
            <h3 className="font-serif text-lg font-normal text-white">{title}</h3>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-steel hover:text-ivory transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
