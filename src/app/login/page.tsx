import Link from 'next/link'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <div className="relative isolate min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(closest-side,rgba(99,102,241,0.10),transparent_70%)]"
      />
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link
          href="/"
          className="self-start text-sm font-semibold text-neutral-700 hover:text-neutral-900"
        >
          ← Back
        </Link>
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-8 shadow-soft fade-up">
          <h1 className="text-2xl font-semibold tracking-tightish">Sign in</h1>
          <p className="mt-1.5 text-sm text-neutral-600">
            We&apos;ll email you a magic link — no passwords.
          </p>
          <LoginForm next={next ?? '/app'} />
        </div>
        <p className="mt-6 text-center text-xs text-neutral-500">
          By signing in you agree to keep your resume content yours.
        </p>
      </main>
    </div>
  )
}
