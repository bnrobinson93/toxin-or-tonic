import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import type { Difficulty } from '../../lib/scoring'

interface LeaderboardFiltersProps {
  difficulty: Difficulty
  onDifficultyChange: (difficulty: Difficulty) => void
}

export default function LeaderboardFilters({
  difficulty,
  onDifficultyChange,
}: LeaderboardFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={difficulty} onValueChange={(v) => onDifficultyChange(v as Difficulty)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="easy">Easy</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="hard">Hard</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
