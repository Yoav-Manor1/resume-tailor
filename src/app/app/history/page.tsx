import Link from 'next/link'
import { requireUser } from '@/lib/supabase/server'

function StatusBadge({ status, score }: { status: string; score: number | null }) {
  if (status === 'done')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        {score}/100
      </span>
    )
  if (status === 'pending')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
        Working…
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
      Failed
    </span>
  )
}

export default async function HistoryPage() {
  const { supabase } = await requireUser()
  const { data: rows } = await supabase
    .from('tailorings')
    .select('id, created_at, status, job_title, job_company, match_score, error')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!rows?.length) {
    return (
      <main className="fade-up">
        <h1 className="text-3xl font-semibold tracking-tightish">History</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-sm text-neutral-600">No tailorings yet.</p>
          <Link
            href="/app"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
          >
            Create your first
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="fade-up">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-semibold tracking-tightish">History</h1>
        <p className="text-xs text-neutral-500">
          {rows.length} tailoring{rows.length === 1 ? '' : 's'}
        </p>
      </div>
      <ul className="mt-6 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-soft">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={`/r/${r.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-neutral-50"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900">
                  {r.job_title ?? 'Untitled'}
                  {r.job_company && (
                    <span className="font-normal text-neutral-500">
                      {' '}
                      · {r.job_company}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <StatusBadge status={r.status} score={r.match_score} />
              <svg
                className="h-4 w-4 flex-none text-neutral-300"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path
                  d="M6 4l4 4-4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
