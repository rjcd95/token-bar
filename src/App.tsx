import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { UsagePanel } from './components/UsagePanel'
import type { AppConfig } from './services/config'
import { loadConfig } from './services/config'
import { aggregateHourly, appendToHistory, loadHistory } from './services/history'
import type { HourlyUsagePoint } from './services/history'
import { fetchUsage, resolveUsageConfig } from './services/usage'

function nowIsoLocal() {
  return new Date().toLocaleString()
}

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tokensUsed, setTokensUsed] = useState<number | null>(null)
  const [modelName, setModelName] = useState<string>('claude-3.7-sonnet')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [nextRefreshIn, setNextRefreshIn] = useState<string>('—')
  const [historyPoints, setHistoryPoints] = useState<HourlyUsagePoint[]>([])

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

    const updateCountdown = () => {
      if (!lastUpdated) {
        setNextRefreshIn('—')
        return
      }
      const last = new Date(lastUpdated).getTime()
      const next = last + usageConfig.refreshIntervalMinutes * 60 * 1000
      const now = Date.now()
      const remainingMs = Math.max(0, next - now)
      const totalSeconds = Math.round(remainingMs / 1000)
      const h = Math.floor(totalSeconds / 3600)
      const m = Math.floor((totalSeconds % 3600) / 60)
      const s = totalSeconds % 60
      const label =
        h > 0
          ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
              .toString()
              .padStart(2, '0')}`
          : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      setNextRefreshIn(label)
    }

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

        const newHistory = await appendToHistory(result.snapshot)
        setHistoryPoints(aggregateHourly(newHistory))
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

    const bootstrap = async () => {
      try {
        const existingHistory = await loadHistory()
        if (!cancelled) {
          setHistoryPoints(aggregateHourly(existingHistory))
        }
      } catch {
        // ignore
      }
      await performRefresh()
    }

    bootstrap()

    const intervalId = window.setInterval(() => {
      void performRefresh()
    }, usageConfig.refreshIntervalMinutes * 60 * 1000)

    const countdownId = window.setInterval(updateCountdown, 1_000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.clearInterval(countdownId)
    }
  }, [config, lastUpdated])

  const tokenLimit = config?.tokenLimit ?? 1
  const computedTokensUsed = tokensUsed ?? 0
  const tokensUsedPercent = (computedTokensUsed / tokenLimit) * 100
  const tokensRemaining = tokenLimit - computedTokensUsed
  const tokensRemainingPercent = (tokensRemaining / tokenLimit) * 100

  if (configError) {
    return (
      <div className="app-root">
        <div className="app-message app-message--error">
          <h1>Claude Monitor</h1>
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
          <h1>Claude Monitor</h1>
          <p>Loading configuration&hellip;</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-root">
      <UsagePanel
        tokensUsed={computedTokensUsed}
        tokensUsedPercent={tokensUsedPercent}
        tokensRemaining={tokensRemaining}
        tokensRemainingPercent={tokensRemainingPercent}
        nextRefreshIn={nextRefreshIn}
        modelName={config.showModel ? modelName : 'Hidden'}
        lastUpdated={lastUpdated ?? nowIsoLocal()}
        history={historyPoints}
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
              const newHistory = await appendToHistory(result.snapshot)
              setHistoryPoints(aggregateHourly(newHistory))
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
        onOpenConfig={() => {
          window.__TAURI__?.shell
            ?.open('config.json')
            .catch((error: unknown) => {
              // eslint-disable-next-line no-console
              console.error('Failed to open config.json', error)
            })
        }}
        onQuit={() => {
          window.__TAURI__?.process?.exit(0)
        }}
      />
    </div>
  )
}

export default App
