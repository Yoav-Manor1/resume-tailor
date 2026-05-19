import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { tailorResume } from '@/lib/openai'
import { TailoredOutput } from '@/lib/schema'
import { truncateJd, truncateResume } from '@/lib/limits'
import { TailorError, type ErrorSlug } from '@/lib/errors'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { user, supabase } = await requireUser()
  const { data: row } = await supabase
    .from('tailorings')
    .select('*')
    .eq('id', id)
    .single()
  if (!row || row.user_id !== user.id)
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  if (!row.resume_text || !row.job_text)
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  await supabase
    .from('tailorings')
    .update({ status: 'pending', error: null })
    .eq('id', id)
  try {
    const { text: jdText, truncated: jdTruncated } = truncateJd(row.job_text)
    const { text: resumeText, truncated: resumeTruncated } = truncateResume(
      row.resume_text,
    )
    const tailored = await tailorResume({
      resumeText,
      jdText,
      jdTruncated,
      resumeTruncated,
    })
    TailoredOutput.parse(tailored) // re-validate
    await supabase
      .from('tailorings')
      .update({
        status: 'done',
        tailored,
        job_title: tailored.job_title,
        job_company: tailored.job_company,
        match_score: tailored.match_score,
      })
      .eq('id', id)
  } catch (e) {
    const slug: ErrorSlug = e instanceof TailorError ? e.slug : 'llm_failed'
    await supabase
      .from('tailorings')
      .update({ status: 'failed', error: slug })
      .eq('id', id)
  }
  return NextResponse.redirect(new URL(`/r/${id}`, request.url), 303)
}
