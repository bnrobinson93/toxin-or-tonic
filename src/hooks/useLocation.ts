import { useState, useEffect, useCallback } from 'react'
import { stateFromCoordinates } from '../lib/stateBoundingBoxes'

export interface LocationData {
  regionCode: string
  locationLabel: string
  latitude?: number
  longitude?: number
}

const CACHE_KEY = 'fow_location'
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000

function getCachedLocation(): LocationData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data: LocationData; timestamp: number }
    if (Date.now() - parsed.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

function cacheLocation(data: LocationData) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ data, timestamp: Date.now() }),
  )
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ stateCode: string; stateName: string } | null> {
  try {
    const res = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      result: {
        geographies: {
          States?: Array<{ STUSAB: string; NAME: string }>
        }
      }
    }
    const state = data.result?.geographies?.States?.[0]
    if (!state) return null
    return { stateCode: state.STUSAB, stateName: state.NAME }
  } catch {
    return null
  }
}

async function ipGeolocate(): Promise<LocationData | null> {
  try {
    // Free IP geolocation — returns US state info
    const res = await fetch('https://ipapi.co/json/')
    if (!res.ok) return null
    const data = (await res.json()) as {
      region_code?: string
      region?: string
      latitude?: number
      longitude?: number
      country_code?: string
    }
    // Only use for US locations
    if (data.country_code !== 'US' || !data.region_code || !data.region) return null
    return {
      regionCode: data.region_code,
      locationLabel: data.region,
      latitude: data.latitude,
      longitude: data.longitude,
    }
  } catch {
    return null
  }
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPrompt, setNeedsPrompt] = useState(false)
  const [needsFallback, setNeedsFallback] = useState(false)

  const doGeolocate = useCallback(async () => {
    setLoading(true)
    setNeedsPrompt(false)

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000,
          })
        },
      )

      const { latitude, longitude } = position.coords
      const geo = await reverseGeocode(latitude, longitude)
      const resolved = geo ?? stateFromCoordinates(latitude, longitude)

      if (resolved) {
        const data: LocationData = {
          regionCode: resolved.stateCode,
          locationLabel: resolved.stateName,
          latitude,
          longitude,
        }
        cacheLocation(data)
        setLocation(data)
        setLoading(false)
        return
      }
    } catch {
      // Browser geolocation failed — fall through to IP lookup
    }

    // Fallback: IP-based geolocation
    const ipResult = await ipGeolocate()
    if (ipResult) {
      cacheLocation(ipResult)
      setLocation(ipResult)
      setLoading(false)
      return
    }

    setLoading(false)
    setNeedsFallback(true)
  }, [])

  useEffect(() => {
    const cached = getCachedLocation()
    if (cached) {
      setLocation(cached)
      setLoading(false)
      return
    }

    doGeolocate()
  }, [doGeolocate])

  const setManualLocation = useCallback(
    (regionCode: string, locationLabel: string) => {
      const data: LocationData = { regionCode, locationLabel }
      cacheLocation(data)
      setLocation(data)
      setNeedsFallback(false)
      setNeedsPrompt(false)
    },
    [],
  )

  return {
    location,
    loading,
    needsPrompt,
    needsFallback,
    requestGeolocation: doGeolocate,
    setManualLocation,
  }
}
