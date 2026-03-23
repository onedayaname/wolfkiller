'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { Player, SKILL_CONFIGS, SkillConfig } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Skull,
  Heart,
  Moon,
  Sun,
  ChevronRight,
  RotateCcw,
  Swords,
  Shield,
  Eye,
  FlaskConical,
  Target,
  Sparkles,
  CheckCircle,
  XCircle,
} from 'lucide-react'

const SKILL_ICONS: Record<string, React.ReactNode> = {
  '刀人': <Skull className="h-4 w-4" />,
  '查验': <Eye className="h-4 w-4" />,
  '解药': <Heart className="h-4 w-4" />,
  '毒药': <FlaskConical className="h-4 w-4" />,
  '开枪': <Target className="h-4 w-4" />,
  '守护': <Shield className="h-4 w-4" />,
  '决斗': <Swords className="h-4 w-4" />,
  '自爆': <Sparkles className="h-4 w-4" />,
  '魅惑': <Sparkles className="h-4 w-4" />,
  '标记': <Target className="h-4 w-4" />,
}

export default function GamePlay() {
  const {
    players,
    currentRound,
    currentPhase,
    skillUsages,
    showVictoryDialog,
    winner,
    victoryReason,
    wolfKilledPlayerId,
    wolfKillUsed,
    guardBlocked,
    blockedGuardPlayerId,
    killPlayer,
    revivePlayer,
    useSkill: recordSkillUse,
    nextRound,
    setPhase,
    confirmVictory,
    resetGame,
    getValidTargets,
    isSkillAvailable,
    setWolfKilledPlayerId,
    goBack,
    canGoBack,
  } = useGameStore((state) => ({
    players: state.players,
    currentRound: state.currentRound,
    currentPhase: state.currentPhase,
    skillUsages: state.skillUsages,
    showVictoryDialog: state.showVictoryDialog,
    winner: state.winner,
    victoryReason: state.victoryReason,
    wolfKilledPlayerId: state.wolfKilledPlayerId,
    wolfKillUsed: state.wolfKillUsed,
    guardBlocked: state.guardBlocked,
    blockedGuardPlayerId: state.blockedGuardPlayerId,
    killPlayer: state.killPlayer,
    revivePlayer: state.revivePlayer,
    useSkill: state.useSkill,
    nextRound: state.nextRound,
    setPhase: state.setPhase,
    confirmVictory: state.confirmVictory,
    resetGame: state.resetGame,
    getValidTargets: state.getValidTargets,
    isSkillAvailable: state.isSkillAvailable,
    setWolfKilledPlayerId: state.setWolfKilledPlayerId,
    goBack: state.goBack,
    canGoBack: state.canGoBack,
  }))

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showSkillPanel, setShowSkillPanel] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<SkillConfig | null>(null)
  const [showTargetSelection, setShowTargetSelection] = useState(false)
  const [validTargets, setValidTargets] = useState<Player[]>([])

  const alivePlayers = players.filter((p) => p.status === 'alive')
  const deadPlayers = players.filter((p) => p.status === 'dead')

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

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player)
    setShowSkillPanel(true)
    setSelectedSkill(null)
    setShowTargetSelection(false)
  }

  const handleKill = (playerId: number) => {
    const cause = currentPhase === 'night' ? 'wolf' : 'vote'
    killPlayer(playerId, cause)
    setShowSkillPanel(false)
    setSelectedPlayer(null)
  }

  const handleRevive = (playerId: number) => {
    revivePlayer(playerId)
    setShowSkillPanel(false)
    setSelectedPlayer(null)
  }

  const handleSkillClick = (skillConfig: SkillConfig) => {
    if (!selectedPlayer) return
    
    if (!isSkillAvailable(selectedPlayer.id, skillConfig.name)) {
      return
    }

    if (!skillConfig.needsTarget) {
      const success = recordSkillUse(selectedPlayer.id, skillConfig.name)
      if (success) {
        setShowSkillPanel(false)
        setSelectedPlayer(null)
      }
      return
    }

    const targets = getValidTargets(selectedPlayer.id, skillConfig.name)
    setValidTargets(targets)
    setSelectedSkill(skillConfig)
    setShowTargetSelection(true)
  }

  const handleTargetSelect = (targetId: number) => {
    if (!selectedPlayer || !selectedSkill) return
    
    const success = recordSkillUse(selectedPlayer.id, selectedSkill.name, targetId)
    if (success) {
      if (selectedSkill.name === '刀人') {
        killPlayer(targetId, 'wolf')
      } else if (selectedSkill.name === '解药') {
        revivePlayer(targetId)
        setWolfKilledPlayerId(null)
      } else if (selectedSkill.name === '毒药') {
        killPlayer(targetId, 'witch')
      } else if (selectedSkill.name === '自爆') {
        killPlayer(selectedPlayer.id, 'white-wolf-king')
        killPlayer(targetId, 'white-wolf-king')
      } else if (selectedSkill.name === '决斗') {
        const target = players.find((p) => p.id === targetId)
        if (target && target.role.type === 'wolf') {
          killPlayer(targetId, 'knight')
        } else {
          killPlayer(selectedPlayer.id, 'knight')
        }
      }
      setShowSkillPanel(false)
      setSelectedPlayer(null)
      setSelectedSkill(null)
      setShowTargetSelection(false)
    }
  }

  const handleHunterShoot = () => {
    if (!selectedPlayer) return
    
    const skillConfig = SKILL_CONFIGS.hunter?.[0]
    if (!skillConfig) return
    
    const targets = getValidTargets(selectedPlayer.id, skillConfig.name)
    setValidTargets(targets)
    setSelectedSkill(skillConfig)
    setShowTargetSelection(true)
  }

  const getSkillUsedInfo = (player: Player, skillName: string): string | null => {
    if (!player.skillStates) return null
    const skillState = player.skillStates.find((s) => s.name === skillName)
    if (!skillState || skillState.available) return null
    if (skillState.usedAt) {
      return `第${skillState.usedAt.round}轮${skillState.usedAt.phase === 'night' ? '黑夜' : '白天'}已使用`
    }
    return '已使用'
  }

  const getNextPhaseButtonText = () => {
    return currentPhase === 'night' ? '天亮请睁眼' : '天黑请闭眼'
  }

  const getPhaseText = () => {
    return currentPhase === 'night' ? '黑夜' : '白天'
  }

  const getPhaseIcon = () => {
    return currentPhase === 'night' ? (
      <Moon className="h-5 w-5" />
    ) : (
      <Sun className="h-5 w-5" />
    )
  }

  const handleNextRound = () => {
    nextRound()
  }

  const handleGoBack = () => {
    goBack()
  }

  const getPlayerRoleColor = (type: string) => {
    switch (type) {
      case 'wolf':
        return 'border-red-500 bg-red-500/10'
      case 'god':
        return 'border-blue-500 bg-blue-500/10'
      case 'villager':
        return 'border-green-500 bg-green-500/10'
      default:
        return 'border-gray-500 bg-gray-500/10'
    }
  }

  const getPlayerName = (playerId: number | undefined): string => {
    if (!playerId) return ''
    const player = players.find((p) => p.id === playerId)
    return player ? player.name : `玩家${playerId}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getPhaseIcon()}
            <span className="text-white font-medium">第 {currentRound} 轮 · {getPhaseText()}</span>
          </div>
        </div>

        {wolfKilledPlayerId && currentPhase === 'night' && (
          <Card className="bg-red-900/30 border-red-500/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-300">
                <Skull className="h-5 w-5" />
                <span>本轮被狼人刀杀：<strong>{getPlayerName(wolfKilledPlayerId)}</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        {guardBlocked && currentPhase === 'night' && (
          <Card className="bg-green-900/30 border-green-500/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-300">
                <Shield className="h-5 w-5" />
                <span>
                  狼刀被守护抵消！
                  {blockedGuardPlayerId && (
                    <span>
                      {' '}<strong>{getPlayerName(blockedGuardPlayerId)}</strong> 的守护成功
                    </span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-400" />
                存活玩家 ({alivePlayers.length})
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetGame}
                className="h-8 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                重新开始
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {alivePlayers.map((player) => (
                <motion.button
                  key={player.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlayerClick(player)}
                  className={`p-3 rounded-lg border-2 ${getPlayerRoleColor(
                    player.role.type
                  )} text-center transition-all`}
                >
                  <div className="text-white font-medium">{player.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {player.role.name}
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {deadPlayers.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Skull className="h-5 w-5 text-red-400" />
                死亡玩家 ({deadPlayers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {deadPlayers.map((player) => (
                  <motion.button
                    key={player.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlayerClick(player)}
                    className="p-3 rounded-lg border-2 border-gray-600 bg-gray-700/50 text-center opacity-60"
                  >
                    <div className="text-white font-medium line-through">
                      {player.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {player.role.name}
                    </div>
                    {player.deathInfo && (
                      <div className="text-xs text-red-400 mt-1">
                        第{player.deathInfo.round}轮
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {skillUsages.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                技能使用记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {skillUsages.map((usage) => (
                  <div
                    key={usage.id}
                    className="flex items-center justify-between p-2 bg-gray-700/50 rounded text-sm"
                  >
                    <span className="text-gray-300">
                      第{usage.round}轮 {usage.phase === 'night' ? '黑夜' : '白天'}
                    </span>
                    <span className="text-white">
                      {usage.roleName === '狼人' ? '狼人' : getPlayerName(usage.playerId)} ({usage.roleName})
                      <span className="text-cyan-400"> {usage.skillName}</span>
                      {usage.targetId && (
                        <span className="text-yellow-400"> → {getPlayerName(usage.targetId)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(() => {
          const playersWithOneTimeSkills = players.filter(
            (p) => p.skillStates && p.skillStates.length > 0
          )
          if (playersWithOneTimeSkills.length === 0) return null
          return (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  一次性技能状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {playersWithOneTimeSkills.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-gray-700/50 rounded"
                    >
                      <span className="text-white font-medium">
                        {player.name} ({player.role.name})
                      </span>
                      <div className="flex gap-2">
                        {player.skillStates!.map((skill) => (
                          <span
                            key={skill.name}
                            className={`text-xs px-2 py-1 rounded ${
                              skill.available
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {skill.name} {skill.available ? '可用' : '已用'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })()}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur border-t border-gray-700">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGoBack}
              disabled={!canGoBack}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              返回上一环节
            </Button>
            <Button
              className="flex-1"
              onClick={handleNextRound}
            >
              {getNextPhaseButtonText()}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSkillPanel && selectedPlayer && !showTargetSelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-end justify-center"
            onClick={() => setShowSkillPanel(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-lg bg-gray-800 rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {selectedPlayer.name}
                </h3>
                <p className="text-gray-400">
                  {selectedPlayer.role.name} ·{' '}
                  {selectedPlayer.status === 'alive' ? '存活' : '死亡'}
                </p>
              </div>

              {selectedPlayer.status === 'alive' ? (
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 bg-red-600 hover:bg-red-700"
                    onClick={() => handleKill(selectedPlayer.id)}
                  >
                    <Skull className="h-4 w-4 mr-2" />
                    标记死亡
                  </Button>

                      {SKILL_CONFIGS[selectedPlayer.role.id] && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {SKILL_CONFIGS[selectedPlayer.role.id].map((skillConfig) => {
                        const available = isSkillAvailable(selectedPlayer.id, skillConfig.name)
                        const usedInfo = getSkillUsedInfo(selectedPlayer, skillConfig.name)
                        const isWolfKill = selectedPlayer.role.type === 'wolf' && skillConfig.name === '刀人'
                        return (
                          <div key={skillConfig.name} className="relative">
                            <Button
                              className="h-12 w-full text-white"
                              style={{ backgroundColor: available ? skillConfig.color : '#52525b' }}
                              onClick={() => handleSkillClick(skillConfig)}
                              disabled={!available}
                            >
                              {SKILL_ICONS[skillConfig.name]}
                              <span className="ml-2">{skillConfig.name}</span>
                              {available ? (
                                <CheckCircle className="h-4 w-4 ml-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 ml-auto" />
                              )}
                            </Button>
                            {usedInfo && (
                              <div className="text-xs text-gray-400 text-center mt-1">
                                {usedInfo}
                              </div>
                            )}
                            {isWolfKill && wolfKillUsed && (
                              <div className="text-xs text-red-400 text-center mt-1">
                                本轮已使用
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {selectedPlayer.role.id === 'hunter' && selectedPlayer.hunterShootAvailable && (
                    <Button
                      className="w-full h-12 mb-3 bg-orange-500 hover:bg-orange-600"
                      onClick={() => handleHunterShoot()}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      <span className="ml-2">开枪</span>
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="w-full h-12"
                    onClick={() => handleRevive(selectedPlayer.id)}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    复活玩家
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setShowSkillPanel(false)}
              >
                取消
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTargetSelection && selectedPlayer && selectedSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-lg bg-gray-800 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  选择目标
                </h3>
                <p className="text-gray-400">
                  {selectedPlayer.name} 使用 {selectedSkill.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedSkill.description}
                </p>
              </div>

              {validTargets.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  没有可选的目标
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {validTargets.map((target) => (
                    <Button
                      key={target.id}
                      variant="outline"
                      className="h-14 flex flex-col"
                      onClick={() => handleTargetSelect(target.id)}
                    >
                      <span className="font-medium">{target.name}</span>
                      <span className="text-xs text-gray-400">{target.role.name}</span>
                    </Button>
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowTargetSelection(false)
                  setSelectedSkill(null)
                }}
              >
                取消
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVictoryDialog && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-gray-800 rounded-2xl p-8 text-center"
            >
              <div className="text-6xl mb-4">
                {winner === 'wolf' ? '🐺' : '👼'}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {winner === 'wolf' ? '狼人阵营胜利' : '好人阵营胜利'}
              </h2>
              <p className="text-yellow-400 mb-2 font-medium">
                {getVictoryReasonText()}
              </p>
              <p className="text-gray-400 mb-6">
                游戏已达成胜利条件，是否结束游戏？
              </p>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={confirmVictory}
                >
                  确认结束游戏
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    useGameStore.setState({ showVictoryDialog: false, dismissedVictory: true })
                  }}
                >
                  继续游戏
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
