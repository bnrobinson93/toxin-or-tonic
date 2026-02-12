import { useEffect } from 'react'

export function useGamePrefetch(nextImageUrl: string | undefined) {
  useEffect(() => {
    if (!nextImageUrl) return

    // Warm browser image cache
    const img = new Image()
    img.src = nextImageUrl
  }, [nextImageUrl])
}
