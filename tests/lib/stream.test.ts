import { describe, it, expect } from 'vitest'
import { ndjsonStream } from '@/lib/stream'

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let out = ''
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    out += decoder.decode(value)
  }
  return out
}

describe('ndjsonStream', () => {
  it('emits one JSON object per line in order', async () => {
    const stream = ndjsonStream(async (emit) => {
      emit({ step: 'a' })
      emit({ step: 'b', payload: 1 })
      emit({ step: 'done' })
    })
    const text = await readAll(stream)
    const lines = text.trim().split('\n').map(l => JSON.parse(l))
    expect(lines).toEqual([{ step: 'a' }, { step: 'b', payload: 1 }, { step: 'done' }])
  })

  it('emits a failed event when the producer throws', async () => {
    const stream = ndjsonStream(async (emit) => {
      emit({ step: 'a' })
      throw new Error('boom')
    })
    const text = await readAll(stream)
    const lines = text.trim().split('\n').map(l => JSON.parse(l))
    expect(lines[0]).toEqual({ step: 'a' })
    expect(lines[1].step).toBe('failed')
  })
})
