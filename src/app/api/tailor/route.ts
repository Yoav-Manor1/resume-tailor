import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { ndjsonStream } from '@/lib/stream'
import { fetchViaJina } from '@/lib/jina'
import { parseResumePdf } from '@/lib/pdf-parse'
import { tailorResume } from '@/lib/openai'
import {
  assertPdfWithinLimits,
  truncateJd,
  truncateResume,
  MAX_TAILORINGS_PER_HOUR,
} from '@/lib/limits'
import { TailorError, type ErrorSlug } from '@/lib/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  let user: { id: string; email?: string | null }
  let supabase: Awaited<ReturnType<typeof requireUser>>['supabase']
  try {
    const ctx = await requireUser()
    user = ctx.user
    supabase = ctx.supabase
  } catch {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let pdf: File
  let jdUrl: string | null
  let jdText: string
  try {
    const form = await request.formData()
    const pdfEntry = form.get('pdf')
    if (!(pdfEntry instanceof File)) throw new TailorError('invalid_input', 'pdf field missing')
    pdf = pdfEntry
    assertPdfWithinLimits(pdf)

    jdUrl = (form.get('jd_url') as string) || null
    const jdRaw = (form.get('jd_text') as string) || ''
    if (!jdUrl && !jdRaw) throw new TailorError('invalid_input', 'Provide jd_url or jd_text')

    // Rate limit pre-flight.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('tailorings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)
    if ((count ?? 0) >= MAX_TAILORINGS_PER_HOUR) throw new TailorError('rate_limited')

    // JD pre-flight (so we don't create a row that's doomed).
    jdText = jdUrl ? await fetchViaJina(jdUrl) : jdRaw
  } catch (e) {
    const slug: ErrorSlug = e instanceof TailorError ? e.slug : 'invalid_input'
    return NextResponse.json(
      { error: slug, message: (e as Error).message },
      { status: 400 },
    )
  }

  const { text: jdClipped, truncated: jdTruncated } = truncateJd(jdText)

  // Upload original PDF to Storage.
  const resumeKey = `${user.id}/${crypto.randomUUID()}.pdf`
  const { error: upErr } = await supabase.storage
    .from('resumes')
    .upload(resumeKey, new Uint8Array(await pdf.arrayBuffer()), {
      contentType: 'application/pdf',
    })
  if (upErr)
    return NextResponse.json(
      { error: 'invalid_input', message: upErr.message },
      { status: 500 },
    )

  // Create the row.
  const { data: row, error: rowErr } = await supabase
    .from('tailorings')
    .insert({
      user_id: user.id,
      status: 'pending',
      job_url: jdUrl,
      job_text: jdClipped,
      resume_pdf_path: resumeKey,
    })
    .select()
    .single()
  if (rowErr || !row)
    return NextResponse.json(
      { error: 'invalid_input', message: rowErr?.message },
      { status: 500 },
    )

  const stream = ndjsonStream(async (emit) => {
    try {
      emit({ step: 'parsing_resume' })
      const resumeRaw = await parseResumePdf(pdf)
      const { text: resumeText, truncated: resumeTruncated } = truncateResume(resumeRaw)
      await supabase.from('tailorings').update({ resume_text: resumeText }).eq('id', row.id)

      emit({ step: 'fetching_jd' }) // JD was already fetched pre-flight; emitted for the UI.

      emit({ step: 'tailoring' })
      const tailored = await tailorResume({
        resumeText,
        jdText: jdClipped,
        jdTruncated,
        resumeTruncated,
      })

      await supabase
        .from('tailorings')
        .update({
          status: 'done',
          tailored,
          job_title: tailored.job_title,
          job_company: tailored.job_company,
          match_score: tailored.match_score,
        })
        .eq('id', row.id)

      emit({ step: 'done', id: row.id })
    } catch (e) {
      const slug: ErrorSlug = e instanceof TailorError ? e.slug : 'llm_failed'
      await supabase
        .from('tailorings')
        .update({ status: 'failed', error: slug })
        .eq('id', row.id)
      emit({ step: 'failed', error: slug, message: (e as Error).message })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
