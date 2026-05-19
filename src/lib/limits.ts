import { TailorError } from './errors'

export const MAX_PDF_BYTES = 2 * 1024 * 1024 // 2 MB
export const MAX_JD_CHARS = 20_000
export const MAX_RESUME_CHARS = 15_000
export const MAX_TAILORINGS_PER_HOUR = 10

export function assertPdfWithinLimits(file: File): void {
  if (file.type !== 'application/pdf') {
    throw new TailorError('invalid_input', 'Only PDF files are accepted.')
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new TailorError('invalid_input', `PDF exceeds ${MAX_PDF_BYTES} bytes.`)
  }
}

export function truncateJd(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_JD_CHARS) return { text, truncated: false }
  return { text: text.slice(0, MAX_JD_CHARS), truncated: true }
}

export function truncateResume(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_RESUME_CHARS) return { text, truncated: false }
  // Keep the TOP — recent experience usually appears at the top of a resume.
  return { text: text.slice(0, MAX_RESUME_CHARS), truncated: true }
}
