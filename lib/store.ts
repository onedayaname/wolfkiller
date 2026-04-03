import { create } from 'zustand'
import {
  GameState,
  GameConfig,
  Player,
  SkillUsage,
  SkillState,
  Winner,
  VictoryReason,
  Speech,
  Review,
  getRecommendedConfig,
  validateConfig,
  assignRoles,
  ONE_TIME_SKILLS,
  SKILL_CONFIGS,
} from '@/lib/types'

type DeathCause = 'wolf' | 'vote' | 'witch' | 'hunter' | 'knight' | 'guard' | 'white-wolf-king' | 'other'

interface HunterSkillPrompt {
  hunterId: number
  hunterName: string
}

interface VictoryResult {
  winner: Winner
  reason: VictoryReason
}

function generateGameId(): string {
  return `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface GameStore extends GameState {
  gameId: string | null
  wolfKilledPlayerId: number | null
  guardedPlayerId: number | null
  guardBlocked: boolean
  blockedGuardPlayerId: number | null
  hunterSkillPrompt: HunterSkillPrompt | null
  ruleSwitchedToKillAll: boolean // 已切换屠城，后续只有双方全灭才算赢
  speeches: Speech[]
  reviews: Review[]
  setPlayerCount: (count: number) => void
  setRoleConfig: (config: Record<string, number>) => void
  setGameRule: (rule: GameConfig['gameRule']) => void
  startGame: (playerNames?: Record<number, string>) => boolean
  addSpeech: (speech: Speech) => void
  setReviews: (reviews: Review[]) => void
  nextPlayer: () => void
  enterGamePlay: () => void
  setCurrentViewingPlayer: (playerIndex: number) => void
  revealIdentity: () => void
  hideIdentity: () => void
  killPlayer: (playerId: number, cause: DeathCause) => void
  revivePlayer: (playerId: number) => void
  useSkill: (playerId: number, skillName: string, targetId?: number) => boolean
  nextRound: () => void
  setWolfKilledPlayerId: (playerId: number | null) => void
  checkVictory: () => VictoryResult
  confirmVictory: () => void
  resetGame: () => void
  dismissHunterPrompt: () => void
  getValidTargets: (playerId: number, skillName: string) => Player[]
  isSkillAvailable: (playerId: number, skillName: string) => boolean
  isConsecutiveGuard: (playerId: number, targetId: number) => boolean
  goBack: () => boolean
  canGoBack: () => boolean
  switchToKillAll: () => void    // 改为屠城
  keepCurrentRule: () => void     // 继续屠边
}

const initialState: GameState = {
  stage: 'config',
  config: {
    playerCount: 9,
    roleConfig: getRecommendedConfig(9),
    gameRule: '屠边',
  },
  players: [],
  currentRound: 1,
  currentPhase: 'night',
  currentViewingPlayer: 0,
  identityRevealed: false,
  skillUsages: [],
  winner: null,
  victoryReason: null,
  showVictoryDialog: false,
  wolfKillUsed: false,
  dismissedVictory: false,
  history: [],
}

const speechReviewState: { gameId: string | null; speeches: Speech[]; reviews: Review[] } = {
  gameId: null,
  speeches: [],
  reviews: [],
}

const initialExtendedState = {
  wolfKilledPlayerId: null as number | null,
  guardedPlayerId: null as number | null,
  guardBlocked: false,
  blockedGuardPlayerId: null as number | null,
  hunterSkillPrompt: null as HunterSkillPrompt | null,
  ruleSwitchedToKillAll: false,
  ...speechReviewState,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  ...initialExtendedState,

  setPlayerCount: (count) => {
    set((state) => ({
      config: {
        ...state.config,
        playerCount: count,
        roleConfig: getRecommendedConfig(count),
      },
    }))
  },

  setRoleConfig: (config) => {
    set((state) => ({
      config: {
        ...state.config,
        roleConfig: config,
      },
    }))
  },

  setGameRule: (rule) => {
    set((state) => ({
      config: {
        ...state.config,
        gameRule: rule,
      },
    }))
  },

  addSpeech: (speech) => {
    set((state) => ({
      speeches: [...state.speeches, speech],
    }))
  },

  setReviews: (reviews) => {
    set({ reviews })
  },

  startGame: (playerNames?: Record<number, string>) => {
    const { config } = get()
    const error = validateConfig(config.roleConfig, config.playerCount)
    if (error) {
      return false
    }

    const roles = assignRoles(config.playerCount, config.roleConfig)
    const players: Player[] = roles.map((role, index) => {
      const oneTimeSkills = ONE_TIME_SKILLS[role.id] || []
      const skillStates: SkillState[] = oneTimeSkills.map((skillName) => ({
        name: skillName,
        available: true,
      }))
      const id = index + 1
      const customName = playerNames?.[id]?.trim()
      const displayName = customName ? `${id}号·${customName}` : `${id}号`

      return {
        id,
        name: displayName,
        role,
        status: 'alive',
        skillStates: skillStates.length > 0 ? skillStates : undefined,
      }
    })

    set({
      ...initialState,
      ...initialExtendedState,
      stage: 'viewing',
      gameId: generateGameId(),
      players,
      currentRound: 1,
      currentPhase: 'night',
      currentViewingPlayer: 0,
      identityRevealed: false,
      skillUsages: [],
      winner: null,
      victoryReason: null,
      showVictoryDialog: false,
      wolfKilledPlayerId: null,
      guardedPlayerId: null,
      hunterSkillPrompt: null,
      wolfKillUsed: false,
      dismissedVictory: false,
      ruleSwitchedToKillAll: false,
    })

    return true
  },

  nextPlayer: () => {
    const { currentViewingPlayer, players } = get()
    if (currentViewingPlayer < players.length - 1) {
      set({
        currentViewingPlayer: currentViewingPlayer + 1,
        identityRevealed: false,
      })
    } else {
      set({
        stage: 'playing',
        currentViewingPlayer: 0,
        identityRevealed: false,
      })
    }
  },

  enterGamePlay: () => {
    set({
      stage: 'playing',
      currentViewingPlayer: 0,
      identityRevealed: false,
    })
  },

  setCurrentViewingPlayer: (playerIndex) => {
    set({
      currentViewingPlayer: playerIndex,
      identityRevealed: false,
    })
  },

  revealIdentity: () => {
    set({ identityRevealed: true })
  },

  hideIdentity: () => {
    set({ identityRevealed: false })
  },

  killPlayer: (playerId, cause) => {
    const { currentRound, currentPhase, players, guardedPlayerId } = get()

    if (cause === 'wolf' && guardedPlayerId === playerId) {
      const guardUsage = get().skillUsages.find(
        (usage) => usage.skillName === '守护' && usage.targetId === playerId && usage.round === currentRound
      )
      if (guardUsage) {
        const guardPlayer = players.find((p) => p.id === guardUsage.playerId)
        set((state) => ({
          guardBlocked: true,
          blockedGuardPlayerId: guardUsage.playerId,
          skillUsages: [...state.skillUsages, {
            id: `guard-block-${currentRound}-${currentPhase}`,
            round: currentRound,
            phase: currentPhase,
            playerId: guardUsage.playerId,
            roleName: guardPlayer?.role.name || '守卫',
            skillName: '守护成功',
            targetId: playerId,
            used: true,
          }],
        }))
        return
      }
    }

    if (cause === 'wolf') {
      set({ wolfKilledPlayerId: playerId })
    }

    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              status: 'dead',
              deathInfo: {
                round: currentRound,
                phase: currentPhase,
                cause,
              },
              hunterShootAvailable: player.role.id === 'hunter',
              hunterDeathRound: currentRound,
            }
          : player
      ),
    }))

    // ─── 胜利检测 ───────────────────────────────────────────
    const result = get().checkVictory()
    if (!result.winner) return

    const aliveWolves = get().players.filter(
      (p) => p.status === 'alive' && p.role.type === 'wolf'
    ).length
    const aliveGoods = get().players.filter(
      (p) => p.status === 'alive' && (p.role.type === 'god' || p.role.type === 'villager')
    ).length
    const bothSidesAlive = aliveWolves > 0 && aliveGoods > 0
    const { dismissedVictory, ruleSwitchedToKillAll } = get()

    if (dismissedVictory) {
      // 已点过继续游戏：屠城模式下双方全灭才算赢；屠边模式下保持原检定
      if (ruleSwitchedToKillAll) {
        // 屠城：只接受双方全灭（all wolves dead / all good dead）
        const isWipeout = !bothSidesAlive
        if (isWipeout) {
          set({ winner: result.winner, victoryReason: result.reason })
          get().confirmVictory()
        }
        // 否则：没有全灭，继续（不弹窗）
      } else {
        // 屠边：保持原有检定，显示弹窗
        set({ winner: result.winner, victoryReason: result.reason, showVictoryDialog: true })
      }
    } else {
      // 首次触发
      if (bothSidesAlive) {
        // 双方都有人：弹窗，可选继续
        set({ winner: result.winner, victoryReason: result.reason, showVictoryDialog: true })
      } else {
        // 某阵营全灭：直接结束
        set({ winner: result.winner, victoryReason: result.reason })
        get().confirmVictory()
      }
    }
  },

  revivePlayer: (playerId) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              status: 'alive',
              deathInfo: undefined,
              hunterShootAvailable: false,
              hunterDeathRound: undefined,
            }
          : player
      ),
      winner: null,
      victoryReason: null,
      showVictoryDialog: false,
      ruleSwitchedToKillAll: false,
    }))
  },

  useSkill: (playerId, skillName, targetId) => {
    const { currentRound, currentPhase, players, wolfKillUsed } = get()
    const player = players.find((p) => p.id === playerId)
    if (!player) return false

    if (player.role.type === 'wolf' && skillName === '刀人') {
      if (wolfKillUsed) {
        return false
      }
    }

    const oneTimeSkills = ONE_TIME_SKILLS[player.role.id] || []
    const isOneTimeSkill = oneTimeSkills.includes(skillName)

    if (isOneTimeSkill && player.skillStates) {
      const skillState = player.skillStates.find((s) => s.name === skillName)
      if (!skillState || !skillState.available) {
        return false
      }
    }

    const skillUsage: SkillUsage = {
      id: `${playerId}-${skillName}-${currentRound}-${currentPhase}`,
      round: currentRound,
      phase: currentPhase,
      playerId,
      roleName: player.role.type === 'wolf' ? '狼人' : player.role.name,
      skillName,
      targetId,
      used: true,
    }

    set((state) => ({
      skillUsages: [...state.skillUsages, skillUsage],
      players: state.players.map((p) => {
        if (p.id !== playerId && p.id !== targetId) return p
        
        const updatedPlayer = { ...p }
        
        if (player.role.id === 'hunter' && skillName === '开枪' && p.id === playerId) {
          updatedPlayer.hunterShootAvailable = false
          updatedPlayer.hunterShootUsedRound = currentRound
        }
        
        if (p.skillStates) {
          updatedPlayer.skillStates = p.skillStates.map((s) =>
            s.name === skillName
              ? { ...s, available: false, usedAt: { round: currentRound, phase: currentPhase } }
              : s
          )
        }
        
        if (player.role.id === 'guard' && skillName === '守护' && targetId) {
          if (p.id === playerId) {
            updatedPlayer.guardUsedThisRound = true
          }
          if (p.id === targetId) {
            updatedPlayer.lastGuardedRound = currentRound
          }
        }
        
        return updatedPlayer
      }),
      wolfKillUsed: player.role.type === 'wolf' && skillName === '刀人' ? true : state.wolfKillUsed,
      guardedPlayerId: player.role.id === 'guard' && skillName === '守护' && targetId ? targetId : state.guardedPlayerId,
    }))

    if (player.role.id === 'hunter' && skillName === '开枪' && targetId) {
      get().killPlayer(targetId, 'hunter')
    }

    return true
  },

  nextRound: () => {
    const { wolfKilledPlayerId, guardedPlayerId, guardBlocked, blockedGuardPlayerId, wolfKillUsed, dismissedVictory } = get()
    set((state) => {
      const historyEntry = {
        round: state.currentRound,
        phase: state.currentPhase,
        players: JSON.parse(JSON.stringify(state.players)),
        skillUsages: [...state.skillUsages],
        wolfKilledPlayerId,
        guardedPlayerId,
        guardBlocked,
        blockedGuardPlayerId,
        wolfKillUsed,
        dismissedVictory,
      }
      
      const nextPhase = state.currentPhase === 'night' ? 'day' : 'night'
      const nextRound = nextPhase === 'night' ? state.currentRound + 1 : state.currentRound
      
      const playersWithUpdatedHunter = state.players.map((player) => {
        if (player.role.id === 'hunter' && player.status === 'dead' && player.hunterShootAvailable && nextPhase === 'night') {
          return {
            ...player,
            hunterShootAvailable: false,
            hunterShootUsedRound: state.currentRound,
          }
        }
        if (player.role.id === 'guard') {
          return {
            ...player,
            guardUsedThisRound: false,
          }
        }
        return player
      })

      return {
        ...state,
        currentRound: nextRound,
        currentPhase: nextPhase,
        wolfKilledPlayerId: null,
        guardedPlayerId: null,
        guardBlocked: false,
        blockedGuardPlayerId: null,
        wolfKillUsed: false,
        players: playersWithUpdatedHunter,
        history: [...state.history, historyEntry],
      }
    })
  },

  setWolfKilledPlayerId: (playerId) => {
    set({ wolfKilledPlayerId: playerId })
  },

  checkVictory: () => {
    const { players, config, ruleSwitchedToKillAll } = get()

    const aliveWolves = players.filter(
      (p) => p.status === 'alive' && p.role.type === 'wolf'
    ).length

    const aliveGods = players.filter(
      (p) => p.status === 'alive' && p.role.type === 'god'
    ).length

    const aliveVillagers = players.filter(
      (p) => p.status === 'alive' && p.role.type === 'villager'
    ).length

    if (aliveWolves === 0) {
      return { winner: 'good', reason: 'all_wolves_dead' }
    }

    // ruleSwitchedToKillAll = true 时强制使用屠城规则
    const effectiveRule = ruleSwitchedToKillAll ? '屠城' : config.gameRule

    if (effectiveRule === '屠边') {
      if (aliveGods === 0) {
        return { winner: 'wolf', reason: 'all_gods_dead' }
      }
      if (aliveVillagers === 0) {
        return { winner: 'wolf', reason: 'all_villagers_dead' }
      }
    } else {
      const aliveGood = aliveGods + aliveVillagers
      if (aliveGood === 0) {
        return { winner: 'wolf', reason: 'all_good_dead' }
      }
    }

    return { winner: null, reason: null }
  },

  confirmVictory: () => {
    set({
      stage: 'ended',
      showVictoryDialog: false,
    })
  },

  dismissHunterPrompt: () => {
    set({ hunterSkillPrompt: null })
  },

  getValidTargets: (playerId, skillName) => {
    const { players, wolfKilledPlayerId } = get()
    const player = players.find((p) => p.id === playerId)
    if (!player) return []

    const skillConfigs = SKILL_CONFIGS[player.role.id]
    const skillConfig = skillConfigs?.find((s) => s.name === skillName)
    if (!skillConfig) return []

    let validTargets: Player[] = []

    switch (skillConfig.targetFilter) {
      case 'alive':
        validTargets = players.filter((p) => p.status === 'alive' && p.id !== playerId)
        break
      case 'dead':
        validTargets = players.filter((p) => p.status === 'dead')
        break
      case 'wolf_killed':
        if (wolfKilledPlayerId) {
          const killedPlayer = players.find((p) => p.id === wolfKilledPlayerId)
          if (killedPlayer) {
            validTargets = [killedPlayer]
          }
        }
        break
      default:
        validTargets = players.filter((p) => p.status === 'alive' && p.id !== playerId)
    }

    return validTargets
  },

  isConsecutiveGuard: function(playerId: number, targetId: number): boolean {
    const { players, currentRound } = get()
    const player = players.find((p) => p.id === playerId)
    if (!player || player.role.id !== 'guard') return false
    const target = players.find((p) => p.id === targetId)
    if (!target) return false
    return target.lastGuardedRound === currentRound - 1 && target.lastGuardedRound !== undefined
  },

  isSkillAvailable: (playerId, skillName) => {
    const { players, currentPhase, currentRound, wolfKillUsed } = get()
    const player = players.find((p) => p.id === playerId)
    if (!player) return false

    const skillConfigs = SKILL_CONFIGS[player.role.id]
    const skillConfig = skillConfigs?.find((s) => s.name === skillName)
    if (!skillConfig) return false

    if (player.role.type === 'wolf' && skillName === '刀人') {
      if (wolfKillUsed) {
        return false
      }
    }

    if (player.role.id === 'hunter' && skillName === '开枪') {
      if (!player.hunterShootAvailable) {
        return false
      }
      if (player.status !== 'dead') {
        return false
      }
      if (player.hunterDeathRound && player.hunterDeathRound !== currentRound) {
        return false
      }
    }

    if (player.role.id === 'guard' && skillName === '守护') {
      if (player.guardUsedThisRound) {
        return false
      }
    }

    if (skillConfig.isOneTime) {
      const skillState = player.skillStates?.find((s) => s.name === skillName)
      if (!skillState || !skillState.available) {
        return false
      }
    }

    if (skillConfig.phase === 'night' && currentPhase !== 'night') {
      return false
    }
    if (skillConfig.phase === 'day' && currentPhase !== 'day') {
      return false
    }
    if (skillConfig.phase === 'on_death' && player.status !== 'dead') {
      return false
    }

    return true
  },

  resetGame: () => {
    set({
      ...initialState,
      ...initialExtendedState,
      config: {
        playerCount: 9,
        roleConfig: getRecommendedConfig(9),
        gameRule: '屠边',
      },
    })
  },

  goBack: () => {
    const { history } = get()
    if (history.length === 0) {
      return false
    }
    
    const lastState = history[history.length - 1]
    const newHistory = history.slice(0, -1)
    
    set({
      currentRound: lastState.round,
      currentPhase: lastState.phase,
      players: lastState.players,
      skillUsages: lastState.skillUsages,
      wolfKilledPlayerId: lastState.wolfKilledPlayerId,
      guardedPlayerId: lastState.guardedPlayerId,
      guardBlocked: lastState.guardBlocked,
      blockedGuardPlayerId: lastState.blockedGuardPlayerId,
      wolfKillUsed: lastState.wolfKillUsed,
      dismissedVictory: lastState.dismissedVictory,
      history: newHistory,
      winner: null,
      victoryReason: null,
      showVictoryDialog: false,
    })
    
    return true
  },

  canGoBack: () => {
    return get().history.length > 0
  },

  switchToKillAll: () => {
    // 改为屠城：后续只按双方全灭结算
    set({ ruleSwitchedToKillAll: true })
  },

  keepCurrentRule: () => {
    // 继续屠边：保持原规则，重新开启检定
    set({ dismissedVictory: false })
  },
}))
