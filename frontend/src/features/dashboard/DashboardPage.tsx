import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAccountsApi, type Account } from '../../api/accountApi'
import { useAuthStore } from '../../store/authStore'
import { getMonthlySummaryApi } from '../../api/transactionApi'

interface StatCard {
  label: string
  value: string
  icon: string
  color: string
  bg: string
  darkBg: string
}

// ✅ Hook defined OUTSIDE the component — this is the fix
const useCountUp = (target: number, duration = 1000) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setCount(0)
      return
    }
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return count
}

export default function DashboardPage() {
  const { fullName } = useAuthStore()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [_summary, setSummary] = useState({
    income: 0, expense: 0, savings: 0
  })

  useEffect(() => {
    Promise.all([
      getAccountsApi(),
      getMonthlySummaryApi()
    ]).then(([accRes, sumRes]) => {
      setAccounts(accRes.data)
      setSummary(sumRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const totalSavings = accounts
    .filter(a => a.type === 'savings')
    .reduce((s, a) => s + a.balance, 0)
  const totalCredit = accounts
    .filter(a => a.type === 'credit')
    .reduce((s, a) => s + a.balance, 0)
  const totalInvestment = accounts
    .filter(a => a.type === 'investment')
    .reduce((s, a) => s + a.balance, 0)

  // ✅ Call the hook inside the component — correct usage
  const animatedBalance    = useCountUp(totalBalance)
  const animatedSavings    = useCountUp(totalSavings)
  const animatedCredit     = useCountUp(totalCredit)
  const animatedInvestment = useCountUp(totalInvestment)

  const fmt = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })

  const stats: StatCard[] = [
    {
      label: 'Net Worth',
      value: fmt(animatedBalance),
      icon: '💰',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50',
      darkBg: 'dark:bg-indigo-950',
    },
    {
      label: 'Total Savings',
      value: fmt(animatedSavings),
      icon: '🏦',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50',
      darkBg: 'dark:bg-green-950',
    },
    {
      label: 'Credit Balance',
      value: fmt(animatedCredit),
      icon: '💳',
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50',
      darkBg: 'dark:bg-orange-950',
    },
    {
      label: 'Investments',
      value: fmt(animatedInvestment),
      icon: '📈',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50',
      darkBg: 'dark:bg-purple-950',
    },
  ]

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning'
    : hour < 17 ? 'Good afternoon'
    : 'Good evening'

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Here's your financial overview
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover-card card-enter"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${stat.bg} ${stat.darkBg}`}>
                {stat.icon}
              </div>
            </div>
            {loading ? (
              <div className="skeleton h-7 w-24" />
            ) : (
              <div className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Accounts Summary + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Your Accounts
            </h2>
            <Link
              to="/accounts"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🏦</div>
              <p className="text-gray-400 text-sm mb-3">No accounts yet</p>
              <Link
                to="/accounts"
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Add your first account
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.slice(0, 4).map(account => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {account.name}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {account.type}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {fmt(account.balance)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover-card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add Account',     icon: '🏦', to: '/accounts',
                color: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' },
              { label: 'Add Transaction', icon: '➕', to: '/transactions',
                color: 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400' },
              { label: 'View Analytics',  icon: '📊', to: '/analytics',
                color: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400' },
              { label: 'My Profile',      icon: '👤', to: '/profile',
                color: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400' },
            ].map(action => (
              <Link
                key={action.label}
                to={action.to}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium transition hover:opacity-80 ${action.color}`}
              >
                <span className="text-2xl">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}