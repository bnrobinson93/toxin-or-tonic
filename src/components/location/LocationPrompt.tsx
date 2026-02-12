import { MapPin } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface LocationPromptProps {
  onAllow: () => void
  onDeny: () => void
  loading: boolean
}

export default function LocationPrompt({
  onAllow,
  onDeny,
  loading,
}: LocationPromptProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-display text-xl">
          Where are you foraging?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          We use your location to show you plants from your region. Your
          location is only stored locally.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={onAllow}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Locating...' : 'Use my location'}
          </Button>
          <Button variant="outline" onClick={onDeny} disabled={loading} className="flex-1">
            Pick manually
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
