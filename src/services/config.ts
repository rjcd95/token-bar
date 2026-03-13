import { invoke } from '@tauri-apps/api/core'

export type AppConfig = {
  provider: string
  apiKey: string
  endpoint: string
  tokenLimit: number
  refreshInterval: number
  menuBarIcon: string
  showPercentages: boolean
  showModel: boolean
}

export const DEFAULT_CONFIG: AppConfig = {
  provider: 'claude',
  apiKey: 'YOUR_API_KEY',
  endpoint: 'https://api.anthropic.com',
  tokenLimit: 200_000,
  refreshInterval: 20,
  menuBarIcon: 'brain',
  showPercentages: true,
  showModel: true,
}

export async function loadConfig(): Promise<AppConfig> {
  const config = await invoke<AppConfig>('load_config')
  return config
}

