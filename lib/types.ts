export type RoleType = 'wolf' | 'god' | 'villager'

export type SkillPhase = 'night' | 'day' | 'on_death' | 'on_vote_out'

export interface SkillConfig {
  name: string
  icon?: string
  color?: string
  needsTarget: boolean
  targetFilter?: 'alive' | 'dead' | 'wolf_killed'
  phase: SkillPhase
  isOneTime: boolean
  description: string
}

export interface Role {
  id: string
  name: string
  type: RoleType
  skill?: string
  skillDescription?: string
  skills?: SkillConfig[]
}

export interface SkillState {
  name: string
  available: boolean
  usedAt?: {
    round: number
    phase: 'night' | 'day'
  }
}

export interface Player {
  id: number
  name: string
  role: Role
  status: 'alive' | 'dead'
  deathInfo?: {
    round: number
    phase: 'night' | 'day'
    cause: 'wolf' | 'vote' | 'witch' | 'hunter' | 'knight' | 'guard' | 'white-wolf-king' | 'other'
  }
  skillStates?: SkillState[]
  lastGuardedRound?: number
}

export const SKILL_CONFIGS: Record<string, SkillConfig[]> = {
  wolf: [{
    name: '刀人',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以杀死一名玩家',
    color: 'bg-red-600',
  }],
  seer: [{
    name: '查验',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以查验一名玩家的身份',
    color: 'bg-blue-500',
  }],
  witch: [
    {
      name: '救人',
      needsTarget: true,
      targetFilter: 'wolf_killed',
      phase: 'night',
      isOneTime: true,
      description: '使用解药救活当晚被狼人杀死的玩家',
      color: 'bg-green-500',
    },
    {
      name: '毒人',
      needsTarget: true,
      targetFilter: 'alive',
      phase: 'night',
      isOneTime: true,
      description: '使用毒药毒死一名玩家',
      color: 'bg-purple-500',
    },
  ],
  hunter: [{
    name: '开枪',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'on_death',
    isOneTime: true,
    description: '死亡时可以开枪带走一名玩家',
    color: 'bg-orange-500',
  }],
  guard: [{
    name: '守护',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以守护一名玩家，不能连续守护同一人',
    color: 'bg-cyan-500',
  }],
  idiot: [{
    name: '免疫',
    needsTarget: false,
    phase: 'on_vote_out',
    isOneTime: true,
    description: '被投票出局时可以翻牌免死，但失去投票权',
    color: 'bg-yellow-500',
  }],
  knight: [{
    name: '决斗',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'day',
    isOneTime: true,
    description: '白天可以决斗一名玩家，若对方是狼人则对方死亡，否则自己死亡',
    color: 'bg-yellow-500',
  }],
  'white-wolf-king': [{
    name: '自爆',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'day',
    isOneTime: true,
    description: '可以在白天自爆并带走一名玩家',
    color: 'bg-red-600',
  }],
  gargoyle: [{
    name: '查验',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以查验一名玩家的具体身份',
    color: 'bg-blue-500',
  }],
  demon: [{
    name: '标记',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以标记一名玩家，被标记的玩家死亡时可以额外带走一人',
    color: 'bg-red-500',
  }],
  'wolf-beauty': [{
    name: '魅惑',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以魅惑一名玩家，被魅惑的玩家会跟随自己一起死亡',
    color: 'bg-pink-500',
  }],
}

export const ONE_TIME_SKILLS: Record<string, string[]> = {
  witch: ['救人', '毒人'],
  hunter: ['开枪'],
  knight: ['决斗'],
  'white-wolf-king': ['自爆'],
  idiot: ['免疫'],
}

export interface SkillUsage {
  id: string
  round: number
  phase: 'night' | 'day'
  playerId: number
  roleName: string
  skillName: string
  targetId?: number
  used: boolean
}

export type GamePhase = 'night' | 'day'
export type GameStage = 'config' | 'viewing' | 'playing' | 'ended'
export type GameRule = '屠边' | '屠城'
export type Winner = 'wolf' | 'good' | null
export type VictoryReason = 'all_wolves_dead' | 'all_gods_dead' | 'all_villagers_dead' | 'all_good_dead' | null

export interface GameConfig {
  playerCount: number
  roleConfig: Record<string, number>
  gameRule: GameRule
}

export interface GameState {
  stage: GameStage
  config: GameConfig
  players: Player[]
  currentRound: number
  currentPhase: GamePhase
  currentViewingPlayer: number
  identityRevealed: boolean
  skillUsages: SkillUsage[]
  winner: Winner
  victoryReason: VictoryReason
  showVictoryDialog: boolean
}

