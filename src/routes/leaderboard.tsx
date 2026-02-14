import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLocation } from '../hooks/useLocation'
import type { Difficulty } from '../lib/scoring'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import LeaderboardFilters from '../components/leaderboard/LeaderboardFilters'
import LeaderboardTable from '../components/leaderboard/LeaderboardTable'
import PlayerRankBadge from '../components/leaderboard/PlayerRankBadge'
import { Trophy } from 'lucide-react'

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
})

const ANON_ID_KEY = 'fow_anonymous_id'

function LeaderboardPage() {
  const { location } = useLocation()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')

  const playerId =
    typeof window !== 'undefined'
      ? localStorage.getItem(ANON_ID_KEY) ?? ''
      : ''

  const entries = useQuery(api.leaderboard.getNearbyLeaderboard, {
    latitude: location?.latitude,
    longitude: location?.longitude,
    difficulty,
    limit: 10,
  })

  const playerRank = useQuery(
    api.leaderboard.getPlayerRank,
    playerId
      ? {
          playerId,
          latitude: location?.latitude,
          longitude: location?.longitude,
          difficulty,
        }
      : 'skip',
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-display font-bold">Leaderboard</h1>
      </div>

      <LeaderboardFilters
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
      />

      {playerRank && (
        <PlayerRankBadge
          rank={playerRank.rank}
          totalPlayers={playerRank.totalPlayers}
          bestScore={playerRank.bestScore}
        />
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display text-muted-foreground">
            Top Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries === undefined ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <LeaderboardTable
              entries={entries}
              currentPlayerId={playerId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
