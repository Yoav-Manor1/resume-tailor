import { TailorForm } from './tailor-form'

export default function AppHome() {
  return (
    <main className="fade-up">
      <h1 className="text-3xl font-semibold tracking-tightish">Tailor a resume</h1>
      <p className="mt-2 text-neutral-600">
        Upload your resume and paste a job link or description. We&apos;ll
        rewrite each bullet to match.
      </p>
      <TailorForm />
    </main>
  )
}
