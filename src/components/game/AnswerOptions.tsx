import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface AnswerOptionsProps {
  options: string[]
  correctAnswer: string | null // null while awaiting, set after answer reveals
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
    <div className={`grid ${gridClass} gap-2`}>
      {options.map((option) => {
        const isSelected = selectedAnswer === option
        const isCorrect = correctAnswer === option
        const showResult = selectedAnswer !== null && correctAnswer !== null

        let variant: 'outline' | 'default' | 'destructive' = 'outline'
        let extraClass = ''

        if (showResult) {
          if (isCorrect) {
            variant = 'default'
            extraClass = 'bg-edible hover:bg-edible text-white animate-in zoom-in-95'
          } else if (isSelected && !isCorrect) {
            variant = 'destructive'
            extraClass = 'animate-in shake'
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
              extraClass,
            )}
            onClick={() => onSelect(option)}
            disabled={disabled || selectedAnswer !== null}
            aria-label={`Answer: ${option}`}
          >
            {option}
          </Button>
        )
      })}
    </div>
  )
}
