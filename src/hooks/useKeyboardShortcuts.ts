import { useEffect } from 'react'

function isInputFocused() {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

interface ShortcutHandlers {
  onHelp?: () => void
  onNewTask?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInputFocused()) return

      switch (e.key) {
        case '?':
          e.preventDefault()
          handlers.onHelp?.()
          break
        case 'n':
          e.preventDefault()
          handlers.onNewTask?.()
          break
        case 'Escape':
          handlers.onEscape?.()
          break
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
