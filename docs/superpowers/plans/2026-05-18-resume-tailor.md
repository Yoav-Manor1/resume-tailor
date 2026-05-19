# AI Resume Tailor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a portfolio-grade Next.js app that tailors resume bullets to a target job: upload a resume PDF + paste/scrape a JD, get a streamed side-by-side bullet diff with keyword highlights, optional PDF download. Auth + history via Supabase.

**Architecture:** Next.js App Router (Node runtime). `POST /api/tailor` streams NDJSON progress events while it parses the PDF (`pdf-parse`), fetches the JD (`r.jina.ai`), and calls OpenAI with `response_format: json_schema`. Result + structured payload land in a `tailorings` row guarded by RLS; `/r/[id]` renders the diff view; PDF export is lazy.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (Auth + Postgres + Storage) via `@supabase/ssr` · OpenAI SDK (`gpt-4o-mini` with structured outputs) · `pdf-parse` · `@react-pdf/renderer` · Zod · Vitest.

**Spec:** `docs/superpowers/specs/2026-05-18-resume-tailor-design.md`

---

## Conventions

- Working directory is `/Users/ymanor/Git_projects/` (already a git repo).
- All paths below are relative to that directory unless noted.
- Run commands from that directory.
- Commit after each task. Conventional commits (`feat:`, `test:`, `chore:`, `fix:`).
- TypeScript strict mode. No `any` unless explicitly justified inline.
- Tests use Vitest. Test files live alongside `src/` under `tests/`.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Verify clean directory and existing git**

Run:
```bash
ls -la
git status
```
Expected: `docs/`, `.git/`, `.superpowers/` exist; no `package.json` yet; clean working tree.

- [ ] **Step 2: Initialize Next.js + TS + Tailwind manually (avoid create-next-app interactivity)**

Create `package.json`:
```json
{
  "name": "resume-tailor",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "15.0.3",
    "react": "19.0.0-rc-66855b96-20241106",
    "react-dom": "19.0.0-rc-66855b96-20241106"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.6.3",
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '3mb' } },
  // pdf-parse and @react-pdf/renderer are CJS — let Next.js trace them, don't externalize.
  serverExternalPackages: ['pdf-parse', '@react-pdf/renderer'],
}
export default nextConfig
```

- [ ] **Step 5: Tailwind + globals**

`postcss.config.mjs`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

`tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
```

`src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: light; }
body { @apply bg-white text-neutral-900 antialiased; }
mark { @apply bg-yellow-100 text-neutral-900 rounded px-0.5; }
```

- [ ] **Step 6: Root layout + landing placeholder**

`src/app/layout.tsx`:
```tsx
import './globals.css'
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
export const metadata = { title: 'Resume Tailor', description: 'AI-tailored resume bullets for any job.' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

`src/app/page.tsx`:
```tsx
export default function Landing() {
  return (
    <main className="mx-auto max-w-2xl p-10">
      <h1 className="text-3xl font-semibold">Resume Tailor</h1>
      <p className="mt-2 text-neutral-600">Coming soon.</p>
    </main>
  )
}
```

- [ ] **Step 7: `.gitignore` and `.env.example`**

`.gitignore`:
```
node_modules
.next
.env
.env.local
*.tsbuildinfo
.DS_Store
.superpowers
coverage
```

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

- [ ] **Step 8: Vitest config**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
```

`next-env.d.ts`:
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 9: Install and verify build**

Run:
```bash
npm install
npm run typecheck
npm run build
```
Expected: install succeeds; typecheck clean; `next build` finishes with the landing route compiled.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + Vitest"
```

---

## Task 2: Supabase schema + RLS + Storage

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Install Supabase CLI prerequisite check**

Run:
```bash
supabase --version
```
Expected: a version like `1.x.x` or `2.x.x`. If missing, run `brew install supabase/tap/supabase`.

- [ ] **Step 2: Initialize Supabase locally**

Run:
```bash
supabase init
```
Expected: creates `supabase/config.toml` and `supabase/migrations/` directory.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/0001_init.sql`:
```sql
-- Tailorings table
create table public.tailorings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  status            text not null default 'pending' check (status in ('pending','done','failed')),
  error             text,
  job_url           text,
  job_text          text not null,
  resume_pdf_path   text not null,
  resume_text       text,
  job_title         text,
  job_company       text,
  match_score       int check (match_score is null or (match_score between 0 and 100)),
  tailored          jsonb,
  tailored_pdf_path text
);

create index tailorings_user_created_idx
  on public.tailorings (user_id, created_at desc);

-- RLS
alter table public.tailorings enable row level security;

create policy "own rows readable"
  on public.tailorings for select
  using (auth.uid() = user_id);

create policy "own rows insertable"
  on public.tailorings for insert
  with check (auth.uid() = user_id);

create policy "own rows updatable"
  on public.tailorings for update
  using (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('tailored', 'tailored', false)
  on conflict (id) do nothing;

-- Storage policies: users can read/write objects under their own user_id/ prefix.
create policy "own resume objects readable"
  on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own resume objects insertable"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own tailored objects readable"
  on storage.objects for select to authenticated
  using (bucket_id = 'tailored' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own tailored objects insertable"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'tailored' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 4: Start local Supabase and apply migration**

Run:
```bash
supabase start
```
Expected: prints API URL, anon key, service role key, studio URL. Migration `0001_init.sql` is applied automatically.

- [ ] **Step 5: Capture local env values**

From the output of `supabase start`, copy into `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon key>
SUPABASE_SERVICE_ROLE_KEY=<the service_role key>
OPENAI_API_KEY=sk-... (real key)
OPENAI_MODEL=gpt-4o-mini
```

- [ ] **Step 6: Smoke-test RLS via psql**

Run:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "select * from public.tailorings;"
```
Expected: zero rows, no errors. (Superuser bypasses RLS — this just confirms the table exists.)

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat(db): tailorings table with RLS + private storage buckets"
```

---

## Task 3: Supabase clients (browser, server, middleware)

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`

- [ ] **Step 1: Install Supabase SSR + JS clients**

Run:
```bash
npm install @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: Browser client** — `src/lib/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 3: Server client (RSC + route handlers)** — `src/lib/supabase/server.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {
            // RSC cookie writes are ignored — middleware handles refresh.
          }
        },
      },
    },
  )
}

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  return { user, supabase }
}
```

- [ ] **Step 4: Middleware helper** — `src/lib/supabase/middleware.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const protectedPath = path.startsWith('/app') || path.startsWith('/r/')
  if (protectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  return response
}
```

- [ ] **Step 5: Next.js middleware entry** — `src/middleware.ts`

```ts
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: passes clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(auth): supabase ssr clients + auth middleware"
```

---

