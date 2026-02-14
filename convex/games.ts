import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const SCORING = {
  easy: { primary: 100, bonus: 50, speedMax: 25 },
  medium: { primary: 150, bonus: 75, speedMax: 50 },
  hard: { primaryPerSubQ: 200, subQuestions: 3, bonus: 100, speedMax: 75 },
} as const

const SPEED_BONUS_FULL_MS = 10_000
const SPEED_BONUS_ZERO_MS = 30_000

function calculateSpeedBonus(timeMs: number, max: number): number {
  if (timeMs <= SPEED_BONUS_FULL_MS) return max
  if (timeMs >= SPEED_BONUS_ZERO_MS) return 0
  const fraction =
    1 - (timeMs - SPEED_BONUS_FULL_MS) / (SPEED_BONUS_ZERO_MS - SPEED_BONUS_FULL_MS)
  return Math.round(max * fraction)
}

export const startGame = mutation({
  args: {
    playerId: v.string(),
    isAnonymous: v.boolean(),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
    regionCode: v.string(),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    locationLabel: v.optional(v.string()),
    plantIds: v.array(v.id('plants')),
  },
  handler: async (ctx, args) => {
    if (args.plantIds.length !== 3) {
      throw new Error('Exactly 3 plant IDs required')
    }

    // Verify all plants exist
    for (const id of args.plantIds) {
      const plant = await ctx.db.get(id)
      if (!plant) throw new Error(`Plant ${id} not found`)
    }

    const rounds = args.plantIds.map((plantId) => ({
      plantId,
    }))

    const sessionId = await ctx.db.insert('gameSessions', {
      playerId: args.playerId,
      isAnonymous: args.isAnonymous,
      difficulty: args.difficulty,
      regionCode: args.regionCode,
      totalScore: 0,
      currentRound: 0,
      status: 'in_progress',
      latitude: args.latitude,
      longitude: args.longitude,
      locationLabel: args.locationLabel,
      rounds,
    })

    return sessionId
  },
})

