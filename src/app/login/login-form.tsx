'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [googleBusy, setGoogleBusy] = useState(false)

  async function onGoogle() {
    setGoogleBusy(true)
    setError(null)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setError(error.message)
      setGoogleBusy(false)
    }
  }

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
    <div className="mt-6 space-y-4">
      {/* Google OAuth — primary path */}
      <button
        type="button"
        onClick={onGoogle}
        disabled={googleBusy}
        className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {googleBusy ? (
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
            Redirecting to Google…
          </>
        ) : (
          <>
            <GoogleMark />
            Continue with Google
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-wider">
          <span className="bg-white px-2 text-neutral-400">or email me a link</span>
        </div>
      </div>

      {/* Magic-link fallback */}
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900"
        />
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
                <path
                  d="M22 12a10 10 0 0 0-10-10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              Sending…
            </>
          ) : (
            'Send magic link'
          )}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24c3 0 5.7 1.1 7.8 3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4 5.5l6.3 5.3C41.3 36 44 30.5 44 24a20 20 0 0 0-.4-3.5z"
      />
    </svg>
  )
}
