import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts'
import {
  getSpendingByCategoryApi,
  getMonthlyTrendApi,
  type CategorySpending,
  type MonthlyTrend
} from '../../api/transactionApi'
import { getMonthlySummaryApi } from '../../api/transactionApi'

const PIE_COLORS = [
  '#6366f1', '#22c55e', '#f97316', '#ef4444',
  '#a855f7', '#0ea5e9', '#eab308', '#14b8a6',
  '#ec4899', '#84cc16'
]

const fmt = (n: number) =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold" style={{ color: payload[0].payload.fill }}>
        {payload[0].name}
      </p>
      <p className="text-gray-600 dark:text-gray-400">{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([])
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([])
  const [summary, setSummary] = useState({ income: 0, expense: 0, savings: 0 })
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      getSpendingByCategoryApi(),
      getMonthlyTrendApi(),
      getMonthlySummaryApi()
    ]).then(([catRes, trendRes, sumRes]) => {
      setCategoryData(catRes.data)
      setTrendData(trendRes.data)
      setSummary(sumRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const totalExpense = categoryData.reduce((s, c) => s + c.amount, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your financial insights at a glance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'This Month Income', value: summary.income,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-950', icon: '↑' },
          { label: 'This Month Expenses', value: summary.expense,
            color: 'text-red-500 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-950', icon: '↓' },
          { label: 'Net Savings', value: summary.savings,
            color: summary.savings >= 0
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-red-500 dark:text-red-400',
            bg: 'bg-indigo-50 dark:bg-indigo-950', icon: '🎯' },
        ].map(card => (
          <div key={card.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {card.label}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${card.bg}`}>
                {card.icon}
              </div>
            </div>
            <div className={`text-xl font-bold ${card.color}`}>
              {loading
                ? <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"/>
                : fmt(card.value)
              }
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 — Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Pie Chart — Spending by Category */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">
            Spending by Category
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            This month's expense breakdown
          </p>

          {loading ? (
            <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"/>
          ) : categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No expense data yet. Add some transactions!
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="space-y-2 mt-2">
                {categoryData.map((item, index) => (
                  <div key={item.category}
                    className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}/>
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 dark:text-gray-500">
                        {totalExpense > 0
                          ? Math.round((item.amount / totalExpense) * 100)
                          : 0}%
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 w-20 text-right">
                        {fmt(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar Chart — Monthly Income vs Expense */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">
            Income vs Expenses
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Last 6 months comparison
          </p>

          {loading ? (
            <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"/>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trendData} barSize={16}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.15)" vertical={false}/>
                <XAxis dataKey="month"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}/>
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => '₹' + (v >= 1000
                    ? Math.round(v/1000) + 'k' : v)}/>
                <Tooltip content={<CustomTooltip />}/>
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}/>
                <Bar dataKey="income" name="Income"
                  fill="#22c55e" radius={[4, 4, 0, 0]}/>
                <Bar dataKey="expense" name="Expense"
                  fill="#ef4444" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Line Chart — Net Worth / Savings Trend */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">
          Savings Trend
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          How much you saved each month over the last 6 months
        </p>

        {loading ? (
          <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"/>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.15)" vertical={false}/>
              <XAxis dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}/>
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => '₹' + (v >= 1000
                  ? Math.round(v/1000) + 'k' : v)}/>
              <Tooltip content={<CustomTooltip />}/>
              <Area
                type="monotone"
                dataKey="savings"
                name="Savings"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#savingsGrad)"
                dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}