export const getGameSession = query({
  args: { sessionId: v.id('gameSessions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId)
  },
})

export const getRoundData = query({
  args: {
    sessionId: v.id('gameSessions'),
    roundIndex: v.float64(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error('Session not found')
    if (args.roundIndex < 0 || args.roundIndex >= session.rounds.length) {
      throw new Error('Invalid round index')
    }

    const round = session.rounds[args.roundIndex]
    const plant = await ctx.db.get(round.plantId)
    if (!plant) throw new Error('Plant not found')

    // Return plant image but NOT the correct answer
    return {
      plantImageUrl: plant.preferredImageUrl ?? plant.imageUrls[0],
      plantId: plant._id,
      roundIndex: args.roundIndex,
      totalRounds: session.rounds.length,
      difficulty: session.difficulty,
      currentScore: session.totalScore,
      hasAnswered: round.primaryAnswer !== undefined,
    }
  },
})

export const submitAnswer = mutation({
  args: {
    sessionId: v.id('gameSessions'),
    roundIndex: v.float64(),
    primaryAnswer: v.string(),
    bonusAnswer: v.optional(v.string()),
    timeToAnswerMs: v.float64(),
    hardSubQuestionsCorrect: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error('Session not found')
    if (session.status !== 'in_progress') throw new Error('Game not in progress')
    if (args.roundIndex !== session.currentRound) {
      throw new Error('Not the current round')
    }

    const round = session.rounds[args.roundIndex]
    if (round.primaryAnswer !== undefined) {
      throw new Error('Round already answered')
    }

    const plant = await ctx.db.get(round.plantId)
    if (!plant) throw new Error('Plant not found')

    // Validate primary answer
    const primaryCorrect = validatePrimaryAnswer(
      session.difficulty,
      args.primaryAnswer,
      plant,
    )

    // Validate bonus answer
    const bonusCorrect = args.bonusAnswer
      ? validateBonusAnswer(session.difficulty, args.bonusAnswer, plant)
      : false

    // Calculate score
    let roundScore = 0
    const diff = session.difficulty

    if (diff === 'hard') {
      const cfg = SCORING.hard
      const correctCount = args.hardSubQuestionsCorrect ?? (primaryCorrect ? cfg.subQuestions : 0)
      roundScore += cfg.primaryPerSubQ * correctCount
      if (bonusCorrect) roundScore += cfg.bonus
      if (correctCount > 0) roundScore += calculateSpeedBonus(args.timeToAnswerMs, cfg.speedMax)
    } else {
      const cfg = SCORING[diff]
      if (primaryCorrect) roundScore += cfg.primary
      if (bonusCorrect) roundScore += cfg.bonus
      if (primaryCorrect) roundScore += calculateSpeedBonus(args.timeToAnswerMs, cfg.speedMax)
    }

    // Update round data
    const updatedRounds = [...session.rounds]
    updatedRounds[args.roundIndex] = {
      ...round,
      primaryAnswer: args.primaryAnswer,
      primaryCorrect,
      bonusAnswer: args.bonusAnswer,
      bonusCorrect,
      timeToAnswerMs: args.timeToAnswerMs,
      score: roundScore,
    }

    const newTotalScore = session.totalScore + roundScore
    const isLastRound = args.roundIndex === session.rounds.length - 1
    const newStatus = isLastRound ? 'completed' : 'in_progress'
    const newCurrentRound = isLastRound
      ? session.currentRound
      : session.currentRound + 1

    await ctx.db.patch(args.sessionId, {
      rounds: updatedRounds,
      totalScore: newTotalScore,
      currentRound: newCurrentRound,
      status: newStatus as 'in_progress' | 'completed' | 'abandoned',
    })

    // Create leaderboard entry on completion
    if (isLastRound) {
      await ctx.db.insert('leaderboardEntries', {
        playerId: session.playerId,
        displayName: session.isAnonymous ? 'Anonymous Forager' : session.playerId,
        gameSessionId: args.sessionId,
        difficulty: session.difficulty,
        totalScore: newTotalScore,
        regionCode: session.regionCode,
        locationLabel: session.locationLabel,
        latitude: session.latitude,
        longitude: session.longitude,
        completedAt: Date.now(),
      })
    }

    return {
      primaryCorrect,
      bonusCorrect,
      roundScore,
      totalScore: newTotalScore,
      isLastRound,
      plant: {
        commonNames: plant.commonNames,
        scientificName: plant.scientificName,
        category: plant.category,
        medicinalUses: plant.medicinalUses,
        edibleParts: plant.edibleParts,
        toxicityInfo: plant.toxicityInfo,
        nutritionalInfo: plant.nutritionalInfo,
      },
    }
  },
})

export const claimAnonymousGames = mutation({
  args: {
    anonymousId: v.string(),
    clerkUserId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find all sessions belonging to the anonymous ID
    const sessions = await ctx.db
      .query('gameSessions')
      .withIndex('by_playerId', (q) => q.eq('playerId', args.anonymousId))
      .collect()

    for (const session of sessions) {
      await ctx.db.patch(session._id, {
        playerId: args.clerkUserId,
        isAnonymous: false,
      })
    }

    // Update leaderboard entries
    const entries = await ctx.db
      .query('leaderboardEntries')
      .withIndex('by_playerId', (q) => q.eq('playerId', args.anonymousId))
      .collect()

    for (const entry of entries) {
      await ctx.db.patch(entry._id, {
        playerId: args.clerkUserId,
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
      })
    }

    return { claimedSessions: sessions.length, claimedEntries: entries.length }
  },
})

function validatePrimaryAnswer(
  difficulty: 'easy' | 'medium' | 'hard',
  answer: string,
  plant: {
    category: string
    commonNames: string[]
    scientificName: string
  },
): boolean {
  if (difficulty === 'easy') {
    // Primary question: edible/medicinal/neutral/poisonous?
    return answer.toLowerCase() === plant.category.toLowerCase()
  }
  // Medium and hard: common name?
  return plant.commonNames.some(
    (name) => name.toLowerCase() === answer.toLowerCase(),
  )
}

function validateBonusAnswer(
  difficulty: 'easy' | 'medium' | 'hard',
  answer: string,
  plant: {
    commonNames: string[]
    medicinalUses: string[]
    edibleParts: string[]
    nutritionalInfo?: string | null
    toxicityInfo?: string | null
  },
): boolean {
  if (difficulty === 'easy') {
    // Bonus: common name?
    return plant.commonNames.some(
      (name) => name.toLowerCase() === answer.toLowerCase(),
    )
  }
  // Medium/hard: specific detail question -- validated against known info
  // Match against medicinal uses, edible parts, or toxicity/nutritional info
  const allDetails = [
    ...plant.medicinalUses,
    ...plant.edibleParts,
    plant.nutritionalInfo ?? '',
    plant.toxicityInfo ?? '',
  ].map((d) => d.toLowerCase())

  return allDetails.some(
    (detail) => detail.includes(answer.toLowerCase()) || answer.toLowerCase().includes(detail),
  )
}
