export interface Role {
  id: string
  name: string
  type: 'wolf' | 'god' | 'villager'
  description: string
  skillDescription: string
}

export interface Player {
  id: number
  name: string
  role: Role
  status: 'alive' | 'dead'
  skillStates?: SkillState[]
  hunterShootAvailable?: boolean
  hunterShootUsedRound?: number
  hunterDeathRound?: number
  lastGuardedRound?: number
  guardUsedThisRound?: boolean
  deathInfo?: {
    round: number
    phase: GamePhase
    cause: string
  }
}

export interface SkillState {
  name: string
  available: boolean
  usedAt?: {
    round: number
    phase: GamePhase
  }
}

export interface SkillConfig {
  name: string
  needsTarget: boolean
  targetFilter?: 'alive' | 'dead' | 'wolf_killed'
  phase: 'night' | 'day' | 'on_death' | 'on_vote_out'
  isOneTime: boolean
  description: string
  color: string
}

export interface SkillUsage {
  id: string
  round: number
  phase: GamePhase
  playerId: number
  roleName: string
  skillName: string
  targetId?: number
  used: boolean
}

export interface GameConfig {
  playerCount: number
  roleConfig: Record<string, number>
  gameRule: '屠边' | '屠城'
}

export type GameStage = 'config' | 'viewing' | 'playing' | 'ended'
export type GamePhase = 'night' | 'day'
export type Winner = 'wolf' | 'good' | null
export type VictoryReason = 'all_wolves_dead' | 'all_gods_dead' | 'all_villagers_dead' | 'all_good_dead' | null

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
  wolfKillUsed: boolean
  dismissedVictory: boolean
  history: Array<{
    round: number
    phase: GamePhase
    players: Player[]
    skillUsages: SkillUsage[]
    wolfKilledPlayerId: number | null
    guardedPlayerId: number | null
    guardBlocked: boolean
    blockedGuardPlayerId: number | null
    wolfKillUsed: boolean
    dismissedVictory: boolean
  }>
}
export const ROLES: Role[] = [
  { id: 'wolf', name: '狼人', type: 'wolf', description: '每晚可以杀死一名玩家', skillDescription: '每晚可以杀死一名玩家' },
  { id: 'white-wolf-king', name: '白狼王', type: 'wolf', description: '可以在白天自爆并带走一名玩家', skillDescription: '可以在白天自爆并带走一名玩家' },
  { id: 'gargoyle', name: '石像鬼', type: 'wolf', description: '每晚可以查验一名玩家的具体身份', skillDescription: '每晚可以查验一名玩家的具体身份' },
  { id: 'demon', name: '恶魔', type: 'wolf', description: '被标记的玩家死亡时可以额外带走一人', skillDescription: '每晚可以标记一名玩家，被标记的玩家死亡时可以额外带走一人' },
  { id: 'wolf-beauty', name: '狼美人', type: 'wolf', description: '被魅惑的玩家会跟随自己一起死亡', skillDescription: '每晚可以魅惑一名玩家，被魅惑的玩家会跟随自己一起死亡' },
  { id: 'villager', name: '村民', type: 'villager', description: '没有特殊技能', skillDescription: '' },
  { id: 'seer', name: '预言家', type: 'god', description: '每晚可以查验一名玩家的身份', skillDescription: '每晚可以查验一名玩家的身份' },
  { id: 'witch', name: '女巫', type: 'god', description: '拥有一瓶解药和一瓶毒药', skillDescription: '拥有一瓶解药和一瓶毒药，解药可以救活被狼人杀死的玩家，毒药可以毒死一名玩家' },
  { id: 'hunter', name: '猎人', type: 'god', description: '死亡时可以开枪带走一名玩家', skillDescription: '死亡时可以开枪带走一名玩家' },
  { id: 'guard', name: '守卫', type: 'god', description: '每晚可以守护一名玩家', skillDescription: '每晚可以守护一名玩家，不能连续守护同一人' },
  { id: 'idiot', name: '白痴', type: 'god', description: '被投票出局时可以翻牌免死', skillDescription: '被投票出局时可以翻牌免死，但失去投票权' },
  { id: 'knight', name: '骑士', type: 'god', description: '白天可以决斗一名玩家', skillDescription: '白天可以决斗一名玩家，若对方是狼人则对方死亡，否则自己死亡' },
]

