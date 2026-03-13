import axios from 'axios'
import type { AppConfig } from './config'

export type UsageMode = 'mock' | 'api'

export type UsageSnapshot = {
  timestamp: string
  totalTokensUsed: number
  tokenLimit: number
  modelName: string
}

export type UsageResult = {
  snapshot: UsageSnapshot
  fromCache: boolean
  source: UsageMode
}

export type UsageConfig = {
  mode: UsageMode
  activeHours: {
    from: number // 0-23 local hour
    to: number // 0-23 local hour, exclusive upper bound
  }
  refreshIntervalMinutes: number
}

export const DEFAULT_USAGE_CONFIG: UsageConfig = {
  mode: 'api',
  activeHours: { from: 6, to: 18 },
  refreshIntervalMinutes: 60,
}

export function resolveUsageConfig(appConfig: AppConfig): UsageConfig {
  const refreshIntervalMinutes = Math.max(5, appConfig.refreshInterval || 60)
  return {
    mode: appConfig.apiKey && appConfig.apiKey !== 'YOUR_API_KEY' ? 'api' : 'mock',
    activeHours: { from: 6, to: 18 },
    refreshIntervalMinutes,
  }
}

function buildMockSnapshot(config: AppConfig): UsageSnapshot {
  const now = new Date()
  const base = (now.getHours() / 24) * 0.8 + 0.1
  const jitter = (Math.sin(now.getTime() / 1_800_000) + 1) / 20
  const ratio = Math.min(0.99, base + jitter)
  const totalTokensUsed = Math.round(config.tokenLimit * ratio)

  return {
    timestamp: now.toISOString(),
    totalTokensUsed,
    tokenLimit: config.tokenLimit,
    modelName: 'claude-3.7-sonnet',
  }
}

async function fetchClaudeUsageFromApi(config: AppConfig): Promise<UsageSnapshot> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const url = `${config.endpoint.replace(/\/+$/, '')}/v1/organizations/usage_report/messages`

  const body = {
    interval: {
      type: 'relative',
      unit: 'day',
      value: 30,
    },
    group_by: ['model'],
    // Use the smallest bucket allowed so we can sum accurately even if the
    // API changes; the app only needs the aggregate.
    bucket_width: '1d',
  }

  const response = await axios.post(url, body, {
    headers: {
      'x-api-key': config.apiKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'usage/v1',
    },
    timeout: 10_000,
  })

  const data = response.data as any

  let totalTokens = 0
  let topModel = 'claude-3.7-sonnet'

  if (Array.isArray(data.results)) {
    for (const bucket of data.results) {
      if (bucket.start_time && bucket.start_time < thirtyDaysAgo.toISOString()) {
        continue
      }
      const usage = bucket.usage ?? bucket.messages_usage ?? {}
      const tokenFields = [
        'input_tokens',
        'output_tokens',
        'input_tokens_cached',
        'input_tokens_cache_write',
      ]
      for (const field of tokenFields) {
        const value = usage[field]
        if (typeof value === 'number' && Number.isFinite(value)) {
          totalTokens += value
        }
      }
    }
  }

  if (Array.isArray(data.grouped_by) && data.grouped_by.length > 0) {
    const firstGroup = data.grouped_by[0]
    if (firstGroup.model) {
      topModel = String(firstGroup.model)
    }
  }

  return {
    timestamp: now.toISOString(),
    totalTokensUsed: totalTokens,
    tokenLimit: config.tokenLimit,
    modelName: topModel,
  }
}

export async function fetchUsage(config: AppConfig): Promise<UsageResult> {
  const usageConfig = resolveUsageConfig(config)

  if (usageConfig.mode === 'mock') {
    return {
      snapshot: buildMockSnapshot(config),
      fromCache: false,
      source: 'mock',
    }
  }

  try {
    const snapshot = await fetchClaudeUsageFromApi(config)
    return {
      snapshot,
      fromCache: false,
      source: 'api',
    }
  } catch {
    return {
      snapshot: buildMockSnapshot(config),
      fromCache: true,
      source: 'mock',
    }
  }
}

