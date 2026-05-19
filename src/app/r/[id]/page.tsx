import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/supabase/server'
import { TailoredOutput } from '@/lib/schema'
import { BulletDiff } from '@/components/BulletDiff'
import { KeywordChips } from '@/components/KeywordChips'
import { ERROR_MESSAGES, type ErrorSlug } from '@/lib/errors'
import { DownloadPdfButton } from './download-pdf-button'

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data: row } = await supabase
    .from('tailorings')
    .select('*')
    .eq('id', id)
    .single()
  if (!row) notFound()

  if (row.status === 'failed') {
    const slug = (row.error ?? 'llm_failed') as ErrorSlug
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Tailoring failed</h1>
        <p className="mt-2 text-red-700">{ERROR_MESSAGES[slug]}</p>
        <form action={`/api/tailorings/${id}/retry`} method="post" className="mt-4">
          <button className="rounded-md bg-neutral-900 px-4 py-2 text-white">
            Retry
          </button>
        </form>
      </main>
    )
  }

  if (row.status === 'pending' || !row.tailored) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Working…</h1>
        <p className="mt-2 text-neutral-600">
          If this page doesn&apos;t update, reload in a few seconds.
        </p>
        <meta httpEquiv="refresh" content="3" />
      </main>
    )
  }

  const tailored = TailoredOutput.parse(row.tailored)

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tailored.job_title}</h1>
          <p className="text-neutral-600">{tailored.job_company}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">{tailored.match_score}</div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Match</div>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-neutral-700">Keywords</h2>
        <div className="mt-2">
          <KeywordChips
            matched={tailored.matched_keywords}
            missing={tailored.missing_keywords}
          />
        </div>
      </section>

      <section className="mt-8">
        <BulletDiff bullets={tailored.bullets} skeleton={tailored.resume_skeleton} />
      </section>

      <DownloadPdfButton id={id} />
    </main>
  )
}
