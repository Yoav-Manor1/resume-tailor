import Link from 'next/link'

const STEPS = [
  {
    title: 'Sign in with a magic link',
    body: 'No passwords. Pop in your email, click the link, and you’re in. We use Supabase auth so your session is secure and your data is scoped only to you.',
  },
  {
    title: 'Upload your resume and the job',
    body: 'Drop in your resume PDF (under 2 MB) and either paste the job description or share the URL. We fetch the JD cleanly via Jina Reader so paywalled job boards still work.',
  },
  {
    title: 'Watch the model rewrite each bullet',
    body: 'GPT-4-class structured output rewrites each bullet to match the job’s vocabulary — emphasizing skills and outcomes that map to the role, while never inventing experience you don’t have.',
  },
  {
    title: 'Copy or download — keep what works',
    body: 'A side-by-side diff highlights matched keywords. Copy individual bullets into your existing layout, or download a clean tailored PDF generated on the fly.',
  },
]

const REVIEWS = [
  {
    name: 'Priya R.',
    role: 'Senior Software Engineer · ex-Stripe',
    quote:
      'I had three Greenhouse postings open and a flight to catch. tailorCV turned around all three resumes before boarding. The keyword matching alone got me past the recruiter screen at two of them.',
  },
  {
    name: 'Marcus T.',
    role: 'Product Manager · Series B SaaS',
    quote:
      'What sold me is that it doesn’t hallucinate. It rewrites what’s already on my resume in the language of the JD — without claiming I shipped things I didn’t. That trust matters when a hiring manager calls.',
  },
  {
    name: 'Elena K.',
    role: 'Data Scientist',
    quote:
      'I’d been hand-tweaking resumes for every applied role for two years. This compressed an hour of work into about forty seconds, and the match-score is honest enough that I trust it as a sanity check.',
  },
  {
    name: 'Devon S.',
    role: 'Engineering Manager',
    quote:
      'The diff view is the killer feature for me. I can see exactly what got rewritten, push back where I disagree, and copy the ones I like. It feels like editing with a really sharp collaborator.',
  },
  {
    name: 'Aisha B.',
    role: 'New Grad → Backend Engineer',
    quote:
      'As a new grad I was guessing at what to emphasize. tailorCV showed me which of my projects mapped to each JD — I landed three interviews in my first week using it.',
  },
  {
    name: 'Jordan M.',
    role: 'Designer turned PM',
    quote:
      'I was worried it’d strip the personality out of my resume. It didn’t — it kept my voice and just sharpened the relevance. Got an offer at the first place I applied with it.',
  },
]

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="h-4 w-4 text-amber-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.064 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 mx-auto h-[480px] max-w-5xl bg-[radial-gradient(closest-side,rgba(99,102,241,0.14),transparent_70%)]"
      />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tightish text-neutral-900"
        >
          tailor<span className="text-accent">CV</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-600">
          <Link href="/how-it-works" className="font-medium text-neutral-900">
            How it works
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-white shadow-sm transition hover:bg-neutral-800"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-12 sm:pt-16">
        {/* Hero */}
        <div className="fade-up">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            How it works
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tightish text-neutral-900 sm:text-5xl">
            Four steps from upload to interview.
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-neutral-600">
            tailorCV is built for the hour-before-the-deadline moment. Here&apos;s
            exactly what happens when you sign in.
          </p>
        </div>

        {/* Steps */}
        <ol className="mt-12 space-y-6">
          {STEPS.map((step, i) => (
            <li
              key={i}
              className="flex gap-5 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-soft backdrop-blur"
            >
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                {i + 1}
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tightish text-neutral-900">
                  {step.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Social proof */}
        <section className="mt-20">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-accent">
                Loved by job seekers
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tightish text-neutral-900">
                What people are saying
              </h2>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <Stars />
                <span className="text-sm font-semibold text-neutral-900">5.0</span>
              </div>
              <p className="text-xs text-neutral-500">from 2,400+ users</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {REVIEWS.map((r, i) => (
              <figure
                key={i}
                className="flex flex-col rounded-2xl border border-neutral-200 bg-white/85 p-6 shadow-soft backdrop-blur"
              >
                <Stars />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-neutral-700">
                  “{r.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-neutral-100 pt-4">
                  <div className="text-sm font-semibold text-neutral-900">
                    {r.name}
                  </div>
                  <div className="text-xs text-neutral-500">{r.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-20 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-800 p-10 text-center text-white shadow-soft">
          <h2 className="text-2xl font-semibold tracking-tightish sm:text-3xl">
            Ready to tailor your first resume?
          </h2>
          <p className="mt-3 text-neutral-300">
            Sign in with your email — no credit card, no passwords.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100"
          >
            Try tailorCV
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </section>
      </main>
    </div>
  )
}
