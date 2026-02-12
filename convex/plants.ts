import { query } from './_generated/server'
import { v } from 'convex/values'

export const getRandomPlants = query({
  args: {
    regionCode: v.string(),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
    count: v.float64(),
    excludeIds: v.optional(v.array(v.id('plants'))),
    randomThreshold: v.float64(),
  },
  handler: async (ctx, args) => {
    const excludeSet = new Set(args.excludeIds ?? [])

    // Query plants using randomSortKey index starting from the threshold
    let plants = await ctx.db
      .query('plants')
      .withIndex('by_randomSortKey', (q) =>
        q.gte('randomSortKey', args.randomThreshold),
      )
      .collect()

    // If we don't get enough, wrap around from 0
    if (plants.length < args.count + excludeSet.size) {
      const morePlants = await ctx.db
        .query('plants')
        .withIndex('by_randomSortKey', (q) =>
          q.lt('randomSortKey', args.randomThreshold),
        )
        .collect()
      plants = [...plants, ...morePlants]
    }

    // Filter by region and nativity based on difficulty
    const filtered = plants.filter((p) => {
      if (excludeSet.has(p._id)) return false
      if (!p.regionCodes.includes(args.regionCode)) return false
      if (!p.preferredImageUrl && p.imageUrls.length === 0) return false
      // Easy/medium: native only. Hard: all nativity types.
      if (args.difficulty !== 'hard' && p.nativity !== 'Native') return false
      return true
    })

    return filtered.slice(0, args.count)
  },
})

export const getDistractorPlants = query({
  args: {
    targetPlantId: v.id('plants'),
    regionCode: v.string(),
    count: v.float64(),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.targetPlantId)
    if (!target) return []

    const allPlants = await ctx.db.query('plants').collect()

    const distractors = allPlants.filter((p) => {
      if (p._id === args.targetPlantId) return false
      if (!p.regionCodes.includes(args.regionCode)) return false
      // Ensure different common names to avoid confusing similar answers
      const targetName = target.commonNames[0]?.toLowerCase()
      const candidateName = p.commonNames[0]?.toLowerCase()
      if (targetName && candidateName && targetName === candidateName) return false
      return true
    })

    // Shuffle and pick
    const shuffled = distractors.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, args.count)
  },
})

export const getPlantById = query({
  args: { plantId: v.id('plants') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.plantId)
  },
})

export const getPlantsByRegion = query({
  args: {
    regionCode: v.string(),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const plants = await ctx.db.query('plants').collect()
    const filtered = plants.filter((p) =>
      p.regionCodes.includes(args.regionCode),
    )
    return args.limit ? filtered.slice(0, args.limit) : filtered
  },
})
