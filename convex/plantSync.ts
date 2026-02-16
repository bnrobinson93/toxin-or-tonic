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

async function fetchFallbackImage(
  scientificName: string,
  commonName?: string,
): Promise<string | null> {
  // 1. Try iNaturalist first — always real photos, never drawings
  try {
    const inatRes = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&rank=species&per_page=1`,
    )
    if (inatRes.ok) {
      const inatData = (await inatRes.json()) as {
        results?: Array<{ default_photo?: { medium_url?: string; url?: string } }>
      }
      const photo = inatData.results?.[0]?.default_photo
      // medium_url gives ~500px wide, url gives square thumbnail
      const photoUrl = photo?.medium_url ?? photo?.url
      if (photoUrl) return photoUrl
    }
  } catch {
    // Fall through to Wikimedia
  }

  // 2. Try Wikimedia Commons — filter to photos (jpeg/png), skip drawings/SVG
  for (const query of [scientificName, commonName].filter(Boolean)) {
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query!)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=800&format=json`,
      )
      if (!res.ok) continue
      const data = (await res.json()) as {
        query?: {
          pages?: Record<string, {
            title?: string
            imageinfo?: Array<{
              url: string
              thumburl?: string
              mime: string
              extmetadata?: { Categories?: { value?: string } }
            }>
          }>
        }
      }
      const pages = data.query?.pages
      if (!pages) continue
      for (const page of Object.values(pages)) {
        const info = page.imageinfo?.[0]
        if (!info) continue
        // Only accept raster photo formats
        if (info.mime !== 'image/jpeg' && info.mime !== 'image/png') continue
        // Skip likely drawings/illustrations by filename
        const title = (page.title ?? '').toLowerCase()
        if (title.includes('illustration') || title.includes('drawing') || title.includes('sketch')) continue
        return info.thumburl ?? info.url
      }
    } catch {
      // Continue to next query
    }
  }
  return null
}

function determineCategory(
  species: FloraSpeciesBasic,
  _edibleParts: string[],
  medicinalUses: string[],
): 'edible' | 'medicinal' | 'neutral' | 'poisonous' {
  if (species.noxious || species.invasive_alert) return 'poisonous'
  if (medicinalUses.length > 0) return 'medicinal'
  // Edible plants are now categorized as neutral for gameplay simplicity
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
    const limit = args.limit ?? 25
    const offset = args.offset ?? 0

    try {
      // 1. List species in region
      const listUrl = `${FLORA_API_BASE}/regions/${args.regionCode}/species?limit=${limit}&offset=${offset}`
      const listRes = await fetch(listUrl, { headers: floraHeaders(apiKey) })

      if (!listRes.ok) {
        throw new Error(`Flora API list failed: ${listRes.status} ${await listRes.text()}`)
      }

      const listBody = await listRes.json()
      const speciesList: FloraSpeciesBasic[] = Array.isArray(listBody)
        ? listBody
        : Array.isArray(listBody?.data)
          ? listBody.data
          : Array.isArray(listBody?.results)
            ? listBody.results
            : Array.isArray(listBody?.species)
              ? listBody.species
              : []

      console.log(
        `Flora API returned ${speciesList.length} species for ${args.regionCode}`,
        `(response type: ${Array.isArray(listBody) ? 'array' : typeof listBody}, keys: ${typeof listBody === 'object' && listBody ? Object.keys(listBody).join(', ') : 'n/a'})`,
      )

      if (speciesList.length === 0) {
        await ctx.runMutation(internal.plantSync.updateSyncLog, {
          logId,
          status: 'completed',
          error: `API returned 0 species. Response keys: ${typeof listBody === 'object' && listBody ? Object.keys(listBody).join(', ') : 'raw: ' + JSON.stringify(listBody).slice(0, 200)}`,
        })
      }

      // 2. Process species in parallel batches of 5
      const BATCH_SIZE = 5
      for (let i = 0; i < speciesList.length; i += BATCH_SIZE) {
        const batch = speciesList.slice(i, i + BATCH_SIZE)
        const results = await Promise.allSettled(
          batch.map(async (basic) => {
            // Fetch detail + images in parallel; search uses POST
            const [detailRes, imagesRes, edibleRes, medRes] = await Promise.all([
              fetch(`${FLORA_API_BASE}/species/${basic.id}`, {
                headers: floraHeaders(apiKey),
              }),
              fetch(`${FLORA_API_BASE}/species/${basic.id}/images`, {
                headers: floraHeaders(apiKey),
              }),
              fetch(`${FLORA_API_BASE}/search/`, {
                method: 'POST',
                headers: { ...floraHeaders(apiKey), 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `q=${encodeURIComponent(basic.scientific_name)}&edible=true&limit=1`,
              }),
              fetch(`${FLORA_API_BASE}/search/`, {
                method: 'POST',
                headers: { ...floraHeaders(apiKey), 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `q=${encodeURIComponent(basic.scientific_name)}&medicinal=true&limit=1`,
              }),
            ])

            // Use detail data if available, fall back to basic
            const species: FloraSpeciesDetailed = detailRes.ok
              ? await detailRes.json()
              : { ...basic, description: null, habitat: null, details: null, images: [] }

            // Images endpoint returns { image_urls: string[] }, not { images: FloraImage[] }
            const imagesRaw: { image_urls?: string[] } = imagesRes.ok
              ? await imagesRes.json()
              : {}

            // Collect images from all sources
            const imageUrls: string[] = []
            // 1. From dedicated images endpoint
            if (imagesRaw.image_urls) {
              for (const url of imagesRaw.image_urls) {
                if (!imageUrls.includes(url)) imageUrls.push(url)
              }
            }
            // 2. From detail response
            if (species.images) {
              for (const url of species.images) {
                if (!imageUrls.includes(url)) imageUrls.push(url)
              }
            }
            // 3. From list preferred_image_url
            if (basic.preferred_image_url && !imageUrls.includes(basic.preferred_image_url)) {
              imageUrls.unshift(basic.preferred_image_url)
            }

            // 4. Fallback: iNaturalist → Wikimedia Commons if no images found
            if (imageUrls.length === 0) {
              const fallbackImage = await fetchFallbackImage(
                basic.scientific_name,
                basic.common_names?.[0],
              )
              if (fallbackImage) imageUrls.push(fallbackImage)
            }

            const edibleParts: string[] = []
            const medicinalUses: string[] = []

            if (edibleRes.ok) {
              const edibleData = (await edibleRes.json()) as { results: Array<Record<string, unknown>> }
              if (edibleData.results?.length > 0) {
                const match = edibleData.results[0]
                const parts = match.edible_parts as string[] | undefined
                if (parts) edibleParts.push(...parts)
              }
            }

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

            return ctx.runMutation(internal.plantSync.upsertPlant, {
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
          }),
        )

        for (const result of results) {
          if (result.status === 'fulfilled') {
            if (result.value.updated) plantsUpdated++
            else plantsAdded++
          } else {
            await ctx.runMutation(internal.plantSync.updateSyncLog, {
              logId,
              status: 'in_progress',
              error: `Failed to sync species: ${result.reason}`,
            })
          }
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
