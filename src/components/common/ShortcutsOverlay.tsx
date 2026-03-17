import { Modal } from './Modal'

interface ShortcutsOverlayProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: { key: string; action: string }[] = [
  { key: '⌘ K', action: 'Search' },
  { key: 'N', action: 'New task' },
  { key: '?', action: 'Show shortcuts' },
  { key: 'Esc', action: 'Close panel' },
]

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts" width="w-[400px]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="pb-2 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Key
            </th>
            <th className="pb-2 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {SHORTCUTS.map(({ key, action }) => (
            <tr key={key} className="border-b border-border-subtle last:border-0">
              <td className="py-3 pr-6">
                <kbd className="rounded bg-surface-3 px-2 py-1 font-mono text-xs font-medium text-text-primary">
                  {key}
                </kbd>
              </td>
              <td className="py-3 text-text-secondary">{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  )
}
