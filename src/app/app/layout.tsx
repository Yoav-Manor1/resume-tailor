import Link from 'next/link'
import { requireUser } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser()
  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/app" className="text-lg font-semibold">
          Resume Tailor
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/app" className="hover:underline">
            New
          </Link>
          <Link href="/app/history" className="hover:underline">
            History
          </Link>
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
