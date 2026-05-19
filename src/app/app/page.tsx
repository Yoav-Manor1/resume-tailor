import { TailorForm } from './tailor-form'

export default function AppHome() {
  return (
    <main>
      <h1 className="text-2xl font-semibold">Tailor a resume</h1>
      <p className="mt-1 text-neutral-600">
        Upload your resume and paste a job link or description.
      </p>
      <TailorForm />
    </main>
  )
}
