import { SignInButton } from '@clerk/clerk-react'
import { LogIn } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

interface SignInPromptProps {
  message?: string
}

export default function SignInPrompt({
  message = 'Sign in to save your score and compete on the leaderboard',
}: SignInPromptProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center gap-4 py-4">
        <LogIn className="h-8 w-8 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <SignInButton mode="modal">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </SignInButton>
      </CardContent>
    </Card>
  )
}
