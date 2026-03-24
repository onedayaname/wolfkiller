'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { ROLES, validateConfig } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function GameConfig() {
  const { config, setPlayerCount, setRoleConfig, setGameRule, startGame } = useGameStore()
  const [error, setError] = useState<string | null>(null)

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

  const handleStartGame = () => {
    const validationError = validateConfig(config.roleConfig, config.playerCount)
    if (validationError) {
      setError(validationError)
      return
    }
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

        <Button
          size="lg"
          className="w-full h-12 md:h-14 text-base md:text-lg font-bold rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02]"
          onClick={handleStartGame}
        >
          开始游戏
        </Button>
      </motion.div>
    </div>
  )
}
