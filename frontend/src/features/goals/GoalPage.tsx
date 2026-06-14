import { useEffect, useState } from 'react'
import {
  getGoalsApi, createGoalApi, updateGoalApi,
  contributeToGoalApi, deleteGoalApi,
  type Goal, type GoalRequest
} from '../../api/goalApi'
import { getAccountsApi, type Account }
  from '../../api/accountApi'
import { toast } from '../../components/ui/Toast'

const STATUS_CONFIG = {
  ON_TRACK: {
    icon: '🟢', label: 'On Track',
    color: 'text-green-600 dark:text-green-400',
    bar: 'bg-green-500',
    bg: 'bg-green-50 dark:bg-green-950'
  },
  BEHIND: {
    icon: '🟡', label: 'Behind Schedule',
    color: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950'
  },
  COMPLETED: {
    icon: '🎉', label: 'Completed!',
    color: 'text-indigo-600 dark:text-indigo-400',
    bar: 'bg-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950'
  }
}

const fmt = (n: number) =>
  '₹' + Math.abs(n).toLocaleString('en-IN',
    { maximumFractionDigits: 0 })

// Empty form state
const emptyForm: GoalRequest = {
  name: '', targetAmount: 0, currentAmount: 0,
  deadline: '', linkedAccountId: '', notes: ''
}

