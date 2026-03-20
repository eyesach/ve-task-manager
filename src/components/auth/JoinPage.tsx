import { useState, type FormEvent } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'

export function JoinPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const { session, loading, signIn } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  if (!companyId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-gray-600">Invalid invite link.</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('join-company', {
        body: {
          company_id: companyId,
          email: email.trim(),
          password,
          full_name: fullName.trim(),
        },
      })

      if (fnError) {
        let message = 'Failed to create account.'
        try {
          const body = fnError.context ? await fnError.context.json() : null
          if (body?.error) message = body.error
        } catch {
          if (fnError.message && !fnError.message.includes('non-2xx')) {
            message = fnError.message
          }
        }
        setError(message)
        setSubmitting(false)
        return
      }

      if (data?.error) {
        setError(data.error)
        setSubmitting(false)
        return
      }

      // Account created — sign them in automatically
      const { error: signInError } = await signIn(email.trim(), password)
      if (signInError) {
        // Account was created but auto-sign-in failed — send them to login
        setError('Account created! Please sign in with your new credentials.')
        setSubmitting(false)
        return
      }
      // signIn succeeded — AuthProvider will redirect to /
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <UserPlus className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Join VE Task Manager</h1>
            <p className="mt-1 text-sm text-gray-500">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Jane Doe"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="joinEmail" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="joinEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@school.edu"
              />
            </div>

            <div>
              <label htmlFor="joinPassword" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="joinPassword"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Have a login?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
