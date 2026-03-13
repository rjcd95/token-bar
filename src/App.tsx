import './App.css'
import { UsagePanel } from './components/UsagePanel'

function nowIsoLocal() {
  return new Date().toLocaleString()
}

function App() {
  // Temporary mock data; this will be replaced by the
  // real Claude usage service in later steps.
  const tokenLimit = 200_000
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
        modelName="claude-3.7-sonnet"
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
