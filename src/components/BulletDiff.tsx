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
    <div className="space-y-8">
      {[...groups.entries()].map(([expId, items]) => {
        const exp = expById.get(expId)
        return (
          <section key={expId}>
            <h3 className="text-sm font-semibold text-neutral-700">
              {exp ? `${exp.company} — ${exp.role}` : 'Experience'}
              {exp && (
                <span className="ml-2 font-normal text-neutral-500">{exp.dates}</span>
              )}
            </h3>
            <div className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200">
              {items.map((b) => {
                const i = index++
                return (
                  <div key={i} className="grid grid-cols-2 gap-4 p-4">
                    <p className="text-sm text-neutral-500">{b.original}</p>
                    <div className="text-sm">
                      <p>{highlight(b.tailored, b.matched_keywords)}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(b.tailored)
                          setCopied(i)
                          setTimeout(
                            () => setCopied((c) => (c === i ? null : c)),
                            1500,
                          )
                        }}
                        className="mt-2 text-xs text-neutral-500 hover:text-neutral-900"
                      >
                        {copied === i ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