## Task 4: Magic-link login flow

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/login/login-form.tsx`, `src/app/auth/callback/route.ts`, `src/app/logout/route.ts`

- [ ] **Step 1: Login page** — `src/app/login/page.tsx` (server component, just renders the form)

```tsx
import { LoginForm } from './login-form'
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <main className="mx-auto max-w-md p-10">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-neutral-600">We'll email you a magic link.</p>
      <LoginForm next={next ?? '/app'} />
    </main>
  )
}
```

- [ ] **Step 2: Login form** — `src/app/login/login-form.tsx`

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError(null)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    if (error) { setError(error.message); setState('error'); return }
    setState('sent')
  }

  if (state === 'sent') {
    return <p className="mt-6 rounded-md bg-green-50 p-4 text-green-800">Check {email} for your sign-in link.</p>
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <input
        type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border border-neutral-300 px-3 py-2"
      />
      <button
        type="submit" disabled={state === 'sending'}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50"
      >
        {state === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 3: Auth callback** — `src/app/auth/callback/route.ts`

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/app'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL('/login?error=auth', url.origin))
}
```

- [ ] **Step 4: Logout** — `src/app/logout/route.ts`

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}
```

- [ ] **Step 5: Manual smoke test**

Run:
```bash
npm run dev
```
In browser: visit `http://localhost:3000/app` → should redirect to `/login?next=/app`. Submit your email. Open the Supabase Studio Inbucket (printed by `supabase start`) at `http://127.0.0.1:54324`. Click the magic link → should land on `/app` (will 404 until Task 5). Confirm there's no error.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(auth): magic-link login + callback + logout"
```

---

## Task 5: `lib/schema.ts` — Zod TailoredOutput

**Files:**
- Create: `src/lib/schema.ts`, `tests/lib/schema.test.ts`, `tests/fixtures/canned-tailored.json`

- [ ] **Step 1: Install Zod and zod-to-json-schema**

Run:
```bash
npm install zod zod-to-json-schema
```

- [ ] **Step 2: Write the failing test** — `tests/lib/schema.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { TailoredOutput } from '@/lib/schema'
import canned from '../fixtures/canned-tailored.json'

describe('TailoredOutput', () => {
  it('accepts a known-good payload', () => {
    const parsed = TailoredOutput.parse(canned)
    expect(parsed.match_score).toBe(82)
    expect(parsed.bullets.length).toBeGreaterThan(0)
    expect(parsed.resume_skeleton.experience[0].id).toBeDefined()
  })

  it('rejects out-of-range match_score', () => {
    const bad = { ...canned, match_score: 150 }
    expect(() => TailoredOutput.parse(bad)).toThrow()
  })

  it('rejects bullets missing experience_id', () => {
    const bad = structuredClone(canned)
    delete (bad.bullets[0] as Record<string, unknown>).experience_id
    expect(() => TailoredOutput.parse(bad)).toThrow()
  })
})
```

- [ ] **Step 3: Create the fixture** — `tests/fixtures/canned-tailored.json`

```json
{
  "job_title": "Senior Backend Engineer",
  "job_company": "Acme Co",
  "match_score": 82,
  "matched_keywords": ["Go", "Kubernetes", "Postgres", "gRPC"],
  "missing_keywords": ["Kafka"],
  "bullets": [
    {
      "experience_id": "exp_1",
      "original": "Built backend services in Python.",
      "tailored": "Built Go backend services on Kubernetes, exposing gRPC APIs backed by Postgres.",
      "matched_keywords": ["Go", "Kubernetes", "gRPC", "Postgres"]
    },
    {
      "experience_id": "exp_1",
      "original": "Worked on the data pipeline.",
      "tailored": "Worked on the data pipeline; designed Postgres schemas for high-write workloads.",
      "matched_keywords": ["Postgres"]
    }
  ],
  "resume_skeleton": {
    "name": "Jane Doe",
    "contact": {
      "email": "jane@example.com",
      "phone": "+1-555-0100",
      "location": "Brooklyn, NY",
      "links": ["linkedin.com/in/janedoe"]
    },
    "summary": "Backend engineer with 6 years of experience building distributed systems.",
    "experience": [
      { "id": "exp_1", "company": "Foo Corp", "role": "Senior Engineer", "dates": "2022–Present" }
    ],
    "skills": ["Go", "Python", "Postgres", "Kubernetes", "gRPC"],
    "education": [
      { "school": "State U", "degree": "B.S. Computer Science", "dates": "2014–2018" }
    ]
  }
}
```

- [ ] **Step 4: Run test to verify failure**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: fails — `Cannot find module '@/lib/schema'`.

- [ ] **Step 5: Implement schema** — `src/lib/schema.ts`

```ts
import { z } from 'zod'

export const Bullet = z.object({
  experience_id:    z.string(),
  original:         z.string(),
  tailored:         z.string(),
  matched_keywords: z.array(z.string()),
})

