'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, ChevronDown, ChevronUp, AlertCircle, Pencil, X } from 'lucide-react'
import { useGameStore } from '@/lib/store'
import { useSpeechRecognition, isSpeechRecognitionSupported, requestMicrophonePermission } from '@/lib/speech'
import { Speech } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface SpeechPanelProps {
  gameId: string
  isNight: boolean
  speeches: Speech[]
  onSpeechSaved?: (speech: Speech) => void
  onClose: () => void
}

export default function SpeechPanel({
  gameId,
  isNight,
  speeches,
  onSpeechSaved,
  onClose,
}: SpeechPanelProps) {
  const { players } = useGameStore()
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'listening' | 'manual'>('idle')
  const [transcript, setTranscript] = useState('')
  const [manualText, setManualText] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const alivePlayers = players.filter((p) => p.status === 'alive')
  const isSupported = isSpeechRecognitionSupported()

  const handleSpeechResult = (text: string) => {
    setTranscript(text)
    // 自动滚动到底部
    setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  const handleSpeechError = (error: string) => {
    if (error === 'microphone_denied') {
      setMicError('microphone_denied')
      setHasPermission(false)
    }
  }

  const { start, stop } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: handleSpeechError,
    onEnd: () => {
      setStatus('idle')
    },
  })

  const handleStartListening = async () => {
    if (!selectedPlayerId) return
    setMicError(null)

    // 主动请求麦克风权限，触发浏览器授权弹窗
    const granted = await requestMicrophonePermission()
    if (!granted) {
      setMicError('microphone_denied')
      setHasPermission(false)
      return
    }

    setHasPermission(true)
    setStatus('listening')
    setTranscript('')
    start()
  }

  const handleStopListening = () => {
    stop()
    setStatus('idle')
  }

  const handleManualMode = () => {
    if (!selectedPlayerId) return
    setStatus('manual')
    setTranscript('')
    setManualText('')
  }

  const handleConfirmManual = () => {
    saveSpeech(manualText.trim())
    setStatus('idle')
    setManualText('')
  }

  const handleCancelManual = () => {
    setStatus('idle')
    setManualText('')
  }

  const handleEndSpeaking = () => {
    if (status === 'listening') {
      stop()
    }
    if (transcript.trim()) {
      saveSpeech(transcript.trim())
    }
    setStatus('idle')
    setTranscript('')
    setSelectedPlayerId(null)
    onClose()
  }

  const saveSpeech = (content: string) => {
    const player = players.find((p) => p.id === selectedPlayerId)
    if (!player) return

    const roundDay = useGameStore.getState().currentRound
    const roundOrder = speeches.filter((s) => s.round_day === roundDay).length + 1

    const speech: Speech = {
      game_id: gameId,
      player_number: player.id,
      player_name: player.name,
      content,
      round_day: roundDay,
      round_order: roundOrder,
    }

    onSpeechSaved?.(speech)
  }

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId)
  const canStart = !!selectedPlayerId && status === 'idle'
  const isSpeaking = status === 'listening'
  const showPanel = isNight ? false : true // 白天显示，夜间隐藏（游戏逻辑控制）

  if (!showPanel) return null

  const isManual = status === 'manual'

  return (
    <>
      {/* ─── 发言面板（底部滑出）────────────────────────── */}
      <AnimatePresence>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`
            fixed bottom-0 left-0 right-0 z-40
            rounded-t-3xl shadow-2xl
            ${isNight
              ? 'bg-[hsl(var(--night-card-bg))] border-t border-[hsl(var(--night-card-border))]'
              : 'bg-white border-t border-[hsl(var(--day-card-border))]'
            }
          `}
        >
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="p-4 space-y-4">

              {/* 面板标题栏 */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isNight ? 'text-white' : 'text-slate-700'}`}>
                  🗣️ 发言记录
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isNight ? 'text-indigo-400' : 'text-slate-400'}`}>
                    Day {useGameStore.getState().currentRound}
                  </span>
                  <button
                    onClick={onClose}
                    className={`p-1 rounded-full hover:opacity-70 ${isNight ? 'text-indigo-400' : 'text-slate-400'}`}
                    aria-label="收起发言面板"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 麦克风权限警告 */}
              {micError === 'microphone_denied' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>麦克风未授权，将使用手动输入模式</span>
                  <button
                    className="ml-auto underline text-xs"
                    onClick={() => { setMicError(null); setHasPermission(null) }}
                  >
                    重试
                  </button>
                </div>
              )}

              {/* 发言者选择 */}
              {!isSpeaking && !isManual && (
                <div className="space-y-2">
                  <p className={`text-xs ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>
                    当前发言：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alivePlayers.map((player) => {
                      const isSelected = selectedPlayerId === player.id
                      return (
                        <button
                          key={player.id}
                          onClick={() => setSelectedPlayerId(player.id)}
                          className={`
                            px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all
                            ${isSelected
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : isNight
                                ? 'border-indigo-700 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }
                          `}
                        >
                          {player.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 当前发言者标签（识别中） */}
              {(isSpeaking || isManual) && selectedPlayer && (
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isNight ? 'text-white' : 'text-slate-800'}`}>
                    正在发言：
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 border border-orange-300">
                    {selectedPlayer.name}
                  </span>
                </div>
              )}

              {/* 实时转写区域 */}
              <div
                className={`
                  rounded-xl p-4 min-h-[80px]
                  ${isNight
                    ? 'bg-indigo-950/50 border border-indigo-400/30'
                    : 'bg-orange-50 border border-orange-200'
                  }
                `}
              >
                {isSpeaking ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        className="text-orange-500"
                      >
                        <Mic className="h-5 w-5" />
                      </motion.div>
                      <span className="text-xs text-orange-500">识别中...</span>
                    </div>
                    <p className={`text-base leading-relaxed ${isNight ? 'text-white' : 'text-slate-900'}`}>
                      {transcript || <span className={isNight ? 'text-indigo-400' : 'text-slate-400'}>正在听...</span>}
                    </p>
                    <div ref={transcriptEndRef} />
                  </div>
                ) : isManual ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Pencil className={`h-4 w-4 ${isNight ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className={`text-xs ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>
                        手动输入模式
                      </span>
                    </div>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="请输入玩家发言内容..."
                      maxLength={500}
                      autoFocus
                      className={`
                        w-full min-h-[60px] resize-none rounded-lg px-3 py-2 text-sm border outline-none
                        ${isNight
                          ? 'bg-indigo-950/50 border-indigo-400/30 text-white placeholder:text-indigo-400'
                          : 'bg-orange-50 border-orange-200 text-slate-900 placeholder:text-slate-400'
                        }
                      `}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={handleConfirmManual}
                        disabled={!manualText.trim()}
                      >
                        确认发言
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={handleCancelManual}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {isSupported && hasPermission !== false ? (
                        <Mic className={`h-5 w-5 ${isNight ? 'text-indigo-400' : 'text-slate-400'}`} />
                      ) : (
                        <MicOff className={`h-5 w-5 ${isNight ? 'text-indigo-400' : 'text-slate-400'}`} />
                      )}
                      <span className={`text-sm ${isNight ? 'text-indigo-300' : 'text-slate-500'}`}>
                        {selectedPlayerId
                          ? '点击下方"开始发言"后自动转写'
                          : '请先选择发言玩家'}
                      </span>
                    </div>
                    {transcript && (
                      <p className={`text-base leading-relaxed ${isNight ? 'text-white' : 'text-slate-800'}`}>
                        {transcript}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              {isSpeaking ? (
                <Button
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg"
                  onClick={handleStopListening}
                >
                  <span className="text-lg mr-2">⏹</span>
                  结束发言
                </Button>
              ) : (
                <div className="flex gap-2">
                  {isSupported && hasPermission !== false ? (
                    <Button
                      className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg"
                      onClick={handleStartListening}
                      disabled={!canStart}
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      开始发言
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg"
                      onClick={handleManualMode}
                      disabled={!canStart}
                    >
                      <Pencil className="h-5 w-5 mr-2" />
                      手动输入
                    </Button>
                  )}
                  {isManual && (
                    <Button
                      variant="outline"
                      className="flex-1 h-12 border-2 border-orange-400 text-orange-600 font-bold rounded-xl"
                      onClick={handleCancelManual}
                    >
                      取消
                    </Button>
                  )}
                  {!isSpeaking && !isManual && (
                    <Button
                      className={`flex-1 h-12 font-bold rounded-xl ${
                        isNight
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-orange-100 hover:bg-orange-200 text-orange-800 border-2 border-orange-300'
                      }`}
                      onClick={handleEndSpeaking}
                      disabled={!selectedPlayerId}
                    >
                      结束本轮
                    </Button>
                  )}
                </div>
              )}

              {/* 发言历史 */}
              {speeches.length > 0 && (
                <div className="border-t pt-3 mt-2">
                  <button
                    onClick={() => setShowHistory((v) => !v)}
                    className={`flex items-center gap-1 text-xs w-full py-1 ${
                      isNight ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  >
                    发言历史（{speeches.length} 条）
                    {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="max-h-32 overflow-y-auto mt-2 space-y-2">
                          {speeches.map((s, i) => (
                            <div
                              key={s.id || i}
                              className={`p-2 rounded-lg text-xs ${
                                isNight
                                  ? 'bg-indigo-900/30 border border-indigo-800/50'
                                  : 'bg-slate-50 border border-slate-200'
                              }`}
                            >
                              <span className={`font-semibold ${isNight ? 'text-indigo-300' : 'text-slate-600'}`}>
                                Day {s.round_day} #{s.round_order} {s.player_name}
                              </span>
                              <p className={`mt-0.5 ${isNight ? 'text-white' : 'text-slate-800'}`}>
                                {s.content || <span className="italic text-slate-400">（无发言内容）</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
