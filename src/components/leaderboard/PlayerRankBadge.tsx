import { Trophy } from 'lucide-react'
import { Badge } from '../ui/badge'

interface PlayerRankBadgeProps {
  rank: number
  totalPlayers: number
  bestScore: number
}

export default function PlayerRankBadge({
  rank,
  totalPlayers,
  bestScore,
}: PlayerRankBadgeProps) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
      <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          You are <span className="text-primary font-bold">#{rank}</span> in
          your region
        </p>
        <p className="text-xs text-muted-foreground">
          Best score: {bestScore} · {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} total
        </p>
      </div>
      <Badge variant="outline" className="text-xs">
        #{rank}
      </Badge>
    </div>
  )
}
