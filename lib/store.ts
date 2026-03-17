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
  hunterSkillPrompt: HunterSkillPrompt | null
  setPlayerCount: (count: number) => void
  setRoleConfig: (config: Record<string, number>) => void
  setGameRule: (rule: GameConfig['gameRule']) => void
  startGame: () => boolean
  nextPlayer: () => void
  revealIdentity: () => void
  hideIdentity: () => void
  killPlayer: (playerId: number, cause: DeathCause) => void
  revivePlayer: (playerId: number) => void
  useSkill: (playerId: number, skillName: string, targetId?: number) => boolean
  nextRound: () => void
  setPhase: (phase: GamePhase) => void
  checkVictory: () => VictoryResult
  confirmVictory: () => void
  resetGame: () => void
  dismissHunterPrompt: () => void
  getValidTargets: (playerId: number, skillName: string) => Player[]
  isSkillAvailable: (playerId: number, skillName: string) => boolean
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
}

const initialExtendedState = {
  wolfKilledPlayerId: null as number | null,
  guardedPlayerId: null as number | null,
  hunterSkillPrompt: null as HunterSkillPrompt | null,
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

  revealIdentity: () => {
    set({ identityRevealed: true })
  },

  hideIdentity: () => {
    set({ identityRevealed: false })
  },

  killPlayer: (playerId, cause) => {
    const { currentRound, currentPhase, players } = get()
    const player = players.find((p) => p.id === playerId)
    
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
            }
          : player
      ),
    }))

    if (player && player.role.id === 'hunter') {
      const skillState = player.skillStates?.find((s) => s.name === '开枪')
      if (skillState?.available) {
        set({
          hunterSkillPrompt: {
            hunterId: player.id,
            hunterName: player.name,
          },
        })
      }
    }

    const result = get().checkVictory()
    if (result.winner) {
      set({ 
        winner: result.winner, 
        victoryReason: result.reason,
        showVictoryDialog: true 
      })
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
            }
          : player
      ),
      winner: null,
      victoryReason: null,
      showVictoryDialog: false,
    }))
  },

  useSkill: (playerId, skillName, targetId) => {
    const { currentRound, currentPhase, players } = get()
    const player = players.find((p) => p.id === playerId)
    if (!player) return false

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
      roleName: player.role.name,
      skillName,
      targetId,
      used: true,
    }

    set((state) => ({
      skillUsages: [...state.skillUsages, skillUsage],
      players: state.players.map((p) => {
        if (p.id !== playerId || !p.skillStates) return p
        return {
          ...p,
          skillStates: p.skillStates.map((s) =>
            s.name === skillName
              ? { ...s, available: false, usedAt: { round: currentRound, phase: currentPhase } }
              : s
          ),
        }
      }),
    }))

    return true
  },

  nextRound: () => {
    set((state) => ({
      currentRound: state.currentRound + 1,
      currentPhase: 'night',
      wolfKilledPlayerId: null,
      guardedPlayerId: null,
    }))
  },

  setPhase: (phase) => {
    set({ currentPhase: phase })
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

    if (player.role.id === 'guard' && skillName === '守护') {
      const lastGuardedId = players.find((p) => p.lastGuardedRound === currentRound - 1)?.id
      if (lastGuardedId) {
        validTargets = validTargets.filter((p) => p.id !== lastGuardedId)
      }
    }

    return validTargets
  },

  isSkillAvailable: (playerId, skillName) => {
    const { players, currentPhase, currentRound } = get()
    const player = players.find((p) => p.id === playerId)
    if (!player) return false

    const skillConfigs = SKILL_CONFIGS[player.role.id]
    const skillConfig = skillConfigs?.find((s) => s.name === skillName)
    if (!skillConfig) return false

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

    if (player.role.id === 'guard' && skillName === '守护') {
      const lastGuardedPlayer = players.find((p) => p.lastGuardedRound === currentRound - 1)
      if (lastGuardedPlayer) {
        return true
      }
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
}))
