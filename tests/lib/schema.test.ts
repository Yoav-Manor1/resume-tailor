import { describe, it, expect } from 'vitest'
import { TailoredOutput } from '@/lib/schema'
import canned from '../fixtures/canned-tailored.json'

describe('TailoredOutput', () => {
  it('accepts a known-good payload', () => {
    const parsed = TailoredOutput.parse(canned)
    expect(parsed.match_score).toBe(82)
    expect(parsed.bullets.length).toBeGreaterThan(0)
    expect(parsed.resume_skeleton.experience[0].id).toBeDefined()
  })

  it('rejects out-of-range match_score', () => {
    const bad = { ...canned, match_score: 150 }
    expect(() => TailoredOutput.parse(bad)).toThrow()
  })

  it('rejects bullets missing experience_id', () => {
    const bad = structuredClone(canned)
    delete (bad.bullets[0] as Record<string, unknown>).experience_id
    expect(() => TailoredOutput.parse(bad)).toThrow()
  })
})
