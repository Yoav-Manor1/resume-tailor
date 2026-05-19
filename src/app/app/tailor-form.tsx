'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'url' | 'text'
type Step = 'idle' | 'parsing_resume' | 'fetching_jd' | 'tailoring' | 'done' | 'failed'

const STEP_LABELS: Record<Exclude<Step, 'idle' | 'failed'>, string> = {
  parsing_resume: 'Parsing resume',
  fetching_jd: 'Fetching job description',
  tailoring: 'Tailoring bullets',
  done: 'Done',
}

export function TailorForm() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('url')
  const [pdf, setPdf] = useState<File | null>(null)
  const [jdUrl, setJdUrl] = useState('')
  const [jdText, setJdText] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [progress, setProgress] = useState<Step[]>([])
  const [error, setError] = useState<string | null>(null)

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

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <div>
        <label className="block text-sm font-medium">Resume (PDF, max 2 MB)</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
      </div>

      <div>
        <div className="flex gap-4 border-b border-neutral-200 text-sm">
          {(['url', 'text'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-1 py-2 ${
                tab === t
                  ? 'border-neutral-900 font-medium'
                  : 'border-transparent text-neutral-500'
              }`}
            >
              {t === 'url' ? 'Job URL' : 'Paste JD'}
            </button>
          ))}
        </div>
        {tab === 'url' ? (
          <input
            type="url"
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
            placeholder="https://jobs.example.com/listing/123"
            className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        ) : (
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={8}
            placeholder="Paste the full job description here…"
            className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={step !== 'idle' && step !== 'failed'}
        className="rounded-md bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {step === 'idle' || step === 'failed' ? 'Tailor' : 'Working…'}
      </button>

      {progress.length > 0 && (
        <ul className="space-y-1 text-sm">
          {progress.map(
            (s, i) =>
              s !== 'failed' &&
              s !== 'idle' && (
                <li key={i} className="flex items-center gap-2">
                  <span aria-hidden>{s === 'done' || progress[i + 1] ? '✓' : '…'}</span>
                  <span>{STEP_LABELS[s as keyof typeof STEP_LABELS]}</span>
                </li>
              ),
          )}
        </ul>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  )
}
