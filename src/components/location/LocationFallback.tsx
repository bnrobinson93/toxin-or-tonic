import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { US_STATES, SEEDED_STATES } from '../../lib/states'

interface LocationFallbackProps {
  onSelect: (regionCode: string, locationLabel: string) => void
}

export default function LocationFallback({ onSelect }: LocationFallbackProps) {
  const [selected, setSelected] = useState('')

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
          <MapPin className="h-6 w-6 text-secondary" />
        </div>
        <CardTitle className="font-display text-xl">Pick your state</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Choose the state whose plants you want to identify.
        </p>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger>
            <SelectValue placeholder="Select a state..." />
          </SelectTrigger>
          <SelectContent>
            {SEEDED_STATES.map((code) => (
              <SelectItem key={code} value={code}>
                {US_STATES[code]}
              </SelectItem>
            ))}
            <SelectItem disabled value="--separator--">
              ──────────
            </SelectItem>
            {Object.entries(US_STATES)
              .filter(([code]) => !SEEDED_STATES.includes(code))
              .map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => onSelect(selected, US_STATES[selected] ?? selected)}
          disabled={!selected || selected === '--separator--'}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  )
}
