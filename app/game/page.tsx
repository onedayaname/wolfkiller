'use client'

import { useGameStore } from '@/lib/store'
import GameConfig from '@/components/game/GameConfig'
import IdentityView from '@/components/game/IdentityView'
import GamePlay from '@/components/game/GamePlay'
import GameEnd from '@/components/game/GameEnd'

export default function GamePage() {
  const stage = useGameStore((state) => state.stage)

  switch (stage) {
    case 'config':
      return <GameConfig />
    case 'viewing':
      return <IdentityView />
    case 'playing':
      return <GamePlay />
    case 'ended':
      return <GameEnd />
    default:
      return <GameConfig />
  }
}
