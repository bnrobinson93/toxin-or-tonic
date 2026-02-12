import { describe, it, expect } from 'vitest'
import { US_STATES, SEEDED_STATES } from './states'

describe('US_STATES', () => {
  it('has 50 states', () => {
    expect(Object.keys(US_STATES)).toHaveLength(50)
  })

  it('maps 2-letter codes to full names', () => {
    expect(US_STATES.OR).toBe('Oregon')
    expect(US_STATES.CA).toBe('California')
    expect(US_STATES.NY).toBe('New York')
  })
})

describe('SEEDED_STATES', () => {
  it('has 5 seeded states', () => {
    expect(SEEDED_STATES).toHaveLength(5)
  })

  it('all seeded states exist in US_STATES', () => {
    for (const code of SEEDED_STATES) {
      expect(US_STATES).toHaveProperty(code)
    }
  })

  it('includes expected states', () => {
    expect(SEEDED_STATES).toContain('OR')
    expect(SEEDED_STATES).toContain('CA')
    expect(SEEDED_STATES).toContain('WA')
    expect(SEEDED_STATES).toContain('TX')
    expect(SEEDED_STATES).toContain('NY')
  })
})
