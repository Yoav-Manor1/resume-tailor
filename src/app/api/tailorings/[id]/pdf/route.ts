import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { TailoredOutput } from '@/lib/schema'
import { renderTailoredPdf } from '@/lib/render-pdf'
import { ERROR_MESSAGES } from '@/lib/errors'

export const runtime = 'nodejs'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { user, supabase } = await requireUser()
  const { data: row } = await supabase
    .from('tailorings')
    .select('*')
    .eq('id', id)
    .single()
  if (!row || row.status !== 'done' || !row.tailored) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  // If already rendered, just sign the existing object.
  if (row.tailored_pdf_path) {
    const { data: signed } = await supabase.storage
      .from('tailored')
      .createSignedUrl(row.tailored_pdf_path, 60 * 10)
    if (signed?.signedUrl) return NextResponse.json({ url: signed.signedUrl })
  }

  const tailored = TailoredOutput.parse(row.tailored)
  let pdf: Buffer
  try {
    pdf = await renderTailoredPdf(tailored)
  } catch {
    return NextResponse.json(
      { error: 'render_failed', message: ERROR_MESSAGES.render_failed },
      { status: 500 },
    )
  }

  const key = `${user.id}/${row.id}.pdf`
  const { error: upErr } = await supabase.storage
    .from('tailored')
    .upload(key, pdf, { contentType: 'application/pdf', upsert: true })
  if (upErr)
    return NextResponse.json(
      { error: 'render_failed', message: upErr.message },
      { status: 500 },
    )

  await supabase.from('tailorings').update({ tailored_pdf_path: key }).eq('id', id)

  const { data: signed } = await supabase.storage
    .from('tailored')
    .createSignedUrl(key, 60 * 10)
  return NextResponse.json({ url: signed?.signedUrl })
}
