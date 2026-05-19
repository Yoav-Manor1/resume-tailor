'use client'
import { useState } from 'react'
import type { Bullet, ResumeSkeleton } from '@/lib/schema'

export function CopyAllButton({
  bullets,
  skeleton,
}: {
  bullets: Bullet[]
  skeleton: ResumeSkeleton
}) {
  const [copied, setCopied] = useState(false)

  function buildText(): string {
    const byExp = new Map<string, Bullet[]>()
    for (const b of bullets) {
      const arr = byExp.get(b.experience_id) ?? []
      arr.push(b)
      byExp.set(b.experience_id, arr)
    }
    const lines: string[] = []
    for (const exp of skeleton.experience) {
      const items = byExp.get(exp.id) ?? []
      if (!items.length) continue
      lines.push(`${exp.company} — ${exp.role}${exp.dates ? ` (${exp.dates})` : ''}`)
      for (const b of items) lines.push(`• ${b.tailored}`)
      lines.push('') // blank line between roles
    }
    return lines.join('\n').trim()
  }

  async function onClick() {
    await navigator.clipboard.writeText(buildText())
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4 text-emerald-300"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied all bullets
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
              d="M8 8h10a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V10a2 2 0 012-2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Copy all bullets
        </>
      )}
    </button>
  )
}
