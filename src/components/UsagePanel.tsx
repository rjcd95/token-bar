import './UsagePanel.css'
import type { HourlyUsagePoint } from '../services/history'
import { UsageHistoryChart } from './UsageHistoryChart'

type UsagePanelProps = {
  tokensUsed: number
  tokensUsedPercent: number
  tokensRemaining: number
  tokensRemainingPercent: number
  nextRefreshIn: string
  modelName: string
  lastUpdated: string
  history: HourlyUsagePoint[]
  onRefresh: () => void
  onOpenConfig: () => void
  onQuit: () => void
}

export function UsagePanel({
  tokensUsed,
  tokensUsedPercent,
  tokensRemaining,
  tokensRemainingPercent,
  nextRefreshIn,
  modelName,
  lastUpdated,
  history,
  onRefresh,
  onOpenConfig,
  onQuit,
}: UsagePanelProps) {
  return (
    <div className="usage-panel">
      <header className="usage-panel__header">
        <h1 className="usage-panel__title">Claude Monitor</h1>
        <p className="usage-panel__subtitle">Live token usage overview</p>
      </header>

      <section className="usage-panel__stats">
        <div className="usage-panel__row">
          <span className="usage-panel__label">Tokens used</span>
          <span className="usage-panel__value">
            {tokensUsed.toLocaleString()} ({tokensUsedPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="usage-panel__row">
          <span className="usage-panel__label">Tokens remaining</span>
          <span className="usage-panel__value">
            {tokensRemaining.toLocaleString()} ({tokensRemainingPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="usage-panel__row">
          <span className="usage-panel__label">Next token refresh</span>
          <span className="usage-panel__value usage-panel__mono">
            {nextRefreshIn}
          </span>
        </div>
        <div className="usage-panel__row">
          <span className="usage-panel__label">Model</span>
          <span className="usage-panel__value">{modelName}</span>
        </div>
      </section>

      <section className="usage-panel__chart">
        <UsageHistoryChart data={history} />
      </section>

      <section className="usage-panel__footer">
        <div className="usage-panel__meta">
          <span className="usage-panel__label">Last update</span>
          <span className="usage-panel__value usage-panel__mono">{lastUpdated}</span>
        </div>
        <div className="usage-panel__actions">
          <button
            type="button"
            className="usage-panel__button usage-panel__button--ghost"
            onClick={onOpenConfig}
          >
            Open configuration file
          </button>
          <button
            type="button"
            className="usage-panel__button"
            onClick={onRefresh}
          >
            Refresh now
          </button>
          <button
            type="button"
            className="usage-panel__button usage-panel__button--danger"
            onClick={onQuit}
          >
            Quit
          </button>
        </div>
      </section>
    </div>
  )
}

