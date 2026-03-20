import type { Task, ChecklistItem } from './types'
import { COMPANY_ID, DEPT_IDS } from './ids'

// ─── Trello JSON types (subset we care about) ──────────────────────────────

export interface TrelloBoard {
  name: string
  lists: TrelloList[]
  cards: TrelloCard[]
  checklists: TrelloChecklist[]
}

export interface TrelloList {
  id: string
  name: string
  closed: boolean
}

export interface TrelloCard {
  id: string
  name: string
  desc: string
  idList: string
  due: string | null
  dueComplete: boolean
  closed: boolean
  attachments: TrelloAttachment[]
  idChecklists: string[]
}

export interface TrelloChecklist {
  id: string
  name: string
  idCard: string
  checkItems: TrelloCheckItem[]
}

export interface TrelloCheckItem {
  id: string
  name: string
  state: 'complete' | 'incomplete'
}

export interface TrelloAttachment {
  name: string
  url: string
}

// ─── Department mapping ─────────────────────────────────────────────────────

const TRELLO_LIST_ALIASES: Record<string, keyof typeof DEPT_IDS> = {
  'administration': 'AD',
  'human resources': 'HR',
  'marketing': 'MK',
  'accounting and finance': 'AF',
  'accounting & finance': 'AF',
  'graphic design': 'BD',
  'branding & design': 'BD',
  'branding and design': 'BD',
  'digital operations': 'DO',
  'sales & product development': 'SP',
  'sales and product development': 'SP',
  'ceo': 'AD',
  'coo': 'AD',
}

export function autoMapListToDepartment(listName: string): keyof typeof DEPT_IDS | null {
  const normalized = listName.trim().toLowerCase()
  return TRELLO_LIST_ALIASES[normalized] ?? null
}

// ─── Validation ─────────────────────────────────────────────────────────────

export function validateTrelloExport(data: unknown): { valid: true; board: TrelloBoard } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'File does not contain valid JSON.' }
  }
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.lists) || !Array.isArray(obj.cards) || !Array.isArray(obj.checklists)) {
    return { valid: false, error: "This doesn't appear to be a Trello board export. Missing lists, cards, or checklists." }
  }
  return { valid: true, board: data as TrelloBoard }
}

// ─── Period number extraction ───────────────────────────────────────────────

export function extractPeriodNumber(periodName: string): number {
  const match = periodName.match(/(\d+)/)
  return match?.[1] ? parseInt(match[1], 10) : 1
}

// ─── Mapping types ──────────────────────────────────────────────────────────

export interface ListMapping {
  trelloListId: string
  trelloListName: string
  departmentAbbr: string | null  // null = skip, 'ID' = inter-department
  cardCount: number
  // Inter-department fields (only used when departmentAbbr === 'ID')
  involvedDepartments?: string[]   // abbreviations of all involved departments
  headDepartmentAbbr?: string      // the lead/head department abbreviation
}

export interface ImportTaskPreview {
  trelloCardId: string
  trelloCardName: string
  task: Task
  checklists: ChecklistItem[]
  warnings: string[]
}

export interface ImportPreview {
  tasks: ImportTaskPreview[]
  skippedCards: Array<{ name: string; reason: string }>
  stats: { totalCards: number; importable: number; skipped: number }
}

// ─── Build initial mappings from a board ────────────────────────────────────

export function buildListMappings(board: TrelloBoard): ListMapping[] {
  const openLists = board.lists.filter((l) => !l.closed)
  return openLists.map((list) => ({
    trelloListId: list.id,
    trelloListName: list.name,
    departmentAbbr: autoMapListToDepartment(list.name),
    cardCount: board.cards.filter((c) => c.idList === list.id && !c.closed).length,
  }))
}

// ─── Transform board into importable tasks ──────────────────────────────────

