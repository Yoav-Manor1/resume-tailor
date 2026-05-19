'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'url' | 'text'
type Step =
  | 'idle'
  | 'parsing_resume'
  | 'fetching_jd'
  | 'tailoring'
  | 'done'
  | 'failed'

const STEP_LABELS: Record<Exclude<Step, 'idle' | 'failed'>, string> = {
  parsing_resume: 'Parsing resume',
  fetching_jd: 'Fetching job description',
  tailoring: 'Tailoring bullets',
  done: 'Done',
}
const STEP_ORDER: Step[] = ['parsing_resume', 'fetching_jd', 'tailoring', 'done']

export function TailorForm() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('url')
  const [pdf, setPdf] = useState<File | null>(null)
  const [jdUrl, setJdUrl] = useState('')
  const [jdText, setJdText] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [progress, setProgress] = useState<Step[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const isWorking = step !== 'idle' && step !== 'failed'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setProgress([])
    if (!pdf) {
      setError('Choose a PDF resume.')
      return
    }
    const fd = new FormData()
    fd.set('pdf', pdf)
    if (tab === 'url') fd.set('jd_url', jdUrl)
    else fd.set('jd_text', jdText)
    setStep('parsing_resume')

    const res = await fetch('/api/tailor', { method: 'POST', body: fd })
    if (!res.ok || !res.body) {
      setStep('failed')
      setError('Request failed.')
      return
    }
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.trim()) continue
        const evt = JSON.parse(line) as {
          step: Step
          id?: string
          error?: string
          message?: string
        }
        setStep(evt.step)
        setProgress((prev) => [...prev, evt.step])
        if (evt.step === 'done' && evt.id) {
          router.push(`/r/${evt.id}`)
          return
        }
        if (evt.step === 'failed') {
          setError(evt.message ?? 'Tailoring failed.')
          return
        }
      }
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type === 'application/pdf') setPdf(f)
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-7">
      {/* PDF dropzone */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
          Resume
        </label>
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
            isDragging
              ? 'border-accent bg-indigo-50/50'
              : pdf
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50'
          }`}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
          {pdf ? (
            <div className="flex items-center gap-3 text-sm">
              <svg
                className="h-5 w-5 text-emerald-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-neutral-900">{pdf.name}</span>
              <span className="text-neutral-500">
                {(pdf.size / 1024).toFixed(0)} KB
              </span>
            </div>
          ) : (
            <>
              <svg
                className="h-6 w-6 text-neutral-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path
                  d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-neutral-700">
                <span className="font-medium text-neutral-900">Click to upload</span>{' '}
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-neutral-500">PDF, up to 2&nbsp;MB</p>
            </>
          )}
        </label>
      </div>

      {/* JD input with tabs */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
          Job description
        </label>
        <div className="mt-2 inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-1 text-sm">
          {(['url', 'text'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 font-medium transition ${
                tab === t
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t === 'url' ? 'Job URL' : 'Paste JD'}
            </button>
          ))}
        </div>
        <div className="mt-3">
          {tab === 'url' ? (
            <input
              type="url"
              value={jdUrl}
              onChange={(e) => setJdUrl(e.target.value)}
              placeholder="https://jobs.example.com/listing/123"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900"
            />
          ) : (
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={8}
              placeholder="Paste the full job description here…"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm leading-relaxed shadow-sm transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
        <p className="text-xs text-neutral-500">
          We won&apos;t invent experience you don&apos;t have.
        </p>
        <button
          type="submit"
          disabled={isWorking}
          className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isWorking ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
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
                <path
                  d="M22 12a10 10 0 0 0-10-10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              Working…
            </>
          ) : (
            <>
              Tailor
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
            </>
          )}
        </button>
      </div>

      {(isWorking || progress.length > 0) && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Progress
          </p>
          <ul className="mt-3 space-y-2.5 text-sm">
            {STEP_ORDER.filter((s) => s !== 'done').map((s) => {
              const reached = progress.includes(s)
              const active = step === s
              const complete =
                reached && (STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(s) || step === 'done')
              return (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-semibold transition ${
                      complete
                        ? 'bg-emerald-500 text-white'
                        : active
                          ? 'border-2 border-neutral-900 bg-white text-neutral-900'
                          : 'border border-neutral-300 bg-white text-neutral-400'
                    }`}
                  >
                    {complete ? (
                      <svg
                        className="h-3 w-3"
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
                    ) : active ? (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-900" />
                    ) : null}
                  </span>
                  <span
                    className={
                      complete
                        ? 'text-neutral-900'
                        : active
                          ? 'font-medium text-neutral-900'
                          : 'text-neutral-500'
                    }
                  >
                    {STEP_LABELS[s as keyof typeof STEP_LABELS]}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  )
}
