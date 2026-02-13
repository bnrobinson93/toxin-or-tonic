import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface AnswerOptionsProps {
  options: string[]
  correctAnswer: string | null
  selectedAnswer: string | null
  onSelect: (answer: string) => void
  disabled: boolean
  columns?: 2 | 3
}

export default function AnswerOptions({
  options,
  correctAnswer,
  selectedAnswer,
  onSelect,
  disabled,
  columns = 2,
}: AnswerOptionsProps) {
  const gridClass = columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'

  return (
    <div className={`grid ${gridClass} gap-2`} role="group" aria-label="Answer options">
      {options.map((option, index) => {
        const isSelected = selectedAnswer === option
        const isCorrect = correctAnswer === option
        const showResult = selectedAnswer !== null && correctAnswer !== null

        let variant: 'outline' | 'default' | 'destructive' = 'outline'
        let extraClass = ''

        if (showResult) {
          if (isCorrect) {
            variant = 'default'
            extraClass = 'bg-edible hover:bg-edible text-white animate-correct-pulse'
          } else if (isSelected && !isCorrect) {
            variant = 'destructive'
            extraClass = 'animate-shake'
          }
        } else if (isSelected) {
          variant = 'default'
        }

        return (
          <Button
            key={option}
            variant={variant}
            className={cn(
              'h-auto min-h-[44px] py-3 px-4 text-sm font-medium whitespace-normal text-left justify-start',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              extraClass,
            )}
            onClick={() => onSelect(option)}
            disabled={disabled || selectedAnswer !== null}
            aria-label={`Answer option ${index + 1}: ${option}`}
            aria-pressed={isSelected}
          >
            {option}
          </Button>
        )
      })}
      {showResult(selectedAnswer, correctAnswer) && (
        <div className="sr-only" role="status" aria-live="polite">
          {selectedAnswer === correctAnswer ? 'Correct!' : 'Incorrect.'}
        </div>
      )}
    </div>
  )
}

function showResult(selected: string | null, correct: string | null): boolean {
  return selected !== null && correct !== null
}
