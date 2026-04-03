'use client'

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { ROLES, validateConfig } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, X } from 'lucide-react'

const NAMES_KEY = 'wolfkiller_player_names'

function loadSavedNames(): Record<number, string> {
  try {
    const raw = localStorage.getItem(NAMES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveNames(names: Record<number, string>) {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names))
  } catch { /* ignore */ }
}

export default function GameConfig() {
  const { config, setPlayerCount, setRoleConfig, setGameRule, startGame } = useGameStore()
  const [error, setError] = useState<string | null>(null)
  const [showNameEditor, setShowNameEditor] = useState(false)
  const [playerNames, setPlayerNames] = useState<Record<number, string>>(loadSavedNames)

  const handlePlayerCountChange = (value: number) => {
    const count = Math.max(6, Math.min(20, value))
    setPlayerCount(count)
    setError(null)
  }

  const handleRoleChange = (roleId: string, value: number) => {
    const newConfig = {
      ...config.roleConfig,
      [roleId]: Math.max(0, value),
    }
    setRoleConfig(newConfig)
    setError(null)
  }

  const handleOpenNameEditor = () => {
    const validationError = validateConfig(config.roleConfig, config.playerCount)
    if (validationError) {
      setError(validationError)
      return
    }
    const names: Record<number, string> = {}
    for (let i = 1; i <= config.playerCount; i++) {
      names[i] = playerNames[i] ?? ''
    }
    setPlayerNames(names)
    setShowNameEditor(true)
  }

  const handleNameChange = (playerId: number, name: string) => {
    setPlayerNames((prev) => ({ ...prev, [playerId]: name }))
  }

  const handleConfirmStart = () => {
    saveNames(playerNames)
    setShowNameEditor(false)
    const success = startGame(playerNames)
    if (!success) {
      setError('游戏启动失败，请检查配置')
    }
  }

  const handleSkipAndStart = () => {
    saveNames(playerNames)
    setShowNameEditor(false)
    const success = startGame()
    if (!success) {
      setError('游戏启动失败，请检查配置')
    }
  }

  const totalRoles = Object.values(config.roleConfig).reduce((sum, count) => sum + count, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-4 md:space-y-6"
      >
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">游戏配置</h1>
          <p className="text-sm md:text-base text-slate-500">设置玩家数量和角色配置</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-800">玩家数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <Button
                size="icon"
                onClick={() => handlePlayerCountChange(config.playerCount - 1)}
                disabled={config.playerCount <= 6}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white border-2 border-indigo-400 shadow-md text-lg md:text-xl"
              >
                -
              </Button>
              <Input
                type="number"
                value={config.playerCount}
                onChange={(e) => handlePlayerCountChange(parseInt(e.target.value) || 6)}
                className="w-16 md:w-20 text-center text-slate-800 bg-white border-2 border-indigo-200 rounded-xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none font-bold text-lg md:text-xl"
                min={6}
                max={20}
              />
              <Button
                size="icon"
                onClick={() => handlePlayerCountChange(config.playerCount + 1)}
                disabled={config.playerCount >= 20}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white border-2 border-indigo-400 shadow-md text-lg md:text-xl"
              >
                +
              </Button>
              <span className="text-slate-600 font-medium text-sm md:text-base">人</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-800">游戏规则</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-3">
              <Button
                onClick={() => setGameRule('屠边')}
                className={`flex-1 h-10 md:h-12 text-sm md:text-base font-medium rounded-xl transition-all ${
                  config.gameRule === '屠边'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 border-2 border-indigo-400'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                屠边
              </Button>
              <Button
                onClick={() => setGameRule('屠城')}
                className={`flex-1 h-10 md:h-12 text-sm md:text-base font-medium rounded-xl transition-all ${
                  config.gameRule === '屠城'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 border-2 border-indigo-400'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                屠城
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              {config.gameRule === '屠边' 
                ? '屠边：狼人杀光所有神职或所有村民即可获胜；好人需杀光所有狼人获胜'
                : '屠城：狼人杀光所有好人即可获胜；好人需杀光所有狼人获胜'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span>角色配置</span>
              <span className={`text-sm ${totalRoles === config.playerCount ? 'text-green-600' : 'text-red-600'}`}>
                {totalRoles} / {config.playerCount}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {ROLES.map((role) => (
              <div key={role.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      role.type === 'wolf'
                        ? 'bg-red-100 text-red-700'
                        : role.type === 'god'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {role.type === 'wolf' ? '狼' : role.type === 'god' ? '神' : '民'}
                  </span>
                  <span className="text-slate-800 font-medium text-sm md:text-base">{role.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 border border-indigo-200"
                    onClick={() => handleRoleChange(role.id, (config.roleConfig[role.id] || 0) - 1)}
                    disabled={(config.roleConfig[role.id] || 0) <= 0}
                  >
                    -
                  </Button>
                  <span className="w-6 md:w-8 text-center text-slate-800 font-bold text-base md:text-lg">
                    {config.roleConfig[role.id] || 0}
                  </span>
                  <Button
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 border border-indigo-200"
                    onClick={() => handleRoleChange(role.id, (config.roleConfig[role.id] || 0) + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 md:p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center shadow-md text-sm md:text-base"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-12 md:h-14 text-base md:text-lg font-bold rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02]"
            onClick={handleOpenNameEditor}
          >
            开始游戏
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-10 md:h-11 text-sm font-medium rounded-xl border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            onClick={handleOpenNameEditor}
          >
            <Pencil className="h-4 w-4 mr-2" />
            ✏️ 编辑玩家名称
          </Button>
        </div>
      </motion.div>

      {/* ─── 玩家名称编辑器面板 ─────────────────────────── */}
      <AnimatePresence>
        {showNameEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowNameEditor(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 面板头 */}
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-lg font-semibold text-slate-800">编辑玩家名称</h2>
                </div>
                <button
                  onClick={() => setShowNameEditor(false)}
                  className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="关闭"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-500">
                  请为每位玩家设置名称（可选），不填写则显示为&ldquo;玩家X号&rdquo;
                </p>

                <div className="space-y-3">
                  {Array.from({ length: config.playerCount }, (_, i) => i + 1).map((id) => (
                    <div key={id} className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium text-slate-600 shrink-0">
                        玩家{id}号
                      </span>
                      <div className="relative flex-1">
                        <Input
                          value={playerNames[id] ?? ''}
                          onChange={(e) => handleNameChange(id, e.target.value)}
                          placeholder=""
                          maxLength={6}
                          className="pr-10"
                        />
                        {(playerNames[id] ?? '').length > 0 && (
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${
                            (playerNames[id] ?? '').length >= 6
                              ? 'text-red-500'
                              : 'text-slate-400'
                          }`}>
                            {(playerNames[id] ?? '').length}/6
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    size="lg"
                    className="w-full h-11 font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                    onClick={handleConfirmStart}
                  >
                    保存并开始
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full h-10 text-slate-500 rounded-xl"
                    onClick={handleSkipAndStart}
                  >
                    跳过，直接开始
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
