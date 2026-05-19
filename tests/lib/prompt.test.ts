import { describe, it, expect } from 'vitest'
import { buildPrompt, SYSTEM_PROMPT } from '@/lib/prompt'

describe('buildPrompt', () => {
  it('includes the no-fabrication rule in the system prompt', () => {
    expect(SYSTEM_PROMPT).toMatch(/without inventing experience/i)
    expect(SYSTEM_PROMPT).toMatch(/preserve every factual claim/i)
  })

  it('produces stable user prompt content (snapshot)', () => {
    const out = buildPrompt({
      resumeText: 'RESUME TEXT GOES HERE',
      jdText: 'JD TEXT GOES HERE',
      jdTruncated: false,
      resumeTruncated: false,
    })
    expect(out).toMatchInlineSnapshot(`
"=== JOB DESCRIPTION ===
JD TEXT GOES HERE

=== RESUME (plain text) ===
RESUME TEXT GOES HERE

=== TASK ===
Return a TailoredOutput JSON. For every bullet in the resume:
- Set \`original\` to the bullet as written.
- Set \`tailored\` to a rewritten version that mirrors the JD's vocabulary, only if the user's existing experience supports it. Otherwise copy \`original\` unchanged.
- Set \`matched_keywords\` to JD keywords that appear in the rewrite.
Populate \`resume_skeleton\` with the user's contact info, summary, experience entries (each with a stable \`id\` reused in bullets[].experience_id), skills, and education — as they appear in the resume.
Score \`match_score\` 0–100 based on how well the user's actual experience matches the JD."
    `)
  })

  it('annotates truncation when inputs were cut', () => {
    const out = buildPrompt({
      resumeText: 'r', jdText: 'j', jdTruncated: true, resumeTruncated: true,
    })
    expect(out).toMatch(/JD was truncated/i)
    expect(out).toMatch(/resume was truncated/i)
  })
})
