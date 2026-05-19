export type ErrorSlug =
  | 'pdf_unreadable'
  | 'jd_unreadable'
  | 'llm_failed'
  | 'render_failed'
  | 'rate_limited'
  | 'invalid_input'

export class TailorError extends Error {
  constructor(public slug: ErrorSlug, message?: string) {
    super(message ?? slug)
    this.name = 'TailorError'
  }
}

export const ERROR_MESSAGES: Record<ErrorSlug, string> = {
  pdf_unreadable: "Couldn't read this PDF (looks scanned). Try a text-based PDF.",
  jd_unreadable:  "Couldn't read that link. Paste the JD instead.",
  llm_failed:     'Tailoring failed. Retry?',
  render_failed:  "Couldn't render PDF — please report this.",
  rate_limited:   "You've hit the hourly limit. Try again later.",
  invalid_input:  'Please check your inputs and try again.',
}
