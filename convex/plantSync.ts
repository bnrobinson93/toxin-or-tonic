import { action, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

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

const FLORA_API_BASE = 'https://api.floraapi.com/v1'

interface FloraSpeciesBasic {
  id: number
  scientific_name: string
  common_names: string[]
  family_name: string
  genus_name: string
  nativity: 'Native' | 'Non-Native' | 'Invasive'
  invasive_alert: boolean
  noxious: boolean
  preferred_image_url: string | null
}

interface FloraSpeciesDetailed extends FloraSpeciesBasic {
  description: string | null
  habitat: string | null
  details: string | null
  images: string[]
}

interface FloraImage {
  url: string
  alt_text: string
  license: string
}

function determineCategory(
  species: FloraSpeciesBasic,
  edibleParts: string[],
  medicinalUses: string[],
): 'edible' | 'medicinal' | 'neutral' | 'poisonous' {
  if (species.noxious || species.invasive_alert) return 'poisonous'
  if (edibleParts.length > 0) return 'edible'
  if (medicinalUses.length > 0) return 'medicinal'
  return 'neutral'
}

function floraHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}` }
}

export const syncRegion = action({
  args: {
    regionCode: v.string(),
    limit: v.optional(v.float64()),
    offset: v.optional(v.float64()),
  },
  handler: async (ctx, args): Promise<{ plantsAdded: number; plantsUpdated: number; logId: Id<'plantSyncLog'> }> => {
    const apiKey = process.env.FLORA_API_KEY
    if (!apiKey) throw new Error('FLORA_API_KEY not set')

    const logId = await ctx.runMutation(internal.plantSync.createSyncLog, {
      regionCode: args.regionCode,
    }) as Id<'plantSyncLog'>

    let plantsAdded = 0
    let plantsUpdated = 0
    const limit = args.limit ?? 50
    const offset = args.offset ?? 0

    try {
      // 1. List species in region
      const listUrl = `${FLORA_API_BASE}/regions/${args.regionCode}/species?limit=${limit}&offset=${offset}`
      const listRes = await fetch(listUrl, { headers: floraHeaders(apiKey) })

      if (!listRes.ok) {
        throw new Error(`Flora API list failed: ${listRes.status} ${await listRes.text()}`)
      }

      const speciesList = (await listRes.json()) as FloraSpeciesBasic[]

      // 2. For each species, fetch details and images
      for (const basic of speciesList) {
        try {
          const [detailRes, imagesRes] = await Promise.all([
            fetch(`${FLORA_API_BASE}/species/${basic.id}`, {
              headers: floraHeaders(apiKey),
            }),
            fetch(`${FLORA_API_BASE}/species/${basic.id}/images`, {
              headers: floraHeaders(apiKey),
            }),
          ])

          // Use detail data if available, fall back to basic
          const species: FloraSpeciesDetailed = detailRes.ok
            ? await detailRes.json()
            : { ...basic, description: null, habitat: null, details: null, images: [] }

          const imagesData: { images: FloraImage[] } = imagesRes.ok
            ? await imagesRes.json()
            : { images: [] }

          const imageUrls = imagesData.images.map((img) => img.url)
          // Also include images from the detail response
          if (species.images) {
            for (const url of species.images) {
              if (!imageUrls.includes(url)) imageUrls.push(url)
            }
          }
          // Include preferred_image_url if set
          if (basic.preferred_image_url && !imageUrls.includes(basic.preferred_image_url)) {
            imageUrls.unshift(basic.preferred_image_url)
          }

          // Fetch edible info via search endpoint
          const edibleParts: string[] = []
          const medicinalUses: string[] = []

          // Use the search endpoint to check edibility
          const edibleRes = await fetch(
            `${FLORA_API_BASE}/search?q=${encodeURIComponent(species.scientific_name)}&edible=true&limit=1`,
            { headers: floraHeaders(apiKey) },
          )
          if (edibleRes.ok) {
            const edibleData = (await edibleRes.json()) as { results: Array<Record<string, unknown>> }
            if (edibleData.results?.length > 0) {
              const match = edibleData.results[0]
              const parts = match.edible_parts as string[] | undefined
              if (parts) edibleParts.push(...parts)
            }
          }

          // Check medicinal via search
          const medRes = await fetch(
            `${FLORA_API_BASE}/search?q=${encodeURIComponent(species.scientific_name)}&medicinal=true&limit=1`,
            { headers: floraHeaders(apiKey) },
          )
          if (medRes.ok) {
            const medData = (await medRes.json()) as { results: Array<Record<string, unknown>> }
            if (medData.results?.length > 0) {
              medicinalUses.push('medicinal')
            }
          }

          const nativity = species.nativity ?? 'Native'
          const validNativity: 'Native' | 'Non-Native' | 'Invasive' =
            nativity === 'Native' || nativity === 'Non-Native' || nativity === 'Invasive'
              ? nativity
              : 'Native'

          const result = await ctx.runMutation(internal.plantSync.upsertPlant, {
            floraApiId: String(basic.id),
            scientificName: species.scientific_name,
            commonNames: species.common_names ?? [],
            familyName: species.family_name ?? '',
            genusName: species.genus_name ?? '',
            category: determineCategory(species, edibleParts, medicinalUses),
            medicinalUses,
            edibleParts,
            nutritionalInfo: undefined,
            toxicityInfo: species.noxious ? 'Noxious plant - potentially harmful' : undefined,
            imageUrls,
            preferredImageUrl: imageUrls[0] ?? basic.preferred_image_url ?? undefined,
            nativity: validNativity,
            regionCode: args.regionCode,
          })

          if (result.updated) plantsUpdated++
          else plantsAdded++
        } catch (err) {
          await ctx.runMutation(internal.plantSync.updateSyncLog, {
            logId,
            status: 'in_progress',
            error: `Failed to sync species ${basic.id}: ${err}`,
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
