import { useState, useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import { usePrintStore } from '@/stores/printStore'
import { useToastStore } from '@/stores/toastStore'
import { COMPANY_ID } from '@/lib/ids'
import { DEPARTMENTS, PRINT_PAPER_TYPES } from '@/lib/constants'
import { useAuth } from '@/components/auth/AuthProvider'
import type { PrintRequest } from '@/lib/types'

interface PrintRequestModalProps {
  open: boolean
  onClose: () => void
}

export function PrintRequestModal({ open, onClose }: PrintRequestModalProps) {
  const { addRequest } = usePrintStore()
  const { addToast } = useToastStore()
  const { profile } = useAuth()

  const [itemName, setItemName] = useState('')
  const [linkToPdf, setLinkToPdf] = useState('')
  const [departmentId, setDepartmentId] = useState<string>(DEPARTMENTS[0].id)
  const [quantity, setQuantity] = useState(1)
  const [sided, setSided] = useState<'single' | 'double'>('single')
  const [paperType, setPaperType] = useState<PrintRequest['paperType']>('plain')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setItemName('')
      setLinkToPdf('')
      setDepartmentId(DEPARTMENTS[0].id)
      setQuantity(1)
      setSided('single')
      setPaperType('plain')
      setNotes('')
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemName.trim()) return

    const request: PrintRequest = {
      id: crypto.randomUUID(),
      companyId: COMPANY_ID,
      itemName: itemName.trim(),
      linkToPdf: linkToPdf.trim() || undefined,
      requestedBy: profile?.id ?? '',
      departmentId,
      quantity,
      sided,
      paperType,
      notes: notes.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    addRequest(request)
    addToast('success', `Print request "${request.itemName}" submitted`)
    onClose()
  }

  const inputCls =
    'w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong'
  const labelCls = 'text-xs font-medium text-text-secondary mb-1.5 block'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Print Request"
      width="w-[560px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface-3"
          >
            Cancel
          </button>
          <button
            form="print-request-form"
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Submit Request
          </button>
        </>
      }
    >
      <form id="print-request-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Item Name */}
        <div>
          <label className={labelCls} htmlFor="pr-item-name">
            Item Name <span className="text-red-400">*</span>
          </label>
          <input
            id="pr-item-name"
            type="text"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Trade Show Banners (2x)"
            className={inputCls}
          />
        </div>

        {/* Link to PDF */}
        <div>
          <label className={labelCls} htmlFor="pr-link">
            Link to PDF
          </label>
          <input
            id="pr-link"
            type="url"
            value={linkToPdf}
            onChange={(e) => setLinkToPdf(e.target.value)}
            placeholder="https://drive.google.com/..."
            className={inputCls}
          />
        </div>

        {/* Department */}
        <div>
          <label className={labelCls} htmlFor="pr-department">
            Department
          </label>
          <select
            id="pr-department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className={inputCls}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity + Paper Type row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="pr-quantity">
              Quantity
            </label>
            <input
              id="pr-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="pr-paper-type">
              Paper Type
            </label>
            <select
              id="pr-paper-type"
              value={paperType}
              onChange={(e) => setPaperType(e.target.value as PrintRequest['paperType'])}
              className={inputCls}
            >
              {PRINT_PAPER_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sided */}
        <div>
          <span className={labelCls}>Sided</span>
          <div className="flex gap-6">
            {(['single', 'double'] as const).map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
                <input
                  type="radio"
                  name="sided"
                  value={s}
                  checked={sided === s}
                  onChange={() => setSided(s)}
                  className="accent-accent"
                />
                {s.charAt(0).toUpperCase() + s.slice(1)}-sided
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls} htmlFor="pr-notes">
            Notes
          </label>
          <textarea
            id="pr-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special instructions or notes..."
            className={`${inputCls} resize-none`}
          />
        </div>
      </form>
    </Modal>
  )
}
