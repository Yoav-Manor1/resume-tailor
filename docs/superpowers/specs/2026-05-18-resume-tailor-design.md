# AI Resume Tailor — Design

**Status:** Approved (pending spec review)
**Date:** 2026-05-18
**Audience for the product:** portfolio piece — recruiters, hiring managers, peer engineers viewing the demo.

## Problem

A job seeker has a resume and a target job. Most resume bullets are written generically and don't mirror the language of the specific role they're applying to. ATS and human screeners both reward keyword alignment. Rewriting bullets by hand for every application is tedious and easy to skip.

**The product:** paste a job link (or JD text), upload a resume PDF, get a side-by-side diff of each bullet — original vs. an AI-tailored rewrite that mirrors the JD's language *without inventing experience*. Copy bullets back into the user's own resume document.

## Goals

- A polished, shippable demo that loads fast, looks professional, and tells a clear product story.
- Real auth + database story, not a toy. Demonstrates Next.js App Router, Supabase Auth + Postgres + RLS + Storage, OpenAI structured outputs, and streamed server responses.
- A "wow" moment: a live progress stream during tailoring, then a crisp diff view with keyword highlights.

## Non-goals

- Real user base, billing, abuse plumbing beyond basic rate limits.
- Preserving the user's original visual layout (see "Why diff-not-render" below).
- DOCX export, multi-template picker, browser E2E tests.

## Stack

- **Next.js** (App Router, Node runtime — pdf-parse and react-pdf both need Node).
- **OpenAI API** — `gpt-4o-mini` with structured outputs (`response_format: json_schema`). Env-swappable to `gpt-4o`.
- **Supabase** — Auth (magic link), Postgres (tailorings table), Storage (`resumes` private bucket, `tailored` private bucket).
- **Jina Reader** (`r.jina.ai/<url>`) for JD URL → clean text.
- **@react-pdf/renderer** for optional PDF export.
- **Vitest** for tests.

## Architecture

```
┌─────────────────────────┐      ┌──────────────────────────┐
│   Next.js App Router    │      │  Supabase                │
│                         │◄────►│   Auth (magic link)      │
│   POST /api/tailor      │      │   Postgres (tailorings)  │
│   (Node, SSE stream)    │      │   Storage (PDFs)         │
│                         │      │   RLS by auth.uid()      │
│   POST /api/tailorings  │      └──────────────────────────┘
│        /[id]/pdf        │
└────────────┬────────────┘
             │
             ├──► pdf-parse          (resume PDF → text)
             ├──► r.jina.ai          (JD URL → markdown)
             ├──► OpenAI             (structured outputs → JSON)
             └──► @react-pdf/renderer (lazy export only)
```

## Why diff-not-render

An earlier draft had the LLM produce a full structured resume JSON and `<ResumeTemplate>` render it to PDF as the primary artifact. We rejected that for two reasons:

1. **Users want their layout preserved.** Reconstructing the user's original visual style from a parsed PDF is brittle (pdf-parse drops font/spacing info; pdfjs-dist exposes it but reconstructing hierarchy is unreliable). Any best-effort re-render looks worse than the user's original.
2. **The bullet diff is the actual deliverable.** "Make my bullets match this JD" is the real user need. A diff view screenshots better, costs less, ships faster, and lets the user paste rewrites into whatever document they already maintain.

The PDF template stays in scope as an *optional* "Download as PDF" button for users without the original doc.

## Pages

```
/                     Landing. Headline, before/after bullet animation, "Try it" CTA.
/login                Magic-link form.
/auth/callback        Supabase auth callback handler.
/app                  Authed home. PDF upload + JD URL/textarea tabs + "Tailor" submit.
/app/history          "My Tailorings" — list of past runs (company · role · date · score).
/r/[id]               Result page. Streaming status during work, diff view when done.
```

## Data model

```sql
create table tailorings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  status            text not null default 'pending', -- pending | done | failed
  error             text,                            -- enum slug on failure

  -- inputs
  job_url           text,
  job_text          text not null,                   -- always populated (scraped or pasted)
  resume_pdf_path   text not null,                   -- key in 'resumes' bucket
  resume_text       text,                            -- parsed plain text, cached

  -- outputs
  job_title         text,                            -- extracted by LLM for history list
  job_company       text,                            -- extracted by LLM for history list
  match_score       int,                             -- 0–100
  tailored          jsonb,                           -- bullet-pair payload (see schema below)
  tailored_pdf_path text                             -- nullable; populated on first PDF download
);

create index on tailorings (user_id, created_at desc);

alter table tailorings enable row level security;
create policy "own rows readable"   on tailorings for select using (auth.uid() = user_id);
create policy "own rows insertable" on tailorings for insert with check (auth.uid() = user_id);
create policy "own rows updatable"  on tailorings for update using (auth.uid() = user_id);
```

