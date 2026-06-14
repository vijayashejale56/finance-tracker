import { useEffect, useState } from 'react'
import {
  getBudgetsApi,
  createBudgetApi,
  updateBudgetApi,
  deleteBudgetApi,
  type Budget,
  type BudgetRequest
} from '../../api/budgetApi'
import { toast } from '../../components/ui/Toast'

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Shopping',
  'Healthcare', 'Entertainment', 'Education',
  'Utilities', 'EMI', 'Other'
]

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
]

const STATUS_CONFIG = {
  SAFE: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950',
    bar: 'bg-green-500',
    icon: '✅',
    label: 'On track'
  },
  WARNING: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
    bar: 'bg-amber-500',
    icon: '⚠️',
    label: 'Warning'
  },
  EXCEEDED: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950',
    bar: 'bg-red-500',
    icon: '🚨',
    label: 'Exceeded'
  }
}

const fmt = (n: number) =>
  '₹' + Math.abs(n).toLocaleString('en-IN',
    { maximumFractionDigits: 0 })

export default function BudgetPage() {
  const now = new Date()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] =
    useState<Budget | null>(null)
  const [form, setForm] = useState<BudgetRequest>({
    category: 'Food',
    limitAmount: 0,
    month: now.getMonth() + 1,
    year: now.getFullYear()
  })

  useEffect(() => { fetchBudgets() }, [])

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const res = await getBudgetsApi()
      setBudgets(res.data.data)
    } catch {
      toast.error('Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBudget) {
        await updateBudgetApi(editingBudget.id, form)
        toast.success('Budget updated successfully!')
      } else {
        await createBudgetApi(form)
        toast.success('Budget created successfully!')
      }
      setShowForm(false)
      setEditingBudget(null)
      setForm({
        category: 'Food',
        limitAmount: 0,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      })
      fetchBudgets()
    } catch (err: any) {
      const msg = err.response?.data?.message ||
        'Failed to save budget'
      toast.error(msg)
    }
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setForm({
      category: budget.category,
      limitAmount: budget.limitAmount,
      month: budget.month,
      year: budget.year
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return
    try {
      await deleteBudgetApi(id)
      toast.success('Budget deleted')
      fetchBudgets()
    } catch {
      toast.error('Failed to delete budget')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingBudget(null)
    setForm({
      category: 'Food',
      limitAmount: 0,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    })
  }

  // Summary stats
  const exceeded = budgets.filter(
    b => b.status === 'EXCEEDED').length
  const warning = budgets.filter(
    b => b.status === 'WARNING').length
  const safe = budgets.filter(
    b => b.status === 'SAFE').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold
            text-gray-900 dark:text-white">
            Budgets
          </h1>
          <p className="text-sm text-gray-500
            dark:text-gray-400 mt-1">
            {MONTHS[now.getMonth()]} {now.getFullYear()} —
            Set limits and track spending
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700
            text-white text-sm font-medium px-4 py-2
            rounded-lg transition"
        >
          + Set Budget
        </button>
      </div>

      {/* Summary Cards */}
      {!loading && budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'On Track', count: safe,
              color: 'text-green-600 dark:text-green-400',
              bg: 'bg-green-50 dark:bg-green-950',
              icon: '✅' },
            { label: 'Warning', count: warning,
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-950',
              icon: '⚠️' },
            { label: 'Exceeded', count: exceeded,
              color: 'text-red-600 dark:text-red-400',
              bg: 'bg-red-50 dark:bg-red-950',
              icon: '🚨' },
          ].map(card => (
            <div key={card.label}
              className="bg-white dark:bg-gray-900 border
                border-gray-200 dark:border-gray-800
                rounded-xl p-4 shadow-sm">
              <div className="flex items-center
                justify-between mb-2">
                <span className="text-xs font-medium
                  text-gray-500 dark:text-gray-400">
                  {card.label}
                </span>
                <span className={`w-8 h-8 rounded-lg flex
                  items-center justify-center ${card.bg}`}>
                  {card.icon}
                </span>
              </div>
              <div className={`text-2xl font-bold
                ${card.color}`}>
                {card.count}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border
          border-gray-200 dark:border-gray-800 rounded-xl
          p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900
            dark:text-white mb-4">
            {editingBudget ? 'Edit Budget' : 'New Budget'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium
                  text-gray-600 dark:text-gray-400 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({
                    ...form, category: e.target.value })}
                  disabled={!!editingBudget}
                  className="w-full border border-gray-300
                    dark:border-gray-700 bg-white
                    dark:bg-gray-800 text-gray-900
                    dark:text-white rounded-lg px-3 py-2
                    text-sm focus:outline-none
                    focus:ring-2 focus:ring-indigo-500
                    disabled:opacity-50"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium
                  text-gray-600 dark:text-gray-400 mb-1">
                  Monthly Limit (₹)
                </label>
                <input
                  type="number" required min="1"
                  value={form.limitAmount || ''}
                  onChange={e => setForm({
                    ...form,
                    limitAmount: parseFloat(e.target.value)
                  })}
                  placeholder="e.g. 5000"
                  className="w-full border border-gray-300
                    dark:border-gray-700 bg-white
                    dark:bg-gray-800 text-gray-900
                    dark:text-white rounded-lg px-3 py-2
                    text-sm focus:outline-none
                    focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium
                  text-gray-600 dark:text-gray-400 mb-1">
                  Month
                </label>
                <select
                  value={form.month}
                  onChange={e => setForm({
                    ...form, month: parseInt(e.target.value)
                  })}
                  disabled={!!editingBudget}
                  className="w-full border border-gray-300
                    dark:border-gray-700 bg-white
                    dark:bg-gray-800 text-gray-900
                    dark:text-white rounded-lg px-3 py-2
                    text-sm focus:outline-none
                    focus:ring-2 focus:ring-indigo-500
                    disabled:opacity-50"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium
                  text-gray-600 dark:text-gray-400 mb-1">
                  Year
                </label>
                <select
                  value={form.year}
                  onChange={e => setForm({
                    ...form, year: parseInt(e.target.value)
                  })}
                  disabled={!!editingBudget}
                  className="w-full border border-gray-300
                    dark:border-gray-700 bg-white
                    dark:bg-gray-800 text-gray-900
                    dark:text-white rounded-lg px-3 py-2
                    text-sm focus:outline-none
                    focus:ring-2 focus:ring-indigo-500
                    disabled:opacity-50"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button type="button" onClick={handleCancel}
                className="text-sm text-gray-500
                  hover:text-gray-700 px-4 py-2">
                Cancel
              </button>
              <button type="submit"
                className="bg-indigo-600 hover:bg-indigo-700
                  text-white text-sm font-medium px-6 py-2
                  rounded-lg transition">
                {editingBudget
                  ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-28 w-full"/>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border
          border-gray-200 dark:border-gray-800 rounded-xl
          p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="font-semibold text-gray-900
            dark:text-white mb-2">
            No budgets set yet
          </h3>
          <p className="text-sm text-gray-500
            dark:text-gray-400 mb-4">
            Set a monthly spending limit for each category
            to track your finances better
          </p>
          <button onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700
              text-white text-sm font-medium px-6 py-2
              rounded-lg transition">
            Set Your First Budget
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(budget => {
            const config = STATUS_CONFIG[budget.status]
            const barWidth = Math.min(
              budget.percentageUsed, 100)

            return (
              <div key={budget.id}
                className="bg-white dark:bg-gray-900 border
                  border-gray-200 dark:border-gray-800
                  rounded-xl p-5 shadow-sm">

                {/* Header row */}
                <div className="flex items-center
                  justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg
                      flex items-center justify-center
                      text-base ${config.bg}`}>
                      {config.icon}
                    </div>
                    <div>
                      <div className="font-semibold
                        text-gray-900 dark:text-white text-sm">
                        {budget.category}
                      </div>
                      <div className={`text-xs font-medium
                        ${config.color}`}>
                        {config.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold
                        text-gray-900 dark:text-white">
                        {fmt(budget.spentAmount)}
                        <span className="text-gray-400
                          font-normal text-xs">
                          {' '}/ {fmt(budget.limitAmount)}
                        </span>
                      </div>
                      <div className={`text-xs
                        font-medium ${config.color}`}>
                        {budget.percentageUsed.toFixed(1)}%
                        used
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="text-xs text-indigo-500
                          hover:text-indigo-700 px-2 py-1
                          rounded border border-indigo-200
                          dark:border-indigo-800 transition">
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(budget.id)}
                        className="text-xs text-red-400
                          hover:text-red-600 transition">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100
                  dark:bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full
                      transition-all duration-500
                      ${config.bar}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* Remaining/Exceeded info */}
                <div className="mt-2 text-xs
                  text-gray-500 dark:text-gray-400">
                  {budget.status === 'EXCEEDED' ? (
                    <span className="text-red-500
                      dark:text-red-400 font-medium">
                      Over by {fmt(Math.abs(
                        budget.remainingAmount))}
                    </span>
                  ) : (
                    <span>
                      {fmt(budget.remainingAmount)} remaining
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}