import { MapPin } from 'lucide-react'
import { Badge } from '../ui/badge'

interface RegionDisplayProps {
  locationLabel: string
  regionCode: string
}

export default function RegionDisplay({
  locationLabel,
  regionCode,
}: RegionDisplayProps) {
  return (
    <Badge variant="outline" className="gap-1 text-sm font-normal">
      <MapPin className="h-3 w-3" />
      {locationLabel} ({regionCode})
    </Badge>
  )
}