**Storage buckets:** `resumes` and `tailored`. Both private, keys are `${user_id}/${tailoring_id}.pdf`. Access via signed URLs only; RLS policy on Storage mirrors the table policy.

## LLM output schema

`lib/schema.ts` — single source of truth for the OpenAI `response_format` and for client/server type-checking of the `tailored` JSON.

```ts
const TailoredOutput = z.object({
  job_title:        z.string(),
  job_company:      z.string(),
  match_score:      z.number().int().min(0).max(100),
  matched_keywords: z.array(z.string()),
  missing_keywords: z.array(z.string()),
  bullets: z.array(z.object({
    experience_id:    z.string(),               // FK into resume_skeleton.experience[].id
    original:         z.string(),
    tailored:         z.string(),
    matched_keywords: z.array(z.string()),      // JD keywords now present in the rewrite
  })),
  // Captured once at tailor time so PDF export is deterministic and doesn't need a second LLM call.
  resume_skeleton: z.object({
    name:    z.string(),
    contact: z.object({
      email: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      links: z.array(z.string()).default([]),    // LinkedIn, portfolio, GitHub
    }),
    summary: z.string().optional(),
    experience: z.array(z.object({
      id:       z.string(),                      // stable id used by bullets[].experience_id
      company:  z.string(),
      role:     z.string(),
      dates:    z.string(),
    })),
    skills:    z.array(z.string()).default([]),
    education: z.array(z.object({
      school: z.string(),
      degree: z.string().optional(),
      dates:  z.string().optional(),
    })).default([]),
  }),
})
```

The `bullets[]` and `resume_skeleton.experience[]` are joined by `experience_id` so the diff view can group bullets by job, and the PDF template can inline each bullet under its experience entry without ambiguity.

## Tailoring pipeline (`POST /api/tailor`)

Node runtime, returns `application/x-ndjson`. One JSON object per line.

```ts
export async function POST(req) {
  const { pdf, jdUrl, jdText } = await parseMultipart(req)
  const user = await requireUser(req)
  enforceLimits({ pdf, jdText })                          // see "Limits"

  const jd = jdUrl ? await fetchViaJina(jdUrl) : jdText   // pre-flight; may throw 'jd_unreadable'
  const resumeKey = await uploadResume(user.id, pdf)
  const row = await insert('tailorings', {
    user_id: user.id, status: 'pending',
    job_url: jdUrl ?? null, job_text: jd, resume_pdf_path: resumeKey,
  })

  return stream(async (emit) => {
    try {
      emit({ step: 'parsing_resume' })
      const resumeText = await pdfParse(pdf)
      await update(row.id, { resume_text: resumeText })

      emit({ step: 'fetching_jd' })                       // already done; emitted for the UI

      emit({ step: 'tailoring' })
      const tailored = await openai.responses.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        input: buildPrompt(resumeText, jd),
        response_format: { type: 'json_schema', schema: TailoredOutput },
      })
      await update(row.id, {
        status: 'done',
        tailored,
        job_title:   tailored.job_title,
        job_company: tailored.job_company,
        match_score: tailored.match_score,
      })
      emit({ step: 'done', id: row.id })
    } catch (e) {
      const slug = classifyError(e)
      await update(row.id, { status: 'failed', error: slug })
      emit({ step: 'failed', error: slug })
    }
  })
}
```

**Prompt (`lib/prompt.ts`):** system message anchors the no-fabrication rule:

> You rewrite resume bullets to mirror the job description's vocabulary, *without inventing experience or credentials*. Preserve every factual claim: companies, dates, scopes, metrics. You may reorder for relevance, sharpen verbs, and surface keywords that the user's existing experience already supports. If the JD demands experience the resume doesn't have, leave the bullet untouched rather than fabricate.

Inputs: the JD (truncated to 20k chars) and the parsed resume text (truncated to 15k from the bottom). Output: a `TailoredOutput` JSON.

**Stream protocol:** `application/x-ndjson`. Client reads with `getReader()` + `TextDecoder`, splits on `\n`, parses each line. On `done`, navigates to `/r/[id]`. On `failed`, shows inline error with retry.

**Durability:** the row is created before the stream starts, and `tailored` is written before `done` is emitted. If the user closes the tab mid-stream, reopening `/r/[id]` later shows the completed result. No queue needed.

## Result page (`/r/[id]`)

Server component reads the row (RLS-protected). Renders:

- Header: company · role · match score chip · created-at.
- Keyword strip: `matched_keywords` as filled chips, `missing_keywords` as outlined chips ("the JD asks for these and we couldn't find them in your resume").
- Bullet diff: two columns. Left = `original`. Right = `tailored` with `matched_keywords` highlighted (`<mark>`). Each row has a copy-to-clipboard button on the tailored side.
- Footer: "Download as PDF" button → `POST /api/tailorings/[id]/pdf` → response is the signed Storage URL.

