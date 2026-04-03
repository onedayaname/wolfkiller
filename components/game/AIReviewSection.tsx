'use client'

import { motion } from 'framer-motion'
import { Review } from '@/lib/types'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIReviewSectionProps {
  reviews: Review[]
  winner: 'wolf' | 'good' | null
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
}

export default function AIReviewSection({
  reviews,
  winner,
  isLoading,
  isError,
  onRetry,
}: AIReviewSectionProps) {
  // 无数据时不显示区块
  if (!isLoading && !isError && reviews.length === 0) {
    return null
  }

  const winnerReviews = reviews.filter((r) => r.is_winner)
  const isWolfWinner = winner === 'wolf'

  return (
    <div className="space-y-4">
      {/* 区块标题 */}
      <div className="flex items-center gap-2">
        <Sparkles className={`h-5 w-5 ${isWolfWinner ? 'text-red-400' : 'text-green-400'}`} />
        <h3 className={`text-base font-semibold ${isWolfWinner ? 'text-red-400' : 'text-green-400'}`}>
          {isWolfWinner ? '🐺 狼人阵营高光时刻' : '🌟 好人阵营高光时刻'}
        </h3>
      </div>

      {/* 加载中 */}
      {isLoading && (
        <div className="rounded-xl p-5 text-center" style={{ background: 'hsl(var(--ai-highlight))', border: '1px solid hsl(var(--ai-highlight-border))' }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="h-5 w-5 text-amber-500" />
            </motion.div>
            <span className="text-sm font-medium text-amber-600">🤖 AI 正在生成点评中...</span>
          </div>
          {/* 假进度条 */}
          <div className="w-full h-2 rounded-full bg-amber-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: isWolfWinner ? 'hsl(0 72% 51%)' : 'hsl(142 76% 36%)' }}
              initial={{ width: '0%' }}
              animate={{ width: '75%' }}
              transition={{ duration: 8, ease: 'linear' }}
            />
          </div>
        </div>
      )}

      {/* 失败状态 */}
      {isError && (
        <div className="rounded-xl p-5 text-center" style={{ background: 'hsl(var(--ai-highlight))', border: '1px solid hsl(var(--ai-highlight-border))' }}>
          <p className="text-2xl mb-2">😴</p>
          <p className="text-sm text-amber-700 mb-3">AI 睡着了，稍后重试</p>
          {onRetry && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              重新生成点评
            </Button>
          )}
        </div>
      )}

      {/* 点评列表 */}
      {!isLoading && !isError && winnerReviews.length > 0 && (
        <div className="space-y-3">
          {winnerReviews.map((review, index) => (
            <motion.div
              key={review.id || review.player_number}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`rounded-xl p-4 border-l-4 ${
                isWolfWinner ? 'border-red-500' : 'border-green-500'
              }`}
              style={{ background: isWolfWinner ? 'rgba(127, 29, 29, 0.4)' : 'hsl(142 30% 92%)', borderLeftWidth: '4px' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-semibold text-sm ${isWolfWinner ? 'text-red-200' : 'text-green-800'}`}>
                  {review.player_name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isWolfWinner
                      ? 'bg-red-900/60 text-red-300'
                      : 'bg-green-200 text-green-800'
                  }`}
                >
                  {isWolfWinner ? '🐺 狼人' : '🌟 好人'}
                </span>
              </div>
              <p className={`text-sm italic leading-relaxed ${isWolfWinner ? 'text-slate-200' : 'text-green-900'}`}>
                &ldquo;{review.review_text}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
