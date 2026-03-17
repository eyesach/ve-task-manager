import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Printer } from 'lucide-react'
import { usePrintStore } from '@/stores/printStore'
import { useTaskStore } from '@/stores/taskStore'
import { getDepartmentById, PRINT_STATUSES } from '@/lib/constants'
import { PrintRequestModal } from './PrintRequestModal'
import { EmptyState } from '@/components/common/EmptyState'
import type { PrintRequest } from '@/lib/types'

export function PrintRequestsView() {
  const { requests, updateRequest, deleteRequest } = usePrintStore()
  const { profiles } = useTaskStore()
  const [modalOpen, setModalOpen] = useState(false)

  function getProfileName(profileId: string) {
    const profile = profiles.find((p) => p.id === profileId)
    return profile?.fullName ?? '—'
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Print Requests</h1>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {requests.length} request{requests.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus size={15} />
          New Request
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {requests.length === 0 ? (
          <EmptyState
            icon={<Printer size={40} />}
            title="No print requests yet"
            description="Submit a request for banners, flyers, catalogs, and more."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                <Plus size={15} />
                New Request
              </button>
            }
          />
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface-2 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-3">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Requested By
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Sided
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Paper
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {requests.map((req) => {
                  const dept = getDepartmentById(req.departmentId)
                  return (
                    <tr key={req.id} className="group hover:bg-surface-3 transition-colors">
                      {/* Item Name */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{req.itemName}</div>
                        {req.linkToPdf && (
                          <a
                            href={req.linkToPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block truncate text-xs text-accent hover:underline"
                          >
                            View PDF
                          </a>
                        )}
                        {req.notes && (
                          <p className="mt-0.5 truncate text-xs text-text-tertiary">{req.notes}</p>
                        )}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3">
                        {dept ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: dept.color + '22', color: dept.color }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: dept.color }}
                            />
                            {dept.abbreviation}
                          </span>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>

                      {/* Requested By */}
                      <td className="px-4 py-3 text-text-secondary">
                        {getProfileName(req.requestedBy)}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 text-center text-text-primary font-medium">
                        {req.quantity}
                      </td>

                      {/* Sided */}
                      <td className="px-4 py-3 capitalize text-text-secondary">
                        {req.sided}
                      </td>

                      {/* Paper Type */}
                      <td className="px-4 py-3 capitalize text-text-secondary">
                        {req.paperType}
                      </td>

                      {/* Status — editable dropdown */}
                      <td className="px-4 py-3">
                        <select
                          value={req.status}
                          onChange={(e) =>
                            updateRequest(req.id, {
                              status: e.target.value as PrintRequest['status'],
                            })
                          }
                          className="rounded-lg border border-border-subtle bg-surface-1 px-2 py-1 text-xs text-text-primary outline-none focus:border-border-strong cursor-pointer hover:bg-surface-3"
                        >
                          {PRINT_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-text-tertiary text-xs whitespace-nowrap">
                        {format(new Date(req.createdAt), 'MMM d, yyyy')}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteRequest(req.id)}
                          className="invisible group-hover:visible flex items-center justify-center ml-auto h-7 w-7 rounded-md text-text-tertiary hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Delete request"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PrintRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
