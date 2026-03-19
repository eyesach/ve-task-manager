import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', destructive = true }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="w-[420px]"
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-3">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-accent-hover'}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{message}</p>
    </Modal>
  )
}
