import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const MILES_TO_KM = 1.60934
const EARTH_RADIUS_KM = 6371

function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (EARTH_RADIUS_KM * c) / MILES_TO_KM
}

export const getNearbyLeaderboard = query({
  args: {
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10

    const allEntries = await ctx.db
      .query('leaderboardEntries')
      .withIndex('by_difficulty', (q) => q.eq('difficulty', args.difficulty))
      .collect()

    // If no player location, return top scores globally for this difficulty
    if (args.latitude == null || args.longitude == null) {
      return allEntries
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit)
    }

    // Filter to entries that have coordinates
    const withCoords = allEntries.filter(
      (e) => e.latitude != null && e.longitude != null,
    )
    const withoutCoords = allEntries.filter(
      (e) => e.latitude == null || e.longitude == null,
    )

    // Expanding radius: start at 50mi, double until we have enough or hit max
    let radiusMiles = 50
    const MAX_RADIUS = 12800
    let nearby: typeof withCoords = []

    while (radiusMiles <= MAX_RADIUS) {
      nearby = withCoords.filter(
        (e) =>
          haversineDistanceMiles(
            args.latitude!,
            args.longitude!,
            e.latitude!,
            e.longitude!,
          ) <= radiusMiles,
      )
      if (nearby.length >= limit) break
      radiusMiles *= 2
    }

    // If still not enough with max radius, include entries without coords too
    if (nearby.length < limit) {
      nearby = [...nearby, ...withoutCoords]
    }

    return nearby
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
  },
})

export const getPlayerRank = query({
  args: {
    playerId: v.string(),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
  },
  handler: async (ctx, args) => {
    const allEntries = await ctx.db
      .query('leaderboardEntries')
      .withIndex('by_difficulty', (q) => q.eq('difficulty', args.difficulty))
      .collect()

    // Get the player's best score
    const playerEntries = allEntries.filter(
      (e) => e.playerId === args.playerId,
    )
    if (playerEntries.length === 0) return null

    const bestScore = Math.max(...playerEntries.map((e) => e.totalScore))
    const rank = allEntries.filter((e) => e.totalScore > bestScore).length + 1

    return {
      rank,
      bestScore,
      totalPlayers: new Set(allEntries.map((e) => e.playerId)).size,
    }
  },
})

export const backfillLeaderboardCoordinates = mutation({
  handler: async (ctx) => {
    const entries = await ctx.db
      .query('leaderboardEntries')
      .collect()

    let updated = 0
    for (const entry of entries) {
      if (entry.latitude != null && entry.longitude != null) continue

      const session = await ctx.db.get(entry.gameSessionId)
      if (!session || session.latitude == null || session.longitude == null) continue

      await ctx.db.patch(entry._id, {
        latitude: session.latitude,
        longitude: session.longitude,
      })
      updated++
    }

    return { updated, total: entries.length }
  },
})
