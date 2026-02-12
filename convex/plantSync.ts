import { action, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

export const upsertPlant = internalMutation({
  args: {
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
    regionCode: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('plants')
      .withIndex('by_floraApiId', (q) => q.eq('floraApiId', args.floraApiId))
      .first()

    const { regionCode, ...plantData } = args

    if (existing) {
      const regionCodes = existing.regionCodes.includes(regionCode)
        ? existing.regionCodes
        : [...existing.regionCodes, regionCode]
      await ctx.db.patch(existing._id, {
        ...plantData,
        regionCodes,
        lastSyncedAt: Date.now(),
      })
      return { updated: true, id: existing._id }
    }

    const id = await ctx.db.insert('plants', {
      ...plantData,
      regionCodes: [regionCode],
      randomSortKey: Math.random(),
      lastSyncedAt: Date.now(),
    })
    return { updated: false, id }
  },
})

export const updateSyncLog = internalMutation({
  args: {
    logId: v.id('plantSyncLog'),
    status: v.union(
      v.literal('pending'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    plantsAdded: v.optional(v.float64()),
    plantsUpdated: v.optional(v.float64()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId)
    if (!log) return

    const updates: Record<string, unknown> = { status: args.status }
    if (args.plantsAdded !== undefined) updates.plantsAdded = args.plantsAdded
    if (args.plantsUpdated !== undefined) updates.plantsUpdated = args.plantsUpdated
    if (args.error) updates.errors = [...log.errors, args.error]
    if (args.status === 'completed' || args.status === 'failed') {
      updates.completedAt = Date.now()
    }
    await ctx.db.patch(args.logId, updates)
  },
})

export const createSyncLog = internalMutation({
  args: { regionCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert('plantSyncLog', {
      regionCode: args.regionCode,
      status: 'in_progress',
      plantsAdded: 0,
      plantsUpdated: 0,
      errors: [],
      startedAt: Date.now(),
    })
  },
})

function determineCategory(
  species: Record<string, unknown>,
): 'edible' | 'medicinal' | 'neutral' | 'poisonous' {
  const edibleParts = species.edible_parts as string[] | null
  const medicinalUses = species.medicinal_uses as string[] | null
  const isNoxious = species.noxious as boolean | null
  const isToxic = species.toxic as boolean | null

  if (isNoxious || isToxic) return 'poisonous'
  if (edibleParts && edibleParts.length > 0) return 'edible'
  if (medicinalUses && medicinalUses.length > 0) return 'medicinal'
  return 'neutral'
}

function determineNativity(
  species: Record<string, unknown>,
): 'Native' | 'Non-Native' | 'Invasive' {
  const invasive = species.invasive as boolean | null
  const native = species.native as boolean | null

  if (invasive) return 'Invasive'
  if (native === false) return 'Non-Native'
  return 'Native'
}

export const syncRegion = action({
  args: {
    regionCode: v.string(),
    page: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.FLORA_API_KEY
    if (!apiKey) throw new Error('FLORA_API_KEY not set')

    const logId = await ctx.runMutation(internal.plantSync.createSyncLog, {
      regionCode: args.regionCode,
    })

    let plantsAdded = 0
    let plantsUpdated = 0
    const page = args.page ?? 1

    try {
      const listRes = await fetch(
        `https://floraapi.com/api/v1/regions/${args.regionCode}/species?page=${page}&per_page=50`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      )

      if (!listRes.ok) {
        throw new Error(`Flora API list failed: ${listRes.status} ${await listRes.text()}`)
      }

      const listData = (await listRes.json()) as {
        data: Array<{ id: string; scientific_name: string }>
      }

      for (const item of listData.data) {
        try {
          const [speciesRes, imagesRes] = await Promise.all([
            fetch(`https://floraapi.com/api/v1/species/${item.id}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            }),
            fetch(`https://floraapi.com/api/v1/species/${item.id}/images`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            }),
          ])

          if (!speciesRes.ok) continue

          const species = (await speciesRes.json()) as Record<string, unknown>
          const imagesData = imagesRes.ok
            ? ((await imagesRes.json()) as { data: Array<{ url: string }> })
            : { data: [] }

          const imageUrls = imagesData.data.map((img) => img.url)
          const commonNames = (species.common_names as string[] | null) ?? []
          const scientificName = (species.scientific_name as string) ?? item.scientific_name
          const familyName = (species.family as string) ?? ''
          const genusName = (species.genus as string) ?? ''
          const medicinalUses = (species.medicinal_uses as string[] | null) ?? []
          const edibleParts = (species.edible_parts as string[] | null) ?? []
          const nutritionalInfo = (species.nutritional_info as string) ?? undefined
          const toxicityInfo = (species.toxicity_info as string) ?? undefined

          const result = await ctx.runMutation(internal.plantSync.upsertPlant, {
            floraApiId: String(item.id),
            scientificName,
            commonNames,
            familyName,
            genusName,
            category: determineCategory(species),
            medicinalUses,
            edibleParts,
            nutritionalInfo,
            toxicityInfo,
            imageUrls,
            preferredImageUrl: imageUrls[0],
            nativity: determineNativity(species),
            regionCode: args.regionCode,
          })

          if (result.updated) plantsUpdated++
          else plantsAdded++
        } catch (err) {
          await ctx.runMutation(internal.plantSync.updateSyncLog, {
            logId,
            status: 'in_progress',
            error: `Failed to sync species ${item.id}: ${err}`,
          })
        }
      }

      await ctx.runMutation(internal.plantSync.updateSyncLog, {
        logId,
        status: 'completed',
        plantsAdded,
        plantsUpdated,
      })

      return { plantsAdded, plantsUpdated, logId }
    } catch (err) {
      await ctx.runMutation(internal.plantSync.updateSyncLog, {
        logId,
        status: 'failed',
        error: String(err),
      })
      throw err
    }
  },
})
