import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <main className="mx-auto max-w-md p-10">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-neutral-600">We&apos;ll email you a magic link.</p>
      <LoginForm next={next ?? '/app'} />
    </main>
  )
}
