'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Eye, EyeOff, Play } from 'lucide-react'

export default function IdentityView() {
  const {
    players,
    currentViewingPlayer,
    identityRevealed,
    revealIdentity,
    hideIdentity,
    nextPlayer,
    setCurrentViewingPlayer,
    enterGamePlay,
  } = useGameStore()

  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const currentPlayer = players[currentViewingPlayer]

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">加载中...</p>
          <p className="text-gray-400 text-sm">正在初始化游戏...</p>
        </div>
      </div>
    )
  }

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">错误：找不到当前玩家</p>
          <p className="text-gray-400 text-sm">玩家总数: {players.length}, 当前索引: {currentViewingPlayer}</p>
        </div>
      </div>
    )
  }

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'wolf':
        return 'from-red-600 to-red-800'
      case 'god':
        return 'from-blue-600 to-blue-800'
      case 'villager':
        return 'from-green-600 to-green-800'
      default:
        return 'from-gray-600 to-gray-800'
    }
  }

  const getRoleBadgeColor = (type: string) => {
    switch (type) {
      case 'wolf':
        return 'bg-red-500'
      case 'god':
        return 'bg-blue-500'
      case 'villager':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handlePlayerCardClick = (index: number) => {
    if (identityRevealed) {
      hideIdentity()
    }
    setCurrentViewingPlayer(index)
  }

  const handleStartGameClick = () => {
    setShowStartConfirm(true)
  }

  const confirmStartGame = () => {
    setShowStartConfirm(false)
    enterGamePlay()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4 flex flex-col">
      <div className="text-center mb-4">
        <p className="text-gray-400 text-sm">
          点击上方玩家卡片选择查看哪位玩家的身份
        </p>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <motion.div
            className="bg-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentViewingPlayer + 1) / players.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
            {players.map((player, index) => (
              <motion.button
                key={player.id}
                onClick={() => handlePlayerCardClick(index)}
                className={`relative aspect-square rounded-md border-2 transition-all cursor-pointer ${
                  currentViewingPlayer === index
                    ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/30'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex flex-col items-center justify-center h-full p-1">
                  <div className="text-lg mb-0.5">👤</div>
                  <span className="text-[10px] text-white font-medium">
                    {player.name.replace('玩家', '')}
                  </span>
                  {currentViewingPlayer === index && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full"
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            key={currentViewingPlayer}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">
                {currentPlayer.name}
              </h2>
              <p className="text-gray-400">请查看您的身份</p>
            </div>

            <AnimatePresence mode="wait">
              {!identityRevealed ? (
                <motion.div
                  key="hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <div className="bg-gray-800/80 rounded-2xl p-12 text-center border-2 border-gray-700 shadow-2xl">
                    <div className="text-6xl mb-4">❓</div>
                    <p className="text-gray-400 text-lg mb-6">身份已隐藏</p>
                    <Button
                      size="lg"
                      className="w-full h-16 text-xl"
                      onClick={revealIdentity}
                    >
                      <Eye className="mr-2 h-6 w-6" />
                      查看身份
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, rotateY: 180 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div
                    className={`bg-gradient-to-br ${getRoleColor(
                      currentPlayer.role.type
                    )} rounded-2xl p-8 text-center border-2 border-white/20 shadow-2xl`}
                  >
                    <div className="mb-6">
                      <span
                        className={`${getRoleBadgeColor(
                          currentPlayer.role.type
                        )} px-4 py-2 rounded-full text-white text-sm font-medium`}
                      >
                        {currentPlayer.role.type === 'wolf'
                          ? '狼人阵营'
                          : '好人阵营'}
                      </span>
                    </div>

                    <div className="text-7xl mb-4">
                      {currentPlayer.role.type === 'wolf' ? '🐺' : '👤'}
                    </div>

                    <h3 className="text-4xl font-bold text-white mb-4">
                      {currentPlayer.role.name}
                    </h3>

                    {currentPlayer.role.skillDescription && (
                      <div className="bg-black/20 rounded-lg p-4 mt-4">
                        <p className="text-white/90 text-sm">
                          {currentPlayer.role.skillDescription}
                        </p>
                      </div>
                    )}

                    <div className="mt-8 space-y-3">
                      <p className="text-center text-gray-400 text-sm">
                        查看完毕后请隐藏身份，让其他玩家查看
                      </p>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full h-14"
                        onClick={hideIdentity}
                      >
                        <EyeOff className="mr-2 h-5 w-5" />
                        隐藏身份
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <div className="mt-8">
        <Button
          size="lg"
          className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
          onClick={handleStartGameClick}
        >
          <Play className="mr-2 h-5 w-5" />
          开始游戏
        </Button>
      </div>

      <Dialog open={showStartConfirm} onOpenChange={setShowStartConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认开始游戏</DialogTitle>
            <DialogDescription>
              请确保所有玩家都已经记住自己的身份后，再开始游戏。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setShowStartConfirm(false)}
              className="flex-1"
            >
              返回查看
            </Button>
            <Button
              onClick={confirmStartGame}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              天黑请闭眼
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
