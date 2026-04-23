'use client'

import { useGameStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AIReviewSection from './AIReviewSection'
import { Trophy, Skull, Heart, RotateCcw, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function GameEnd() {
  const { players, winner, victoryReason, currentRound, skillUsages, reviews, resetGame } = useGameStore()
  const aiReviewLoading = useGameStore((state) => state.aiReviewLoading)
  const aiReviewError = useGameStore((state) => state.aiReviewError)

  const isWolfWin = winner === 'wolf'

  const alivePlayers = players.filter((p) => p.status === 'alive')
  const deadPlayers = players.filter((p) => p.status === 'dead')

  // ─── 主题配色 ───────────────────────────────────────────────
  // 狼人胜利 → 黑夜深色主题
  // 好人胜利 → 白天浅色主题
  const bg = isWolfWin
    ? 'from-slate-900 via-purple-950 to-slate-900'
    : 'from-amber-100 via-orange-50 to-pink-100'

  const cardBg = isWolfWin ? 'bg-indigo-950/80 border-indigo-700/50' : 'bg-white/80 border-white/50'
  const cardItemBg = isWolfWin ? 'bg-indigo-900/50' : 'bg-amber-50/80'
  const textPrimary = isWolfWin ? 'text-white' : 'text-slate-800'
  const textSecondary = isWolfWin ? 'text-indigo-300' : 'text-slate-500'
  const textMuted = isWolfWin ? 'text-indigo-300' : 'text-slate-400'
  const newGameBtn = isWolfWin
    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'wolf':
        return isWolfWin ? 'text-red-400' : 'text-red-600'
      case 'god':
        return isWolfWin ? 'text-blue-400' : 'text-blue-600'
      case 'villager':
        return isWolfWin ? 'text-green-400' : 'text-green-600'
      default:
        return isWolfWin ? 'text-gray-400' : 'text-gray-600'
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

  const cardClass = (extra = '') =>
    `rounded-xl shadow-xl ${cardBg} ${extra}`

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bg} p-4 md:p-6 lg:p-8`}>
      <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
        {/* 标题区 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl md:text-7xl lg:text-8xl mb-3 md:mb-4">
            {isWolfWin ? '🐺' : '👼'}
          </div>
          <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${textPrimary} mb-2`}>
            {isWolfWin ? '狼人阵营胜利' : '好人阵营胜利'}
          </h1>
          <p className="text-yellow-500 text-base md:text-lg mb-2">
            {getVictoryReasonText()}
          </p>
          <p className={`${textSecondary} text-base md:text-lg`}>
            游戏在第 {currentRound} 轮结束
          </p>
        </motion.div>

        {/* 游戏统计 */}
        <Card className={cardClass()}>
          <CardHeader>
            <CardTitle className={`${textPrimary} flex items-center gap-2`}>
              <Trophy className="h-5 w-5 text-yellow-400" />
              游戏统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {[
                { val: alivePlayers.length, label: '存活玩家', color: 'text-green-400' },
                { val: deadPlayers.length, label: '死亡玩家', color: 'text-red-400' },
                { val: skillUsages.length, label: '技能使用', color: 'text-purple-400' },
                { val: currentRound, label: '游戏轮次', color: 'text-blue-400' },
              ].map(({ val, label, color }) => (
                <div key={label} className={`text-center p-3 md:p-4 ${cardItemBg} rounded-xl`}>
                  <div className={`text-2xl md:text-3xl font-bold ${color}`}>{val}</div>
                  <div className={`${textMuted} text-xs md:text-sm`}>{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI 点评区块 */}
        <Card className={cardClass()}>
          <CardContent className="pt-4">
            {reviews.length > 0 && winner && (
              <AIReviewSection
                reviews={reviews}
                winner={winner}
                isLoading={false}
                isError={false}
                onRetry={() => {}}
              />
            )}
            {reviews.length === 0 && aiReviewLoading && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin"></div>
                </div>
                <p className={`${textMuted} text-sm animate-pulse`}>让我看看你们的表现...</p>
              </div>
            )}
            {aiReviewError && !aiReviewLoading && (
              <div className={`text-center py-8 ${textMuted}`}>
                <p className="mb-3">⚠️ AI 点评生成失败</p>
                <p className="text-xs opacity-70 mb-4">{aiReviewError}</p>
              </div>
            )}
            {reviews.length === 0 && !aiReviewLoading && !aiReviewError && (
              <div className={`text-center py-8 ${textMuted}`}>
                <p>AI 点评暂未生成</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 存活玩家 */}
        <Card className={cardClass()}>
          <CardHeader>
            <CardTitle className={`${textPrimary} flex items-center gap-2`}>
              <Heart className="h-5 w-5 text-green-400" />
              存活玩家
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {alivePlayers.map((player) => (
                <div key={player.id} className={`flex items-center justify-between p-2 md:p-3 ${cardItemBg} rounded-xl`}>
                  <span className={`${textPrimary} text-sm md:text-base`}>{player.name}</span>
                  <span className={`text-xs md:text-sm ${getRoleColor(player.role.type)}`}>
                    {player.role.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 死亡玩家 */}
        <Card className={cardClass()}>
          <CardHeader>
            <CardTitle className={`${textPrimary} flex items-center gap-2`}>
              <Skull className="h-5 w-5 text-red-400" />
              死亡玩家
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deadPlayers.map((player) => (
                <div key={player.id} className={`flex items-center justify-between p-2 md:p-3 ${cardItemBg} rounded-xl opacity-60`}>
                  <span className={`${textPrimary} line-through text-sm md:text-base`}>{player.name}</span>
                  <span className={`text-xs md:text-sm ${getRoleColor(player.role.type)}`}>
                    {player.role.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2 md:space-y-3">
          <Button
            size="lg"
            className={`w-full h-12 md:h-14 text-base md:text-lg shadow-lg ${newGameBtn}`}
            onClick={resetGame}
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            开始新游戏
          </Button>
          <Link href="/" className="block">
            <Button
              variant="outline"
              size="lg"
              className={`w-full h-12 md:h-14 text-base md:text-lg ${
                isWolfWin
                  ? 'border-indigo-400 text-indigo-300 hover:bg-indigo-900/30'
                  : 'border-orange-400 text-orange-600 hover:bg-orange-50'
              }`}
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
