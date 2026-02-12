import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getOrCreateProfile = mutation({
  args: {
    clerkUserId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerkUserId', (q) =>
        q.eq('clerkUserId', args.clerkUserId),
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        email: args.email,
      })
      return existing._id
    }

    return await ctx.db.insert('userProfiles', {
      clerkUserId: args.clerkUserId,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      email: args.email,
      totalGamesPlayed: 0,
      totalScore: 0,
      highestScore: 0,
      averageScore: 0,
    })
  },
})

export const updateProfile = mutation({
  args: {
    clerkUserId: v.string(),
    displayName: v.optional(v.string()),
    preferredRegion: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    locationLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerkUserId', (q) =>
        q.eq('clerkUserId', args.clerkUserId),
      )
      .first()

    if (!profile) throw new Error('Profile not found')

    const { clerkUserId: _, ...updates } = args
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    )

    await ctx.db.patch(profile._id, cleanUpdates)
  },
})

export const getPlayerStats = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerkUserId', (q) =>
        q.eq('clerkUserId', args.clerkUserId),
      )
      .first()

    if (!profile) return null

    // Get recent game sessions
    const sessions = await ctx.db
      .query('gameSessions')
      .withIndex('by_playerId', (q) =>
        q.eq('playerId', args.clerkUserId),
      )
      .order('desc')
      .take(10)

    return {
      profile,
      recentGames: sessions,
    }
  },
})

export const updateStatsAfterGame = mutation({
  args: {
    clerkUserId: v.string(),
    gameScore: v.float64(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_clerkUserId', (q) =>
        q.eq('clerkUserId', args.clerkUserId),
      )
      .first()

    if (!profile) return

    const newTotalGames = profile.totalGamesPlayed + 1
    const newTotalScore = profile.totalScore + args.gameScore
    const newHighest = Math.max(profile.highestScore, args.gameScore)
    const newAverage = newTotalScore / newTotalGames

    await ctx.db.patch(profile._id, {
      totalGamesPlayed: newTotalGames,
      totalScore: newTotalScore,
      highestScore: newHighest,
      averageScore: Math.round(newAverage * 100) / 100,
    })
  },
})
