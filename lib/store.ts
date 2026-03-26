import { create } from 'zustand'
import {
  GameState,
  GameConfig,
  Player,
  SkillUsage,
  SkillState,
  Winner,
  VictoryReason,
  GamePhase,
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

interface GameStore extends GameState {
  wolfKilledPlayerId: number | null
  guardedPlayerId: number | null
  guardBlocked: boolean
  blockedGuardPlayerId: number | null
  hunterSkillPrompt: HunterSkillPrompt | null
  setPlayerCount: (count: number) => void
  setRoleConfig: (config: Record<string, number>) => void
  setGameRule: (rule: GameConfig['gameRule']) => void
  startGame: () => boolean
  nextPlayer: () => void
  enterGamePlay: () => void
  setCurrentViewingPlayer: (playerIndex: number) => void
  revealIdentity: () => void
  hideIdentity: () => void
  killPlayer: (playerId: number, cause: DeathCause) => void
  revivePlayer: (playerId: number) => void
  useSkill: (playerId: number, skillName: string, targetId?: number) => boolean
  nextRound: () => void
  setPhase: (phase: GamePhase) => void
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

const initialExtendedState = {
  wolfKilledPlayerId: null as number | null,
  guardedPlayerId: null as number | null,
  guardBlocked: false,
  blockedGuardPlayerId: null as number | null,
  hunterSkillPrompt: null as HunterSkillPrompt | null,
  wolfKillUsed: false,
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

  startGame: () => {
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

      return {
        id: index + 1,
        name: `玩家${index + 1}`,
        role,
        status: 'alive',
        skillStates: skillStates.length > 0 ? skillStates : undefined,
      }
    })

    set({
      stage: 'viewing',
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
    const { currentRound, currentPhase, players, guardedPlayerId, dismissedVictory } = get()
    
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

    if (!dismissedVictory) {
      const result = get().checkVictory()
      if (result.winner) {
        set({ 
          winner: result.winner, 
          victoryReason: result.reason,
          showVictoryDialog: true 
        })
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

  setPhase: (phase) => {
    set({ currentPhase: phase })
  },

  setWolfKilledPlayerId: (playerId) => {
    set({ wolfKilledPlayerId: playerId })
  },

  checkVictory: () => {
    const { players, config } = get()
    
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

    if (config.gameRule === '屠边') {
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
    const result = get().checkVictory()
    set({
      stage: 'ended',
      winner: result.winner,
      victoryReason: result.reason,
      showVictoryDialog: false,
    })
  },

  dismissHunterPrompt: () => {
    set({ hunterSkillPrompt: null })
  },

  getValidTargets: (playerId, skillName) => {
    const { players, wolfKilledPlayerId, currentRound } = get()
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
}))
