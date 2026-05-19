import OpenAI from 'openai'
import { z } from 'zod'
import { TailoredOutput, type TailoredOutput as TTailoredOutput } from './schema'
import { SYSTEM_PROMPT, buildPrompt, type BuildPromptArgs } from './prompt'
import { TailorError } from './errors'

let _client: OpenAI | null = null
function client() {
  if (_client) return _client
  if (!process.env.OPENAI_API_KEY) throw new TailorError('llm_failed', 'OPENAI_API_KEY not set')
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

// Zod v4 ships a native JSON Schema generator. Use it directly — we previously
// tried zod-to-json-schema with target:'openAi', which returns a broken $ref
// stub for v4 schemas.
const tailoredJsonSchema = z.toJSONSchema(TailoredOutput) as Record<string, unknown>

export interface TailorArgs extends BuildPromptArgs {
  model?: string
}

export async function tailorResume(args: TailorArgs): Promise<TTailoredOutput> {
  const model = args.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const userPrompt = buildPrompt(args)

  let raw: string
  try {
    const completion = await client().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'TailoredOutput', strict: true, schema: tailoredJsonSchema },
      },
    })
    raw = completion.choices[0]?.message?.content ?? ''
  } catch (e) {
    throw new TailorError('llm_failed', `OpenAI call failed: ${(e as Error).message}`)
  }

  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch {
    throw new TailorError('llm_failed', 'OpenAI returned non-JSON content')
  }
  const result = TailoredOutput.safeParse(parsed)
  if (!result.success) {
    throw new TailorError('llm_failed', `Schema mismatch: ${result.error.message}`)
  }
  return result.data
}
