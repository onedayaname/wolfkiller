import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-white mb-4 animate-pulse">
          🐺 狼人杀
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          现场游戏辅助工具
        </p>
        <a
          href="/game"
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium",
            "ring-offset-background transition-colors focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "h-12 px-8 py-3 text-lg"
          )}
        >
          开始游戏
        </a>
      </div>
    </main>
  )
}
