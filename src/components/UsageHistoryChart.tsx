import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HourlyUsagePoint } from '../services/history'

type Props = {
  data: HourlyUsagePoint[]
}

export function UsageHistoryChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="usage-chart usage-chart--empty">
        <span className="usage-chart__empty-title">Token usage over last 24 hours</span>
        <span className="usage-chart__empty-text">
          A line chart will show usage per hour here once you use “Refresh now” or wait for the next automatic refresh.
        </span>
      </div>
    )
  }

  return (
    <div className="usage-chart">
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="hourLabel" hide />
          <YAxis hide />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as HourlyUsagePoint
              return (
                <div className="usage-chart__tooltip">
                  <div>{point.hourLabel}</div>
                  <div>{point.tokensUsed.toLocaleString()} tokens</div>
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="tokensUsed"
            stroke="#a855f7"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

