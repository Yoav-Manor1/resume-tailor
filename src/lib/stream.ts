import { TailorError, type ErrorSlug } from './errors'

export type StreamEvent =
  | { step: 'parsing_resume' }
  | { step: 'fetching_jd' }
  | { step: 'tailoring' }
  | { step: 'done'; id: string }
  | { step: 'failed'; error: ErrorSlug; message?: string }
  | { step: string; [k: string]: unknown }

export type Emitter = (event: StreamEvent) => void

export function ndjsonStream(producer: (emit: Emitter) => Promise<void>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      const emit: Emitter = (event) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      }
      try {
        await producer(emit)
      } catch (e) {
        const slug: ErrorSlug = e instanceof TailorError ? e.slug : 'llm_failed'
        emit({ step: 'failed', error: slug, message: (e as Error).message })
      } finally {
        controller.close()
      }
    },
  })
}
