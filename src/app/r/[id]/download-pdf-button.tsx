'use client'
import { useState } from 'react'

export function DownloadPdfButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function onClick() {
    setBusy(true)
    setErr(null)
    const res = await fetch(`/api/tailorings/${id}/pdf`, { method: 'POST' })
    if (!res.ok) {
      setErr('PDF generation failed.')
      setBusy(false)
      return
    }
    const { url } = (await res.json()) as { url: string }
    window.location.href = url
  }
  return (
    <div className="mt-10 border-t border-neutral-200 pt-6">
      <button
        onClick={onClick}
        disabled={busy}
        className="rounded-md border border-neutral-300 px-4 py-2 disabled:opacity-50"
      >
        {busy ? 'Generating…' : 'Download as PDF'}
      </button>
      {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
    </div>
  )
}
