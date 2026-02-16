import { useState } from "react";

interface GalleryImage {
  url: string;
  altText?: string;
  license?: string;
}

interface PlantImageGalleryProps {
  images: GalleryImage[];
  fallbackUrls?: string[];
}

export default function PlantImageGallery({
  images,
  fallbackUrls,
}: PlantImageGalleryProps) {
  // Merge gallery images with fallback URLs (deduped)
  const allImages: GalleryImage[] = [...images];
  const existingUrls = new Set(images.map((i) => i.url));
  if (fallbackUrls) {
    for (const url of fallbackUrls) {
      if (!existingUrls.has(url)) {
        allImages.push({ url });
      }
    }
  }

  if (allImages.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
      {allImages.map((img, i) => (
        <GalleryItem key={img.url} image={img} index={i} />
      ))}
    </div>
  );
}

function GalleryItem({ image, index }: { image: GalleryImage; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <div className="flex-shrink-0 snap-start w-48 space-y-1">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
        {!loaded && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
        )}
        <img
          src={image.url}
          alt={image.altText ?? `Plant photo ${index + 1}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      </div>
      {image.altText && (
        <p className="text-xs text-muted-foreground truncate">
          {image.altText}
        </p>
      )}
    </div>
  );
}
