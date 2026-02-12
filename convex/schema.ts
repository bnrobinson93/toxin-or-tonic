import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  plants: defineTable({
    floraApiId: v.string(),
    scientificName: v.string(),
    commonNames: v.array(v.string()),
    familyName: v.string(),
    genusName: v.string(),
    category: v.union(
      v.literal('edible'),
      v.literal('medicinal'),
      v.literal('neutral'),
      v.literal('poisonous'),
    ),
    medicinalUses: v.array(v.string()),
    edibleParts: v.array(v.string()),
    nutritionalInfo: v.optional(v.string()),
    toxicityInfo: v.optional(v.string()),
    imageUrls: v.array(v.string()),
    preferredImageUrl: v.optional(v.string()),
    nativity: v.union(
      v.literal('Native'),
      v.literal('Non-Native'),
      v.literal('Invasive'),
    ),
    regionCodes: v.array(v.string()),
    randomSortKey: v.float64(),
    lastSyncedAt: v.float64(),
  })
    .index('by_floraApiId', ['floraApiId'])
    .index('by_category', ['category'])
    .index('by_nativity', ['nativity'])
    .index('by_randomSortKey', ['randomSortKey']),

  gameSessions: defineTable({
    playerId: v.string(),
    isAnonymous: v.boolean(),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
    regionCode: v.string(),
    totalScore: v.float64(),
    currentRound: v.float64(),
    status: v.union(
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('abandoned'),
    ),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    locationLabel: v.optional(v.string()),
    rounds: v.array(
      v.object({
        plantId: v.id('plants'),
        primaryAnswer: v.optional(v.string()),
        primaryCorrect: v.optional(v.boolean()),
        bonusAnswer: v.optional(v.string()),
        bonusCorrect: v.optional(v.boolean()),
        timeToAnswerMs: v.optional(v.float64()),
        score: v.optional(v.float64()),
      }),
    ),
  })
    .index('by_playerId', ['playerId'])
    .index('by_status', ['status'])
    .index('by_score_and_difficulty', ['difficulty', 'totalScore']),

  leaderboardEntries: defineTable({
    playerId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    gameSessionId: v.id('gameSessions'),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
    totalScore: v.float64(),
    regionCode: v.string(),
    locationLabel: v.optional(v.string()),
    completedAt: v.float64(),
  })
    .index('by_region_difficulty_score', [
      'regionCode',
      'difficulty',
      'totalScore',
    ])
    .index('by_playerId', ['playerId']),

  userProfiles: defineTable({
    clerkUserId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    preferredRegion: v.optional(v.string()),
    totalGamesPlayed: v.float64(),
    totalScore: v.float64(),
    highestScore: v.float64(),
    averageScore: v.float64(),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    locationLabel: v.optional(v.string()),
  }).index('by_clerkUserId', ['clerkUserId']),

  plantSyncLog: defineTable({
    regionCode: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    plantsAdded: v.float64(),
    plantsUpdated: v.float64(),
    errors: v.array(v.string()),
    startedAt: v.float64(),
    completedAt: v.optional(v.float64()),
  })
    .index('by_regionCode', ['regionCode'])
    .index('by_status', ['status']),
})
