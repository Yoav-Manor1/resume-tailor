export const SYSTEM_PROMPT = `You rewrite resume bullets to mirror the job description's vocabulary, without inventing experience or credentials. Preserve every factual claim: companies, dates, scopes, and metrics in the source resume.

You may:
- Reorder for relevance.
- Sharpen verbs.
- Surface keywords from the JD that the user's existing experience already supports.

You must not:
- Invent companies, roles, dates, technologies, or metrics not present in the source resume.
- Inflate scope (e.g. "led team of 5" if the source says "worked with").
- Add credentials, degrees, or certifications the resume doesn't list.

If the JD demands experience the resume lacks, leave the bullet unchanged rather than fabricate.

Output must conform exactly to the TailoredOutput JSON schema you've been given. Use stable string ids like "exp_1", "exp_2" for resume_skeleton.experience[].id and reference them from bullets[].experience_id.`

export interface BuildPromptArgs {
  resumeText: string
  jdText: string
  jdTruncated: boolean
  resumeTruncated: boolean
}

export function buildPrompt({ resumeText, jdText, jdTruncated, resumeTruncated }: BuildPromptArgs): string {
  const notes: string[] = []
  if (jdTruncated) notes.push('Note: JD was truncated to fit context.')
  if (resumeTruncated) notes.push('Note: resume was truncated to fit context.')

  const body = `=== JOB DESCRIPTION ===
${jdText}

=== RESUME (plain text) ===
${resumeText}

=== TASK ===
Return a TailoredOutput JSON. For every bullet in the resume:
- Set \`original\` to the bullet as written.
- Set \`tailored\` to a rewritten version that mirrors the JD's vocabulary, only if the user's existing experience supports it. Otherwise copy \`original\` unchanged.
- Set \`matched_keywords\` to JD keywords that appear in the rewrite.
Populate \`resume_skeleton\` with the user's contact info, summary, experience entries (each with a stable \`id\` reused in bullets[].experience_id), skills, and education — as they appear in the resume.
Score \`match_score\` 0–100 based on how well the user's actual experience matches the JD.`

  return notes.length ? `${notes.join('\n')}\n\n${body}` : body
}
