import type { ReactNode } from "react"
import { fetchJobs, type Job } from "@/lib/sheets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshButton } from "@/components/dashboard/refresh-button"
import { RevenueByTechChart, RevenueByDayChart } from "@/components/dashboard/charts-client"
import { OpenQuotesTable } from "@/components/dashboard/open-quotes-table"
import {
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  FileText,
  TrendingUp,
} from "lucide-react"

export const dynamic = "force-dynamic"

function parseDate(s: string): Date {
  const d = new Date(s)
  return isNaN(d.getTime()) ? new Date(0) : d
}

function computeStats(jobs: Job[]) {
  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 864e5)

  const quarterJobs = jobs.filter((j) => parseDate(j.date) >= ninetyDaysAgo)
  const totalRevenue = quarterJobs.reduce((s, j) => s + j.revenue, 0)
  const completedThisQuarter = quarterJobs.filter((j) => j.status === "Completed").length

  const openQuotes = jobs.filter((j) => j.status === "Quoted-Pending")

  const completedAll = jobs.filter((j) => j.status === "Completed")
  const avgJobValue =
    completedAll.length > 0
      ? completedAll.reduce((s, j) => s + j.revenue, 0) / completedAll.length
      : 0

  // Revenue by technician (last 90 days)
  const techMap = new Map<string, number>()
  for (const j of quarterJobs) {
    if (j.technician) {
      techMap.set(j.technician, (techMap.get(j.technician) ?? 0) + j.revenue)
    }
  }
  const revenueByTech = Array.from(techMap.entries())
    .map(([technician, revenue]) => ({ technician, revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  // Revenue by day (last 90 days) — initialize every day to 0 first
  const dayMap = new Map<string, number>()
  for (let i = 89; i >= 0; i--) {
    const key = new Date(now.getTime() - i * 864e5).toISOString().slice(0, 10)
    dayMap.set(key, 0)
  }
  for (const j of quarterJobs) {
    const key = j.date.slice(0, 10)
    if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + j.revenue)
  }
  const revenueByDay = Array.from(dayMap.entries()).map(([date, revenue]) => ({
    date: date.slice(5), // MM-DD
    revenue,
  }))

  // Open quotes with days-since
  const openQuotesWithDays = openQuotes
    .map((j) => ({
      ...j,
      daysSince: Math.floor((now.getTime() - parseDate(j.date).getTime()) / 864e5),
    }))
    .sort((a, b) => b.daysSince - a.daysSince)

  const stale = openQuotesWithDays.filter((j) => j.daysSince > 7)
  const alertInfo =
    stale.length > 0 ? { count: stale.length, oldest: stale[0].daysSince } : null

  return {
    totalRevenue,
    completedThisQuarter,
    openQuotesCount: openQuotes.length,
    avgJobValue,
    revenueByTech,
    revenueByDay,
    openQuotesWithDays,
    alertInfo,
  }
}

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

function StatCard({
  title,
  value,
  icon,
  accent,
  sub,
}: {
  title: string
  value: string
  icon: ReactNode
  accent?: boolean
  sub?: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium text-slate-500 leading-tight">
            {title}
          </CardTitle>
          <span className={accent ? "text-[#1E3A8A]" : "text-slate-300"}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p
          className={`text-3xl font-bold tracking-tight ${
            accent ? "text-[#1E3A8A]" : "text-slate-900"
          }`}
        >
          {value}
        </p>
        {sub && <div className="mt-2">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  let jobs: Job[] = []
  let error: string | null = null

  try {
    jobs = await fetchJobs()
  } catch (e) {
    error =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred while loading data."
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Could not load dashboard data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">{error}</p>
            <p className="text-xs text-muted-foreground">
              Make sure <code className="bg-slate-100 px-1 rounded">GOOGLE_SHEET_ID</code>,{" "}
              <code className="bg-slate-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>, and{" "}
              <code className="bg-slate-100 px-1 rounded">GOOGLE_PRIVATE_KEY</code> are set in your
              environment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const {
    totalRevenue,
    completedThisQuarter,
    openQuotesCount,
    avgJobValue,
    revenueByTech,
    revenueByDay,
    openQuotesWithDays,
    alertInfo,
  } = computeStats(jobs)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A8A] tracking-tight">
              HVAC Demo Co.
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{dateStr}</p>
          </div>
          <RefreshButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Alert banner */}
        {alertInfo && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm font-medium">
              {alertInfo.count} {alertInfo.count === 1 ? "quote needs" : "quotes need"} follow-up
              — oldest is {alertInfo.oldest} days old.
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue This Quarter"
            value={fmt(totalRevenue)}
            icon={<DollarSign className="h-5 w-5" />}
            accent
          />
          <StatCard
            title="Jobs Completed This Quarter"
            value={String(completedThisQuarter)}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Open Quotes"
            value={String(openQuotesCount)}
            icon={<FileText className="h-5 w-5" />}
            sub={
              openQuotesCount > 0 ? (
                <Badge variant="secondary" className="text-xs">
                  Quoted-Pending
                </Badge>
              ) : undefined
            }
          />
          <StatCard
            title="Average Job Value"
            value={fmt(avgJobValue)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">
                Revenue by Technician — Last 90 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueByTechChart data={revenueByTech} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">
                Revenue by Day — Last 90 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueByDayChart data={revenueByDay} />
            </CardContent>
          </Card>
        </div>

        {/* Open quotes table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700">
                All Open Quotes
              </CardTitle>
              {openQuotesCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {openQuotesCount} open
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <OpenQuotesTable quotes={openQuotesWithDays} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
