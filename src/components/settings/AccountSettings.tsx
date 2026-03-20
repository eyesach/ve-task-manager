import { useState } from 'react'
import { Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { useToastStore } from '@/stores/toastStore'

export function AccountSettings() {
  const { user } = useAuth()
  const addToast = useToastStore((s) => s.addToast)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChangePassword() {
    setError(null)

    if (!newPassword) {
      setError('Please enter a new password.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setNewPassword('')
        setConfirmPassword('')
        addToast('success', 'Password updated successfully.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Account Info */}
      <div className="rounded-lg border border-border-subtle bg-surface-1 p-5">
        <h3 className="text-sm font-medium text-text-primary">Account Information</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Signed in as <span className="font-medium text-text-primary">{user?.email ?? '—'}</span>
        </p>
      </div>

      {/* Change Password */}
      <div className="rounded-lg border border-border-subtle bg-surface-1 p-5">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-medium text-text-primary">Change Password</h3>
        </div>

        <div className="mt-4 flex max-w-sm flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">New Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-border-strong bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Confirm Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-border-strong bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleChangePassword()
              }}
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
