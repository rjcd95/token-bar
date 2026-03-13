import { useEffect, useState } from 'react'
import './App.css'
import { UsagePanel } from './components/UsagePanel'
import type { AppConfig } from './services/config'
import { loadConfig } from './services/config'

function nowIsoLocal() {
  return new Date().toLocaleString()
}

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

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

  // Temporary mock usage data; this will be replaced by the
  // real Claude usage service in later steps.
  const tokenLimit = config.tokenLimit
  const tokensUsed = 42_000
  const tokensUsedPercent = (tokensUsed / tokenLimit) * 100
  const tokensRemaining = tokenLimit - tokensUsed
  const tokensRemainingPercent = (tokensRemaining / tokenLimit) * 100

  return (
    <div className="app-root">
      <UsagePanel
        tokensUsed={tokensUsed}
        tokensUsedPercent={tokensUsedPercent}
        tokensRemaining={tokensRemaining}
        tokensRemainingPercent={tokensRemainingPercent}
        nextRefreshIn="in 00:23:12"
        modelName={config.showModel ? 'claude-3.7-sonnet' : 'Hidden'}
        lastUpdated={nowIsoLocal()}
        onRefresh={() => {
          // real refresh will be wired to the usage service
          console.log('Refresh requested')
        }}
        onOpenConfig={() => {
          console.log('Open config requested')
        }}
        onQuit={() => {
          console.log('Quit requested')
        }}
      />
    </div>
  )
}

export default App
