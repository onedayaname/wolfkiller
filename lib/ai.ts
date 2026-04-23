import type { AIReviewResult } from './types'

const MINIMAX_BASE_URL = 'https://api.minimaxi.com/v1/text/chatcompletion_v2'

const SYSTEM_PROMPT = `你是一位资深狼人杀玩家，也是大家的朋友。你为每一轮游戏生成轻松有趣的玩家点评。
- 语气：像朋友聊天，轻松幽默，带一点 Emoji
- 风格：不严肃批评，重点发现优点和高光时刻
- 每条点评限制在 50 字以内
- 如果某玩家发言较少，也要找角度给正面反馈`

interface MiniMaxMessage {
  role: 'system' | 'user'
  name: string
  content: string
}

interface MiniMaxChoice {
  finish_reason: string
  index: number
  message: {
    role: string
    name: string
    content: string
  }
}

interface MiniMaxResponse {
  id: string
  choices: MiniMaxChoice[]
  base_resp?: {
    status_code: number
    status_msg: string
  }
}

function buildUserPrompt(params: {
  gameId: string
  ruleType: string
  winner: string
  winningPlayers: Array<{ number: number; name: string; role: string }>
  speeches: Array<{ day: number; playerName: string; content: string }>
}): string {
  const { winner, winningPlayers, speeches, ruleType } = params

  const speechesText = speeches
    .map((s) => `Day ${s.day}，[${s.playerName}] 说：${s.content}`)
    .join('\n')

  const winnerLabel = winner === 'wolf' ? '狼人阵营' : '好人阵营'

  return `这是一局狼人杀游戏记录，请为**获胜阵营的每位玩家**生成一句高光点评。

游戏信息：
- 游戏ID：${params.gameId}
- 规则：${ruleType}
- 胜方：${winnerLabel}

发言记录：
${speechesText || '（本局暂无发言记录）'}

获胜阵营玩家：
${winningPlayers.map((p) => `- ${p.name}（${p.role}）`).join('\n')}

请以纯 JSON 格式返回一个数组（仅包含获胜阵营玩家，不要包含任何其他文字）：
[
  {
    "player_number": 3,
    "player_name": "3号·小明",
    "review": "高光点评，不超过50字，突出这一局中最亮眼的表现"
  }
]

点评要求：
- 重点描述本局中该玩家最精彩的一到两个瞬间
- 语气轻松幽默，像朋友之间的称赞
- 可以提及具体的发言内容、投票、操作等细节
- 落败阵营玩家不写入返回结果
- 只返回 JSON，不要解释或添加其他文字`
}

export async function generateReviews(params: {
  gameId: string
  ruleType: string
  winner: string
  players: Array<{ number: number; name: string; role: string; team: 'wolf' | 'good' }>
  speeches: Array<{ day: number; playerNumber: number; playerName: string; content: string }>
}): Promise<AIReviewResult[]> {
  const apiKey = process.env.MINIMAX_API_KEY

  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY 未配置')
  }

  const winningPlayers = params.players.filter((p) => p.team === params.winner)

  const userPrompt = buildUserPrompt({
    gameId: params.gameId,
    ruleType: params.ruleType,
    winner: params.winner,
    winningPlayers: winningPlayers.map((p) => ({
      number: p.number,
      name: p.name,
      role: p.role,
    })),
    speeches: params.speeches.map((s) => ({
      day: s.day,
      playerName: s.playerName,
      content: s.content,
    })),
  })

  const messages: MiniMaxMessage[] = [
    { role: 'system', name: 'MiniMax AI', content: SYSTEM_PROMPT },
    { role: 'user', name: '用户', content: userPrompt },
  ]

  const response = await fetch(MINIMAX_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.5',
      stream: false,
      max_completion_tokens: 2048,
      temperature: 1.0,
      top_p: 0.95,
      messages,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`MiniMax API 错误：${response.status} ${errorText}`)
  }

  const data: MiniMaxResponse = await response.json()

  if (!data.choices || data.choices.length === 0) {
    throw new Error('MiniMax 返回内容为空')
  }

  const rawContent = data.choices[0].message.content.trim()

  // 尝试解析 JSON 数组
  let reviews: AIReviewResult[] = []
  try {
    // 去掉可能的 markdown 代码块标记
    const jsonStr = rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    reviews = JSON.parse(jsonStr)
  } catch {
    // JSON 解析失败，尝试从中提取内容
    console.error('AI 返回内容解析失败：', rawContent)
    throw new Error('AI 返回格式异常，无法解析')
  }

  if (!Array.isArray(reviews)) {
    throw new Error('AI 返回格式异常，期望数组')
  }

  return reviews.map((r) => ({
    player_number: r.player_number,
    player_name: r.player_name,
    review: r.review,
  }))
}
