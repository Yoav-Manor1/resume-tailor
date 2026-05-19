'use client'
import { useEffect, useState } from 'react'

const PAIRS = [
  {
    before: 'Worked on backend services.',
    after: 'Built Go microservices on Kubernetes, exposing gRPC APIs.',
  },
  {
    before: 'Wrote tests for the platform.',
    after: 'Authored integration suite covering 92% of the payment pipeline.',
  },
  {
    before: 'Improved the data pipeline.',
    after:
      'Cut nightly ETL runtime from 45 to 9 minutes by parallelizing Postgres COPY.',
  },
]

export function BeforeAfterAnimation() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((prev) => (prev + 1) % PAIRS.length), 3500)
    return () => clearInterval(t)
  }, [])
  const p = PAIRS[i]
  return (
    <div className="mt-14 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
      <div className="grid grid-cols-1 divide-y divide-neutral-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-300" />
            Before
          </div>
          <p
            key={`b-${i}`}
            className="mt-3 text-[0.95rem] leading-relaxed text-neutral-400 line-through decoration-neutral-300 [animation:fadeIn_400ms_ease]"
          >
            {p.before}
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            After
          </div>
          <p
            key={`a-${i}`}
            className="mt-3 text-[0.95rem] font-medium leading-relaxed text-neutral-900 [animation:fadeIn_400ms_ease_200ms_both]"
          >
            {p.after}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-6 py-3">
        <div className="flex gap-1.5">
          {PAIRS.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 w-6 rounded-full transition-colors ${
                idx === i ? 'bg-neutral-900' : 'bg-neutral-300'
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Live sample
        </span>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  )
}
