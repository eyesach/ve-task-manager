import { useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading, signOut } = useAuth()

  // If session exists but profile is missing (deleted account), sign out
  // so the stale session doesn't block the join page redirect.
  useEffect(() => {
    if (!loading && session && !profile) {
      signOut()
    }
  }, [loading, session, profile, signOut])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
