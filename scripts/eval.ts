#!/usr/bin/env tsx
import 'dotenv/config'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'
import { tailorResume } from '../src/lib/openai'

interface Pair {
  name: string
  resume: string
  jd: string
}

async function extractTopKeywords(jd: string): Promise<string[]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const c = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `List the 10 most important hard-skill keywords from this JD as a JSON array of strings. JD:\n${jd}`,
      },
    ],
    response_format: { type: 'json_object' },
  })
  const raw = c.choices[0]?.message?.content ?? '{}'
  const obj = JSON.parse(raw) as { keywords?: string[] } | string[]
  return Array.isArray(obj) ? obj : obj.keywords ?? []
}

async function run() {
  const dir = path.join(process.cwd(), 'tests/fixtures/eval-pairs')
  const pairs = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as Pair)

  let pass = 0,
    fail = 0
  for (const p of pairs) {
    console.log(`\n--- ${p.name} ---`)
    const out = await tailorResume({
      resumeText: p.resume,
      jdText: p.jd,
      jdTruncated: false,
      resumeTruncated: false,
    })
    const keywords = await extractTopKeywords(p.jd)

    // No fabrication: every company in resume_skeleton.experience must appear in the source resume text.
    const fabricated = out.resume_skeleton.experience.filter(
      (e) => !p.resume.includes(e.company),
    )
    if (fabricated.length) {
      console.error(
        'FAIL: fabricated companies:',
        fabricated.map((e) => e.company),
      )
      fail++
      continue
    }

    // Keyword coverage: ≥70% of top-10 JD keywords appear in tailored bullets.
    const allTailored = out.bullets.map((b) => b.tailored).join(' ').toLowerCase()
    const present = keywords.filter((k) => allTailored.includes(k.toLowerCase()))
    const coverage = keywords.length ? present.length / keywords.length : 0
    if (coverage < 0.7) {
      console.error(`FAIL: keyword coverage ${(coverage * 100).toFixed(0)}%`, {
        missing: keywords.filter((k) => !present.includes(k)),
      })
      fail++
      continue
    }

    // Score in range.
    if (out.match_score < 0 || out.match_score > 100) {
      console.error('FAIL: bad match_score')
      fail++
      continue
    }

    console.log(
      `PASS (coverage ${(coverage * 100).toFixed(0)}%, score ${out.match_score})`,
    )
    pass++
  }
  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
