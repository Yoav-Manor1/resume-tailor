import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Mock auth + Supabase + OpenAI before importing the route.
vi.mock('@/lib/supabase/server', () => {
  const calls: unknown[] = []
  const inserted: Record<string, unknown> = { id: 'row_1', user_id: 'user_1' }
  return {
    requireUser: async () => ({
      user: { id: 'user_1', email: 't@example.com' },
      supabase: {
        from: () => ({
          insert: (row: object) => ({
            select: () => ({
              single: async () => ({ data: { ...inserted, ...row }, error: null }),
            }),
          }),
          update: (patch: object) => ({
            eq: () => {
              calls.push(patch)
              return { error: null }
            },
          }),
          select: () => ({
            eq: () => ({ gte: () => ({ data: [], error: null, count: 0 }) }),
          }),
        }),
        storage: {
          from: () => ({
            upload: async () => ({ data: { path: 'user_1/row_1.pdf' }, error: null }),
          }),
        },
      },
      __calls: calls,
    }),
    createClient: async () => {
      throw new Error('not used in test')
    },
  }
})

vi.mock('@/lib/openai', () => ({
  tailorResume: async () => ({
    job_title: 'Senior Backend Engineer',
    job_company: 'Acme Co',
    match_score: 82,
    matched_keywords: ['Go', 'Postgres'],
    missing_keywords: [],
    bullets: [
      {
        experience_id: 'exp_1',
        original: 'Built backend services in Python.',
        tailored: 'Built Go backend services.',
        matched_keywords: ['Go'],
      },
    ],
    resume_skeleton: {
      name: 'Jane Doe',
      contact: { email: 'jane@example.com', links: [] },
      summary: '',
      experience: [
        { id: 'exp_1', company: 'Foo Corp', role: 'Senior Engineer', dates: '2022–Present' },
      ],
      skills: [],
      education: [],
    },
  }),
}))

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, text: async () => 'A'.repeat(500) }),
  )
})

describe('POST /api/tailor (mocked)', () => {
  it('streams expected steps and ends with done', async () => {
    const { POST } = await import('@/app/api/tailor/route')
    const pdf = readFileSync(path.join(process.cwd(), 'tests/fixtures/sample-resume.pdf'))
    const fd = new FormData()
    fd.set('pdf', new File([pdf], 'r.pdf', { type: 'application/pdf' }))
    fd.set('jd_url', 'https://example.com/job/1')

    const req = new Request('http://localhost/api/tailor', { method: 'POST', body: fd })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/application\/x-ndjson/)

    const text = await res.text()
    const events = text
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l))
    const steps = events.map((e) => e.step)
    expect(steps).toContain('parsing_resume')
    expect(steps).toContain('fetching_jd')
    expect(steps).toContain('tailoring')
    expect(steps[steps.length - 1]).toBe('done')
    expect(events[events.length - 1].id).toBe('row_1')
  })
})
