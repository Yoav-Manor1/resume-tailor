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
    <div className="space-y-12">
      {[...groups.entries()].map(([expId, items]) => {
        const exp = expById.get(expId)
        return (
          <section key={expId}>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-base font-semibold tracking-tightish text-neutral-900">
                {exp ? `${exp.company} — ${exp.role}` : 'Experience'}
              </h3>
              {exp?.dates && (
                <span className="flex-none text-xs text-neutral-500">
                  {exp.dates}
                </span>
              )}
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-soft">
              <div className="divide-y divide-neutral-200">
                {items.map((b) => {
                  const i = index++
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-1 gap-x-8 gap-y-5 px-7 py-6 md:grid-cols-2"
                    >
                      {/* Original */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                          Original
                        </p>
                        <p className="mt-2 text-[15px] leading-7 text-neutral-500">
                          {b.original}
                        </p>
                      </div>

                      {/* Tailored */}
                      <div className="group/cell relative md:border-l md:border-neutral-100 md:pl-8">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                          Tailored
                        </p>
                        <p className="mt-2 text-[15px] leading-7 text-neutral-900">
                          {highlight(b.tailored, b.matched_keywords)}
                        </p>
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
                          className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-600 opacity-0 shadow-sm transition group-hover/cell:opacity-100 hover:text-neutral-900"
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
