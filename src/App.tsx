import { useEffect, useState } from 'react'
import './App.css'
import { UsagePanel } from './components/UsagePanel'
import type { AppConfig } from './services/config'
import { loadConfig } from './services/config'
import { fetchUsage, resolveUsageConfig } from './services/usage'
import { updateTrayUsage } from './tray'

/** Formats an ISO timestamp in English: e.g. "Mar 13, 2026, 3:59:40 PM" */
function formatLastUpdate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  return `${date}, ${time}`
}

function capitalizeProvider(name: string): string {
  if (!name) return '—'
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tokensUsed, setTokensUsed] = useState<number | null>(null)
  const [modelName, setModelName] = useState<string>('claude-3.7-sonnet')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : String(error ?? 'Unknown error')
        setConfigError(message)
        // eslint-disable-next-line no-console
        console.error('Failed to load config', error)
      })
  }, [])

  useEffect(() => {
    if (!config) return

    let cancelled = false
    const usageConfig = resolveUsageConfig(config)

    const withinActiveHours = () => {
      const hour = new Date().getHours()
      const from = usageConfig.activeHours.from
      const to = usageConfig.activeHours.to
      return hour >= from && hour < to
    }

    const performRefresh = async () => {
      if (cancelled) return
      if (!withinActiveHours()) return

      try {
        setIsRefreshing(true)
        const result = await fetchUsage(config)
        if (cancelled) return

        setUsageError(null)
        setTokensUsed(result.snapshot.totalTokensUsed)
        setModelName(result.snapshot.modelName)
        setLastUpdated(result.snapshot.timestamp)

        const pct = (result.snapshot.totalTokensUsed / result.snapshot.tokenLimit) * 100
        void updateTrayUsage(pct)
      } catch (error) {
        if (cancelled) return
        const message =
          error instanceof Error ? error.message : String(error ?? 'Unknown error')
        setUsageError(message)
      } finally {
        if (!cancelled) {
          setIsRefreshing(false)
        }
      }
    }

    void performRefresh()

    const intervalId = window.setInterval(() => {
      void performRefresh()
    }, usageConfig.refreshIntervalMinutes * 60 * 1000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
    // Only when config changes; lastUpdated read via ref to avoid refresh loop
  }, [config])

  const tokenLimit = config?.tokenLimit ?? 1
  const computedTokensUsed = tokensUsed ?? 0
  const tokensUsedPercent = (computedTokensUsed / tokenLimit) * 100
  const tokensRemaining = tokenLimit - computedTokensUsed
  const tokensRemainingPercent = (tokensRemaining / tokenLimit) * 100

  if (configError) {
    return (
      <div className="app-root">
        <div className="app-message app-message--error">
          <h1>Token Monitor</h1>
          <p>Could not load configuration.</p>
          <p className="app-message__details">{configError}</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="app-root">
        <div className="app-message">
          <h1>Token Monitor</h1>
          <p>Loading configuration&hellip;</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-root">
      <UsagePanel
        providerName={capitalizeProvider(config.provider)}
        tokensUsed={computedTokensUsed}
        tokensUsedPercent={tokensUsedPercent}
        tokensRemaining={tokensRemaining}
        tokensRemainingPercent={tokensRemainingPercent}
        modelName={config.showModel ? modelName : 'Hidden'}
        lastUpdatedFormatted={formatLastUpdate(lastUpdated)}
        onRefresh={() => {
          setLastUpdated(null)
          setIsRefreshing(true)
          void (async () => {
            if (!config) return
            try {
              const result = await fetchUsage(config)
              setUsageError(null)
              setTokensUsed(result.snapshot.totalTokensUsed)
              setModelName(result.snapshot.modelName)
              setLastUpdated(result.snapshot.timestamp)
              const pct =
                (result.snapshot.totalTokensUsed / result.snapshot.tokenLimit) * 100
              void updateTrayUsage(pct)
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : String(error ?? 'Unknown error')
              setUsageError(message)
            } finally {
              setIsRefreshing(false)
            }
          })()
        }}
        onOpenConfig={async () => {
          if (!('__TAURI__' in window)) return
          const { invoke } = await import('@tauri-apps/api/core')
          invoke('open_config_file').catch((error: unknown) => {
            // eslint-disable-next-line no-console
            console.error('Failed to open config file', error)
          })
        }}
        onQuit={async () => {
          if (!('__TAURI__' in window)) return
          const { exit } = await import('@tauri-apps/plugin-process')
          await exit(0)
        }}
      />
    </div>
  )
}

export default App
