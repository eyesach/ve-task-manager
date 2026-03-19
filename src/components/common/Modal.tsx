import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
}

export function Modal({ open, onClose, title, children, footer, width = 'w-[560px]' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} className={`relative ${width} max-h-[85vh] flex flex-col rounded-xl border border-border-subtle bg-surface-1 shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary hover:bg-surface-3 hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}
