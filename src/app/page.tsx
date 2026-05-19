import Link from 'next/link'
import { BeforeAfterAnimation } from '@/components/BeforeAfterAnimation'

export default function Landing() {
  return (
    <div className="relative isolate">
      {/* Subtle hero glow on top of the global tinted background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 mx-auto h-[520px] max-w-5xl bg-[radial-gradient(closest-side,rgba(99,102,241,0.18),transparent_70%)]"
      />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tightish text-neutral-900"
        >
          tailor<span className="text-accent">CV</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-600">
          <Link href="/how-it-works" className="hover:text-neutral-900">
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

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-12 sm:pt-20">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-xs font-medium text-neutral-600 shadow-soft backdrop-blur">
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
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-md border border-neutral-200 bg-white/80 px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur transition hover:border-neutral-300 hover:text-neutral-900"
            >
              How it works
            </Link>
          </div>
        </div>

        <BeforeAfterAnimation />

        <footer className="mt-24 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          Your data stays yours. Resumes and tailored output are scoped to your
          account by row-level security.
        </footer>
      </main>
    </div>
  )
}
