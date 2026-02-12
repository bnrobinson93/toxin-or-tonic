import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { US_STATES, SEEDED_STATES } from '../../lib/states'
import type { Difficulty } from '../../lib/scoring'

interface LeaderboardFiltersProps {
  regionCode: string
  difficulty: Difficulty
  onRegionChange: (region: string) => void
  onDifficultyChange: (difficulty: Difficulty) => void
}

export default function LeaderboardFilters({
  regionCode,
  difficulty,
  onRegionChange,
  onDifficultyChange,
}: LeaderboardFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={regionCode} onValueChange={onRegionChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          {SEEDED_STATES.map((code) => (
            <SelectItem key={code} value={code}>
              {US_STATES[code]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
