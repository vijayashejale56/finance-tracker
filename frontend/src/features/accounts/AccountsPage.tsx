import { useEffect, useState } from 'react'

import type { Account } from '../../api/accountApi'
import { AccountSkeleton } from '../../components/ui/Skeleton'
import { toast } from '../../components/ui/Toast'

import {
  getAccountsApi,
  createAccountApi,
  deleteAccountApi,
} from '../../api/accountApi'

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'investment']

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', type: 'checking', balance: '', currency: 'USD'
  })

  useEffect(() => { fetchAccounts() }, [])

  const fetchAccounts = async () => {
    try {
      const res = await getAccountsApi()
      setAccounts(res.data)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    await createAccountApi({
      name: form.name,
      type: form.type,
      balance: parseFloat(form.balance) || 0,
      currency: form.currency
    })
    toast.success('Account created successfully!')
    setForm({ name: '', type: 'checking', balance: '', currency: 'USD' })
    setShowForm(false)
    fetchAccounts()
  } catch {
    toast.error('Failed to create account.')
  }
}

  const handleDelete = async (id: string) => {
  if (!confirm('Delete this account?')) return
  try {
    await deleteAccountApi(id)
    toast.success('Account deleted successfully.')
    fetchAccounts()
  } catch {
    toast.error('Failed to delete account.')
  }
}

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
            <p className="text-sm text-gray-500 mt-1">
              Total Balance:
              <span className="font-semibold text-gray-800 ml-1">
                ₹{totalBalance.toLocaleString()}
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Add Account
          </button>
        </div>

        {/* Add Account Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              New Account
            </h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. HDFC Savings"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Balance
                </label>
                <input
                  type="number"
                  value={form.balance}
                  onChange={e => setForm({ ...form, balance: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts List */}
        {loading ? (
  <AccountSkeleton count={3} />
) : accounts.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-white rounded-xl border border-gray-200">
            No accounts yet. Add your first account!
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map(account => (
              <div
                key={account.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {account.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize mt-0.5">
                      {account.type} · {account.currency}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      ₹{account.balance.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">Balance</div>
                  </div>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="text-red-400 hover:text-red-600 text-sm transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}