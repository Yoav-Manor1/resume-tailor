'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError(null)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) {
      setError(error.message)
      setState('error')
      return
    }
    setState('sent')
  }

  if (state === 'sent') {
    return (
      <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 flex-none text-emerald-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium">Check your inbox</p>
            <p className="mt-0.5 text-emerald-800">
              We sent a sign-in link to <span className="font-medium">{email}</span>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium uppercase tracking-wider text-neutral-500"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900"
        />
      </div>
      <button
        type="submit"
        disabled={state === 'sending'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state === 'sending' ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="3"
              />
              <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" />
            </svg>
            Sending…
          </>
        ) : (
          'Send magic link'
        )}
      </button>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  )
}
