import { Trophy, RotateCcw } from 'lucide-react'
import { SignedOut } from '@clerk/tanstack-react-start'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { getMaxGameScore, type Difficulty } from '../../lib/scoring'
import SignInPrompt from '../auth/SignInPrompt'

interface RoundSummary {
  primaryCorrect: boolean
  bonusCorrect: boolean
  score: number
  plantName: string
}

interface GameResultsProps {
  difficulty: Difficulty
  totalScore: number
  rounds: RoundSummary[]
  regionCode: string
  onPlayAgain: () => void
  onViewLeaderboard: () => void
}

function getPerformanceMessage(
  score: number,
  maxScore: number,
): { message: string; emoji: string } {
  const pct = score / maxScore
  if (pct >= 0.9) return { message: 'Plant Master!', emoji: '🌿' }
  if (pct >= 0.7) return { message: 'Naturalist', emoji: '🌱' }
  if (pct >= 0.5) return { message: 'Getting There', emoji: '🌾' }
  if (pct >= 0.25) return { message: 'Keep Learning', emoji: '🍂' }
  return { message: 'Watch Out!', emoji: '☠️' }
}

export default function GameResults({
  difficulty,
  totalScore,
  rounds,
  onPlayAgain,
  onViewLeaderboard,
}: GameResultsProps) {
  const maxScore = getMaxGameScore(difficulty)
  const { message, emoji } = getPerformanceMessage(totalScore, maxScore)

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="text-4xl mb-2">{emoji}</div>
          <CardTitle className="font-display text-2xl">{message}</CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Trophy className="h-5 w-5 text-secondary" />
            <span className="text-2xl font-bold">{totalScore}</span>
            <span className="text-muted-foreground">/ {maxScore}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          <div className="space-y-2">
            <h3 className="font-display font-medium text-sm">Round Breakdown</h3>
            {rounds.map((round, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">R{i + 1}</span>
                  <span className="text-sm font-medium">{round.plantName}</span>
                  <div className="flex gap-1">
                    <Badge
                      variant={round.primaryCorrect ? 'default' : 'destructive'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {round.primaryCorrect ? '✓' : '✗'}
                    </Badge>
                    {round.bonusCorrect && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground">
                        +B
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="text-sm font-mono">{round.score}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={onPlayAgain} className="flex-1 gap-2">
              <RotateCcw className="h-4 w-4" />
              Play Again
            </Button>
            <Button
              variant="outline"
              onClick={onViewLeaderboard}
              className="flex-1 gap-2"
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
          </div>
        </CardContent>
      </Card>

      <SignedOut>
        <SignInPrompt />
      </SignedOut>
    </div>
  )
}
