import { z } from 'zod'

export const Bullet = z.object({
  experience_id: z.string(),
  original: z.string(),
  tailored: z.string(),
  matched_keywords: z.array(z.string()),
})

export const ResumeSkeleton = z.object({
  name: z.string(),
  contact: z.object({
    email: z.string().nullish(),
    phone: z.string().nullish(),
    location: z.string().nullish(),
    links: z.array(z.string()).default([]),
  }),
  summary: z.string().nullish(),
  experience: z.array(
    z.object({
      id: z.string(),
      company: z.string(),
      role: z.string(),
      dates: z.string(),
    }),
  ),
  skills: z.array(z.string()).default([]),
  education: z
    .array(
      z.object({
        school: z.string(),
        degree: z.string().nullish(),
        dates: z.string().nullish(),
      }),
    )
    .default([]),
})

export const TailoredOutput = z.object({
  job_title: z.string(),
  job_company: z.string(),
  match_score: z.number().int().min(0).max(100),
  matched_keywords: z.array(z.string()),
  missing_keywords: z.array(z.string()),
  bullets: z.array(Bullet),
  resume_skeleton: ResumeSkeleton,
})

export type TailoredOutput = z.infer<typeof TailoredOutput>
export type ResumeSkeleton = z.infer<typeof ResumeSkeleton>
export type Bullet = z.infer<typeof Bullet>
