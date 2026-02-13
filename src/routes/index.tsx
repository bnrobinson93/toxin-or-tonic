import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { nanoid } from 'nanoid'
import { useLocation } from '../hooks/useLocation'
import type { Difficulty } from '../lib/scoring'
import ModeSelector from '../components/game/ModeSelector'
import GameBoard from '../components/game/GameBoard'
import GameResults from '../components/game/GameResults'
import LocationPrompt from '../components/location/LocationPrompt'
import LocationFallback from '../components/location/LocationFallback'
import RegionDisplay from '../components/location/RegionDisplay'

export const Route = createFileRoute('/')({ component: HomePage })

type GameState =
  | { phase: 'select' }
  | {
      phase: 'playing'
      sessionId: Id<'gameSessions'>
      difficulty: Difficulty
    }
  | {
      phase: 'results'
      difficulty: Difficulty
      totalScore: number
      rounds: Array<{
        primaryCorrect: boolean
        bonusCorrect: boolean
        score: number
        plantName: string
      }>
    }

const ANON_ID_KEY = 'fow_anonymous_id'

function getAnonymousId(): string {
  let id = localStorage.getItem(ANON_ID_KEY)
  if (!id) {
    id = nanoid()
    localStorage.setItem(ANON_ID_KEY, id)
  }
  return id
}

function HomePage() {
  const navigate = useNavigate()
  const {
    location,
    loading: locationLoading,
    needsPrompt,
    needsFallback,
    requestGeolocation,
    setManualLocation,
  } = useLocation()

  const [gameState, setGameState] = useState<GameState>({ phase: 'select' })
  const [startingGame, setStartingGame] = useState(false)

  const startGame = useMutation(api.games.startGame)

  // Fetch random plants when a difficulty is selected
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null)
  const [randomThreshold, setRandomThreshold] = useState(() => Math.random())
  const randomPlants = useQuery(
    api.plants.getRandomPlants,
    pendingDifficulty && location
      ? {
          regionCode: location.regionCode,
          difficulty: pendingDifficulty,
          count: 3,
          randomThreshold,
        }
      : 'skip',
  )

  useEffect(() => {
    if (!randomPlants || !pendingDifficulty || !location || startingGame) return
    if (randomPlants.length < 3) return

    const doStart = async () => {
      setStartingGame(true)
      try {
        const playerId = getAnonymousId()
        const sessionId = await startGame({
          playerId,
          isAnonymous: true,
          difficulty: pendingDifficulty,
          regionCode: location.regionCode,
          latitude: location.latitude,
          longitude: location.longitude,
          locationLabel: location.locationLabel,
          plantIds: randomPlants.slice(0, 3).map((p) => p._id),
        })

        setGameState({
          phase: 'playing',
          sessionId,
          difficulty: pendingDifficulty,
        })
        setPendingDifficulty(null)
      } catch (err) {
        console.error('Failed to start game:', err)
      } finally {
        setStartingGame(false)
      }
    }

    doStart()
  }, [randomPlants, pendingDifficulty, location, startGame, startingGame])

  const handleModeSelect = (difficulty: Difficulty) => {
    if (!location) return
    setPendingDifficulty(difficulty)
  }

  const handleGameComplete = (result: {
    totalScore: number
    rounds: Array<{
      primaryCorrect: boolean
      bonusCorrect: boolean
      score: number
      plantName: string
    }>
  }) => {
    if (gameState.phase !== 'playing') return
    setGameState({
      phase: 'results',
      difficulty: gameState.difficulty,
      totalScore: result.totalScore,
      rounds: result.rounds,
    })
  }

  const handlePlayAgain = () => {
    setRandomThreshold(Math.random())
    setGameState({ phase: 'select' })
  }

  const handleViewLeaderboard = () => {
    navigate({ to: '/leaderboard' })
  }

  // Location setup
  if (locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (needsPrompt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <LocationPrompt
          onAllow={requestGeolocation}
          onDeny={() => setManualLocation('OR', 'Oregon')}
          loading={false}
        />
      </div>
    )
  }

  if (needsFallback || !location) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <LocationFallback onSelect={setManualLocation} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {gameState.phase === 'select' && (
        <div className="text-center mb-4">
          <RegionDisplay
            locationLabel={location.locationLabel}
            regionCode={location.regionCode}
          />
        </div>
      )}

      {gameState.phase === 'select' && (
        <>
          {pendingDifficulty || startingGame ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {randomPlants && randomPlants.length < 3
                    ? `Not enough plant data for ${location.regionCode}. Try seeding first.`
                    : 'Setting up your game...'}
                </p>
              </div>
            </div>
          ) : (
            <ModeSelector onSelect={handleModeSelect} />
          )}
        </>
      )}

      {gameState.phase === 'playing' && (
        <GameBoard
          sessionId={gameState.sessionId}
          difficulty={gameState.difficulty}
          onGameComplete={handleGameComplete}
        />
      )}

      {gameState.phase === 'results' && (
        <GameResults
          difficulty={gameState.difficulty}
          totalScore={gameState.totalScore}
          rounds={gameState.rounds}
          regionCode={location.regionCode}
          onPlayAgain={handlePlayAgain}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}
    </div>
  )
}
