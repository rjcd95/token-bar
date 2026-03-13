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

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
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
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core')
    const config = await invoke<AppConfig>('load_config')
    return config
  }

  // Fallback for running in a regular browser during development:
  // load config.json served by Vite from the project root.
  try {
    const response = await fetch('/config.json')
    if (!response.ok) {
      return DEFAULT_CONFIG
    }
    const raw = (await response.json()) as any
    return {
      provider: raw.provider ?? DEFAULT_CONFIG.provider,
      apiKey: raw.apiKey ?? DEFAULT_CONFIG.apiKey,
      endpoint: raw.endpoint ?? DEFAULT_CONFIG.endpoint,
      tokenLimit: Number(raw.tokenLimit ?? DEFAULT_CONFIG.tokenLimit),
      refreshInterval: Number(raw.refreshInterval ?? DEFAULT_CONFIG.refreshInterval),
      menuBarIcon: raw.menuBarIcon ?? DEFAULT_CONFIG.menuBarIcon,
      showPercentages:
        typeof raw.showPercentages === 'boolean'
          ? raw.showPercentages
          : DEFAULT_CONFIG.showPercentages,
      showModel:
        typeof raw.showModel === 'boolean' ? raw.showModel : DEFAULT_CONFIG.showModel,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}
