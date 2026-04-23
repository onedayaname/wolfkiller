'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { Player, SKILL_CONFIGS, SkillConfig } from '@/lib/types'
import { extractPlayerName, extractPlayerNumber } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SpeechPanel from './SpeechPanel'
import {
  Skull,
  Heart,
  Moon,
  Sun,
  ChevronRight,
  RotateCcw,
  Shield,
  Sparkles,
  CheckCircle,
  XCircle,
  Mic,
} from 'lucide-react'

const SKILL_ICONS: Record<string, React.ReactNode> = {
  '刀人': <span className="text-lg">🗡️</span>,
  '查验': <span className="text-lg">👁️</span>,
  '解药': <span className="text-lg">💊</span>,
  '毒药': <span className="text-lg">☠️</span>,
  '开枪': <span className="text-lg">🔫</span>,
  '守护': <span className="text-lg">🛡️</span>,
  '决斗': <span className="text-lg">⚔️</span>,
  '自爆': <span className="text-lg">💥</span>,
  '魅惑': <span className="text-lg">💕</span>,
  '标记': <span className="text-lg">🎯</span>,
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
    confirmVictory,
    resetGame,
    getValidTargets,
    isSkillAvailable,
    isConsecutiveGuard,
    setWolfKilledPlayerId,
    goBack,
    canGoBack,
    gameId,
    speeches,
    addSpeech: addSpeechAction,
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
    confirmVictory: state.confirmVictory,
    resetGame: state.resetGame,
    getValidTargets: state.getValidTargets,
    isSkillAvailable: state.isSkillAvailable,
    isConsecutiveGuard: state.isConsecutiveGuard,
    setWolfKilledPlayerId: state.setWolfKilledPlayerId,
    goBack: state.goBack,
    canGoBack: state.canGoBack,
    dismissedVictory: state.dismissedVictory,
    gameId: state.gameId,
    speeches: state.speeches,
    addSpeech: state.addSpeech,
  }))

  // 规则切换方法（从 store 顶层直接取，避免闭包问题）
  const switchToKillAll = useGameStore.getState().switchToKillAll
  const keepCurrentRule = useGameStore.getState().keepCurrentRule

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showSkillPanel, setShowSkillPanel] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<SkillConfig | null>(null)
  const [showTargetSelection, setShowTargetSelection] = useState(false)
  const [validTargets, setValidTargets] = useState<Player[]>([])
  const [showConsecutiveGuardConfirm, setShowConsecutiveGuardConfirm] = useState(false)
  const [pendingGuardTarget, setPendingGuardTarget] = useState<number | null>(null)
  const [speechPanelOpen, setSpeechPanelOpen] = useState(false)
  const [showRuleSwitchDialog, setShowRuleSwitchDialog] = useState(false)

  const alivePlayers = players.filter((p) => p.status === 'alive')
  const deadPlayers = players.filter((p) => p.status === 'dead')

  // 胜利弹窗弹出时自动触发 AI 点评生成
  useEffect(() => {
    if (showVictoryDialog && winner) {
      useGameStore.getState().generateAIReview()
    }
  }, [showVictoryDialog, winner])

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

    if (selectedSkill.name === '守护' && selectedPlayer.role.id === 'guard') {
      if (isConsecutiveGuard(selectedPlayer.id, targetId)) {
        setPendingGuardTarget(targetId)
        setShowConsecutiveGuardConfirm(true)
        setShowTargetSelection(false)
        return
      }
    }
    
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

  const handleConsecutiveGuardConfirm = () => {
    if (!selectedPlayer || pendingGuardTarget === null) return
    
    const success = recordSkillUse(selectedPlayer.id, '守护', pendingGuardTarget)
    if (success) {
      setShowSkillPanel(false)
      setSelectedPlayer(null)
      setSelectedSkill(null)
    }
    setShowConsecutiveGuardConfirm(false)
    setPendingGuardTarget(null)
  }

  const handleConsecutiveGuardCancel = () => {
    setShowConsecutiveGuardConfirm(false)
    setPendingGuardTarget(null)
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

  const isNight = currentPhase === 'night'

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

  const getRoleEmoji = (roleId: string) => {
    switch (roleId) {
      case 'seer':
        return '👁️'
      case 'witch':
        return '🧪'
      case 'guard':
        return '🛡️'
      case 'hunter':
        return '🏹'
      case 'villager':
        return '🧑'
      case 'wolf':
        return '🐺'
      case 'knight':
        return '🦸'
      case 'white-wolf-king':
        return '🐺👑'
      case 'gargoyle':
        return '🐺🗿'
      case 'demon':
        return '🐺😈'
      case 'wolf-beauty':
        return '🐺💋'
      case 'idiot':
        return '🤪'
      default:
        return '🧑'
    }
  }

  const getPlayerName = (playerId: number | undefined): string => {
    if (!playerId) return ''
    const player = players.find((p) => p.id === playerId)
    return player ? player.name : `玩家${playerId}`
  }

  return (
    <div className={`min-h-screen p-3 md:p-4 ${isNight ? 'pb-24 md:pb-20' : speechPanelOpen ? 'pb-[65vh]' : 'pb-24 md:pb-20'} ${isNight 
      ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950' 
      : 'bg-gradient-to-b from-amber-100 via-orange-50 to-pink-100'}`}>
      <div className="max-w-2xl mx-auto space-y-3 md:space-y-4">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className={`flex items-center gap-1 md:gap-2 font-medium text-sm md:text-base ${isNight ? 'text-white' : 'text-slate-800'}`}>
            {getPhaseIcon()}
            <span>第 {currentRound} 轮 · {getPhaseText()}</span>
          </div>
        </div>

        {wolfKilledPlayerId && currentPhase === 'night' && (
          <Card className={`border ${isNight ? 'bg-red-900/30 border-red-500/50' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="pt-4">
              <div className={`flex items-center gap-2 ${isNight ? 'text-red-300' : 'text-red-700'}`}>
                <Skull className="h-5 w-5" />
                <span>本轮被狼人刀杀：<strong>{getPlayerName(wolfKilledPlayerId)}</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        {guardBlocked && currentPhase === 'night' && (
          <Card className={`border ${isNight ? 'bg-green-900/30 border-green-500/50' : 'bg-green-50 border-green-200'}`}>
            <CardContent className="pt-4">
              <div className={`flex items-center gap-2 ${isNight ? 'text-green-300' : 'text-green-700'}`}>
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

        <Card className={`${isNight ? 'bg-indigo-950/80 border-indigo-700/50' : 'bg-white/80 backdrop-blur-sm border-white/50'} shadow-xl`}>
          <CardHeader>
            <CardTitle className={`flex items-center justify-between gap-2 ${isNight ? 'text-white' : 'text-slate-800'}`}>
              <div className="flex items-center gap-2">
                <Heart className={`h-5 w-5 ${isNight ? 'text-green-400' : 'text-green-600'}`} />
                存活玩家 ({alivePlayers.length})
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={resetGame}
                className={`h-8 text-xs border ${isNight ? 'text-indigo-300 border-indigo-500/50 bg-indigo-900/30 hover:bg-indigo-900/50' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-100'}`}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                重新开始
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 md:gap-2">
              {alivePlayers.map((player) => (
                <motion.button
                  key={player.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlayerClick(player)}
                  className={`p-3 rounded-xl border-2 ${getPlayerRoleColor(
                    player.role.type
                  )} text-center transition-all shadow-md hover:shadow-lg`}
                >
                  <div className={`text-lg mb-1`}>
                    {getRoleEmoji(player.role.id)}
                  </div>
                  <div className={`font-semibold ${isNight ? 'text-white' : 'text-slate-800'}`}>
                    {extractPlayerNumber(player.name)}玩家
                  </div>
                  {extractPlayerName(player.name) && (
                    <div className={`text-sm ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>
                      {extractPlayerName(player.name)}
                    </div>
                  )}
                  <div className={`text-xs mt-1 ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>
                    {player.role.name}
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {deadPlayers.length > 0 && (
          <Card className={`${isNight ? 'bg-indigo-950/80 border-indigo-700/50' : 'bg-white/80 backdrop-blur-sm border-white/50'} shadow-xl`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isNight ? 'text-white' : 'text-slate-800'}`}>
                <Skull className={`h-5 w-5 ${isNight ? 'text-red-400' : 'text-red-500'}`} />
                死亡玩家 ({deadPlayers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 md:gap-2">
                {deadPlayers.map((player) => (
                  <motion.button
                    key={player.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlayerClick(player)}
                    className={`p-3 rounded-xl border-2 text-center opacity-60 shadow-md ${
                      isNight 
                        ? 'border-indigo-700/50 bg-indigo-900/30' 
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className={`text-lg mb-1`}>
                      {getRoleEmoji(player.role.id)}
                    </div>
                    <div className={`font-semibold ${isNight ? 'text-white' : 'text-slate-800'}`}>
                      {extractPlayerNumber(player.name)}玩家
                    </div>
                    {extractPlayerName(player.name) && (
                      <div className={`text-sm ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>
                        {extractPlayerName(player.name)}
                      </div>
                    )}
                    <div className={`text-xs mt-1 ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>
                      {player.role.name}
                    </div>
                    {player.deathInfo && (
                      <div className={`text-xs mt-1 ${isNight ? 'text-red-400' : 'text-red-500'}`}>
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
          <Card className={`${isNight ? 'bg-indigo-950/80 border-indigo-700/50' : 'bg-white/80 backdrop-blur-sm border-white/50'} shadow-xl`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isNight ? 'text-white' : 'text-slate-800'}`}>
                <Sparkles className={`h-5 w-5 ${isNight ? 'text-purple-400' : 'text-purple-500'}`} />
                技能使用记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {skillUsages.map((usage) => (
                  <div
                    key={usage.id}
                    className={`flex items-center justify-between p-2 rounded text-sm border ${
                      isNight ? 'bg-indigo-900/50 border-indigo-700/50' : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <span className={isNight ? 'text-indigo-300' : 'text-slate-600'}>
                      第{usage.round}轮 {usage.phase === 'night' ? '黑夜' : '白天'}
                    </span>
                    <span className={isNight ? 'text-white' : 'text-slate-800'}>
                      {usage.roleName === '狼人' ? '狼人' : getPlayerName(usage.playerId)} ({usage.roleName})
                      <span className={isNight ? 'text-cyan-400' : 'text-cyan-600'}> {usage.skillName}</span>
                      {usage.targetId && (
                        <span className={isNight ? 'text-yellow-400' : 'text-yellow-600'}> → {getPlayerName(usage.targetId)}</span>
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
            <Card className={`${isNight ? 'bg-indigo-950/80 border-indigo-700/50' : 'bg-white/80 backdrop-blur-sm border-white/50'} shadow-xl`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isNight ? 'text-white' : 'text-slate-800'}`}>
                  <Shield className={`h-5 w-5 ${isNight ? 'text-cyan-400' : 'text-cyan-500'}`} />
                  一次性技能状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {playersWithOneTimeSkills.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded border ${
                        isNight ? 'bg-indigo-900/50 border-indigo-700/50' : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <span className={isNight ? 'text-white' : 'text-slate-800'}>
                        {player.name} ({player.role.name})
                      </span>
                      <div className="flex gap-2">
                        {player.skillStates!.map((skill) => (
                          <span
                            key={skill.name}
                            className={`text-xs px-2 py-1 rounded ${
                              skill.available
                                ? isNight ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                                : isNight ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
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

        <div className={`fixed bottom-0 left-0 right-0 p-3 md:p-4 backdrop-blur-md border-t ${
          isNight
            ? 'bg-indigo-950/90 border-indigo-700/50'
            : 'bg-white/90 border-amber-200/50'
        }`}>
          <div className="max-w-2xl mx-auto flex gap-2">
            <Button
              variant="outline"
              className={`flex-1 rounded-xl h-10 md:h-12 ${isNight ? 'border-indigo-400 text-indigo-300 hover:bg-indigo-900/30' : 'border-orange-400 text-orange-600 hover:bg-orange-50'}`}
              onClick={goBack}
              disabled={!canGoBack}
            >
              <RotateCcw className="h-4 w-4 mr-1 md:mr-2" />
              <span className="text-xs sm:text-sm md:text-base">返回</span>
            </Button>

            {/* 发言按钮（仅白天显示） */}
            {!isNight && (
              <Button
                className={`flex-1 rounded-xl h-10 md:h-12 font-bold shadow-lg transition-all ${
                  speechPanelOpen
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-orange-100 border-2 border-orange-300 text-orange-600 hover:bg-orange-50'
                }`}
                onClick={() => setSpeechPanelOpen((v) => !v)}
              >
                <Mic className="h-4 w-4 mr-1 md:mr-2" />
                <span className="text-xs sm:text-sm md:text-base">
                  {speechPanelOpen ? '收起' : '🗣️ 发言'}
                </span>
              </Button>
            )}

            <Button
              className={`flex-1 font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] h-10 md:h-12 ${
                isNight
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
              }`}
              onClick={nextRound}
            >
              <span className="text-xs sm:text-sm md:text-base">{getNextPhaseButtonText()}</span>
              <ChevronRight className="h-4 w-4 ml-1 md:ml-2" />
            </Button>
          </div>
        </div>

        {/* 发言面板（仅白天 + 开启时显示） */}
        {!isNight && speechPanelOpen && (
          <SpeechPanel
            gameId={gameId ?? ''}
            isNight={isNight}
            speeches={speeches}
            onSpeechSaved={async (speech) => {
              addSpeechAction(speech)
              if (speech.game_id) {
                const { error } = await supabase
                  .from('speeches')
                  .insert({
                    game_id: speech.game_id,
                    player_number: speech.player_number,
                    player_name: speech.player_name,
                    content: speech.content,
                    round_day: speech.round_day,
                    round_order: speech.round_order,
                  })
                if (error) {
                  console.error('Supabase speech insert error:', error)
                }
              }
            }}
            onClose={() => setSpeechPanelOpen(false)}
          />
        )}
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
              className={`w-full max-w-lg rounded-t-3xl p-6 ${isNight ? 'bg-indigo-900' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">
                  {getRoleEmoji(selectedPlayer.role.id)}
                </div>
                <h3 className={`text-2xl font-bold ${isNight ? 'text-white' : 'text-slate-800'}`}>
                  {selectedPlayer.name}
                </h3>
                <p className={isNight ? 'text-indigo-300' : 'text-slate-500'}>
                  {selectedPlayer.role.name} ·{' '}
                  {selectedPlayer.status === 'alive' ? '存活' : '死亡'}
                </p>
              </div>

              {selectedPlayer.status === 'alive' ? (
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 bg-red-600 hover:bg-red-700 shadow-lg text-base"
                    onClick={() => handleKill(selectedPlayer.id)}
                  >
                    <span className="text-xl mr-2">💀</span>
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
                              className="h-12 w-full text-white shadow-md"
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
                              <div className={`text-xs text-center mt-1 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
                                {usedInfo}
                              </div>
                            )}
                            {isWolfKill && wolfKillUsed && (
                              <div className={`text-xs text-center mt-1 ${isNight ? 'text-red-400' : 'text-red-500'}`}>
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
                      className="w-full h-12 mb-3 bg-orange-500 hover:bg-orange-600 shadow-lg text-base"
                      onClick={() => handleHunterShoot()}
                    >
                      <span className="text-xl mr-2">🏹</span>
                      <span className="ml-2">开枪</span>
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="w-full h-12 shadow-md text-base"
                    onClick={() => handleRevive(selectedPlayer.id)}
                  >
                    <span className="text-xl mr-2">❤️</span>
                    复活玩家
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                className={`w-full mt-4 border-2 ${isNight ? 'border-indigo-400 text-indigo-200 hover:bg-indigo-900/50' : 'border-orange-400 text-orange-600 hover:bg-orange-50'}`}
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
              className={`w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto ${isNight ? 'bg-indigo-900' : 'bg-white'}`}
            >
              <div className="text-center mb-4">
                <h3 className={`text-xl font-bold ${isNight ? 'text-white' : 'text-slate-800'}`}>
                  选择目标
                </h3>
                <p className={isNight ? 'text-indigo-300' : 'text-slate-500'}>
                  {selectedPlayer.name} 使用 {selectedSkill.name}
                </p>
                <p className={`text-xs mt-1 ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {selectedSkill.description}
                </p>
              </div>

              {validTargets.length === 0 ? (
                <div className={`text-center py-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
                  没有可选的目标
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {validTargets.map((target) => (
                    <Button
                      key={target.id}
                      className={`h-14 flex flex-col shadow-md border-2 ${
                        isNight
                          ? 'bg-indigo-800 border-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-white border-orange-300 text-slate-800 hover:bg-orange-50'
                      }`}
                      onClick={() => handleTargetSelect(target.id)}
                    >
                      <span className="font-medium">{target.name}</span>
                      <span className={`text-xs ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>{target.role.name}{target.role.emoji}</span>
                    </Button>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className={`w-full border-2 ${isNight ? 'border-indigo-400 text-indigo-200 hover:bg-indigo-900/50' : 'border-orange-400 text-orange-600 hover:bg-orange-50'}`}
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
        {showConsecutiveGuardConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4"
            onClick={handleConsecutiveGuardCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl p-6 text-center ${isNight ? 'bg-indigo-900' : 'bg-white'} shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className={`text-xl font-bold mb-3 ${isNight ? 'text-white' : 'text-slate-800'}`}>
                连续守护确认
              </h3>
              <p className={`mb-6 ${isNight ? 'text-indigo-300' : 'text-slate-600'}`}>
                你选择了连续两晚守护同一个玩家，是否确认？
                <br />
                <span className="text-yellow-400 text-sm">
                  （连续守护可能导致守尸，狼人可以从守卫刀不到的地方刀人）
                </span>
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                  onClick={handleConsecutiveGuardConfirm}
                >
                  确认守护
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleConsecutiveGuardCancel}
                >
                  取消，重新选择
                </Button>
              </div>
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
              className={`w-full max-w-md rounded-2xl p-8 text-center ${isNight ? 'bg-indigo-900' : 'bg-white'} shadow-2xl`}
            >
              <div className="text-6xl mb-4">
                {winner === 'wolf' ? '🐺' : '👼'}
              </div>
              <h2 className={`text-3xl font-bold mb-2 ${isNight ? 'text-white' : 'text-slate-800'}`}>
                {winner === 'wolf' ? '狼人阵营胜利' : '好人阵营胜利'}
              </h2>
              <p className="text-yellow-400 mb-2 font-medium">
                {getVictoryReasonText()}
              </p>
              <p className={`mb-6 ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>
                游戏已达成胜利条件，是否结束游戏？
              </p>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full shadow-lg"
                  onClick={confirmVictory}
                >
                  确认结束游戏
                </Button>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`flex-1 h-12 font-bold border-2 ${
                      isNight
                        ? 'border-indigo-400 text-indigo-200 hover:bg-indigo-900/50 hover:text-indigo-100'
                        : 'border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800'
                    }`}
                    onClick={() => {
                      useGameStore.getState().cancelAIReview()
                      useGameStore.getState().keepCurrentRule()
                      useGameStore.setState({ showVictoryDialog: false })
                    }}
                  >
                    屠边规则继续游戏
                  </Button>
                  <Button
                    size="sm"
                    className={`flex-1 h-12 font-bold ${
                      isNight
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                    onClick={() => {
                      useGameStore.getState().cancelAIReview()
                      useGameStore.getState().switchToKillAll()
                      useGameStore.setState({ showVictoryDialog: false })
                    }}
                  >
                    屠城规则继续游戏
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 规则切换弹窗 ─────────────────────────────── */}
      <AnimatePresence>
        {showRuleSwitchDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4"
            onClick={() => setShowRuleSwitchDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl p-8 text-center ${isNight ? 'bg-indigo-900' : 'bg-white'} shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-4">⚖️</div>
              <h2 className={`text-2xl font-bold mb-2 ${isNight ? 'text-white' : 'text-slate-800'}`}>
                是否改为屠城规则？
              </h2>
              <p className={`mb-6 text-sm ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>
                继续屠边：过程中仍有阵营死光会触发结束<br />
                改为屠城：只有双方全部死亡才结束
              </p>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg"
                  onClick={() => {
                    switchToKillAll()
                    setShowRuleSwitchDialog(false)
                  }}
                >
                  🔄 改为屠城
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className={`w-full font-bold border-2 ${
                    isNight
                      ? 'border-indigo-400 text-indigo-300 hover:bg-indigo-900/50'
                      : 'border-orange-300 text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => {
                    keepCurrentRule()
                    setShowRuleSwitchDialog(false)
                  }}
                >
                  继续屠边
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full ${isNight ? 'text-slate-400' : 'text-slate-400'}`}
                  onClick={() => setShowRuleSwitchDialog(false)}
                >
                  取消
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
