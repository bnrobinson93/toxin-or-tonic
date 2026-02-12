export type Difficulty = 'easy' | 'medium' | 'hard'

const SCORING = {
  easy: { primary: 100, bonus: 50, speedMax: 25, maxPerRound: 175 },
  medium: { primary: 150, bonus: 75, speedMax: 50, maxPerRound: 275 },
  hard: { primaryPerSubQ: 200, subQuestions: 3, bonus: 100, speedMax: 75, maxPerRound: 775 },
} as const

const SPEED_BONUS_FULL_THRESHOLD_MS = 10_000
const SPEED_BONUS_ZERO_THRESHOLD_MS = 30_000

export function calculateSpeedBonus(
  timeToAnswerMs: number,
  maxSpeedBonus: number,
): number {
  if (timeToAnswerMs <= SPEED_BONUS_FULL_THRESHOLD_MS) return maxSpeedBonus
  if (timeToAnswerMs >= SPEED_BONUS_ZERO_THRESHOLD_MS) return 0
  const fraction =
    1 -
    (timeToAnswerMs - SPEED_BONUS_FULL_THRESHOLD_MS) /
      (SPEED_BONUS_ZERO_THRESHOLD_MS - SPEED_BONUS_FULL_THRESHOLD_MS)
  return Math.round(maxSpeedBonus * fraction)
}

export function calculateRoundScore(
  difficulty: Difficulty,
  primaryCorrect: boolean,
  bonusCorrect: boolean,
  timeToAnswerMs: number,
  hardSubQuestionsCorrect?: number,
): number {
  let score = 0

  if (difficulty === 'hard') {
    const cfg = SCORING.hard
    const correctCount = hardSubQuestionsCorrect ?? (primaryCorrect ? cfg.subQuestions : 0)
    score += cfg.primaryPerSubQ * correctCount
    if (bonusCorrect) score += cfg.bonus
    if (correctCount > 0) score += calculateSpeedBonus(timeToAnswerMs, cfg.speedMax)
  } else {
    const cfg = SCORING[difficulty]
    if (primaryCorrect) score += cfg.primary
    if (bonusCorrect) score += cfg.bonus
    if (primaryCorrect) score += calculateSpeedBonus(timeToAnswerMs, cfg.speedMax)
  }

  return score
}

export function getMaxGameScore(difficulty: Difficulty): number {
  if (difficulty === 'hard') return SCORING.hard.maxPerRound * 3
  return SCORING[difficulty].maxPerRound * 3
}

export function getAnswerOptionCount(
  difficulty: Difficulty,
  questionType: 'primary' | 'bonus',
): number {
  if (difficulty === 'easy') return questionType === 'primary' ? 4 : 3
  if (difficulty === 'medium') return 4
  if (questionType === 'bonus') return 4
  return 6
}
