import Link from 'next/link'
import { requireUser } from '@/lib/supabase/server'

// Authed shell for /r/* routes — mirrors /app's layout so users have a
// consistent header (brand, nav, sign-out) and a constrained reading column
// instead of edge-to-edge content on wide monitors.
export default async function ResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requireUser()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link
            href="/app"
            className="text-xl font-semibold tracking-tightish text-neutral-900"
          >
            tailor<span className="text-accent">CV</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/app"
              className="rounded-md px-3 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              New
            </Link>
            <Link
              href="/app/history"
              className="rounded-md px-3 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              History
            </Link>
            <div className="ml-2 flex items-center gap-3 border-l border-neutral-200 pl-4">
              <span
                title={user.email ?? ''}
                className="hidden max-w-[180px] truncate text-xs text-neutral-500 sm:inline"
              >
                {user.email}
              </span>
              <form action="/logout" method="post">
                <button className="text-xs text-neutral-500 hover:text-neutral-900">
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-10 sm:py-12">{children}</div>
    </div>
  )
}
