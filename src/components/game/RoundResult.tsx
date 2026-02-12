import { CheckCircle, XCircle, Info } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface PlantInfo {
  commonNames: string[]
  scientificName: string
  category: string
  medicinalUses: string[]
  edibleParts: string[]
  toxicityInfo?: string | null
  nutritionalInfo?: string | null
}

interface RoundResultProps {
  primaryCorrect: boolean
  bonusCorrect: boolean
  roundScore: number
  plant: PlantInfo
  onContinue: () => void
  isLastRound: boolean
}

const categoryColors: Record<string, string> = {
  edible: 'bg-edible/20 text-edible',
  medicinal: 'bg-medicinal/20 text-medicinal',
  neutral: 'bg-neutral/20 text-neutral',
  poisonous: 'bg-poisonous/20 text-poisonous',
}

export default function RoundResult({
  primaryCorrect,
  bonusCorrect,
  roundScore,
  plant,
  onContinue,
  isLastRound,
}: RoundResultProps) {
  return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          {primaryCorrect ? (
            <CheckCircle className="h-8 w-8 text-edible flex-shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-poisonous flex-shrink-0" />
          )}
          <div>
            <p className="font-display text-lg font-semibold">
              {primaryCorrect ? 'Correct!' : 'Not quite!'}
            </p>
            <p className="text-sm text-muted-foreground">
              +{roundScore} points this round
            </p>
          </div>
        </div>

        <div className="space-y-2 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="font-display font-medium">
              {plant.commonNames[0] ?? plant.scientificName}
            </span>
            <Badge className={categoryColors[plant.category] ?? ''}>
              {plant.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground italic">
            {plant.scientificName}
          </p>
          {plant.edibleParts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Edible parts: {plant.edibleParts.join(', ')}
            </p>
          )}
          {plant.medicinalUses.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Medicinal uses: {plant.medicinalUses.join(', ')}
            </p>
          )}
          {plant.toxicityInfo && (
            <p className="text-sm text-poisonous">
              Toxicity: {plant.toxicityInfo}
            </p>
          )}
        </div>

        {bonusCorrect && (
          <p className="text-sm text-edible font-medium">
            Bonus correct! Nice depth of knowledge.
          </p>
        )}

        <Button onClick={onContinue} className="w-full">
          {isLastRound ? 'See Results' : 'Next Round'}
        </Button>
      </CardContent>
    </Card>
  )
}
