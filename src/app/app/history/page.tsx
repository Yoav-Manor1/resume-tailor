import Link from 'next/link'
import { requireUser } from '@/lib/supabase/server'

export default async function HistoryPage() {
  const { supabase } = await requireUser()
  const { data: rows } = await supabase
    .from('tailorings')
    .select('id, created_at, status, job_title, job_company, match_score, error')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!rows?.length) {
    return (
      <main>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="mt-2 text-neutral-600">
          No tailorings yet.{' '}
          <Link href="/app" className="underline">
            Create one.
          </Link>
        </p>
      </main>
    )
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold">History</h1>
      <ul className="mt-6 divide-y divide-neutral-200 rounded-md border border-neutral-200">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={`/r/${r.id}`}
              className="flex items-center justify-between p-4 hover:bg-neutral-50"
            >
              <div>
                <div className="font-medium">
                  {r.job_title ?? 'Untitled'}
                  {r.job_company && (
                    <span className="text-neutral-500"> · {r.job_company}</span>
                  )}
                </div>
                <div className="text-xs text-neutral-500">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-right text-sm">
                {r.status === 'done' && <span>{r.match_score}/100</span>}
                {r.status === 'pending' && (
                  <span className="text-neutral-500">working…</span>
                )}
                {r.status === 'failed' && <span className="text-red-700">failed</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