export const SKILL_CONFIGS: Record<string, SkillConfig[]> = {
  wolf: [{
    name: '刀人',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以杀死一名玩家',
    color: '#dc2626',
  }],
  seer: [{
    name: '查验',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以查验一名玩家的身份',
    color: '#3b82f6',
  }],
  witch: [
    {
      name: '解药',
      needsTarget: true,
      targetFilter: 'wolf_killed',
      phase: 'night',
      isOneTime: true,
      description: '使用解药救活当晚被狼人杀死的玩家',
      color: '#22c55e',
    },
    {
      name: '毒药',
      needsTarget: true,
      targetFilter: 'alive',
      phase: 'night',
      isOneTime: true,
      description: '使用毒药毒死一名玩家',
      color: '#a855f7',
    },
  ],
  hunter: [{
    name: '开枪',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'on_death',
    isOneTime: true,
    description: '死亡时可以开枪带走一名玩家',
    color: '#f97316',
  }],
  guard: [{
    name: '守护',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以守护一名玩家，不能连续守护同一人',
    color: '#06b6d4',
  }],
  idiot: [{
    name: '免疫',
    needsTarget: false,
    phase: 'on_vote_out',
    isOneTime: true,
    description: '被投票出局时可以翻牌免死，但失去投票权',
    color: '#eab308',
  }],
  knight: [{
    name: '决斗',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'day',
    isOneTime: true,
    description: '白天可以决斗一名玩家，若对方是狼人则对方死亡，否则自己死亡',
    color: '#eab308',
  }],
  'white-wolf-king': [{
    name: '自爆',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'day',
    isOneTime: true,
    description: '可以在白天自爆并带走一名玩家',
    color: '#dc2626',
  }],
  gargoyle: [{
    name: '查验',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以查验一名玩家的具体身份',
    color: '#3b82f6',
  }],
  demon: [{
    name: '标记',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以标记一名玩家，被标记的玩家死亡时可以额外带走一人',
    color: '#ef4444',
  }],
  'wolf-beauty': [{
    name: '魅惑',
    needsTarget: true,
    targetFilter: 'alive',
    phase: 'night',
    isOneTime: false,
    description: '每晚可以魅惑一名玩家，被魅惑的玩家会跟随自己一起死亡',
    color: '#ec4899',
  }],
}

export const ONE_TIME_SKILLS: Record<string, string[]> = {
  witch: ['解药', '毒药'],
  hunter: ['开枪'],
  knight: ['决斗'],
  'white-wolf-king': ['自爆'],
  idiot: ['免疫'],
}

export function getRecommendedConfig(playerCount: number): Record<string, number> {
  const configs: Record<number, Record<string, number>> = {
    6: { wolf: 2, seer: 1, witch: 1, hunter: 1, villager: 1 },
    7: { wolf: 2, seer: 1, witch: 1, hunter: 1, villager: 2 },
    8: { wolf: 2, seer: 1, witch: 1, hunter: 1, guard: 1, villager: 2 },
    9: { wolf: 3, seer: 1, witch: 1, hunter: 1, guard: 1, villager: 2 },
    10: { wolf: 3, seer: 1, witch: 1, hunter: 1, guard: 1, villager: 3 },
    11: { wolf: 3, seer: 1, witch: 1, hunter: 1, guard: 1, villager: 4 },
    12: { wolf: 4, seer: 1, witch: 1, hunter: 1, guard: 1, villager: 4 },
  }
  return configs[playerCount] || { wolf: 3, seer: 1, witch: 1, hunter: 1, guard: 1, villager: 3 }
}

export function validateConfig(roleConfig: Record<string, number>, playerCount: number): string | null {
  const totalRoles = Object.values(roleConfig).reduce((sum, count) => sum + count, 0)
  if (totalRoles !== playerCount) {
    return `角色总数 (${totalRoles}) 不等于玩家数量 (${playerCount})`
  }
  
  const wolfCount = roleConfig.wolf || 0
  if (wolfCount < 1) {
    return '狼人阵营至少需要 1 名玩家'
  }
  
  const goodCount = Object.entries(roleConfig)
    .filter(([roleId]) => roleId !== 'wolf')
    .reduce((sum, [, count]) => sum + count, 0)
  if (goodCount < 1) {
    return '好人阵营至少需要 1 名玩家'
  }
  
  return null
}

export function assignRoles(playerCount: number, roleConfig: Record<string, number>): Role[] {
  const roles: Role[] = []
  Object.entries(roleConfig).forEach(([roleId, count]) => {
    const role = ROLES.find((r) => r.id === roleId)
    if (role) {
      for (let i = 0; i < count; i++) {
        roles.push(role)
      }
    }
  })
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[roles[i], roles[j]] = [roles[j], roles[i]]
  }
  return roles
}
