import { renderToBuffer } from '@react-pdf/renderer'
import { ResumeTemplate } from '@/components/ResumeTemplate'
import type { TailoredOutput } from './schema'
import { TailorError } from './errors'

export async function renderTailoredPdf(tailored: TailoredOutput): Promise<Buffer> {
  try {
    return await renderToBuffer(
      <ResumeTemplate
        bullets={tailored.bullets}
        skeleton={tailored.resume_skeleton}
      />,
    )
  } catch (e) {
    throw new TailorError('render_failed', (e as Error).message)
  }
}
