import { create } from 'zustand'

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (type: ToastItem['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, type, message }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
