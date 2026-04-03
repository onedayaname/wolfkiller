import { Player, Speech, Review } from './types'

// ─── 存档数据结构 ───────────────────────────────────────────

export interface GameArchive {
  gameId: string
  gameTime: string
  players: Array<{
    number: number
    name: string
    role: string
    isAlive: boolean
    isWolf: boolean
  }>
  winner: 'wolf' | 'good' | null
  speeches: Speech[]
  reviews: Review[]
}

// ─── 生成存档对象 ───────────────────────────────────────────

export function buildArchive(params: {
  gameId: string
  players: Player[]
  winner: 'wolf' | 'good' | null
  speeches: Speech[]
  reviews: Review[]
}): GameArchive {
  return {
    gameId: params.gameId,
    gameTime: new Date().toLocaleString('zh-CN'),
    players: params.players.map((p) => ({
      number: p.id,
      name: p.name,
      role: p.role.name,
      isAlive: p.status === 'alive',
      isWolf: p.role.type === 'wolf',
    })),
    winner: params.winner,
    speeches: params.speeches,
    reviews: params.reviews,
  }
}

// ─── 下载工具 ───────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── 导出 JSON ──────────────────────────────────────────────

export function exportAsJSON(archive: GameArchive, label = '狼人杀') {
  const json = JSON.stringify(archive, null, 2)
  const filename = `${label}_${formatDate()}.json`
  triggerDownload(json, filename, 'application/json')
}

// ─── 导出 TXT ───────────────────────────────────────────────

export function exportAsTXT(archive: GameArchive, label = '狼人杀') {
  const lines: string[] = [
    `🐺 ${label} 游戏存档`,
    `生成时间：${archive.gameTime}`,
    `胜方：${archive.winner === 'wolf' ? '🐺 狼人阵营胜利' : archive.winner === 'good' ? '🌟 好人阵营胜利' : '未知'}`,
    '',
    '── 玩家列表 ──',
    ...archive.players.map(
      (p) =>
        `${p.number}号 ${p.name} · ${p.role} · ${p.isAlive ? '存活' : '已死亡'}`
    ),
    '',
    '── 发言记录 ──',
    ...(archive.speeches.length === 0
      ? ['（无发言记录）']
      : archive.speeches.map(
          (s) => `Day ${s.round_day} #${s.round_order} [${s.player_name}]：${s.content}`
        )),
    '',
  ]

  // 只有获胜阵营有 AI 点评
  const winnerReviews = archive.reviews.filter((r) => r.is_winner)
  if (winnerReviews.length > 0) {
    lines.push('── 获胜阵营高光点评 ──')
    winnerReviews.forEach((r) => {
      lines.push(`${r.player_name}：${r.review_text}`)
    })
  }

  const txt = lines.join('\n')
  const filename = `${label}_${formatDate()}.txt`
  triggerDownload(txt, filename, 'text/plain;charset=utf-8')
}

// ─── 工具函数 ──────────────────────────────────────────────

function formatDate() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
}
