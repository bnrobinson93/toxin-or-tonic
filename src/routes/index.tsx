import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold font-display text-primary">
          Feed or Weed
        </h1>
        <p className="text-lg text-muted-foreground">
          Can you tell the difference between a feast and a fiasco?
        </p>
      </div>
    </div>
  )
}
