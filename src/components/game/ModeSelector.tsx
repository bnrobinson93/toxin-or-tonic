import { Leaf, BookOpen, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import type { Difficulty } from '../../lib/scoring'

interface ModeSelectorProps {
  onSelect: (difficulty: Difficulty) => void
}

const modes = [
  {
    difficulty: 'easy' as Difficulty,
    title: 'That Friend You Want to Get Lost With',
    description:
      'Identify whether plants are edible, medicinal, neutral, or poisonous. Then guess the common name. Perfect for beginners!',
    icon: Leaf,
    color: 'text-edible',
    bgColor: 'bg-edible/10',
    maxScore: 525,
  },
  {
    difficulty: 'medium' as Difficulty,
    title: 'The Know It All',
    description:
      'Name the plant from its image, then answer a detail question about its properties. For experienced plant enthusiasts.',
    icon: BookOpen,
    color: 'text-medicinal',
    bgColor: 'bg-medicinal/10',
    maxScore: 825,
  },
  {
    difficulty: 'hard' as Difficulty,
    title: 'Professional Plant Person',
    description:
      'Name the plant, identify genus & species, classify it, and answer detail questions. Three sub-questions per round!',
    icon: GraduationCap,
    color: 'text-poisonous',
    bgColor: 'bg-poisonous/10',
    maxScore: 2325,
  },
]

export default function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-foreground">
          Choose Your Challenge
        </h2>
        <p className="text-muted-foreground">
          3 rounds per game. How well do you know your plants?
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {modes.map((mode) => (
          <Card
            key={mode.difficulty}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
            onClick={() => onSelect(mode.difficulty)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(mode.difficulty) } }}
            tabIndex={0}
            role="button"
            aria-label={`Play ${mode.difficulty} mode: ${mode.title}. Max score ${mode.maxScore}`}
          >
            <CardHeader className="text-center pb-2">
              <div
                className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full ${mode.bgColor}`}
              >
                <mode.icon className={`h-7 w-7 ${mode.color}`} />
              </div>
              <CardTitle className="font-display text-lg leading-tight">
                {mode.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {mode.description}
              </p>
              <div className="text-xs text-muted-foreground">
                Max score: <span className="font-semibold">{mode.maxScore}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
