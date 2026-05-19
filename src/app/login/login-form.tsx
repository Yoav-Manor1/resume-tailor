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
      <p className="mt-6 rounded-md bg-green-50 p-4 text-green-800">
        Check {email} for your sign-in link.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border border-neutral-300 px-3 py-2"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50"
      >
        {state === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  )
}
