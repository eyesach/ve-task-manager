import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAllData } from '@/lib/supabaseService'
import { useAuth } from '@/components/auth/AuthProvider'
import { useTaskStore } from '@/stores/taskStore'
import { usePeriodStore } from '@/stores/periodStore'
import { useCalendarStore } from '@/stores/calendarStore'
import { usePrintStore } from '@/stores/printStore'
import { useCompanyStore } from '@/stores/companyStore'
import { useToastStore } from '@/stores/toastStore'
import {
  mapTask,
  mapChecklistItem,
  mapAssignee,
  mapComment,
  mapProfile,
  mapCalendarEvent,
  mapPrintRequest,
  mapPeriod,
  mapTaskDepartment,
} from '@/lib/supabase-types'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Payload = {
  new: Record<string, unknown>
  old: Record<string, unknown>
}

/**
 * Replaces useSupabaseSync. On mount:
 *  1. Fetches all data from Supabase and hydrates Zustand stores.
 *  2. Subscribes to Postgres Realtime changes and applies them to stores.
 * Gates everything on companyId from the authenticated profile.
 */
export function useRealtimeSync() {
  const { profile } = useAuth()
  const companyId = profile?.companyId ?? null
  const channelRef = useRef<RealtimeChannel | null>(null)
  const hasConnectedOnce = useRef(false)
  const lastErrorToast = useRef(0)

  useEffect(() => {
    if (!companyId) return

    // ─── Initial data fetch ─────────────────────────────────────────────────

    async function hydrateStores() {
      try {
        const data = await fetchAllData()
        if (!data) return // Supabase not configured or fetch failed — keep mock data

        useTaskStore.setState({
          tasks: data.tasks,
          profiles: data.profiles,
          checklists: data.checklists,
          comments: data.comments,
          assignees: data.assignees,
          taskDepartments: data.taskDepartments,
        })

        usePeriodStore.setState({
          periods: data.periods,
          activePeriodId:
            data.periods.find((p) => p.isActive)?.id ?? data.periods[0]?.id ?? '',
        })

        useCalendarStore.setState({ events: data.events })
        usePrintStore.setState({ requests: data.printRequests })

        if (data.company) {
          useCompanyStore.setState({ company: data.company })
        }

        console.log(
          'Supabase sync complete: loaded',
          data.tasks.length,
          'tasks,',
          data.profiles.length,
          'profiles',
        )
      } catch (err) {
        console.error('Supabase sync failed, using mock data:', err)
      }
    }

    hydrateStores()

    // ─── Realtime subscriptions ─────────────────────────────────────────────

    const taskStore = useTaskStore.getState
    const calendarStore = useCalendarStore.getState
    const printStore = usePrintStore.getState
    const periodStore = usePeriodStore.getState

    const channel = supabase
      .channel(`company-${companyId}`)
      // ── Tables WITH company_id column (filtered) ──
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `company_id=eq.${companyId}` },
        (payload) => {
          const p = payload as unknown as { eventType: string } & Payload
          if (payload.eventType === 'INSERT') {
            taskStore().applyRealtimeTaskInsert(mapTask(p.new))
          } else if (payload.eventType === 'UPDATE') {
            taskStore().applyRealtimeTaskUpdate(p.new.id as string, mapTask(p.new))
          } else if (payload.eventType === 'DELETE') {
            taskStore().applyRealtimeTaskDelete(p.old.id as string)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `company_id=eq.${companyId}` },
        (payload) => {
          const p = payload as unknown as { eventType: string } & Payload
          if (payload.eventType === 'INSERT') {
            taskStore().applyRealtimeProfileInsert(mapProfile(p.new))
          } else if (payload.eventType === 'UPDATE') {
            taskStore().applyRealtimeProfileUpdate(p.new.id as string, mapProfile(p.new))
          } else if (payload.eventType === 'DELETE') {
            taskStore().applyRealtimeProfileDelete(p.old.id as string)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events', filter: `company_id=eq.${companyId}` },
        (payload) => {
          const p = payload as unknown as { eventType: string } & Payload
          if (payload.eventType === 'INSERT') {
            calendarStore().applyRealtimeEventInsert(mapCalendarEvent(p.new))
          } else if (payload.eventType === 'UPDATE') {
            calendarStore().applyRealtimeEventUpdate(p.new.id as string, mapCalendarEvent(p.new))
          } else if (payload.eventType === 'DELETE') {
            calendarStore().applyRealtimeEventDelete(p.old.id as string)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'print_requests', filter: `company_id=eq.${companyId}` },
        (payload) => {
          const p = payload as unknown as { eventType: string } & Payload
          if (payload.eventType === 'INSERT') {
            printStore().applyRealtimeRequestInsert(mapPrintRequest(p.new))
          } else if (payload.eventType === 'UPDATE') {
            printStore().applyRealtimeRequestUpdate(p.new.id as string, mapPrintRequest(p.new))
          } else if (payload.eventType === 'DELETE') {
            printStore().applyRealtimeRequestDelete(p.old.id as string)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_periods', filter: `company_id=eq.${companyId}` },
        (payload) => {
          const p = payload as unknown as { eventType: string } & Payload
          if (payload.eventType === 'INSERT') {
            periodStore().applyRealtimePeriodInsert(mapPeriod(p.new))
          } else if (payload.eventType === 'UPDATE') {
            periodStore().applyRealtimePeriodUpdate(p.new.id as string, mapPeriod(p.new))
          } else if (payload.eventType === 'DELETE') {
            periodStore().applyRealtimePeriodDelete(p.old.id as string)
          }
        },
      )
      // ── Child tables WITHOUT company_id (no filter) ──
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checklist_items' },
        (payload) => {
          const p = payload as unknown as { eventType: string } & Payload
          if (payload.eventType === 'INSERT') {
            taskStore().applyRealtimeChecklistInsert(mapChecklistItem(p.new))
          } else if (payload.eventType === 'UPDATE') {
            taskStore().applyRealtimeChecklistUpdate(p.new.id as string, mapChecklistItem(p.new))
          } else if (payload.eventType === 'DELETE') {
            taskStore().applyRealtimeChecklistDelete(p.old.id as string)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignees' },
        (payload) => {
          const p = payload as unknown as { eventType: string } & Payload
          if (payload.eventType === 'INSERT') {
            taskStore().applyRealtimeAssigneeInsert(mapAssignee(p.new))
          } else if (payload.eventType === 'UPDATE') {
            taskStore().applyRealtimeAssigneeUpdate(p.new.id as string, mapAssignee(p.new))
          } else if (payload.eventType === 'DELETE') {
            taskStore().applyRealtimeAssigneeDelete(p.old.id as string)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments' },
        (payload) => {
          const p = payload as unknown as { eventType: string } & Payload
          if (payload.eventType === 'INSERT') {
            taskStore().applyRealtimeCommentInsert(mapComment(p.new))
          } else if (payload.eventType === 'UPDATE') {
            taskStore().applyRealtimeCommentUpdate(p.new.id as string, mapComment(p.new))
          } else if (payload.eventType === 'DELETE') {
            taskStore().applyRealtimeCommentDelete(p.old.id as string)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_departments' },
        (payload) => {
          const p = payload as unknown as { eventType: string } & Payload
          if (payload.eventType === 'INSERT') {
            const td = mapTaskDepartment(p.new)
            useTaskStore.setState((s) => ({
              taskDepartments: s.taskDepartments.some((x) => x.id === td.id)
                ? s.taskDepartments
                : [...s.taskDepartments, td],
            }))
          } else if (payload.eventType === 'UPDATE') {
            const td = mapTaskDepartment(p.new)
            useTaskStore.setState((s) => ({
              taskDepartments: s.taskDepartments.map((x) => (x.id === td.id ? td : x)),
            }))
          } else if (payload.eventType === 'DELETE') {
            useTaskStore.setState((s) => ({
              taskDepartments: s.taskDepartments.filter((x) => x.id !== (p.old.id as string)),
            }))
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error')
          // Throttle error toasts to at most once per 30 seconds
          const now = Date.now()
          if (now - lastErrorToast.current > 30_000) {
            lastErrorToast.current = now
            useToastStore.getState().addToast('error', 'Realtime connection error. Some updates may be delayed.')
          }
        }
        if (status === 'SUBSCRIBED') {
          if (hasConnectedOnce.current) {
            // Reconnected — re-fetch all data to catch anything missed
            console.log('Realtime reconnected, re-fetching data...')
            hydrateStores()
          }
          hasConnectedOnce.current = true
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [companyId])
}
