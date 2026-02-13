import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'

interface ScoreDisplayProps {
  score: number
  maxScore: number
}

export default function ScoreDisplay({ score, maxScore }: ScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(score)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (score === displayScore) return
    setAnimating(true)

    // Animate counting up
    const diff = score - displayScore
    const steps = Math.min(Math.abs(diff), 20)
    const increment = diff / steps
    let step = 0

    const interval = setInterval(() => {
      step++
      if (step >= steps) {
        setDisplayScore(score)
        setAnimating(false)
        clearInterval(interval)
      } else {
        setDisplayScore((prev) => Math.round(prev + increment))
      }
    }, 30)

    return () => clearInterval(interval)
  }, [score, displayScore])

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium" aria-label={`Score: ${score} out of ${maxScore}`}>
      <Star className="h-4 w-4 text-secondary fill-secondary" />
      <span className={animating ? 'animate-score-count' : ''}>{displayScore}</span>
      <span className="text-muted-foreground">/ {maxScore}</span>
    </div>
  )
}
