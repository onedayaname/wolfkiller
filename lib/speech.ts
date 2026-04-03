/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SpeechStatus } from './types'

// ─── 浏览器能力检测 ─────────────────────────────────────────

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

// ─── 获取 SpeechRecognition 构造器 ───────────────────────────

function getSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

// ─── 权限检测 ───────────────────────────────────────────────

export async function checkMicrophonePermission(): Promise<boolean | null> {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return result.state === 'granted'
  } catch {
    return null
  }
}

// ─── 主动请求麦克风权限（通过 getUserMedia 触发浏览器授权弹窗）───

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // 立即释放麦克风，实际录音由 SpeechRecognition 处理
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch {
    return false
  }
}

// ─── useSpeechRecognition Hook ───────────────────────────────

export interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
  lang?: string
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions) {
  const { onResult, onError, onEnd, lang = 'zh-CN' } = options
  const recognitionRef = useRef<any>(null)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  const onEndRef = useRef(onEnd)
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const statusRef = useRef<SpeechStatus>('idle')
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const transcriptRef = useRef('')

  // 保持回调引用始终最新（避免闭包过期）
  useEffect(() => { onResultRef.current = onResult }, [onResult])
  useEffect(() => { onErrorRef.current = onError }, [onError])
  useEffect(() => { onEndRef.current = onEnd }, [onEnd])
  useEffect(() => { statusRef.current = status }, [status])

  // 初始化时检测能力
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setIsSupported(false)
      return
    }
    const SR = getSpeechRecognition()
    if (!SR) {
      setIsSupported(false)
      return
    }

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }
      if (finalTranscript) {
        transcriptRef.current += finalTranscript
        onResultRef.current(transcriptRef.current)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setStatus('idle')
        onErrorRef.current?.('microphone_denied')
      } else if (event.error !== 'aborted') {
        onErrorRef.current?.(event.error)
      }
    }

    recognition.onend = () => {
      if (statusRef.current === 'listening') {
        setStatus('idle')
      }
    }

    recognitionRef.current = recognition
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(async () => {
    if (!recognitionRef.current || !isSupported) return

    const granted = await checkMicrophonePermission()
    if (granted === false) {
      onErrorRef.current?.('microphone_denied')
      return
    }

    transcriptRef.current = ''
    try {
      recognitionRef.current.start()
      setStatus('listening')
    } catch {
      // already running, ignore
    }
  }, [isSupported])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {
      // ignore
    }
    setStatus('idle')
    onEndRef.current?.()
  }, [])

  const reset = useCallback(() => {
    transcriptRef.current = ''
    setStatus('idle')
  }, [])

  return {
    status,
    setStatus,
    isSupported,
    start,
    stop,
    reset,
  }
}