export const ResumeSkeleton = z.object({
  name:    z.string(),
  contact: z.object({
    email:    z.string().optional(),
    phone:    z.string().optional(),
    location: z.string().optional(),
    links:    z.array(z.string()).default([]),
  }),
  summary: z.string().optional(),
  experience: z.array(z.object({
    id:       z.string(),
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
})

export const TailoredOutput = z.object({
  job_title:        z.string(),
  job_company:      z.string(),
  match_score:      z.number().int().min(0).max(100),
  matched_keywords: z.array(z.string()),
  missing_keywords: z.array(z.string()),
  bullets:          z.array(Bullet),
  resume_skeleton:  ResumeSkeleton,
})

export type TailoredOutput = z.infer<typeof TailoredOutput>
export type ResumeSkeleton = z.infer<typeof ResumeSkeleton>
export type Bullet = z.infer<typeof Bullet>
```

- [ ] **Step 6: Run test to verify pass**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: 3 passing.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(schema): zod TailoredOutput + fixture"
```

---

## Task 6: `lib/jina.ts` — JD URL fetcher

**Files:**
- Create: `src/lib/jina.ts`, `tests/lib/jina.test.ts`, `src/lib/errors.ts`

- [ ] **Step 1: Define error slugs first** — `src/lib/errors.ts`

```ts
export type ErrorSlug =
  | 'pdf_unreadable'
  | 'jd_unreadable'
  | 'llm_failed'
  | 'render_failed'
  | 'rate_limited'
  | 'invalid_input'

export class TailorError extends Error {
  constructor(public slug: ErrorSlug, message?: string) {
    super(message ?? slug)
    this.name = 'TailorError'
  }
}

export const ERROR_MESSAGES: Record<ErrorSlug, string> = {
  pdf_unreadable: "Couldn't read this PDF (looks scanned). Try a text-based PDF.",
  jd_unreadable:  "Couldn't read that link. Paste the JD instead.",
  llm_failed:     'Tailoring failed. Retry?',
  render_failed:  "Couldn't render PDF — please report this.",
  rate_limited:   "You've hit the hourly limit. Try again later.",
  invalid_input:  'Please check your inputs and try again.',
}
```

- [ ] **Step 2: Write the failing test** — `tests/lib/jina.test.ts`

```ts
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
```

- [ ] **Step 3: Run test to verify failure**

Run: `npm test -- tests/lib/jina.test.ts`
Expected: fails — `fetchViaJina` not exported.

- [ ] **Step 4: Implement** — `src/lib/jina.ts`

```ts
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
```

- [ ] **Step 5: Run test to verify pass**

Run: `npm test -- tests/lib/jina.test.ts`
Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(jina): JD URL fetcher with short-response detection"
```

---

## Task 7: `lib/limits.ts` — size caps + rate limit

**Files:**
- Create: `src/lib/limits.ts`, `tests/lib/limits.test.ts`

- [ ] **Step 1: Write the failing test** — `tests/lib/limits.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { assertPdfWithinLimits, truncateJd, truncateResume, MAX_TAILORINGS_PER_HOUR } from '@/lib/limits'
import { TailorError } from '@/lib/errors'

describe('limits', () => {
  it('rejects PDFs over 2MB', () => {
    const big = new File([new Uint8Array(2_100_000)], 'r.pdf', { type: 'application/pdf' })
    expect(() => assertPdfWithinLimits(big)).toThrow(TailorError)
  })
  it('rejects non-PDF MIME types', () => {
    const docx = new File([new Uint8Array(1000)], 'r.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    expect(() => assertPdfWithinLimits(docx)).toThrow(TailorError)
  })
  it('accepts a small PDF', () => {
    const pdf = new File([new Uint8Array(1_000_000)], 'r.pdf', { type: 'application/pdf' })
    expect(() => assertPdfWithinLimits(pdf)).not.toThrow()
  })
  it('truncates long JD to 20k chars', () => {
    const long = 'x'.repeat(25_000)
    const out = truncateJd(long)
    expect(out.text.length).toBeLessThanOrEqual(20_000)
    expect(out.truncated).toBe(true)
  })
  it('does not truncate short JD', () => {
    expect(truncateJd('x'.repeat(100))).toEqual({ text: 'x'.repeat(100), truncated: false })
  })
  it('truncates resume text from the bottom to 15k', () => {
    const long = 'A'.repeat(10_000) + 'B'.repeat(10_000)
    const out = truncateResume(long)
    expect(out.text.length).toBe(15_000)
    expect(out.text.startsWith('A')).toBe(true)
    expect(out.truncated).toBe(true)
  })
  it('exports an hourly rate limit constant', () => {
    expect(MAX_TAILORINGS_PER_HOUR).toBe(10)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/lib/limits.test.ts`
Expected: fails — module not found.

- [ ] **Step 3: Implement** — `src/lib/limits.ts`

```ts
import { TailorError } from './errors'

export const MAX_PDF_BYTES = 2 * 1024 * 1024 // 2 MB
export const MAX_JD_CHARS = 20_000
export const MAX_RESUME_CHARS = 15_000
export const MAX_TAILORINGS_PER_HOUR = 10

export function assertPdfWithinLimits(file: File): void {
  if (file.type !== 'application/pdf') {
    throw new TailorError('invalid_input', 'Only PDF files are accepted.')
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new TailorError('invalid_input', `PDF exceeds ${MAX_PDF_BYTES} bytes.`)
  }
}

export function truncateJd(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_JD_CHARS) return { text, truncated: false }
  return { text: text.slice(0, MAX_JD_CHARS), truncated: true }
}

export function truncateResume(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_RESUME_CHARS) return { text, truncated: false }
  // Keep the TOP — recent experience usually appears at the top of a resume.
  return { text: text.slice(0, MAX_RESUME_CHARS), truncated: true }
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- tests/lib/limits.test.ts`
Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(limits): size caps + rate limit constants"
```

---

## Task 8: `lib/prompt.ts` — LLM prompt builder

**Files:**
- Create: `src/lib/prompt.ts`, `tests/lib/prompt.test.ts`, `tests/__snapshots__/prompt.test.ts.snap` (auto)

- [ ] **Step 1: Write the snapshot test** — `tests/lib/prompt.test.ts`

```ts
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
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/lib/prompt.test.ts`
Expected: fails — module not found.

- [ ] **Step 3: Implement** — `src/lib/prompt.ts`

```ts
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
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- tests/lib/prompt.test.ts`
Expected: 3 passing. If the snapshot diff fails first, run with `-u` once: `npm test -- -u tests/lib/prompt.test.ts` to lock the snapshot.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(prompt): build LLM prompt with no-fabrication rule + snapshot"
```

---

## Task 9: `lib/pdf-parse.ts` — resume PDF → text

**Files:**
- Create: `src/lib/pdf-parse.ts`

- [ ] **Step 1: Install pdf-parse + types**

Run:
```bash
npm install pdf-parse
npm install -D @types/pdf-parse
```

- [ ] **Step 2: Implement** — `src/lib/pdf-parse.ts`

```ts
import { TailorError } from './errors'

export async function parseResumePdf(file: File): Promise<string> {
  // pdf-parse is CJS; import dynamically so Next.js Edge analyzers don't choke.
  const { default: pdfParse } = await import('pdf-parse')
  const buf = Buffer.from(await file.arrayBuffer())
  let result: { text: string }
  try {
    result = await pdfParse(buf)
  } catch (e) {
    throw new TailorError('pdf_unreadable', `pdf-parse threw: ${(e as Error).message}`)
  }
  const text = (result.text ?? '').trim()
  if (text.length < 50) {
    throw new TailorError('pdf_unreadable', `Extracted only ${text.length} chars — likely a scanned PDF.`)
  }
  return text
}
```

- [ ] **Step 3: Manual smoke** (no unit test — pdf-parse needs a real PDF; covered by the integration test in Task 13)

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(pdf): wrap pdf-parse with TailorError on unreadable PDFs"
```

---

## Task 10: `lib/openai.ts` — tailoring call

**Files:**
- Create: `src/lib/openai.ts`

- [ ] **Step 1: Install OpenAI SDK**

Run:
```bash
npm install openai
```

- [ ] **Step 2: Implement** — `src/lib/openai.ts`

```ts
import OpenAI from 'openai'
import { zodToJsonSchema } from 'zod-to-json-schema'
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

const jsonSchema = zodToJsonSchema(TailoredOutput, {
  name: 'TailoredOutput',
  target: 'openAi',
  $refStrategy: 'none',
})

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
        json_schema: { name: 'TailoredOutput', strict: true, schema: jsonSchema.definitions!.TailoredOutput as object },
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
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(openai): tailorResume with structured outputs + schema enforcement"
```

---

## Task 11: `lib/stream.ts` — NDJSON streaming helper

**Files:**
- Create: `src/lib/stream.ts`, `tests/lib/stream.test.ts`

- [ ] **Step 1: Write the failing test** — `tests/lib/stream.test.ts`

```ts
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
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/lib/stream.test.ts`
Expected: fails — module not found.

- [ ] **Step 3: Implement** — `src/lib/stream.ts`

```ts
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
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- tests/lib/stream.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(stream): NDJSON streaming helper with auto-failed event"
```

---

## Task 12: `/app` form (no backend yet)

**Files:**
- Create: `src/app/app/page.tsx`, `src/app/app/tailor-form.tsx`, `src/app/app/layout.tsx`

- [ ] **Step 1: Authed layout with header + logout** — `src/app/app/layout.tsx`

```tsx
import Link from 'next/link'
import { requireUser } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser()
  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/app" className="text-lg font-semibold">Resume Tailor</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/app" className="hover:underline">New</Link>
          <Link href="/app/history" className="hover:underline">History</Link>
          <span className="text-neutral-500">{user.email}</span>
          <form action="/logout" method="post">
            <button className="text-neutral-500 hover:underline">Sign out</button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Page that renders the form** — `src/app/app/page.tsx`

```tsx
import { TailorForm } from './tailor-form'
export default function AppHome() {
  return (
    <main>
      <h1 className="text-2xl font-semibold">Tailor a resume</h1>
      <p className="mt-1 text-neutral-600">Upload your resume and paste a job link or description.</p>
      <TailorForm />
    </main>
  )
}
```

- [ ] **Step 3: Client form** — `src/app/app/tailor-form.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'url' | 'text'
type Step = 'idle' | 'parsing_resume' | 'fetching_jd' | 'tailoring' | 'done' | 'failed'

const STEP_LABELS: Record<Exclude<Step, 'idle' | 'failed'>, string> = {
  parsing_resume: 'Parsing resume',
  fetching_jd:    'Fetching job description',
  tailoring:      'Tailoring bullets',
  done:           'Done',
}

export function TailorForm() {
  const router = useRouter()
  const [tab, setTab]       = useState<Tab>('url')
  const [pdf, setPdf]       = useState<File | null>(null)
  const [jdUrl, setJdUrl]   = useState('')
  const [jdText, setJdText] = useState('')
  const [step, setStep]     = useState<Step>('idle')
  const [progress, setProgress] = useState<Step[]>([])
  const [error, setError]   = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setProgress([])
    if (!pdf) { setError('Choose a PDF resume.'); return }
    const fd = new FormData()
    fd.set('pdf', pdf)
    if (tab === 'url') fd.set('jd_url', jdUrl); else fd.set('jd_text', jdText)
    setStep('parsing_resume')

    const res = await fetch('/api/tailor', { method: 'POST', body: fd })
    if (!res.ok || !res.body) { setStep('failed'); setError('Request failed.'); return }
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.trim()) continue
        const evt = JSON.parse(line) as { step: Step; id?: string; error?: string; message?: string }
        setStep(evt.step)
        setProgress(prev => [...prev, evt.step])
        if (evt.step === 'done' && evt.id) { router.push(`/r/${evt.id}`); return }
        if (evt.step === 'failed') { setError(evt.message ?? 'Tailoring failed.'); return }
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <div>
        <label className="block text-sm font-medium">Resume (PDF, max 2 MB)</label>
        <input
          type="file" accept="application/pdf"
          onChange={e => setPdf(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
      </div>

      <div>
        <div className="flex gap-4 border-b border-neutral-200 text-sm">
          {(['url', 'text'] as Tab[]).map(t => (
            <button
              key={t} type="button" onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-1 py-2 ${tab === t ? 'border-neutral-900 font-medium' : 'border-transparent text-neutral-500'}`}
            >
              {t === 'url' ? 'Job URL' : 'Paste JD'}
            </button>
          ))}
        </div>
        {tab === 'url' ? (
          <input
            type="url" value={jdUrl} onChange={e => setJdUrl(e.target.value)}
            placeholder="https://jobs.example.com/listing/123"
            className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        ) : (
          <textarea
            value={jdText} onChange={e => setJdText(e.target.value)} rows={8}
            placeholder="Paste the full job description here…"
            className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        )}
      </div>

      <button
        type="submit" disabled={step !== 'idle' && step !== 'failed'}
        className="rounded-md bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {step === 'idle' || step === 'failed' ? 'Tailor' : 'Working…'}
      </button>

      {progress.length > 0 && (
        <ul className="space-y-1 text-sm">
          {progress.map((s, i) => (
            s !== 'failed' && s !== 'idle' && (
              <li key={i} className="flex items-center gap-2">
                <span aria-hidden>{s === 'done' || progress[i + 1] ? '✓' : '…'}</span>
                <span>{STEP_LABELS[s as keyof typeof STEP_LABELS]}</span>
              </li>
            )
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 4: Smoke test**

Run `npm run dev`. Sign in, land on `/app`. The form should render, file picker should reject non-PDFs visually, submit will 404 until Task 13.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(app): tailor form with tabs + streaming progress consumer"
```

---

## Task 13: `POST /api/tailor` route (+ integration test)

**Files:**
- Create: `src/app/api/tailor/route.ts`, `tests/integration/tailor-route.test.ts`, `tests/fixtures/sample-resume.pdf`

- [ ] **Step 1: Create a sample resume PDF fixture**

Run:
```bash
mkdir -p tests/fixtures
cat > /tmp/make-fixture.ts <<'EOF'
import { writeFileSync } from 'node:fs'
import PDFDocument from 'pdfkit'
const doc = new PDFDocument()
const chunks: Buffer[] = []
doc.on('data', c => chunks.push(c as Buffer))
doc.on('end', () => writeFileSync('tests/fixtures/sample-resume.pdf', Buffer.concat(chunks)))
doc.fontSize(18).text('Jane Doe')
doc.fontSize(10).text('jane@example.com · +1-555-0100 · Brooklyn, NY')
doc.moveDown().fontSize(12).text('Experience')
doc.fontSize(10).text('Foo Corp — Senior Engineer (2022–Present)')
doc.text('• Built backend services in Python.')
doc.text('• Worked on the data pipeline.')
doc.moveDown().fontSize(12).text('Skills')
doc.fontSize(10).text('Python, Postgres, Docker')
doc.end()
EOF
npm install -D pdfkit @types/pdfkit
npx tsx /tmp/make-fixture.ts
ls -lh tests/fixtures/sample-resume.pdf
```
Expected: a small (< 10 KB) PDF appears at the path. If `tsx` is missing, `npm install -D tsx` first.

- [ ] **Step 2: Write the integration test** — `tests/integration/tailor-route.test.ts`

```ts
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
          insert:  (row: object) => ({ select: () => ({ single: async () => ({ data: { ...inserted, ...row }, error: null }) }) }),
          update:  (patch: object) => ({ eq: () => { calls.push(patch); return { error: null } } }),
          select:  () => ({ eq: () => ({ gte: () => ({ data: [], error: null, count: 0 }) }) }),
        }),
        storage: { from: () => ({ upload: async () => ({ data: { path: 'user_1/row_1.pdf' }, error: null }) }) },
      },
      __calls: calls,
    }),
    createClient: async () => { throw new Error('not used in test') },
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
      { experience_id: 'exp_1', original: 'Built backend services in Python.', tailored: 'Built Go backend services.', matched_keywords: ['Go'] },
    ],
    resume_skeleton: {
      name: 'Jane Doe', contact: { email: 'jane@example.com', links: [] }, summary: '',
      experience: [{ id: 'exp_1', company: 'Foo Corp', role: 'Senior Engineer', dates: '2022–Present' }],
      skills: [], education: [],
    },
  }),
}))

beforeEach(() => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'A'.repeat(500) })) })

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
    const events = text.trim().split('\n').map(l => JSON.parse(l))
    const steps = events.map(e => e.step)
    expect(steps).toContain('parsing_resume')
    expect(steps).toContain('fetching_jd')
    expect(steps).toContain('tailoring')
    expect(steps[steps.length - 1]).toBe('done')
    expect(events[events.length - 1].id).toBe('row_1')
  })
})
```

- [ ] **Step 3: Run test to verify failure**

Run: `npm test -- tests/integration/tailor-route.test.ts`
Expected: fails — route doesn't exist.

- [ ] **Step 4: Implement the route** — `src/app/api/tailor/route.ts`

```ts
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { ndjsonStream } from '@/lib/stream'
import { fetchViaJina } from '@/lib/jina'
import { parseResumePdf } from '@/lib/pdf-parse'
import { tailorResume } from '@/lib/openai'
import { assertPdfWithinLimits, truncateJd, truncateResume, MAX_TAILORINGS_PER_HOUR } from '@/lib/limits'
import { TailorError, type ErrorSlug } from '@/lib/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  let user, supabase
  try {
    const ctx = await requireUser()
    user = ctx.user
    supabase = ctx.supabase
  } catch {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let pdf: File, jdUrl: string | null, jdText: string
  try {
    const form = await request.formData()
    const pdfEntry = form.get('pdf')
    if (!(pdfEntry instanceof File)) throw new TailorError('invalid_input', 'pdf field missing')
    pdf = pdfEntry
    assertPdfWithinLimits(pdf)

    jdUrl = (form.get('jd_url') as string) || null
    const jdRaw = (form.get('jd_text') as string) || ''
    if (!jdUrl && !jdRaw) throw new TailorError('invalid_input', 'Provide jd_url or jd_text')

    // Rate limit pre-flight.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase.from('tailorings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)
    if ((count ?? 0) >= MAX_TAILORINGS_PER_HOUR) throw new TailorError('rate_limited')

    // JD pre-flight (so we don't create a row that's doomed).
    jdText = jdUrl ? await fetchViaJina(jdUrl) : jdRaw
  } catch (e) {
    const slug: ErrorSlug = e instanceof TailorError ? e.slug : 'invalid_input'
    return NextResponse.json({ error: slug, message: (e as Error).message }, { status: 400 })
  }

  const { text: jdClipped, truncated: jdTruncated } = truncateJd(jdText)

  // Upload original PDF to Storage.
  const resumeKey = `${user.id}/${crypto.randomUUID()}.pdf`
  const { error: upErr } = await supabase.storage.from('resumes')
    .upload(resumeKey, new Uint8Array(await pdf.arrayBuffer()), { contentType: 'application/pdf' })
  if (upErr) return NextResponse.json({ error: 'invalid_input', message: upErr.message }, { status: 500 })

  // Create the row.
  const { data: row, error: rowErr } = await supabase.from('tailorings')
    .insert({
      user_id: user.id, status: 'pending',
      job_url: jdUrl, job_text: jdClipped, resume_pdf_path: resumeKey,
    }).select().single()
  if (rowErr || !row) return NextResponse.json({ error: 'invalid_input', message: rowErr?.message }, { status: 500 })

  const stream = ndjsonStream(async (emit) => {
    try {
      emit({ step: 'parsing_resume' })
      const resumeRaw = await parseResumePdf(pdf)
      const { text: resumeText, truncated: resumeTruncated } = truncateResume(resumeRaw)
      await supabase.from('tailorings').update({ resume_text: resumeText }).eq('id', row.id)

      emit({ step: 'fetching_jd' }) // JD was already fetched pre-flight; emitted for the UI.

      emit({ step: 'tailoring' })
      const tailored = await tailorResume({ resumeText, jdText: jdClipped, jdTruncated, resumeTruncated })

      await supabase.from('tailorings').update({
        status: 'done',
        tailored,
        job_title: tailored.job_title,
        job_company: tailored.job_company,
        match_score: tailored.match_score,
      }).eq('id', row.id)

      emit({ step: 'done', id: row.id })
    } catch (e) {
      const slug: ErrorSlug = e instanceof TailorError ? e.slug : 'llm_failed'
      await supabase.from('tailorings').update({ status: 'failed', error: slug }).eq('id', row.id)
      emit({ step: 'failed', error: slug, message: (e as Error).message })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
```

- [ ] **Step 5: Run test to verify pass**

Run: `npm test -- tests/integration/tailor-route.test.ts`
Expected: 1 passing. If it fails due to `fetch` polyfill behavior in Node 20, ensure Node ≥ 20.10.

- [ ] **Step 6: Manual smoke**

`npm run dev`, sign in, upload the fixture PDF + paste any short JD. Watch the progress checklist update. Redirects to `/r/<id>` which 404s for now (Task 14).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(api): POST /api/tailor with streaming progress + integration test"
```

---

## Task 14: `/r/[id]` result page + diff view

**Files:**
- Create: `src/app/r/[id]/page.tsx`, `src/components/BulletDiff.tsx`, `src/components/KeywordChips.tsx`

- [ ] **Step 1: KeywordChips** — `src/components/KeywordChips.tsx`

```tsx
export function KeywordChips({ matched, missing }: { matched: string[]; missing: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {matched.map(k => (
        <span key={`m-${k}`} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-900">{k}</span>
      ))}
      {missing.map(k => (
        <span key={`x-${k}`} className="rounded-full border border-red-300 px-2 py-0.5 text-xs text-red-700">{k}</span>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: BulletDiff** — `src/components/BulletDiff.tsx`

```tsx
'use client'
import { useState } from 'react'
import type { Bullet, ResumeSkeleton } from '@/lib/schema'

function highlight(text: string, keywords: string[]): React.ReactNode {
  if (!keywords.length) return text
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
  const parts = text.split(re)
  return parts.map((p, i) =>
    keywords.some(k => k.toLowerCase() === p.toLowerCase())
      ? <mark key={i}>{p}</mark>
      : <span key={i}>{p}</span>
  )
}

export function BulletDiff({ bullets, skeleton }: { bullets: Bullet[]; skeleton: ResumeSkeleton }) {
  const expById = new Map(skeleton.experience.map(e => [e.id, e]))
  const groups = new Map<string, Bullet[]>()
  for (const b of bullets) {
    const arr = groups.get(b.experience_id) ?? []
    arr.push(b); groups.set(b.experience_id, arr)
  }
  const [copied, setCopied] = useState<number | null>(null)

  let index = 0
  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([expId, items]) => {
        const exp = expById.get(expId)
        return (
          <section key={expId}>
            <h3 className="text-sm font-semibold text-neutral-700">
              {exp ? `${exp.company} — ${exp.role}` : 'Experience'}
              {exp && <span className="ml-2 font-normal text-neutral-500">{exp.dates}</span>}
            </h3>
            <div className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200">
              {items.map(b => {
                const i = index++
                return (
                  <div key={i} className="grid grid-cols-2 gap-4 p-4">
                    <p className="text-sm text-neutral-500">{b.original}</p>
                    <div className="text-sm">
                      <p>{highlight(b.tailored, b.matched_keywords)}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(b.tailored); setCopied(i); setTimeout(() => setCopied(c => c === i ? null : c), 1500) }}
                        className="mt-2 text-xs text-neutral-500 hover:text-neutral-900"
                      >
                        {copied === i ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Result page** — `src/app/r/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/supabase/server'
import { TailoredOutput } from '@/lib/schema'
import { BulletDiff } from '@/components/BulletDiff'
import { KeywordChips } from '@/components/KeywordChips'
import { ERROR_MESSAGES, type ErrorSlug } from '@/lib/errors'
import { DownloadPdfButton } from './download-pdf-button'

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data: row } = await supabase.from('tailorings').select('*').eq('id', id).single()
  if (!row) notFound()

  if (row.status === 'failed') {
    const slug = (row.error ?? 'llm_failed') as ErrorSlug
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Tailoring failed</h1>
        <p className="mt-2 text-red-700">{ERROR_MESSAGES[slug]}</p>
        <form action={`/api/tailorings/${id}/retry`} method="post" className="mt-4">
          <button className="rounded-md bg-neutral-900 px-4 py-2 text-white">Retry</button>
        </form>
      </main>
    )
  }

  if (row.status === 'pending' || !row.tailored) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Working…</h1>
        <p className="mt-2 text-neutral-600">If this page doesn't update, reload in a few seconds.</p>
        <meta httpEquiv="refresh" content="3" />
      </main>
    )
  }

  const tailored = TailoredOutput.parse(row.tailored)

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tailored.job_title}</h1>
          <p className="text-neutral-600">{tailored.job_company}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">{tailored.match_score}</div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Match</div>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-neutral-700">Keywords</h2>
        <div className="mt-2"><KeywordChips matched={tailored.matched_keywords} missing={tailored.missing_keywords} /></div>
      </section>

      <section className="mt-8">
        <BulletDiff bullets={tailored.bullets} skeleton={tailored.resume_skeleton} />
      </section>

      <DownloadPdfButton id={id} />
    </main>
  )
}
```

- [ ] **Step 4: Download button (client)** — `src/app/r/[id]/download-pdf-button.tsx`

```tsx
'use client'
import { useState } from 'react'

export function DownloadPdfButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState<string | null>(null)
  async function onClick() {
    setBusy(true); setErr(null)
    const res = await fetch(`/api/tailorings/${id}/pdf`, { method: 'POST' })
    if (!res.ok) { setErr('PDF generation failed.'); setBusy(false); return }
    const { url } = await res.json() as { url: string }
    window.location.href = url
  }
  return (
    <div className="mt-10 border-t border-neutral-200 pt-6">
      <button onClick={onClick} disabled={busy} className="rounded-md border border-neutral-300 px-4 py-2 disabled:opacity-50">
        {busy ? 'Generating…' : 'Download as PDF'}
      </button>
      {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Manual smoke**

`npm run dev`. Run a tailoring end-to-end. The result page should render the diff with matched-keyword highlights, keyword chips at the top, and a Download button (which will 404 until Task 16).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(result): /r/[id] diff view with keyword chips + match score"
```

---

## Task 15: `/app/history` — past tailorings

**Files:**
- Create: `src/app/app/history/page.tsx`

- [ ] **Step 1: History page** — `src/app/app/history/page.tsx`

```tsx
import Link from 'next/link'
import { requireUser } from '@/lib/supabase/server'

export default async function HistoryPage() {
  const { supabase } = await requireUser()
  const { data: rows } = await supabase.from('tailorings')
    .select('id, created_at, status, job_title, job_company, match_score, error')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!rows?.length) {
    return (
      <main>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="mt-2 text-neutral-600">No tailorings yet. <Link href="/app" className="underline">Create one.</Link></p>
      </main>
    )
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold">History</h1>
      <ul className="mt-6 divide-y divide-neutral-200 rounded-md border border-neutral-200">
        {rows.map(r => (
          <li key={r.id}>
            <Link href={`/r/${r.id}`} className="flex items-center justify-between p-4 hover:bg-neutral-50">
              <div>
                <div className="font-medium">{r.job_title ?? 'Untitled'}{r.job_company && <span className="text-neutral-500"> · {r.job_company}</span>}</div>
                <div className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right text-sm">
                {r.status === 'done' && <span>{r.match_score}/100</span>}
                {r.status === 'pending' && <span className="text-neutral-500">working…</span>}
                {r.status === 'failed' && <span className="text-red-700">failed</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 2: Smoke test**

`npm run dev` → `/app/history` lists previous runs and links to `/r/[id]`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(history): list past tailorings with status + match score"
```

---

## Task 16: PDF export

**Files:**
- Create: `src/components/ResumeTemplate.tsx`, `src/lib/render-pdf.ts`, `src/app/api/tailorings/[id]/pdf/route.ts`

- [ ] **Step 1: Install react-pdf**

Run:
```bash
npm install @react-pdf/renderer
```

- [ ] **Step 2: ResumeTemplate** — `src/components/ResumeTemplate.tsx`

```tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Bullet, ResumeSkeleton } from '@/lib/schema'

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff' },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff', fontWeight: 700 },
  ],
})

const s = StyleSheet.create({
  page:   { padding: 48, fontFamily: 'Inter', fontSize: 10, color: '#111' },
  name:   { fontSize: 22, fontWeight: 700 },
  contact:{ fontSize: 10, color: '#555', marginTop: 4 },
  section:{ fontSize: 11, fontWeight: 700, marginTop: 18, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  expRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  expName:{ fontSize: 11, fontWeight: 700 },
  expDates:{ fontSize: 10, color: '#555' },
  bullet: { marginTop: 3, marginLeft: 10 },
  summary:{ marginTop: 4, lineHeight: 1.4 },
  skillsLine: { marginTop: 4, lineHeight: 1.4 },
  eduRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
})

export function ResumeTemplate({ bullets, skeleton }: { bullets: Bullet[]; skeleton: ResumeSkeleton }) {
  const byExp = new Map<string, Bullet[]>()
  for (const b of bullets) {
    const arr = byExp.get(b.experience_id) ?? []
    arr.push(b); byExp.set(b.experience_id, arr)
  }
  const contactParts = [skeleton.contact.email, skeleton.contact.phone, skeleton.contact.location, ...skeleton.contact.links].filter(Boolean)

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{skeleton.name}</Text>
        <Text style={s.contact}>{contactParts.join('  ·  ')}</Text>

        {skeleton.summary && (
          <>
            <Text style={s.section}>Summary</Text>
            <Text style={s.summary}>{skeleton.summary}</Text>
          </>
        )}

        <Text style={s.section}>Experience</Text>
        {skeleton.experience.map(exp => (
          <View key={exp.id}>
            <View style={s.expRow}>
              <Text style={s.expName}>{exp.company} — {exp.role}</Text>
              <Text style={s.expDates}>{exp.dates}</Text>
            </View>
            {(byExp.get(exp.id) ?? []).map((b, i) => (
              <Text key={i} style={s.bullet}>• {b.tailored}</Text>
            ))}
          </View>
        ))}

        {skeleton.skills.length > 0 && (
          <>
            <Text style={s.section}>Skills</Text>
            <Text style={s.skillsLine}>{skeleton.skills.join(' · ')}</Text>
          </>
        )}

        {skeleton.education.length > 0 && (
          <>
            <Text style={s.section}>Education</Text>
            {skeleton.education.map((e, i) => (
              <View key={i} style={s.eduRow}>
                <Text>{e.school}{e.degree ? ` — ${e.degree}` : ''}</Text>
                {e.dates && <Text style={s.expDates}>{e.dates}</Text>}
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  )
}
```

- [ ] **Step 3: Renderer** — `src/lib/render-pdf.ts`

```ts
import { renderToBuffer } from '@react-pdf/renderer'
import { ResumeTemplate } from '@/components/ResumeTemplate'
import type { TailoredOutput } from './schema'
import { TailorError } from './errors'

export async function renderTailoredPdf(tailored: TailoredOutput): Promise<Buffer> {
  try {
    return await renderToBuffer(
      <ResumeTemplate bullets={tailored.bullets} skeleton={tailored.resume_skeleton} />
    )
  } catch (e) {
    throw new TailorError('render_failed', (e as Error).message)
  }
}
```

If TS complains about JSX in a `.ts` file, rename to `src/lib/render-pdf.tsx`.

- [ ] **Step 4: Route** — `src/app/api/tailorings/[id]/pdf/route.ts`

```ts
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { TailoredOutput } from '@/lib/schema'
import { renderTailoredPdf } from '@/lib/render-pdf'
import { ERROR_MESSAGES } from '@/lib/errors'

export const runtime = 'nodejs'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await requireUser()
  const { data: row } = await supabase.from('tailorings').select('*').eq('id', id).single()
  if (!row || row.status !== 'done' || !row.tailored) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  // If already rendered, just sign the existing object.
  if (row.tailored_pdf_path) {
    const { data: signed } = await supabase.storage.from('tailored')
      .createSignedUrl(row.tailored_pdf_path, 60 * 10)
    if (signed?.signedUrl) return NextResponse.json({ url: signed.signedUrl })
  }

  const tailored = TailoredOutput.parse(row.tailored)
  let pdf: Buffer
  try { pdf = await renderTailoredPdf(tailored) }
  catch { return NextResponse.json({ error: 'render_failed', message: ERROR_MESSAGES.render_failed }, { status: 500 }) }

  const key = `${user.id}/${row.id}.pdf`
  const { error: upErr } = await supabase.storage.from('tailored')
    .upload(key, pdf, { contentType: 'application/pdf', upsert: true })
  if (upErr) return NextResponse.json({ error: 'render_failed', message: upErr.message }, { status: 500 })

  await supabase.from('tailorings').update({ tailored_pdf_path: key }).eq('id', id)

  const { data: signed } = await supabase.storage.from('tailored').createSignedUrl(key, 60 * 10)
  return NextResponse.json({ url: signed?.signedUrl })
}
```

- [ ] **Step 5: Smoke test**

`npm run dev`, hit "Download as PDF" on a finished result. Confirm a clean PDF downloads with the user's name, bullets grouped by experience, and matched-keyword content present.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(pdf): lazy PDF export via react-pdf + signed URL"
```

---

## Task 17: Retry route for failed tailorings

**Files:**
- Create: `src/app/api/tailorings/[id]/retry/route.ts`

- [ ] **Step 1: Implement** — `src/app/api/tailorings/[id]/retry/route.ts`

```ts
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { tailorResume } from '@/lib/openai'
import { TailoredOutput } from '@/lib/schema'
import { truncateJd, truncateResume } from '@/lib/limits'
import { TailorError, type ErrorSlug } from '@/lib/errors'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await requireUser()
  const { data: row } = await supabase.from('tailorings').select('*').eq('id', id).single()
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  if (!row.resume_text || !row.job_text) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  await supabase.from('tailorings').update({ status: 'pending', error: null }).eq('id', id)
  try {
    const { text: jdText, truncated: jdTruncated } = truncateJd(row.job_text)
    const { text: resumeText, truncated: resumeTruncated } = truncateResume(row.resume_text)
    const tailored = await tailorResume({ resumeText, jdText, jdTruncated, resumeTruncated })
    TailoredOutput.parse(tailored) // re-validate
    await supabase.from('tailorings').update({
      status: 'done', tailored,
      job_title: tailored.job_title, job_company: tailored.job_company, match_score: tailored.match_score,
    }).eq('id', id)
  } catch (e) {
    const slug: ErrorSlug = e instanceof TailorError ? e.slug : 'llm_failed'
    await supabase.from('tailorings').update({ status: 'failed', error: slug }).eq('id', id)
  }
  return NextResponse.redirect(new URL(`/r/${id}`, request.url), 303)
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(retry): retry failed tailorings against the same row"
```

---

## Task 18: Landing page + before/after animation

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/BeforeAfterAnimation.tsx`

- [ ] **Step 1: Animation** — `src/components/BeforeAfterAnimation.tsx`

```tsx
'use client'
import { useEffect, useState } from 'react'

const PAIRS = [
  { before: 'Worked on backend services.', after: 'Built Go microservices on Kubernetes, exposing gRPC APIs.' },
  { before: 'Wrote tests for the platform.', after: 'Authored integration suite covering 92% of the payment pipeline.' },
  { before: 'Improved the data pipeline.',   after: 'Cut nightly ETL runtime from 45 to 9 minutes by parallelizing Postgres COPY.' },
]

export function BeforeAfterAnimation() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(prev => (prev + 1) % PAIRS.length), 3500)
    return () => clearInterval(t)
  }, [])
  const p = PAIRS[i]
  return (
    <div className="mt-12 grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Before</div>
        <p key={`b-${i}`} className="mt-2 text-sm text-neutral-500 [animation:fadeIn_400ms_ease]">{p.before}</p>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">After</div>
        <p key={`a-${i}`} className="mt-2 text-sm font-medium [animation:fadeIn_400ms_ease_200ms_both]">{p.after}</p>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  )
}
```

- [ ] **Step 2: Landing** — replace `src/app/page.tsx`

```tsx
import Link from 'next/link'
import { BeforeAfterAnimation } from '@/components/BeforeAfterAnimation'

export default function Landing() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">Tailor your resume to any job in 30 seconds.</h1>
      <p className="mt-4 text-lg text-neutral-600">
        Upload your resume, paste a job link, and get keyword-optimized bullet rewrites — without inventing experience you don't have.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/login" className="rounded-md bg-neutral-900 px-5 py-2.5 text-white">Try it</Link>
        <a href="#how" className="rounded-md border border-neutral-300 px-5 py-2.5">How it works</a>
      </div>
      <BeforeAfterAnimation />

      <section id="how" className="mt-20">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-neutral-700">
          <li>Sign in with a magic link.</li>
          <li>Upload your resume PDF and paste the job URL or description.</li>
          <li>Watch the model rewrite each bullet to match the JD's language.</li>
          <li>Copy bullets back into your own resume, or download a clean tailored PDF.</li>
        </ol>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Smoke**

`npm run dev` → landing renders, animation cycles every 3.5s, "Try it" leads to login.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(landing): hero + animated before/after sample"
```

---

## Task 19: Eval script

**Files:**
- Create: `scripts/eval.ts`, `tests/fixtures/eval-pairs/*.json`

- [ ] **Step 1: Create fixtures directory + a starter pair**

```bash
mkdir -p tests/fixtures/eval-pairs
```

`tests/fixtures/eval-pairs/backend-go.json`:
```json
{
  "name": "backend-go",
  "resume": "Jane Doe\nFoo Corp — Senior Engineer (2022–Present)\n• Built backend services in Python.\n• Worked on the data pipeline.\nSkills: Python, Postgres, Docker",
  "jd": "We are hiring a Senior Backend Engineer. You will write Go services on Kubernetes, design Postgres schemas, and ship gRPC APIs. Bonus: Kafka."
}
```

(Add 4 more later — `frontend-react.json`, `data-platform.json`, `pm-handoff.json`, `ml-infra.json`. Same shape. Skip in MVP if time-boxed.)

- [ ] **Step 2: Eval script** — `scripts/eval.ts`

```ts
#!/usr/bin/env tsx
import 'dotenv/config'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'
import { tailorResume } from '../src/lib/openai'

interface Pair { name: string; resume: string; jd: string }

async function extractTopKeywords(jd: string): Promise<string[]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const c = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `List the 10 most important hard-skill keywords from this JD as a JSON array of strings. JD:\n${jd}`,
    }],
    response_format: { type: 'json_object' },
  })
  const raw = c.choices[0]?.message?.content ?? '{}'
  const obj = JSON.parse(raw) as { keywords?: string[] } | string[]
  return Array.isArray(obj) ? obj : (obj.keywords ?? [])
}

async function run() {
  const dir = path.join(process.cwd(), 'tests/fixtures/eval-pairs')
  const pairs = readdirSync(dir).filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as Pair)

  let pass = 0, fail = 0
  for (const p of pairs) {
    console.log(`\n--- ${p.name} ---`)
    const out = await tailorResume({ resumeText: p.resume, jdText: p.jd, jdTruncated: false, resumeTruncated: false })
    const keywords = await extractTopKeywords(p.jd)

    // No fabrication: every company in resume_skeleton.experience must appear in the source resume text.
    const fabricated = out.resume_skeleton.experience.filter(e => !p.resume.includes(e.company))
    if (fabricated.length) { console.error('FAIL: fabricated companies:', fabricated.map(e => e.company)); fail++; continue }

    // Keyword coverage: ≥70% of top-10 JD keywords appear in tailored bullets.
    const allTailored = out.bullets.map(b => b.tailored).join(' ').toLowerCase()
    const present = keywords.filter(k => allTailored.includes(k.toLowerCase()))
    const coverage = keywords.length ? present.length / keywords.length : 0
    if (coverage < 0.7) { console.error(`FAIL: keyword coverage ${(coverage*100).toFixed(0)}%`, { missing: keywords.filter(k => !present.includes(k)) }); fail++; continue }

    // Score in range.
    if (out.match_score < 0 || out.match_score > 100) { console.error('FAIL: bad match_score'); fail++; continue }

    console.log(`PASS (coverage ${(coverage*100).toFixed(0)}%, score ${out.match_score})`)
    pass++
  }
  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}

run().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Step 3: Install dotenv + tsx**

Run:
```bash
npm install -D dotenv tsx
```

- [ ] **Step 4: Run manually**

Run:
```bash
npx tsx scripts/eval.ts
```
Expected: prints per-pair PASS/FAIL. If FAIL, tune `src/lib/prompt.ts` until coverage clears 70% and no fabrication.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(eval): manual eval script + starter pair"
```

---

## Task 20: Final typecheck, lint, and build

- [ ] **Step 1: Full test run**

Run: `npm test`
Expected: every test in `tests/lib/*.test.ts` and `tests/integration/*.test.ts` passes.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds; all routes compile.

- [ ] **Step 4: End-to-end manual smoke**

1. `supabase start && npm run dev`
2. Visit `/` → "Try it" → sign in via Inbucket link.
3. On `/app`, upload `tests/fixtures/sample-resume.pdf` and paste a real JD URL (e.g. a public Greenhouse posting).
4. Watch the four progress steps stream in.
5. Land on `/r/[id]`, see diff + chips + score.
6. Click "Download as PDF", confirm a clean PDF.
7. Visit `/app/history` and see the new entry.
8. Force a failure (paste a bogus JD URL) and confirm the error message + Retry button works.

- [ ] **Step 5: Commit any final tweaks and tag**

```bash
git add -A
git commit -m "chore: v0.1.0 demo-ready" --allow-empty
git tag v0.1.0
```

---

## Out of scope (deliberately deferred)

- DOCX export; multi-template picker.
- Public share links for `/r/[id]` (currently RLS-gated to the owner).
- Sentry / structured logging.
- E2E browser tests, visual regression on the PDF, load tests.
- Anonymous trial without sign-in.
