import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToastStore } from '@/stores/toastStore'

const ICONS = {
  success: <CheckCircle2 size={16} className="text-emerald-400" />,
  error: <AlertCircle size={16} className="text-red-400" />,
  info: <Info size={16} className="text-blue-400" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-in-right flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-2 px-4 py-3 shadow-xl"
        >
          {ICONS[toast.type]}
          <span className="text-sm text-text-primary">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-2 text-text-tertiary hover:text-text-primary">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
