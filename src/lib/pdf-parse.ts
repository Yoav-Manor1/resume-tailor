import { TailorError } from './errors'

export async function parseResumePdf(file: File): Promise<string> {
  // pdf-parse v2 uses a class-based API; import dynamically so Next.js Edge
  // analyzers don't choke on the CJS/ESM boundary.
  const { PDFParse } = await import('pdf-parse')
  const buf = Buffer.from(await file.arrayBuffer())
  let text: string
  try {
    const parser = new PDFParse({ data: buf })
    const result = await parser.getText()
    text = (result.text ?? '').trim()
  } catch (e) {
    throw new TailorError('pdf_unreadable', `pdf-parse threw: ${(e as Error).message}`)
  }
  if (text.length < 50) {
    throw new TailorError('pdf_unreadable', `Extracted only ${text.length} chars — likely a scanned PDF.`)
  }
  return text
}
