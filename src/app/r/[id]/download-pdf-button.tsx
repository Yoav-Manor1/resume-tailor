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
    <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6">
      <p className="text-xs text-neutral-500">
        Bullets are yours to copy. Need a clean file?
      </p>
      <button
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
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
            Generating…
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path
                d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download PDF
          </>
        )}
      </button>
      {err && <p className="w-full text-sm text-red-700">{err}</p>}
    </div>
  )
}
