'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Skull, Heart, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GameEnd() {
  const { players, winner, victoryReason, currentRound, skillUsages, resetGame } = useGameStore()

  const alivePlayers = players.filter((p) => p.status === 'alive')
  const deadPlayers = players.filter((p) => p.status === 'dead')

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'wolf':
        return 'text-red-400'
      case 'god':
        return 'text-blue-400'
      case 'villager':
        return 'text-green-400'
      default:
        return 'text-gray-400'
    }
  }

  const getVictoryReasonText = () => {
    if (!victoryReason) return ''
    switch (victoryReason) {
      case 'all_wolves_dead':
        return '所有狼人已死亡'
      case 'all_gods_dead':
        return '所有神职已死亡'
      case 'all_villagers_dead':
        return '所有村民已死亡'
      case 'all_good_dead':
        return '所有好人已死亡'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">
            {winner === 'wolf' ? '🐺' : '👼'}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {winner === 'wolf' ? '狼人阵营胜利' : '好人阵营胜利'}
          </h1>
          <p className="text-yellow-400 text-lg mb-2">
            {getVictoryReasonText()}
          </p>
          <p className="text-gray-400 text-lg">
            游戏在第 {currentRound} 轮结束
          </p>
        </motion.div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              游戏统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-3xl font-bold text-green-400">
                  {alivePlayers.length}
                </div>
                <div className="text-gray-400 text-sm">存活玩家</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-3xl font-bold text-red-400">
                  {deadPlayers.length}
                </div>
                <div className="text-gray-400 text-sm">死亡玩家</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-3xl font-bold text-purple-400">
                  {skillUsages.length}
                </div>
                <div className="text-gray-400 text-sm">技能使用</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-3xl font-bold text-blue-400">
                  {currentRound}
                </div>
                <div className="text-gray-400 text-sm">游戏轮次</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-green-400" />
              存活玩家
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {alivePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <span className="text-white">{player.name}</span>
                  <span className={`text-sm ${getRoleColor(player.role.type)}`}>
                    {player.role.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Skull className="h-5 w-5 text-red-400" />
              死亡玩家
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {deadPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg opacity-60"
                >
                  <span className="text-white line-through">{player.name}</span>
                  <span className={`text-sm ${getRoleColor(player.role.type)}`}>
                    {player.role.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-14"
            onClick={resetGame}
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            开始新游戏
          </Button>
          <Link href="/" className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14"
            >
              <Home className="h-5 w-5 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
