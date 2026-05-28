"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

const BLUE = "#1E3A8A"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatCurrency(value: any): string {
  if (value == null) return "$0"
  const n = Array.isArray(value) ? Number(value[0]) : Number(value)
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

interface TechData {
  technician: string
  revenue: number
}

export function RevenueByTechChart({ data }: { data: TechData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
        No data for last 30 days
      </div>
    )
  }

  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="technician"
            tick={{ fontSize: 12, fill: "#64748b" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={52}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(value), "Revenue"]}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          <Bar dataKey="revenue" fill={BLUE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface DayData {
  date: string
  revenue: number
}

export function RevenueByDayChart({ data }: { data: DayData[] }) {
  const hasRevenue = data.some((d) => d.revenue > 0)

  if (!hasRevenue) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
        No revenue recorded in last 30 days
      </div>
    )
  }

  const thinned = data.filter((_, i) => i % 3 === 0 || i === data.length - 1)

  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#64748b" }}
            ticks={thinned.map((d) => d.date)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={52}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(value), "Revenue"]}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={BLUE}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
