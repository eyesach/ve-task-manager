import type { Profile } from '@/lib/types'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const AVATAR_COLORS = [
  '#4F46E5', '#059669', '#D97706', '#7C3AED',
  '#DC2626', '#2563EB', '#0891B2', '#DB2777',
]

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

export function AvatarGroup({ profiles, max = 3 }: { profiles: Profile[]; max?: number }) {
  const visible = profiles.slice(0, max)
  const overflow = profiles.length - max

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((p) => (
        <div
          key={p.id}
          title={p.fullName}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-2 text-[9px] font-semibold text-white"
          style={{ backgroundColor: hashColor(p.fullName) }}
        >
          {getInitials(p.fullName)}
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-2 bg-surface-4 text-[9px] font-medium text-text-secondary">
          +{overflow}
        </div>
      )}
    </div>
  )
}

export function Avatar({ profile, size = 'sm' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-6 w-6 text-[9px]', md: 'h-8 w-8 text-[11px]', lg: 'h-10 w-10 text-sm' }

  return (
    <div
      title={profile.fullName}
      className={`flex items-center justify-center rounded-full font-semibold text-white ${sizes[size]}`}
      style={{ backgroundColor: hashColor(profile.fullName) }}
    >
      {getInitials(profile.fullName)}
    </div>
  )
}