export const ROLES: Role[] = [
  {
    id: 'wolf',
    name: '狼人',
    type: 'wolf',
    skill: 'kill',
    skillDescription: '每晚可以杀死一名玩家',
  },
  {
    id: 'villager',
    name: '村民',
    type: 'villager',
  },
  {
    id: 'seer',
    name: '预言家',
    type: 'god',
    skill: 'check',
    skillDescription: '每晚可以查验一名玩家的身份',
  },
  {
    id: 'witch',
    name: '女巫',
    type: 'god',
    skill: 'save_or_poison',
    skillDescription: '拥有一瓶解药和一瓶毒药，可以救人或毒人',
  },
  {
    id: 'hunter',
    name: '猎人',
    type: 'god',
    skill: 'shoot',
    skillDescription: '死亡时可以开枪带走一名玩家',
  },
  {
    id: 'guard',
    name: '守卫',
    type: 'god',
    skill: 'protect',
    skillDescription: '每晚可以守护一名玩家，不能连续守护同一人',
  },
  {
    id: 'idiot',
    name: '白痴',
    type: 'god',
    skill: 'immune',
    skillDescription: '被投票出局时可以翻牌免死，但失去投票权',
  },
  {
    id: 'knight',
    name: '骑士',
    type: 'god',
    skill: 'duel',
    skillDescription: '白天可以决斗一名玩家，若对方是狼人则对方死亡，否则自己死亡',
  },
  {
    id: 'white-wolf-king',
    name: '白狼王',
    type: 'wolf',
    skill: 'self-destruct',
    skillDescription: '可以在白天自爆并带走一名玩家',
  },
  {
    id: 'gargoyle',
    name: '石像鬼',
    type: 'god',
    skill: 'check',
    skillDescription: '每晚可以查验一名玩家的具体身份',
  },
  {
    id: 'demon',
    name: '恶魔',
    type: 'wolf',
    skill: 'mark',
    skillDescription: '每晚可以标记一名玩家，被标记的玩家死亡时可以额外带走一人',
  },
  {
    id: 'wolf-beauty',
    name: '狼美人',
    type: 'wolf',
    skill: 'charm',
    skillDescription: '每晚可以魅惑一名玩家，被魅惑的玩家会跟随自己一起死亡',
  },
]

export const DEFAULT_ROLE_CONFIG: Record<string, number> = {
  wolf: 0,
  villager: 0,
  seer: 0,
  witch: 0,
  hunter: 0,
  guard: 0,
  idiot: 0,
  knight: 0,
  'white-wolf-king': 0,
  gargoyle: 0,
  demon: 0,
  'wolf-beauty': 0,
}

export function getRecommendedConfig(playerCount: number): Record<string, number> {
  const config: Record<string, number> = { ...DEFAULT_ROLE_CONFIG }
  
  if (playerCount >= 6 && playerCount <= 8) {
    config.wolf = 2
    config.villager = 2
    config.seer = 1
    config.witch = 1
    config.hunter = 1
  } else if (playerCount >= 9 && playerCount <= 11) {
    config.wolf = 3
    config.villager = 3
    config.seer = 1
    config.witch = 1
    config.hunter = 1
    config.guard = 1
  } else if (playerCount >= 12) {
    config.wolf = 4
    config.villager = 4
    config.seer = 1
    config.witch = 1
    config.hunter = 1
    config.guard = 1
    config.idiot = 1
  }
  
  const total = Object.values(config).reduce((sum, count) => sum + count, 0)
  if (total !== playerCount) {
    config.villager += playerCount - total
  }
  
  return config
}

export function validateConfig(config: Record<string, number>, playerCount: number): string | null {
  const total = Object.values(config).reduce((sum, count) => sum + count, 0)
  
  if (total !== playerCount) {
    return `角色总数(${total})必须等于玩家数量(${playerCount})`
  }
  
  const wolfCount = config.wolf + (config['white-wolf-king'] || 0) + 
                    (config.demon || 0) + (config['wolf-beauty'] || 0)
  if (wolfCount < 1) {
    return '至少需要1个狼人阵营角色'
  }
  
  const godCount = (config.seer || 0) + (config.witch || 0) + (config.hunter || 0) +
                   (config.guard || 0) + (config.idiot || 0) + (config.knight || 0) +
                   (config.gargoyle || 0)
  if (godCount < 1) {
    return '至少需要1个神职角色'
  }
  
  if (config.villager < 1) {
    return '至少需要1个村民'
  }
  
  return null
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export function assignRoles(playerCount: number, roleConfig: Record<string, number>): Role[] {
  const roles: Role[] = []
  
  Object.entries(roleConfig).forEach(([roleId, count]) => {
    const role = ROLES.find(r => r.id === roleId)
    if (role && count > 0) {
      for (let i = 0; i < count; i++) {
        roles.push({ ...role })
      }
    }
  })
  
  return shuffleArray(roles)
}
