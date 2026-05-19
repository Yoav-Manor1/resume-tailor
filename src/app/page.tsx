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
