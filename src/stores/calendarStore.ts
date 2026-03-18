import { create } from 'zustand'
import type { CalendarEvent } from '@/lib/types'
import { MOCK_CALENDAR_EVENTS } from '@/lib/mockData'
import { insertCalendarEvent as dbInsertEvent, updateCalendarEventRow, deleteCalendarEventRow } from '@/lib/supabaseService'

interface CalendarState {
  events: CalendarEvent[]
  getEventsForDate: (date: string) => CalendarEvent[]
  getEventsForMonth: (year: number, month: number) => CalendarEvent[]
  addEvent: (event: CalendarEvent) => void
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (eventId: string) => void
  // Realtime event handlers (pure local state, no DB writes)
  applyRealtimeEventInsert: (event: CalendarEvent) => void
  applyRealtimeEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void
  applyRealtimeEventDelete: (eventId: string) => void
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: MOCK_CALENDAR_EVENTS,

  getEventsForDate: (date) =>
    get().events.filter(
      (e) => e.startDate === date || (e.endDate && e.startDate <= date && e.endDate >= date),
    ),

  getEventsForMonth: (year, month) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const prefix = `${year}-${monthStr}`
    return get().events.filter((e) => e.startDate.startsWith(prefix))
  },

  addEvent: (event) => {
    set((s) => ({ events: [...s.events, event] }))
    dbInsertEvent(event)
  },

  updateEvent: (eventId, updates) => {
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
    }))
    updateCalendarEventRow(eventId, updates)
  },

  deleteEvent: (eventId) => {
    set((s) => ({ events: s.events.filter((e) => e.id !== eventId) }))
    deleteCalendarEventRow(eventId)
  },

  // ─── Realtime event handlers ───────────────────────────────────────────────

  applyRealtimeEventInsert: (event) =>
    set((s) => ({
      events: s.events.some((e) => e.id === event.id) ? s.events : [...s.events, event],
    })),

  applyRealtimeEventUpdate: (eventId, updates) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
    })),

  applyRealtimeEventDelete: (eventId) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== eventId) })),
}))