During streaming (`status='pending'`), the page renders a checklist UI driven by the SSE stream from `/api/tailor`. When `status='done'` (either from stream completion or from a reload), it renders the diff.

## PDF export (`POST /api/tailorings/[id]/pdf`)

Lazy. On first call, reads `tailored.resume_skeleton` + `tailored.bullets`, renders via `<ResumeTemplate data={...} />` (the template joins bullets onto their experience by `experience_id`), uploads to `tailored/${user_id}/${id}.pdf`, writes `tailored_pdf_path`, returns a signed URL. On subsequent calls, returns the existing signed URL — no second LLM call ever.

**Template** (`components/ResumeTemplate.tsx`): one file, single column, ATS-friendly. One typeface (Inter via `Font.register`), three sizes (name 22pt / section 11pt bold / body 10pt), generous whitespace. Sections fixed: Name + contact / Summary / Experience / Skills / Education.

## Limits

Enforced in `lib/limits.ts`, called at the top of the route handler:

- Resume PDF: 2 MB max, `application/pdf` only. Reject before parsing.
- JD text: 20k chars, truncated with a UI note if longer.
- Resume parsed text: 15k chars, truncated from the bottom (recent experience matters most).
- Rate limit: 10 tailorings per user per rolling hour, enforced by `select count(*) from tailorings where user_id = ? and created_at > now() - interval '1 hour'`. No Redis.

## Errors

Each failure mode has a specific user-facing message and a stable error slug stored in `tailorings.error`.

| Slug              | Cause                                  | User sees |
|-------------------|----------------------------------------|-----------|
| `pdf_unreadable`  | pdf-parse returned empty/whitespace    | "Couldn't read this PDF (looks scanned). Try a text-based PDF." |
| `jd_unreadable`   | Jina returned <200 chars or non-2xx    | "Couldn't read that link. Paste the JD instead." (pre-flight; no row created) |
| `llm_failed`      | OpenAI timeout, schema mismatch, 5xx   | "Tailoring failed. Retry?" (retry button hits a `POST /api/tailorings/[id]/retry`) |
| `render_failed`   | react-pdf throws during PDF export     | "Couldn't render PDF — please report this." |
| `rate_limited`    | >10 in last hour                       | "You've hit the hourly limit. Try again later." |

## Testing

Scope is "enough to not embarrass yourself during a demo," not full coverage.

**Unit (Vitest):**
- `lib/schema.ts` — known-good payload validates; known-bad rejected.
- `lib/jina.ts` — short-response → throws `jd_unreadable`.
- `lib/limits.ts` — size caps and rate-limit counting.
- `lib/prompt.ts` — snapshot of the assembled prompt to catch accidental regressions.

**Integration (one test):**
- `POST /api/tailor` with fixture PDF + canned JD text + a mocked OpenAI client returning a fixed `TailoredOutput`. Asserts stream emits the expected steps in order, the row reaches `status='done'`, and `tailored` is populated. Runs against local Supabase (`supabase start`).

**Eval (manual, before prompt/model changes):**
- `scripts/eval.ts` — 5 hand-picked `(resume, JD)` pairs. Hits real OpenAI. Asserts on JSON:
  - **No fabrication:** every `company` mentioned in tailored bullets appears in the parsed resume text.
  - **Keyword coverage:** ≥70% of JD top-10 keywords (extracted by a second cheap LLM call) appear in the tailored bullets.
  - `match_score` ∈ [0, 100].
- Not in CI. Costs money, flaky.

**Out of scope:** E2E browser tests, visual regression on PDF, load tests.

## Build order

1. Supabase project + schema + RLS + Storage buckets. Confirm RLS by trying to read another user's row.
2. Magic-link auth + `/login` + `/auth/callback` + middleware that protects `/app/*`.
3. `/app` form (upload + JD tabs). No backend yet — submit logs payload.
4. `lib/schema.ts`, `lib/prompt.ts`, `lib/limits.ts`, `lib/jina.ts` with their unit tests.
5. `POST /api/tailor` with mocked OpenAI; integration test green.
6. `/r/[id]` server component + streaming UI; navigation from `/app` to `/r/[id]`.
7. Real OpenAI; eval script; tune prompt until eval passes.
8. `/app/history` list view.
9. PDF export route + `<ResumeTemplate>`.
10. Landing page + before/after animation.
11. Polish pass (empty states, loading, error UIs, mobile).

## Open questions

None at design time. Decisions worth revisiting after first ship: whether to add `/r/[id]` share-links for anonymous viewing (currently gated by RLS to the owner), and whether to add a second template after seeing the first one in real PDFs.
