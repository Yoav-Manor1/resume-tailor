'use client'
import { useState } from 'react'
import type { Bullet, ResumeSkeleton } from '@/lib/schema'

function highlight(text: string, keywords: string[]): React.ReactNode {
  if (!keywords.length) return text
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
  const parts = text.split(re)
  return parts.map((p, i) =>
    keywords.some((k) => k.toLowerCase() === p.toLowerCase()) ? (
      <mark key={i}>{p}</mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

export function BulletDiff({
  bullets,
  skeleton,
}: {
  bullets: Bullet[]
  skeleton: ResumeSkeleton
}) {
  const expById = new Map(skeleton.experience.map((e) => [e.id, e]))
  const groups = new Map<string, Bullet[]>()
  for (const b of bullets) {
    const arr = groups.get(b.experience_id) ?? []
    arr.push(b)
    groups.set(b.experience_id, arr)
  }
  const [copied, setCopied] = useState<number | null>(null)

  let index = 0
  return (
    <div className="space-y-10">
      {[...groups.entries()].map(([expId, items]) => {
        const exp = expById.get(expId)
        return (
          <section key={expId}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold tracking-tightish text-neutral-900">
                {exp ? `${exp.company} — ${exp.role}` : 'Experience'}
              </h3>
              {exp?.dates && (
                <span className="text-xs text-neutral-500">{exp.dates}</span>
              )}
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-soft">
              <div className="grid grid-cols-2 border-b border-neutral-200 bg-neutral-50 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                <div className="px-5 py-2">Original</div>
                <div className="border-l border-neutral-200 px-5 py-2">Tailored</div>
              </div>
              <div className="divide-y divide-neutral-200">
                {items.map((b) => {
                  const i = index++
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-2 divide-x divide-neutral-200"
                    >
                      <p className="px-5 py-4 text-sm leading-relaxed text-neutral-500">
                        {b.original}
                      </p>
                      <div className="group/cell relative px-5 py-4 text-sm leading-relaxed">
                        <p>{highlight(b.tailored, b.matched_keywords)}</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(b.tailored)
                            setCopied(i)
                            setTimeout(
                              () => setCopied((c) => (c === i ? null : c)),
                              1500,
                            )
                          }}
                          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-600 opacity-0 shadow-sm transition group-hover/cell:opacity-100 hover:text-neutral-900"
                        >
                          {copied === i ? (
                            <>
                              <svg
                                className="h-3 w-3 text-emerald-600"
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden
                              >
                                <path
                                  d="M2 6l3 3 5-6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Copied
                            </>
                          ) : (
                            'Copy'
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
