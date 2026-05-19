import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchViaJina } from '@/lib/jina'
import { TailorError } from '@/lib/errors'

describe('fetchViaJina', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns markdown for a valid response', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => 'A'.repeat(500),
    })
    const out = await fetchViaJina('https://example.com/job/123')
    expect(out.length).toBe(500)
    expect(fetch).toHaveBeenCalledWith(
      'https://r.jina.ai/https%3A%2F%2Fexample.com%2Fjob%2F123',
      expect.any(Object),
    )
  })

  it('throws jd_unreadable when response is short', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => 'too short',
    })
    await expect(fetchViaJina('https://example.com/x')).rejects.toMatchObject({
      slug: 'jd_unreadable',
    } satisfies Partial<TailorError>)
  })

  it('throws jd_unreadable on non-2xx', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, status: 502, text: async () => '',
    })
    await expect(fetchViaJina('https://example.com/x')).rejects.toMatchObject({ slug: 'jd_unreadable' })
  })

  it('throws invalid_input for non-URL strings', async () => {
    await expect(fetchViaJina('not a url')).rejects.toMatchObject({ slug: 'invalid_input' })
  })
})
