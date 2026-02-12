import { cn } from '../../lib/utils'

interface RoundIndicatorProps {
  currentRound: number
  totalRounds: number
}

export default function RoundIndicator({
  currentRound,
  totalRounds,
}: RoundIndicatorProps) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={currentRound + 1} aria-valuemax={totalRounds}>
      {Array.from({ length: totalRounds }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2.5 w-2.5 rounded-full transition-colors',
            i < currentRound
              ? 'bg-primary'
              : i === currentRound
                ? 'bg-primary animate-pulse'
                : 'bg-muted',
          )}
          aria-label={`Round ${i + 1}${i === currentRound ? ' (current)' : i < currentRound ? ' (completed)' : ''}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        Round {currentRound + 1}/{totalRounds}
      </span>
    </div>
  )
}
