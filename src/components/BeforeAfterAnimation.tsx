'use client'
import { useEffect, useState } from 'react'

const PAIRS = [
  { before: 'Worked on backend services.', after: 'Built Go microservices on Kubernetes, exposing gRPC APIs.' },
  { before: 'Wrote tests for the platform.', after: 'Authored integration suite covering 92% of the payment pipeline.' },
  { before: 'Improved the data pipeline.',   after: 'Cut nightly ETL runtime from 45 to 9 minutes by parallelizing Postgres COPY.' },
]

export function BeforeAfterAnimation() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(prev => (prev + 1) % PAIRS.length), 3500)
    return () => clearInterval(t)
  }, [])
  const p = PAIRS[i]
  return (
    <div className="mt-12 grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Before</div>
        <p key={`b-${i}`} className="mt-2 text-sm text-neutral-500 [animation:fadeIn_400ms_ease]">{p.before}</p>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">After</div>
        <p key={`a-${i}`} className="mt-2 text-sm font-medium [animation:fadeIn_400ms_ease_200ms_both]">{p.after}</p>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  )
}
