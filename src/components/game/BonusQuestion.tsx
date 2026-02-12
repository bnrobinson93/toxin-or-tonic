import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import AnswerOptions from './AnswerOptions'

interface BonusQuestionProps {
  question: string
  options: string[]
  correctAnswer: string | null
  selectedAnswer: string | null
  onSelect: (answer: string) => void
  disabled: boolean
}

export default function BonusQuestion({
  question,
  options,
  correctAnswer,
  selectedAnswer,
  onSelect,
  disabled,
}: BonusQuestionProps) {
  return (
    <Card className="border-dashed border-secondary">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display text-secondary-foreground">
          Bonus Question
        </CardTitle>
        <p className="text-sm text-muted-foreground">{question}</p>
      </CardHeader>
      <CardContent>
        <AnswerOptions
          options={options}
          correctAnswer={correctAnswer}
          selectedAnswer={selectedAnswer}
          onSelect={onSelect}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  )
}
