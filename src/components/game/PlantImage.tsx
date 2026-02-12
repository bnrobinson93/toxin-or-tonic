import { useState } from 'react'
import { Skeleton } from '../ui/skeleton'

interface PlantImageProps {
  imageUrl: string | undefined
  alt?: string
}

export default function PlantImage({ imageUrl, alt = 'Mystery plant' }: PlantImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  if (!imageUrl || error) {
    return (
      <div className="w-full aspect-[4/3] rounded-xl bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No image available</span>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-muted">
      {!loaded && (
        <Skeleton className="absolute inset-0 rounded-xl" />
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  )
}
