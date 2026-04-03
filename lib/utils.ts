import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 从 "3号·小明" 格式中提取姓名部分，返回 "小明"
 * 若无姓名，返回空字符串
 */
export function extractPlayerName(name: string): string {
  const parts = name.split('·')
  return parts.length > 1 ? parts[1] : ''
}

/**
 * 从 "3号·小明" 提取编号部分，返回 "3号"
 */
export function extractPlayerNumber(name: string): string {
  return name.split('·')[0]
}
