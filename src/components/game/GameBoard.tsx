import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { Difficulty } from '../../lib/scoring'
import { getMaxGameScore } from '../../lib/scoring'
import PlantImage from './PlantImage'
import AnswerOptions from './AnswerOptions'
import BonusQuestion from './BonusQuestion'
import RoundResult from './RoundResult'
import RoundIndicator from './RoundIndicator'
import ScoreDisplay from './ScoreDisplay'

type GamePhase = 'answering' | 'bonus' | 'result'

interface GameBoardProps {
  sessionId: Id<'gameSessions'>
  difficulty: Difficulty
  onGameComplete: (result: {
    totalScore: number
    rounds: Array<{
      primaryCorrect: boolean
      bonusCorrect: boolean
      score: number
      plantName: string
    }>
  }) => void
}

const CATEGORY_OPTIONS = ['edible', 'medicinal', 'neutral', 'poisonous']

export default function GameBoard({
  sessionId,
  difficulty,
  onGameComplete,
}: GameBoardProps) {
  const [currentRound, setCurrentRound] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('answering')
  const [primaryAnswer, setPrimaryAnswer] = useState<string | null>(null)
  const [bonusAnswer, setBonusAnswer] = useState<string | null>(null)
  const [roundStartTime, setRoundStartTime] = useState(Date.now())
  const [totalScore, setTotalScore] = useState(0)
  const [roundResults, setRoundResults] = useState<
    Array<{
      primaryCorrect: boolean
      bonusCorrect: boolean
      score: number
      plantName: string
      plant: {
        commonNames: string[]
        scientificName: string
        category: string
        medicinalUses: string[]
        edibleParts: string[]
        toxicityInfo?: string | null
        nutritionalInfo?: string | null
      }
    }>
  >([])

  const submitAnswer = useMutation(api.games.submitAnswer)

  // Fetch current round data
  const roundData = useQuery(api.games.getRoundData, {
    sessionId,
    roundIndex: currentRound,
  })

  // Fetch plant data for answer options
  const plantData = useQuery(api.plants.getPlantById, roundData?.plantId ? {
    plantId: roundData.plantId,
  } : 'skip')

  // Fetch distractors for answer options
  const session = useQuery(api.games.getGameSession, { sessionId })
  const distractors = useQuery(
    api.plants.getDistractorPlants,
    roundData?.plantId && session
      ? {
          targetPlantId: roundData.plantId,
          regionCode: session.regionCode,
          count: difficulty === 'hard' ? 5 : difficulty === 'easy' ? 2 : 3,
        }
      : 'skip',
  )

  // Generate shuffled answer options
  const answerOptionsRef = useRef<string[]>([])
  const bonusOptionsRef = useRef<string[]>([])
  const bonusQuestionRef = useRef<string>('')
  const bonusCorrectAnswerRef = useRef<string>('')

  useEffect(() => {
    if (!plantData || !distractors) return

    // Reset on new round
    if (phase === 'answering' && primaryAnswer === null) {
      setRoundStartTime(Date.now())

      // Build primary answer options based on difficulty
      if (difficulty === 'easy') {
        // Category classification
        answerOptionsRef.current = shuffleArray([...CATEGORY_OPTIONS])
      } else {
        // Common name identification
        const correctName = plantData.commonNames[0] ?? plantData.scientificName
        const wrongNames = distractors
          .map((d) => d.commonNames[0])
          .filter((n): n is string => !!n && n !== correctName)
          .slice(0, difficulty === 'hard' ? 5 : 3)
        answerOptionsRef.current = shuffleArray([correctName, ...wrongNames])
      }

      // Build bonus question and options
      if (difficulty === 'easy') {
        // Bonus: guess common name
        bonusQuestionRef.current = 'What is this plant commonly called?'
        const correctName = plantData.commonNames[0] ?? plantData.scientificName
        const wrongNames = distractors
          .map((d) => d.commonNames[0])
          .filter((n): n is string => !!n && n !== correctName)
          .slice(0, 2)
        bonusOptionsRef.current = shuffleArray([correctName, ...wrongNames])
        bonusCorrectAnswerRef.current = correctName
      } else {
        // Bonus: detail question
        const detail = getBonusDetail(plantData)
        bonusQuestionRef.current = detail.question
        const wrongDetails = distractors
          .map((d) => getBonusDetail(d).answer)
          .filter((a) => a !== detail.answer)
          .slice(0, 3)
        bonusOptionsRef.current = shuffleArray([detail.answer, ...wrongDetails])
        bonusCorrectAnswerRef.current = detail.answer
      }
    }
  }, [plantData, distractors, phase, primaryAnswer, difficulty])

  // Prefetch next round's image
  useEffect(() => {
    if (currentRound < 2 && session) {
      const nextRound = session.rounds[currentRound + 1]
      if (nextRound?.plantId) {
        // This triggers the Convex query cache to load
      }
    }
  }, [currentRound, session])

  const handlePrimaryAnswer = useCallback(
    async (answer: string) => {
      setPrimaryAnswer(answer)

      if (difficulty === 'easy') {
        // For easy: after primary (category), show bonus (common name)
        setPhase('bonus')
      } else {
        // For medium/hard: after primary (common name), show bonus (detail)
        setPhase('bonus')
      }
    },
    [difficulty],
  )

  const handleBonusAnswer = useCallback(
    async (answer: string) => {
      setBonusAnswer(answer)

      const timeToAnswerMs = Date.now() - roundStartTime

      try {
        const result = await submitAnswer({
          sessionId,
          roundIndex: currentRound,
          primaryAnswer: primaryAnswer!,
          bonusAnswer: answer,
          timeToAnswerMs,
        })

        const newTotalScore = result.totalScore
        setTotalScore(newTotalScore)
        setRoundResults((prev) => [
          ...prev,
          {
            primaryCorrect: result.primaryCorrect,
            bonusCorrect: result.bonusCorrect,
            score: result.roundScore,
            plantName: result.plant.commonNames[0] ?? result.plant.scientificName,
            plant: result.plant,
          },
        ])
        setPhase('result')
      } catch (err) {
        console.error('Failed to submit answer:', err)
      }
    },
    [sessionId, currentRound, primaryAnswer, roundStartTime, submitAnswer],
  )

  const handleSkipBonus = useCallback(async () => {
    const timeToAnswerMs = Date.now() - roundStartTime

    try {
      const result = await submitAnswer({
        sessionId,
        roundIndex: currentRound,
        primaryAnswer: primaryAnswer!,
        timeToAnswerMs,
      })

      setTotalScore(result.totalScore)
      setRoundResults((prev) => [
        ...prev,
        {
          primaryCorrect: result.primaryCorrect,
          bonusCorrect: false,
          score: result.roundScore,
          plantName: result.plant.commonNames[0] ?? result.plant.scientificName,
          plant: result.plant,
        },
      ])
      setPhase('result')
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }, [sessionId, currentRound, primaryAnswer, roundStartTime, submitAnswer])

  const handleContinue = useCallback(() => {
    const latestResults = roundResults
    if (currentRound >= 2) {
      // Game complete
      onGameComplete({
        totalScore,
        rounds: latestResults,
      })
      return
    }

    setCurrentRound((prev) => prev + 1)
    setPhase('answering')
    setPrimaryAnswer(null)
    setBonusAnswer(null)
  }, [currentRound, onGameComplete, totalScore, roundResults])

  if (!roundData || !plantData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading round...</p>
        </div>
      </div>
    )
  }

  const maxScore = getMaxGameScore(difficulty)
  const latestResult = roundResults[roundResults.length - 1]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <RoundIndicator currentRound={currentRound} totalRounds={3} />
        <ScoreDisplay score={totalScore} maxScore={maxScore} />
      </div>

      {phase !== 'result' && (
        <>
          <PlantImage imageUrl={roundData.plantImageUrl} />

          <div className="space-y-2">
            <p className="font-display font-medium text-sm">
              {difficulty === 'easy'
                ? 'Is this plant edible, medicinal, neutral, or poisonous?'
                : 'What is this plant?'}
            </p>
            <AnswerOptions
              options={answerOptionsRef.current}
              correctAnswer={null}
              selectedAnswer={primaryAnswer}
              onSelect={handlePrimaryAnswer}
              disabled={phase !== 'answering'}
              columns={difficulty === 'easy' ? 2 : 2}
            />
          </div>

          {phase === 'bonus' && (
            <div className="space-y-2">
              <BonusQuestion
                question={bonusQuestionRef.current}
                options={bonusOptionsRef.current}
                correctAnswer={null}
                selectedAnswer={bonusAnswer}
                onSelect={handleBonusAnswer}
                disabled={bonusAnswer !== null}
              />
              <button
                onClick={handleSkipBonus}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip bonus question
              </button>
            </div>
          )}
        </>
      )}

      {phase === 'result' && latestResult && (
        <RoundResult
          primaryCorrect={latestResult.primaryCorrect}
          bonusCorrect={latestResult.bonusCorrect}
          roundScore={latestResult.score}
          plant={latestResult.plant}
          onContinue={handleContinue}
          isLastRound={currentRound >= 2}
        />
      )}
    </div>
  )
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getBonusDetail(plant: {
  medicinalUses: string[]
  edibleParts: string[]
  toxicityInfo?: string | null
  nutritionalInfo?: string | null
}): { question: string; answer: string } {
  if (plant.medicinalUses.length > 0) {
    return {
      question: 'What is one medicinal use of this plant?',
      answer: plant.medicinalUses[0],
    }
  }
  if (plant.edibleParts.length > 0) {
    return {
      question: 'Which part of this plant is edible?',
      answer: plant.edibleParts[0],
    }
  }
  if (plant.toxicityInfo) {
    return {
      question: 'What is notable about this plant\'s toxicity?',
      answer: plant.toxicityInfo,
    }
  }
  if (plant.nutritionalInfo) {
    return {
      question: 'What nutritional benefit does this plant offer?',
      answer: plant.nutritionalInfo,
    }
  }
  return {
    question: 'What is this plant\'s scientific name?',
    answer: plant.medicinalUses[0] ?? 'Unknown',
  }
}
