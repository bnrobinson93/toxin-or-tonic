import { Star } from 'lucide-react'

interface ScoreDisplayProps {
  score: number
  maxScore: number
}

export default function ScoreDisplay({ score, maxScore }: ScoreDisplayProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium">
      <Star className="h-4 w-4 text-secondary fill-secondary" />
      <span>{score}</span>
      <span className="text-muted-foreground">/ {maxScore}</span>
    </div>
  )
}
