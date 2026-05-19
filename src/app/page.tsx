import Link from 'next/link'
import { BeforeAfterAnimation } from '@/components/BeforeAfterAnimation'

export default function Landing() {
  return (
    <div className="relative isolate">
      {/* Subtle hero gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 mx-auto h-[480px] max-w-5xl bg-[radial-gradient(closest-side,rgba(99,102,241,0.10),transparent_70%)]"
      />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tightish text-neutral-900"
        >
          Resume<span className="text-accent">.tailor</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-600">
          <a href="#how" className="hover:text-neutral-900">
            How it works
          </a>
          <Link
            href="/login"
            className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-white shadow-sm transition hover:bg-neutral-800"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-12 sm:pt-20">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Tailored bullets in under a minute
          </span>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tightish text-neutral-900 sm:text-6xl">
            Tailor your resume to any job in 30 seconds.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-neutral-600">
            Upload your resume, paste a job link, and get keyword-optimized
            bullet rewrites — without inventing experience you don&apos;t have.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
            >
              Try it free
              <svg
                className="h-4 w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#how"
              className="rounded-md border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:text-neutral-900"
            >
              How it works
            </a>
          </div>
        </div>

        <BeforeAfterAnimation />

        <section id="how" className="mt-24 scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tightish">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              'Sign in with a magic link.',
              'Upload your resume PDF and paste the job URL or description.',
              "Watch the model rewrite each bullet to match the JD's language.",
              'Copy bullets back into your resume, or download a clean tailored PDF.',
            ].map((step, i) => (
              <li
                key={i}
                className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                  {i + 1}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-24 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          Your data stays yours. Resumes and tailored output are scoped to your
          account by row-level security.
        </footer>
      </main>
    </div>
  )
}
