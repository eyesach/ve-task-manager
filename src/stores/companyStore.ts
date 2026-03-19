import { create } from 'zustand'
import type { Company } from '@/lib/types'
import { updateCompanyRow } from '@/lib/supabaseService'

interface CompanyState {
  company: Company
  updateCompany: (updates: Partial<Company>) => void
}

export const useCompanyStore = create<CompanyState>((set) => ({
  company: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Siply',
    schoolYear: '2025-26',
    description: 'Siply is a VE hydration ecosystem company (S-Corp) based in Tustin, CA with ~30 employees across 7 departments.',
  },

  updateCompany: (updates) => {
    set((s) => ({ company: { ...s.company, ...updates } }))
    updateCompanyRow(updates)
  },
}))
