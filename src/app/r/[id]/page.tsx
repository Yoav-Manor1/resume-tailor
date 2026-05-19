import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/supabase/server'
import { TailoredOutput } from '@/lib/schema'
import { BulletDiff } from '@/components/BulletDiff'
import { KeywordChips } from '@/components/KeywordChips'
import { ERROR_MESSAGES, type ErrorSlug } from '@/lib/errors'
import { DownloadPdfButton } from './download-pdf-button'
import { CopyAllButton } from './copy-all-button'

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

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
      <main className="fade-up rounded-2xl border border-red-200 bg-white p-8 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tightish">
              Tailoring failed
            </h1>
            <p className="mt-1 text-sm text-neutral-600">{ERROR_MESSAGES[slug]}</p>
            <form action={`/api/tailorings/${id}/retry`} method="post" className="mt-5">
              <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800">
                Retry
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  if (row.status === 'pending' || !row.tailored) {
    return (
      <main className="fade-up rounded-2xl border border-neutral-200 bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 animate-spin text-neutral-400"
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
          <h1 className="text-xl font-semibold tracking-tightish">Working…</h1>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          This page will refresh automatically.
        </p>
        <meta httpEquiv="refresh" content="3" />
      </main>
    )
  }

  const tailored = TailoredOutput.parse(row.tailored)

  return (
    <main className="fade-up">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-neutral-200 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Tailored for
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tightish text-neutral-900">
            {tailored.job_title}
          </h1>
          {tailored.job_company && (
            <p className="mt-1 text-neutral-600">{tailored.job_company}</p>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-5xl font-semibold tracking-tightish ${scoreColor(tailored.match_score)}`}
            >
              {tailored.match_score}
            </span>
            <span className="text-lg text-neutral-400">/100</span>
          </div>
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            Match score
          </div>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Keywords
        </h2>
        <div className="mt-3">
          <KeywordChips
            matched={tailored.matched_keywords}
            missing={tailored.missing_keywords}
          />
        </div>
      </section>

      <section className="mt-10">
        <BulletDiff bullets={tailored.bullets} skeleton={tailored.resume_skeleton} />
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6">
        <p className="text-xs text-neutral-500">
          Paste these bullets into your own resume — or grab a quick PDF.
        </p>
        <div className="flex items-center gap-2">
          <CopyAllButton
            bullets={tailored.bullets}
            skeleton={tailored.resume_skeleton}
          />
          <DownloadPdfButton id={id} />
        </div>
      </div>
    </main>
  )
}
