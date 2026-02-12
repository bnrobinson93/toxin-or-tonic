import { query } from './_generated/server'
import { v } from 'convex/values'

export const getRegionalLeaderboard = query({
  args: {
    regionCode: v.string(),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25

    const entries = await ctx.db
      .query('leaderboardEntries')
      .withIndex('by_region_difficulty_score', (q) =>
        q.eq('regionCode', args.regionCode).eq('difficulty', args.difficulty),
      )
      .order('desc')
      .collect()

    // Sort by totalScore descending and take the top N
    return entries
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
  },
})

export const getPlayerRank = query({
  args: {
    playerId: v.string(),
    regionCode: v.string(),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
  },
  handler: async (ctx, args) => {
    const allEntries = await ctx.db
      .query('leaderboardEntries')
      .withIndex('by_region_difficulty_score', (q) =>
        q.eq('regionCode', args.regionCode).eq('difficulty', args.difficulty),
      )
      .collect()

    // Get the player's best score
    const playerEntries = allEntries.filter(
      (e) => e.playerId === args.playerId,
    )
    if (playerEntries.length === 0) return null

    const bestScore = Math.max(...playerEntries.map((e) => e.totalScore))
    const rank = allEntries.filter((e) => e.totalScore > bestScore).length + 1

    return { rank, bestScore, totalPlayers: new Set(allEntries.map((e) => e.playerId)).size }
  },
})
