'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { Review } from '@/lib/types'
import type { AIReviewResult } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AIReviewSection from './AIReviewSection'
import { Trophy, Skull, Heart, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GameEnd() {
  const { players, winner, victoryReason, currentRound, skillUsages, speeches, reviews, setReviews, config, resetGame } = useGameStore()

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(false)

  const isWolfWin = winner === 'wolf'
  const gameId = useGameStore((state) => state.gameId) ?? 'temp-game-id'

  // ─── AI 点评生成 ───────────────────────────────────────────────
  const handleGenerateReviews = async () => {
    setAiLoading(true)
    setAiError(false)
    try {
      const winningPlayers = players.map((p) => ({
        number: p.id,
        name: p.name,
        role: p.role.name,
        team: p.role.type === 'wolf' ? 'wolf' as const : 'good' as const,
      }))

      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          ruleType: config.gameRule,
          winner: winner ?? 'good',
          players: winningPlayers,
          speeches: speeches.map((s) => ({
            day: s.round_day,
            playerNumber: s.player_number,
            playerName: s.player_name,
            content: s.content,
          })),
        }),
      })

      if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`API 错误：${errBody}`)
      }

      const data = await response.json() as { reviews: AIReviewResult[] }
      const result = data.reviews

      const newReviews: Review[] = result.map((r) => ({
        player_number: r.player_number,
        player_name: r.player_name,
        review_text: r.review,
        is_winner: true,
        game_id: gameId,
      }))

      setReviews(newReviews)

      // 写入 Supabase
      if (gameId && newReviews.length > 0) {
        const { error } = await supabase
          .from('reviews')
          .insert(
            newReviews.map((r) => ({
              game_id: r.game_id,
              player_number: r.player_number,
              player_name: r.player_name,
              review_text: r.review_text,
              is_winner: r.is_winner,
            }))
          )
        if (error) {
          console.error('Supabase review insert error:', error)
        }
      }
    } catch (err) {
      console.error('AI review generation failed:', err)
      setAiError(true)
    } finally {
      setAiLoading(false)
    }
  }

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
            {winner && (
              <AIReviewSection
                reviews={reviews}
                winner={winner}
                isLoading={aiLoading}
                isError={aiError}
                onRetry={handleGenerateReviews}
              />
            )}
            {reviews.length === 0 && !aiLoading && !aiError && (
              <button
                onClick={handleGenerateReviews}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all"
              >
                ✨ 一键生成 AI 点评
              </button>
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