export function transformTrelloBoard(
  board: TrelloBoard,
  mappings: ListMapping[],
  targetPeriodId: string,
  periodNumber: number,
  getNextTaskCode: (deptAbbr: string, periodNumber: number) => string,
): ImportPreview {
  const skippedCards: ImportPreview['skippedCards'] = []
  const tasks: ImportTaskPreview[] = []

  // Index checklists by card ID for fast lookup
  const checklistsByCard = new Map<string, TrelloChecklist[]>()
  for (const cl of board.checklists) {
    const existing = checklistsByCard.get(cl.idCard) ?? []
    existing.push(cl)
    checklistsByCard.set(cl.idCard, existing)
  }

  // Build a map from list ID → department abbreviation + inter-dept info
  const listToDept = new Map<string, string>()
  const listToMapping = new Map<string, ListMapping>()
  for (const m of mappings) {
    if (m.departmentAbbr) {
      listToDept.set(m.trelloListId, m.departmentAbbr)
      listToMapping.set(m.trelloListId, m)
    }
  }

  // Track codes generated during this transform so each card gets a unique code
  const generatedCodeCounts = new Map<string, number>()

  const openCards = board.cards.filter((c) => !c.closed)

  for (const card of openCards) {
    const deptAbbr = listToDept.get(card.idList)
    if (!deptAbbr) {
      skippedCards.push({ name: card.name, reason: 'Department not mapped' })
      continue
    }
    if (!card.name.trim()) {
      skippedCards.push({ name: '(empty name)', reason: 'Card has no title' })
      continue
    }

    const warnings: string[] = []
    const mapping = listToMapping.get(card.idList)!
    const isInterDept = deptAbbr === 'ID'

    // For inter-department tasks, use the head department for the task code and departmentId
    const effectiveAbbr = isInterDept ? (mapping.headDepartmentAbbr ?? 'AD') : deptAbbr
    const deptId = DEPT_IDS[effectiveAbbr as keyof typeof DEPT_IDS]
    if (!deptId) {
      skippedCards.push({ name: card.name, reason: `Unknown department abbreviation: ${effectiveAbbr}` })
      continue
    }

    // For inter-dept tasks, use 'ID' as the code prefix; otherwise use the department abbreviation
    const codeAbbr = isInterDept ? 'ID' : deptAbbr

    // Get the base code from the store (accounts for existing tasks),
    // then offset by how many codes we've already generated for this dept
    const deptKey = `${codeAbbr}-${periodNumber}`
    const alreadyGenerated = generatedCodeCounts.get(deptKey) ?? 0
    // On the first call getNextTaskCode returns the correct next code,
    // but subsequent calls during the same transform still see the same store state.
    // So: call once per dept to get the base, then increment locally.
    let taskCode: string
    if (alreadyGenerated === 0) {
      taskCode = getNextTaskCode(codeAbbr, periodNumber)
    } else {
      // Parse the base code's sequence and add the offset
      const baseCode = getNextTaskCode(codeAbbr, periodNumber)
      const prefix = `${codeAbbr} ${periodNumber}.`
      const baseSeq = parseInt(baseCode.slice(prefix.length), 10)
      taskCode = `${prefix}${baseSeq + alreadyGenerated}`
    }
    generatedCodeCounts.set(deptKey, alreadyGenerated + 1)
    const taskId = crypto.randomUUID()
    const now = new Date().toISOString()

    // Build description and attachments
    const description = card.desc || ''
    const attachments = (card.attachments ?? []).map((a) => ({
      name: a.name || a.url,
      url: a.url,
    }))

    const task: Task = {
      id: taskId,
      companyId: COMPANY_ID,
      taskPeriodId: targetPeriodId,
      departmentId: isInterDept ? null : deptId,
      taskCode,
      title: card.name.trim(),
      description: description || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      category: isInterDept ? 'inter_department' : 'department',
      priority: 'normal',
      status: card.dueComplete ? 'completed' : 'not_started',
      dueDate: card.due ? card.due.slice(0, 10) : undefined,
      isOptional: false,
      isHighPriority: false,
      sortOrder: tasks.filter((t) => t.task.departmentId === deptId).length,
      createdAt: now,
      updatedAt: now,
    }

    // Build checklist items from all checklists on this card
    const cardChecklists = checklistsByCard.get(card.id) ?? []
    const checklistItems: ChecklistItem[] = []
    let sortIdx = 0
    for (const cl of cardChecklists) {
      for (const item of cl.checkItems) {
        checklistItems.push({
          id: crypto.randomUUID(),
          taskId,
          label: item.name,
          evidenceType: 'text',
          isCompleted: item.state === 'complete',
          sortOrder: sortIdx++,
        })
      }
    }

    if (card.due && !card.dueComplete) {
      const dueDate = new Date(card.due)
      if (dueDate < new Date()) {
        warnings.push('Overdue')
      }
    }

    tasks.push({
      trelloCardId: card.id,
      trelloCardName: card.name,
      task,
      checklists: checklistItems,
      warnings,
    })
  }

  return {
    tasks,
    skippedCards,
    stats: {
      totalCards: openCards.length,
      importable: tasks.length,
      skipped: skippedCards.length,
    },
  }
}
