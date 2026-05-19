import { describe, it, expect } from 'vitest'
import { assertPdfWithinLimits, truncateJd, truncateResume, MAX_TAILORINGS_PER_HOUR } from '@/lib/limits'
import { TailorError } from '@/lib/errors'

describe('limits', () => {
  it('rejects PDFs over 2MB', () => {
    const big = new File([new Uint8Array(2_100_000)], 'r.pdf', { type: 'application/pdf' })
    expect(() => assertPdfWithinLimits(big)).toThrow(TailorError)
  })
  it('rejects non-PDF MIME types', () => {
    const docx = new File([new Uint8Array(1000)], 'r.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    expect(() => assertPdfWithinLimits(docx)).toThrow(TailorError)
  })
  it('accepts a small PDF', () => {
    const pdf = new File([new Uint8Array(1_000_000)], 'r.pdf', { type: 'application/pdf' })
    expect(() => assertPdfWithinLimits(pdf)).not.toThrow()
  })
  it('truncates long JD to 20k chars', () => {
    const long = 'x'.repeat(25_000)
    const out = truncateJd(long)
    expect(out.text.length).toBeLessThanOrEqual(20_000)
    expect(out.truncated).toBe(true)
  })
  it('does not truncate short JD', () => {
    expect(truncateJd('x'.repeat(100))).toEqual({ text: 'x'.repeat(100), truncated: false })
  })
  it('truncates resume text from the bottom to 15k', () => {
    const long = 'A'.repeat(10_000) + 'B'.repeat(10_000)
    const out = truncateResume(long)
    expect(out.text.length).toBe(15_000)
    expect(out.text.startsWith('A')).toBe(true)
    expect(out.truncated).toBe(true)
  })
  it('exports an hourly rate limit constant', () => {
    expect(MAX_TAILORINGS_PER_HOUR).toBe(10)
  })
})
