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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">游戏配置</h1>
          <p className="text-gray-400">设置玩家数量和角色配置</p>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">玩家数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePlayerCountChange(config.playerCount - 1)}
                disabled={config.playerCount <= 6}
              >
                -
              </Button>
              <Input
                type="number"
                value={config.playerCount}
                onChange={(e) => handlePlayerCountChange(parseInt(e.target.value) || 6)}
                className="w-20 text-center text-white bg-gray-700 border-gray-600"
                min={6}
                max={20}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePlayerCountChange(config.playerCount + 1)}
                disabled={config.playerCount >= 20}
              >
                +
              </Button>
              <span className="text-gray-400">人</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">游戏规则</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-3">
              <Button
                variant={config.gameRule === '屠边' ? 'default' : 'outline'}
                onClick={() => setGameRule('屠边')}
                className="flex-1"
              >
                屠边
              </Button>
              <Button
                variant={config.gameRule === '屠城' ? 'default' : 'outline'}
                onClick={() => setGameRule('屠城')}
                className="flex-1"
              >
                屠城
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              {config.gameRule === '屠边' 
                ? '屠边：狼人杀光所有神职或所有村民即可获胜；好人需杀光所有狼人获胜'
                : '屠城：狼人杀光所有好人即可获胜；好人需杀光所有狼人获胜'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex justify-between items-center">
              <span>角色配置</span>
              <span className={`text-sm ${totalRoles === config.playerCount ? 'text-green-400' : 'text-red-400'}`}>
                {totalRoles} / {config.playerCount}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ROLES.map((role) => (
              <div key={role.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      role.type === 'wolf'
                        ? 'bg-red-500/20 text-red-400'
                        : role.type === 'god'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {role.type === 'wolf' ? '狼' : role.type === 'god' ? '神' : '民'}
                  </span>
                  <span className="text-white">{role.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRoleChange(role.id, (config.roleConfig[role.id] || 0) - 1)}
                    disabled={(config.roleConfig[role.id] || 0) <= 0}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center text-white">
                    {config.roleConfig[role.id] || 0}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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
            className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}

        <Button
          size="lg"
          className="w-full h-14 text-lg"
          onClick={handleStartGame}
        >
          开始游戏
        </Button>
      </motion.div>
    </div>
  )
}
