import { TailorError } from './errors'

const MIN_LENGTH = 200

export async function fetchViaJina(url: string): Promise<string> {
  let parsed: URL
  try { parsed = new URL(url) } catch { throw new TailorError('invalid_input', `Not a URL: ${url}`) }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TailorError('invalid_input', `Unsupported protocol: ${parsed.protocol}`)
  }

  const target = `https://r.jina.ai/${encodeURIComponent(parsed.toString())}`
  const res = await fetch(target, {
    headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => { throw new TailorError('jd_unreadable', 'Network error fetching JD') })

  if (!res.ok) throw new TailorError('jd_unreadable', `Jina returned ${res.status}`)

  const text = await res.text()
  if (text.trim().length < MIN_LENGTH) {
    throw new TailorError('jd_unreadable', `Response too short (${text.length} chars)`)
  }
  return text
}
