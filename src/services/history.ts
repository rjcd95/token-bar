import { BaseDirectory } from '@tauri-apps/plugin-fs'
import { exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import type { UsageSnapshot } from './usage'

const HISTORY_FILE = 'token-bar-history.json'
const HISTORY_MAX_HOURS = 24

export type UsageHistoryEntry = {
  timestamp: string
  totalTokensUsed: number
}

export type UsageHistory = UsageHistoryEntry[]

export async function loadHistory(): Promise<UsageHistory> {
  const hasFile = await exists(HISTORY_FILE, { baseDir: BaseDirectory.AppData })
  if (!hasFile) return []

  try {
    const contents = await readTextFile(HISTORY_FILE, {
      baseDir: BaseDirectory.AppData,
    })
    const parsed = JSON.parse(contents) as UsageHistory
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export async function appendToHistory(snapshot: UsageSnapshot): Promise<UsageHistory> {
  const history = await loadHistory()
  const entry: UsageHistoryEntry = {
    timestamp: snapshot.timestamp,
    totalTokensUsed: snapshot.totalTokensUsed,
  }

  const merged = [...history, entry].filter((h) => {
    const dt = new Date(h.timestamp).getTime()
    const now = new Date(snapshot.timestamp).getTime()
    const diffHours = (now - dt) / (1000 * 60 * 60)
    return diffHours <= HISTORY_MAX_HOURS
  })

  await writeTextFile(HISTORY_FILE, JSON.stringify(merged), {
    baseDir: BaseDirectory.AppData,
  })

  return merged
}

export type HourlyUsagePoint = {
  hourLabel: string
  tokensUsed: number
}

export function aggregateHourly(history: UsageHistory): HourlyUsagePoint[] {
  const byHour = new Map<string, number>()

  for (const entry of history) {
    const date = new Date(entry.timestamp)
    const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`
    const prev = byHour.get(hourKey) ?? 0
    byHour.set(hourKey, Math.max(prev, entry.totalTokensUsed))
  }

  return Array.from(byHour.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([hourLabel, tokensUsed]) => ({ hourLabel, tokensUsed }))
}

