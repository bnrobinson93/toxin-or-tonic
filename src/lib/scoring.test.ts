import { describe, it, expect } from 'vitest'
import {
  calculateSpeedBonus,
  calculateRoundScore,
  getMaxGameScore,
  getAnswerOptionCount,
} from './scoring'

describe('calculateSpeedBonus', () => {
  it('returns full bonus when answered within 10s', () => {
    expect(calculateSpeedBonus(5000, 25)).toBe(25)
    expect(calculateSpeedBonus(10000, 25)).toBe(25)
    expect(calculateSpeedBonus(0, 50)).toBe(50)
  })

  it('returns 0 when answered at or after 30s', () => {
    expect(calculateSpeedBonus(30000, 25)).toBe(0)
    expect(calculateSpeedBonus(45000, 75)).toBe(0)
  })

  it('returns linearly decayed bonus between 10s and 30s', () => {
    expect(calculateSpeedBonus(20000, 50)).toBe(25)
    expect(calculateSpeedBonus(15000, 100)).toBe(75)
    expect(calculateSpeedBonus(25000, 100)).toBe(25)
  })
})

describe('calculateRoundScore', () => {
  describe('easy mode', () => {
    it('scores 100 + 50 + speed bonus for all correct fast answer', () => {
      const score = calculateRoundScore('easy', true, true, 5000)
      expect(score).toBe(175)
    })

    it('scores 100 + speed bonus for correct primary, wrong bonus', () => {
      const score = calculateRoundScore('easy', true, false, 5000)
      expect(score).toBe(125)
    })

    it('scores 0 for wrong primary even if bonus correct', () => {
      const score = calculateRoundScore('easy', false, true, 5000)
      expect(score).toBe(50)
    })

    it('scores 0 for all wrong', () => {
      const score = calculateRoundScore('easy', false, false, 5000)
      expect(score).toBe(0)
    })

    it('reduces speed bonus for slower answers', () => {
      const fast = calculateRoundScore('easy', true, false, 5000)
      const slow = calculateRoundScore('easy', true, false, 20000)
      expect(fast).toBeGreaterThan(slow)
    })
  })

  describe('medium mode', () => {
    it('scores 150 + 75 + speed bonus for all correct fast answer', () => {
      const score = calculateRoundScore('medium', true, true, 5000)
      expect(score).toBe(275)
    })

    it('max per round is 275', () => {
      const score = calculateRoundScore('medium', true, true, 0)
      expect(score).toBe(275)
    })
  })

  describe('hard mode', () => {
    it('scores 200*3 + 100 + speed bonus for all correct fast answer', () => {
      const score = calculateRoundScore('hard', true, true, 5000, 3)
      expect(score).toBe(775)
    })

    it('scores partial for some sub-questions correct', () => {
      const score = calculateRoundScore('hard', true, false, 5000, 2)
      expect(score).toBe(400 + 75)
    })

    it('scores 0 for all wrong', () => {
      const score = calculateRoundScore('hard', false, false, 5000, 0)
      expect(score).toBe(0)
    })
  })
})

describe('getMaxGameScore', () => {
  it('returns 525 for easy', () => {
    expect(getMaxGameScore('easy')).toBe(525)
  })

  it('returns 825 for medium', () => {
    expect(getMaxGameScore('medium')).toBe(825)
  })

  it('returns 2325 for hard', () => {
    expect(getMaxGameScore('hard')).toBe(2325)
  })
})

describe('getAnswerOptionCount', () => {
  it('returns 4 primary, 3 bonus for easy', () => {
    expect(getAnswerOptionCount('easy', 'primary')).toBe(4)
    expect(getAnswerOptionCount('easy', 'bonus')).toBe(3)
  })

  it('returns 4 for both in medium', () => {
    expect(getAnswerOptionCount('medium', 'primary')).toBe(4)
    expect(getAnswerOptionCount('medium', 'bonus')).toBe(4)
  })

  it('returns 6 primary, 4 bonus for hard', () => {
    expect(getAnswerOptionCount('hard', 'primary')).toBe(6)
    expect(getAnswerOptionCount('hard', 'bonus')).toBe(4)
  })
})
