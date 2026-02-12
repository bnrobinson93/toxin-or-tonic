import { Trophy, Medal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

interface LeaderboardEntry {
  _id: string
  displayName: string
  avatarUrl?: string | null
  totalScore: number
  completedAt: number
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentPlayerId?: string
}

export default function LeaderboardTable({
  entries,
  currentPlayerId,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No scores yet. Be the first to play!</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {entries.map((entry, i) => {
        const rank = i + 1
        const isCurrentPlayer =
          currentPlayerId && entry.displayName === currentPlayerId

        return (
          <div
            key={entry._id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isCurrentPlayer
                ? 'bg-primary/10 border border-primary/20'
                : 'hover:bg-muted/50'
            }`}
          >
            <div className="w-8 text-center flex-shrink-0">
              {rank <= 3 ? (
                <Medal
                  className={`h-5 w-5 mx-auto ${
                    rank === 1
                      ? 'text-yellow-500'
                      : rank === 2
                        ? 'text-gray-400'
                        : 'text-amber-600'
                  }`}
                />
              ) : (
                <span className="text-sm text-muted-foreground font-mono">
                  {rank}
                </span>
              )}
            </div>

            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {entry.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {entry.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.completedAt).toLocaleDateString()}
              </p>
            </div>

            <span className="font-mono text-sm font-semibold">
              {entry.totalScore}
            </span>
          </div>
        )
      })}
    </div>
  )
}
