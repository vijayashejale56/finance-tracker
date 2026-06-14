import { useEffect, useState } from 'react'
import {
  getRecurringApi, createRecurringApi,
  toggleRecurringApi, deleteRecurringApi,
  type RecurringTransaction, type RecurringRequest
} from '../../api/recurringApi'
import { getAccountsApi, type Account }
  from '../../api/accountApi'
import { toast } from '../../components/ui/Toast'

const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']

const FREQ_COLORS: Record<string, string> = {
  DAILY:   'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
  WEEKLY:  'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  MONTHLY: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
  YEARLY:  'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
}

const CATEGORIES = [
  'Salary', 'Rent', 'EMI', 'Subscription',
  'Utilities', 'Insurance', 'Investment',
  'Freelance', 'Business', 'Other'
]

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN',
    { maximumFractionDigits: 0 })

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

const emptyForm: RecurringRequest = {
  accountId: '', type: 'expense', amount: 0,
  currency: 'INR', category: 'Salary',
  description: '', frequency: 'MONTHLY',
  dayOfMonth: 1,
  startDate: new Date().toISOString().split('T')[0]
}

export default function RecurringPage() {
  const [recurring, setRecurring] =
    useState<RecurringTransaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] =
    useState<RecurringRequest>(emptyForm)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [recRes, accRes] = await Promise.all([
        getRecurringApi(),
        getAccountsApi()
      ])
      setRecurring(recRes.data.data)
      setAccounts(accRes.data)
      if (accRes.data.length > 0 && !form.accountId) {
        setForm(f => ({
          ...f, accountId: accRes.data[0].id }))
      }
    } catch {
      toast.error('Failed to load recurring transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRecurringApi(form)
      toast.success('Recurring transaction created! ✅')
      setShowForm(false)
      setForm(emptyForm)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message ||
        'Failed to create')
    }
  }

  const handleToggle = async (id: string,
      isActive: boolean) => {
    try {
      await toggleRecurringApi(id)
      toast.success(isActive
        ? 'Paused successfully'
        : 'Resumed successfully')
      fetchData()
    } catch {
      toast.error('Failed to toggle')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(
      'Delete this recurring transaction?')) return
    try {
      await deleteRecurringApi(id)
      toast.success('Deleted successfully')
      fetchData()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const activeCount = recurring.filter(
    r => r.isActive).length
  const pausedCount = recurring.filter(
    r => !r.isActive).length

  const inputClass = `w-full border border-gray-300
    dark:border-gray-700 bg-white dark:bg-gray-800
    text-gray-900 dark:text-white rounded-lg px-3 py-2
    text-sm focus:outline-none focus:ring-2
    focus:ring-indigo-500`

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between
        mb-6">
        <div>
          <h1 className="text-2xl font-bold
            text-gray-900 dark:text-white">
            Recurring Transactions
          </h1>
          <p className="text-sm text-gray-500
            dark:text-gray-400 mt-1">
            {activeCount} active · {pausedCount} paused
            — auto-added every scheduled date
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700
            text-white text-sm font-medium px-4 py-2
            rounded-lg transition">
          + Add Recurring
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-950
        border border-indigo-200 dark:border-indigo-800
        rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-xl">⏰</span>
        <div>
          <p className="text-sm font-semibold
            text-indigo-700 dark:text-indigo-300">
            How it works
          </p>
          <p className="text-xs text-indigo-600
            dark:text-indigo-400 mt-1">
            Every night at midnight, the system checks for
            due transactions and creates them automatically.
            Your salary, rent, subscriptions — all tracked
            without manual entry.
          </p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border
          border-gray-200 dark:border-gray-800 rounded-xl
          p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900
            dark:text-white mb-4">
            New Recurring Transaction
          </h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">

              {/* Type */}
              <div className="col-span-2">
                <div className="flex gap-2">
                  {(['expense', 'income'] as const)
                    .map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm({
                        ...form, type: t,
                        category: t === 'income'
                          ? 'Salary' : 'Rent'
                      })}
                      className={`flex-1 py-2 rounded-lg
                        text-sm font-medium capitalize
                        transition border ${
                        form.type === t
                          ? t === 'income'
                            ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-transparent'
                            : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-transparent'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}>
                      {t === 'income' ? '↑ Income' : '↓ Expense'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account */}
              <div>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">
                  Account
                </label>
                <select required value={form.accountId}
                  onChange={e => setForm({
                    ...form, accountId: e.target.value })}
                  className={inputClass}>
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">
                  Amount (₹)
                </label>
                <input required type="number" min="1"
                  value={form.amount || ''}
                  onChange={e => setForm({
                    ...form,
                    amount: parseFloat(e.target.value)
                  })}
                  placeholder="e.g. 85000"
                  className={inputClass} />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">
                  Category
                </label>
                <select value={form.category}
                  onChange={e => setForm({
                    ...form, category: e.target.value })}
                  className={inputClass}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">
                  Frequency
                </label>
                <select value={form.frequency}
                  onChange={e => setForm({
                    ...form, frequency: e.target.value })}
                  className={inputClass}>
                  {FREQUENCIES.map(f => (
                    <option key={f} value={f}>
                      {f.charAt(0) + f.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day of month — only for MONTHLY */}
              {form.frequency === 'MONTHLY' && (
                <div>
                  <label className="block text-xs
                    font-medium text-gray-600
                    dark:text-gray-400 mb-1">
                    Day of Month
                  </label>
                  <input type="number" min="1" max="31"
                    value={form.dayOfMonth || ''}
                    onChange={e => setForm({
                      ...form,
                      dayOfMonth: parseInt(e.target.value)
                    })}
                    placeholder="e.g. 1 for 1st of month"
                    className={inputClass} />
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">
                  Start Date
                </label>
                <input type="date"
                  value={form.startDate}
                  onChange={e => setForm({
                    ...form, startDate: e.target.value })}
                  className={inputClass} />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">
                  Description (optional)
                </label>
                <input type="text"
                  value={form.description}
                  onChange={e => setForm({
                    ...form, description: e.target.value })}
                  placeholder="e.g. Netflix subscription, Home loan EMI..."
                  className={inputClass} />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button type="button"
                onClick={() => {
                  setShowForm(false)
                  setForm(emptyForm)
                }}
                className="text-sm text-gray-500 px-4 py-2">
                Cancel
              </button>
              <button type="submit"
                className="bg-indigo-600 hover:bg-indigo-700
                  text-white text-sm font-medium px-6 py-2
                  rounded-lg transition">
                Create Recurring
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recurring List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-28 w-full"/>
          ))}
        </div>
      ) : recurring.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border
          border-gray-200 dark:border-gray-800 rounded-xl
          p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🔄</div>
          <h3 className="font-semibold text-gray-900
            dark:text-white mb-2">
            No recurring transactions yet
          </h3>
          <p className="text-sm text-gray-500
            dark:text-gray-400 mb-4">
            Automate your salary, rent, EMIs and
            subscriptions
          </p>
          <button onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white text-sm
              font-medium px-6 py-2 rounded-lg
              hover:bg-indigo-700 transition">
            Add Your First Recurring
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recurring.map(r => (
            <div key={r.id}
              className={`bg-white dark:bg-gray-900 border
                rounded-xl p-5 shadow-sm transition ${
                r.isActive
                  ? 'border-gray-200 dark:border-gray-800'
                  : 'border-dashed border-gray-300 dark:border-gray-700 opacity-60'
              }`}>

              <div className="flex items-start
                justify-between">
                <div className="flex items-start gap-3">

                  {/* Type Icon */}
                  <div className={`w-10 h-10 rounded-full
                    flex items-center justify-center
                    text-base flex-shrink-0 ${
                    r.type === 'income'
                      ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                  }`}>
                    {r.type === 'income' ? '↑' : '↓'}
                  </div>

                  <div>
                    {/* Name + Frequency Badge */}
                    <div className="flex items-center
                      gap-2 flex-wrap">
                      <span className="font-semibold
                        text-gray-900 dark:text-white">
                        {r.description || r.category}
                      </span>
                      <span className={`text-xs font-medium
                        px-2 py-0.5 rounded-full
                        ${FREQ_COLORS[r.frequency]}`}>
                        {r.frequency}
                      </span>
                      {!r.isActive && (
                        <span className="text-xs font-medium
                          px-2 py-0.5 rounded-full
                          bg-gray-100 dark:bg-gray-800
                          text-gray-500 dark:text-gray-400">
                          PAUSED
                        </span>
                      )}
                    </div>

                    {/* Account + Category */}
                    <p className="text-xs text-gray-400
                      dark:text-gray-500 mt-0.5">
                      {r.accountName} · {r.category}
                      {r.dayOfMonth &&
                        r.frequency === 'MONTHLY' &&
                        ` · Day ${r.dayOfMonth}`}
                    </p>

                    {/* Next due info */}
                    <div className="flex items-center
                      gap-3 mt-2">
                      <span className="text-xs
                        text-gray-500 dark:text-gray-400">
                        Next:{' '}
                        <span className="font-medium
                          text-gray-700 dark:text-gray-300">
                          {formatDate(r.nextDueDate)}
                        </span>
                        {r.daysUntilNext === 0 &&
                          ' (Today!)'}
                        {r.daysUntilNext === 1 &&
                          ' (Tomorrow)'}
                        {r.daysUntilNext > 1 &&
                          ` (in ${r.daysUntilNext} days)`}
                      </span>
                      {r.lastExecutedDate && (
                        <span className="text-xs
                          text-gray-400
                          dark:text-gray-600">
                          Last: {formatDate(
                            r.lastExecutedDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side — amount + actions */}
                <div className="flex items-center gap-3
                  flex-shrink-0">
                  <div className="text-right">
                    <div className={`font-bold ${
                      r.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      {r.type === 'income' ? '+' : '-'}
                      {fmt(r.amount)}
                    </div>
                    <div className="text-xs text-gray-400
                      dark:text-gray-500">
                      per {r.frequency.toLowerCase()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {/* Pause/Resume */}
                    <button
                      onClick={() => handleToggle(
                        r.id, r.isActive)}
                      className={`text-xs px-3 py-1
                        rounded-lg font-medium transition
                        border ${
                        r.isActive
                          ? 'border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950'
                          : 'border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950'
                      }`}>
                      {r.isActive ? '⏸ Pause' : '▶ Resume'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-gray-400
                        hover:text-red-500
                        dark:text-gray-600
                        dark:hover:text-red-400
                        transition text-center">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}