export default function GoalPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  // Form state — used for both create and edit
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] =
    useState<Goal | null>(null)
  const [form, setForm] = useState<GoalRequest>(emptyForm)

  // Contribute state
  const [contributeGoalId, setContributeGoalId] =
    useState<string | null>(null)
  const [contributeAmount, setContributeAmount] =
    useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [goalsRes, accRes] = await Promise.all([
        getGoalsApi(),
        getAccountsApi()
      ])
      setGoals(goalsRes.data.data)
      setAccounts(accRes.data)
    } catch {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  // Open form for creating new goal
  const handleOpenCreate = () => {
    setEditingGoal(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  // Open form pre-filled for editing
  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      linkedAccountId: goal.linkedAccountId || '',
      notes: goal.notes || ''
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingGoal(null)
    setForm(emptyForm)
  }

  // Handle both create and update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingGoal) {
        // UPDATE existing goal
        await updateGoalApi(editingGoal.id, {
          ...form,
          linkedAccountId:
            form.linkedAccountId || undefined
        })
        toast.success('Goal updated successfully!')
      } else {
        // CREATE new goal
        await createGoalApi({
          ...form,
          linkedAccountId:
            form.linkedAccountId || undefined
        })
        toast.success('Goal created! Keep going 💪')
      }
      handleCancel()
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message ||
        'Failed to save goal')
    }
  }

  const handleContribute = async (goalId: string) => {
    if (!contributeAmount ||
        parseFloat(contributeAmount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    try {
      await contributeToGoalApi(
        goalId, parseFloat(contributeAmount))
      toast.success('Contribution added! 🎯')
      setContributeGoalId(null)
      setContributeAmount('')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message ||
        'Failed to add contribution')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal?')) return
    try {
      await deleteGoalApi(id)
      toast.success('Goal deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete goal')
    }
  }

  const completed = goals.filter(
    g => g.status === 'COMPLETED').length
  const inProgress = goals.filter(
    g => g.status === 'IN_PROGRESS').length

  const inputClass = `w-full border border-gray-300
    dark:border-gray-700 bg-white dark:bg-gray-800
    text-gray-900 dark:text-white rounded-lg px-3 py-2
    text-sm focus:outline-none focus:ring-2
    focus:ring-indigo-500`

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold
            text-gray-900 dark:text-white">
            Financial Goals
          </h1>
          <p className="text-sm text-gray-500
            dark:text-gray-400 mt-1">
            {inProgress} active · {completed} completed
          </p>
        </div>
        <button onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700
            text-white text-sm font-medium px-4 py-2
            rounded-lg transition">
          + New Goal
        </button>
      </div>

      {/* Summary Cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Goals',
              value: goals.length,
              icon: '🎯',
              color: 'text-indigo-600 dark:text-indigo-400'
            },
            { label: 'On Track',
              value: goals.filter(g =>
                g.trackingStatus === 'ON_TRACK').length,
              icon: '🟢',
              color: 'text-green-600 dark:text-green-400'
            },
            { label: 'Completed',
              value: completed,
              icon: '🏆',
              color: 'text-purple-600 dark:text-purple-400'
            }
          ].map(card => (
            <div key={card.label}
              className="bg-white dark:bg-gray-900 border
                border-gray-200 dark:border-gray-800
                rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl mb-1">
                {card.icon}
              </div>
              <div className={`text-2xl font-bold
                ${card.color}`}>
                {card.value}
              </div>
              <div className="text-xs text-gray-500
                dark:text-gray-400 mt-1">
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border
          border-gray-200 dark:border-gray-800 rounded-xl
          p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900
            dark:text-white mb-4">
            {editingGoal ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">

              {/* Name — disable when editing */}
              <div className="col-span-2">
                <label className="block text-xs font-medium
                  text-gray-600 dark:text-gray-400 mb-1">
                  Goal Name
                </label>
                <input required type="text"
                  value={form.name}
                  onChange={e => setForm({
                    ...form, name: e.target.value })}
                  disabled={!!editingGoal}
                  placeholder="e.g. Emergency Fund, Vacation, New Laptop"
                  className={`${inputClass} ${editingGoal ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {editingGoal && (
                  <p className="text-xs text-gray-400 mt-1">
                    Goal name cannot be changed
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium
                  text-gray-600 dark:text-gray-400 mb-1">
                  Target Amount (₹)
                </label>
                <input required type="number" min="1"
                  value={form.targetAmount || ''}
                  onChange={e => setForm({
                    ...form,
                    targetAmount: parseFloat(
                      e.target.value) })}
                  placeholder="e.g. 100000"
                  className={inputClass} />
              </div>

              {/* Current amount — only show when no linked account */}
              {!form.linkedAccountId && (
                <div>
                  <label className="block text-xs font-medium
                    text-gray-600 dark:text-gray-400 mb-1">
                    Already Saved (₹)
                  </label>
                  <input type="number" min="0"
                    value={form.currentAmount || ''}
                    onChange={e => setForm({
                      ...form,
                      currentAmount: parseFloat(
                        e.target.value) || 0 })}
                    placeholder="0"
                    className={inputClass} />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium
                  text-gray-600 dark:text-gray-400 mb-1">
                  Target Date
                </label>
                <input required type="date"
                  min={new Date().toISOString()
                    .split('T')[0]}
                  value={form.deadline}
                  onChange={e => setForm({
                    ...form, deadline: e.target.value })}
                  className={inputClass} />
              </div>

              {/* Linked Account */}
              <div className={!form.linkedAccountId
                ? '' : 'col-span-2'}>
                <label className="block text-xs font-medium
                  text-gray-600 dark:text-gray-400 mb-1">
                  Link to Account (optional)
                </label>
                <select
                  value={form.linkedAccountId}
                  onChange={e => setForm({
                    ...form,
                    linkedAccountId: e.target.value,
                    // Clear manual amount if linking account
                    currentAmount: e.target.value
                      ? 0 : form.currentAmount
                  })}
                  className={inputClass}>
                  <option value="">
                    Manual tracking
                  </option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} — current balance ₹
                      {a.balance.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                {form.linkedAccountId && (
                  <p className="text-xs text-indigo-500
                    dark:text-indigo-400 mt-1">
                    ✅ Progress auto-tracks from this
                    account's balance
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium
                  text-gray-600 dark:text-gray-400 mb-1">
                  Notes (optional)
                </label>
                <input type="text"
                  value={form.notes || ''}
                  onChange={e => setForm({
                    ...form, notes: e.target.value })}
                  placeholder="Why is this goal important?"
                  className={inputClass} />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button type="button" onClick={handleCancel}
                className="text-sm text-gray-500 px-4 py-2">
                Cancel
              </button>
              <button type="submit"
                className="bg-indigo-600 hover:bg-indigo-700
                  text-white text-sm font-medium px-6 py-2
                  rounded-lg transition">
                {editingGoal ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i}
              className="skeleton h-36 w-full"/>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border
          border-gray-200 dark:border-gray-800 rounded-xl
          p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="font-semibold text-gray-900
            dark:text-white mb-2">
            No goals yet
          </h3>
          <p className="text-sm text-gray-500
            dark:text-gray-400 mb-4">
            Set your first financial goal and start
            working towards it
          </p>
          <button onClick={handleOpenCreate}
            className="bg-indigo-600 text-white text-sm
              font-medium px-6 py-2 rounded-lg
              hover:bg-indigo-700 transition">
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const config = STATUS_CONFIG[
              goal.trackingStatus] ||
              STATUS_CONFIG.ON_TRACK
            const barWidth = Math.min(
              goal.percentageComplete, 100)
            const isLinked = !!goal.linkedAccountId

            return (
              <div key={goal.id}
                className="bg-white dark:bg-gray-900
                  border border-gray-200 dark:border-gray-800
                  rounded-xl p-5 shadow-sm">

                {/* Goal Header */}
                <div className="flex items-start
                  justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900
                        dark:text-white">
                        {goal.name}
                      </h3>
                      <span className={`text-xs font-medium
                        px-2 py-0.5 rounded-full
                        ${config.bg} ${config.color}`}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    {goal.notes && (
                      <p className="text-xs text-gray-400
                        dark:text-gray-500 mt-0.5">
                        {goal.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {/* Show Add Money ONLY for manual goals */}
                    {goal.status === 'IN_PROGRESS' &&
                      !isLinked && (
                      <button
                        onClick={() => {
                          setContributeGoalId(goal.id)
                          setContributeAmount('')
                        }}
                        className="text-xs bg-indigo-50
                          dark:bg-indigo-950 text-indigo-600
                          dark:text-indigo-400 px-3 py-1
                          rounded-lg hover:bg-indigo-100
                          dark:hover:bg-indigo-900
                          transition font-medium">
                        + Add Money
                      </button>
                    )}

                    {/* Edit button */}
                    {goal.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="text-xs border
                          border-gray-200 dark:border-gray-700
                          text-gray-500 dark:text-gray-400
                          px-3 py-1 rounded-lg
                          hover:bg-gray-50
                          dark:hover:bg-gray-800
                          transition font-medium">
                        Edit
                      </button>
                    )}

                    {/* Delete button */}
                    <button onClick={() =>
                        handleDelete(goal.id)}
                      className="text-gray-300
                        hover:text-red-500
                        dark:text-gray-700
                        dark:hover:text-red-400 transition">
                      ✕
                    </button>
                  </div>
                </div>

                {/* Contribute Input (manual goals only) */}
                {contributeGoalId === goal.id && (
                  <div className="flex gap-2 mb-3 p-3
                    bg-indigo-50 dark:bg-indigo-950
                    rounded-lg">
                    <input type="number" min="1"
                      value={contributeAmount}
                      onChange={e =>
                        setContributeAmount(e.target.value)}
                      placeholder="Amount to add (₹)"
                      className="flex-1 border border-indigo-200
                        dark:border-indigo-800 bg-white
                        dark:bg-gray-800 text-gray-900
                        dark:text-white rounded-lg px-3
                        py-1.5 text-sm focus:outline-none
                        focus:ring-2 focus:ring-indigo-500" />
                    <button
                      onClick={() =>
                        handleContribute(goal.id)}
                      className="bg-indigo-600 text-white
                        text-sm font-medium px-4 py-1.5
                        rounded-lg hover:bg-indigo-700
                        transition">
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setContributeGoalId(null)
                        setContributeAmount('')
                      }}
                      className="text-gray-400
                        hover:text-gray-600 px-2">
                      ✕
                    </button>
                  </div>
                )}

                {/* Amount Info */}
                <div className="flex items-center
                  justify-between mb-2">
                  <div className="text-sm">
                    <span className="font-bold
                      text-gray-900 dark:text-white">
                      {fmt(goal.currentAmount)}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {' '}saved of{' '}
                    </span>
                    <span className="font-semibold
                      text-gray-700 dark:text-gray-300">
                      {fmt(goal.targetAmount)}
                    </span>
                  </div>
                  <div className={`text-sm font-bold
                    ${config.color}`}>
                    {goal.percentageComplete.toFixed(1)}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100
                  dark:bg-gray-800 rounded-full h-2.5 mb-3">
                  <div
                    className={`h-2.5 rounded-full
                      transition-all duration-700
                      ${config.bar}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-gray-50
                    dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-400
                      dark:text-gray-500">
                      Remaining
                    </div>
                    <div className="text-sm font-semibold
                      text-gray-900 dark:text-white">
                      {fmt(goal.remainingAmount)}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50
                    dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-400
                      dark:text-gray-500">
                      Monthly Need
                    </div>
                    <div className={`text-sm font-semibold
                      ${config.color}`}>
                      {goal.monthsRemaining > 0
                        ? fmt(goal.monthlyRequired)
                        : '—'}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50
                    dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-400
                      dark:text-gray-500">
                      Deadline
                    </div>
                    <div className="text-sm font-semibold
                      text-gray-900 dark:text-white">
                      {goal.daysRemaining > 0
                        ? `${goal.daysRemaining}d left`
                        : '🎉 Done!'}
                    </div>
                  </div>
                </div>

                {/* Linked Account info */}
                {isLinked && (
                  <div className="mt-3 flex items-center
                    gap-2 text-xs text-indigo-500
                    dark:text-indigo-400 bg-indigo-50
                    dark:bg-indigo-950 px-3 py-2
                    rounded-lg">
                    <span>📊</span>
                    <span>
                      Auto-tracking from:{' '}
                      <strong>
                        {goal.linkedAccountName}
                      </strong>
                      {' '}— balance updates automatically
                      when you add transactions
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}