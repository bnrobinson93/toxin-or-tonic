import { CheckCircle, XCircle, Info, AlertTriangle, Leaf, Utensils } from 'lucide-react'
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
  // Normalize 'edible' to 'neutral' for display
  const displayCategory = plant.category === 'edible' ? 'neutral' : plant.category

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
            <Badge className={categoryColors[displayCategory] ?? ''}>
              {displayCategory}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground italic">
            {plant.scientificName}
          </p>
          {plant.toxicityInfo && (
            <div className="mt-2 p-2 rounded-md bg-poisonous/10 border border-poisonous/20">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-poisonous" />
                <span className="text-xs font-semibold text-poisonous">Toxicity Warning</span>
              </div>
              <ul className="list-disc list-inside text-sm text-poisonous space-y-0.5">
                {plant.toxicityInfo.split(/[,;]/).map((item, i) => (
                  <li key={i}>{item.trim()}</li>
                ))}
              </ul>
            </div>
          )}
          {plant.medicinalUses.length > 0 && (
            <div className="mt-2 p-2 rounded-md bg-medicinal/10 border border-medicinal/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Leaf className="h-3.5 w-3.5 text-medicinal" />
                <span className="text-xs font-semibold text-medicinal">Medicinal Uses</span>
              </div>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {plant.medicinalUses.map((use, i) => (
                  <li key={i}>{use}</li>
                ))}
              </ul>
            </div>
          )}
          {plant.edibleParts.length > 0 && (
            <div className="mt-2 p-2 rounded-md bg-edible/10 border border-edible/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Utensils className="h-3.5 w-3.5 text-edible" />
                <span className="text-xs font-semibold text-edible">Edible Parts</span>
              </div>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {plant.edibleParts.map((part, i) => (
                  <li key={i}>{part}</li>
                ))}
              </ul>
            </div>
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
