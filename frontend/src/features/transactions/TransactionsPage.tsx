import { useEffect, useState } from 'react'
import { getAccountsApi, type Account } from '../../api/accountApi'
import {
  getTransactionsApi,
  createTransactionApi,
  deleteTransactionApi,
  type Transaction,
  type PageResponse,
  type TransactionFilters
} from '../../api/transactionApi'
import { useDebounce } from '../../hooks/useDebounce'
import { toast } from '../../components/ui/Toast'
import { TransactionSkeleton } from '../../components/ui/Skeleton'
import ExportButton from '../../components/ui/ExportButton'

const CATEGORIES = {
  income:   ['Salary', 'Freelance', 'Business',
             'Investment', 'Gift', 'Other'],
  expense:  ['Food', 'Rent', 'Transport', 'Shopping',
             'Healthcare', 'Entertainment', 'Education',
             'Utilities', 'EMI', 'Other'],
  transfer: ['Transfer']
}

const TYPE_COLORS = {
  income:   'text-green-600 dark:text-green-400',
  expense:  'text-red-500 dark:text-red-400',
  transfer: 'text-blue-500 dark:text-blue-400'
}

const TYPE_BG = {
  income:   'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
  expense:  'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
  transfer: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
}

export default function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<PageResponse<Transaction> | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)

  // ─── Filter State ──────────────────────────────────
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<TransactionFilters>({
    type: '', category: '', from: '', to: '',
    minAmount: undefined, maxAmount: undefined,
    sortBy: 'date', sortDir: 'desc'
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Debounce search — waits 500ms after user stops typing
  const debouncedSearch = useDebounce(searchInput, 500)

  // ─── Form State ────────────────────────────────────
  const [form, setForm] = useState({
    accountId: '',
    type: 'expense',
    amount: '',
    currency: 'INR',
    category: 'Food',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    transferToAccountId: ''
  })

  // Fetch when filters or search changes
  useEffect(() => {
    setCurrentPage(0)
    fetchAll(0)
  }, [debouncedSearch, filters])

  // Fetch when page changes
  useEffect(() => {
    fetchAll(currentPage)
  }, [currentPage])

  const fetchAll = async (page: number) => {
    setLoading(true)
    try {
      const [txRes, accRes] = await Promise.all([
        getTransactionsApi({
          page,
          size: 20,
          ...(filters.type && { type: filters.type }),
          ...(filters.category && {
            category: filters.category }),
          ...(filters.from && { from: filters.from }),
          ...(filters.to && { to: filters.to }),
          ...(filters.minAmount && {
            minAmount: filters.minAmount }),
          ...(filters.maxAmount && {
            maxAmount: filters.maxAmount }),
          ...(debouncedSearch && {
            keyword: debouncedSearch }),
          // sortBy: filters.sortBy,
          // sortDir: filters.sortDir
          sortBy: filters.sortBy ?? 'id',       
          sortDir: filters.sortDir ?? 'asc'
        }),
        getAccountsApi()
      ])
      setTransactions(txRes.data)
      setAccounts(accRes.data)
      if (accRes.data.length > 0 && !form.accountId) {
        setForm(f => ({
          ...f, accountId: accRes.data[0].id }))
      }
    } finally {
      setLoading(false)
    }
  }

  const clearAllFilters = () => {
    setSearchInput('')
    setFilters({
      type: '', category: '', from: '', to: '',
      minAmount: undefined, maxAmount: undefined,
      sortBy: 'date', sortDir: 'desc'
    })
  }

  const hasActiveFilters = searchInput ||
    filters.type || filters.category ||
    filters.from || filters.to ||
    filters.minAmount || filters.maxAmount

  const handleTypeChange = (type: string) => {
    const cats = CATEGORIES[type as keyof typeof CATEGORIES]
    setForm(f => ({ ...f, type, category: cats[0] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTransactionApi({
        ...form,
        amount: parseFloat(form.amount),
        transferToAccountId:
          form.transferToAccountId || undefined
      })
      toast.success('Transaction added successfully!')
      setShowForm(false)
      setForm(f => ({
        ...f, amount: '', description: '',
        transactionDate: new Date()
          .toISOString().split('T')[0]
      }))
      fetchAll(0)
    } catch {
      toast.error('Failed to add transaction.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(
      'Delete this transaction? Balance will reverse.'))
      return
    try {
      await deleteTransactionApi(id)
      toast.success('Transaction deleted.')
      fetchAll(currentPage)
    } catch {
      toast.error('Failed to delete transaction.')
    }
  }

  const fmt = (n: number) =>
    '₹' + Math.abs(n).toLocaleString('en-IN',
      { maximumFractionDigits: 2 })

  const inputClass = `w-full border border-gray-300
    dark:border-gray-700 bg-white dark:bg-gray-800
    text-gray-900 dark:text-white rounded-lg px-3 py-2
    text-sm focus:outline-none focus:ring-2
    focus:ring-indigo-500`

  return (
    <div>
      {/* Header */}
      {/* <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold
            text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-sm text-gray-500
            dark:text-gray-400 mt-1">
            {transactions?.totalElements ?? 0} total
            {hasActiveFilters ? ' (filtered)' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700
            text-white text-sm font-medium px-4 py-2
            rounded-lg transition"
        >
          + Add Transaction
        </button>
      </div> */}

      <div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold
      text-gray-900 dark:text-white">
      Transactions
    </h1>
    <p className="text-sm text-gray-500
      dark:text-gray-400 mt-1">
      {transactions?.totalElements ?? 0} total
      {hasActiveFilters ? ' (filtered)' : ''}
    </p>
  </div>

  {/* Right side buttons */}
  <div className="flex items-center gap-3">
    <ExportButton
      from={filters.from}
      to={filters.to}
    />
    <button
      onClick={() => setShowForm(!showForm)}
      className="bg-indigo-600 hover:bg-indigo-700
        text-white text-sm font-medium px-4 py-2
        rounded-lg transition"
    >
      + Add Transaction
    </button>
  </div>
</div>

      {/* Add Transaction Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border
          border-gray-200 dark:border-gray-800 rounded-xl
          p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900
            dark:text-white mb-4">
            New Transaction
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              {(['expense','income','transfer'] as const)
                .map(t => (
                <button key={t} type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 py-2 rounded-lg
                    text-sm font-medium capitalize
                    transition border ${
                    form.type === t
                      ? TYPE_BG[t] + ' border-transparent'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>
                  {t === 'income' ? '↑ Income'
                    : t === 'expense' ? '↓ Expense'
                    : '⇄ Transfer'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">Account</label>
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
              <div>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">Amount (₹)</label>
                <input required type="number"
                  min="0.01" step="0.01"
                  value={form.amount}
                  onChange={e => setForm({
                    ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">Category</label>
                <select value={form.category}
                  onChange={e => setForm({
                    ...form, category: e.target.value })}
                  className={inputClass}>
                  {CATEGORIES[
                    form.type as keyof typeof CATEGORIES
                  ].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">Date</label>
                <input required type="date"
                  value={form.transactionDate}
                  onChange={e => setForm({
                    ...form,
                    transactionDate: e.target.value })}
                  className={inputClass} />
              </div>
              {form.type === 'transfer' && (
                <div>
                  <label className="block text-xs
                    font-medium text-gray-600
                    dark:text-gray-400 mb-1">
                    To Account
                  </label>
                  <select
                    value={form.transferToAccountId}
                    onChange={e => setForm({
                      ...form,
                      transferToAccountId: e.target.value
                    })}
                    className={inputClass}>
                    <option value="">
                      Select destination
                    </option>
                    {accounts
                      .filter(a => a.id !== form.accountId)
                      .map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div className={
                form.type === 'transfer' ? '' : 'col-span-2'
              }>
                <label className="block text-xs
                  font-medium text-gray-600
                  dark:text-gray-400 mb-1">
                  Description (optional)
                </label>
                <input type="text"
                  value={form.description}
                  onChange={e => setForm({
                    ...form, description: e.target.value })}
                  placeholder="e.g. Swiggy order..."
                  className={inputClass} />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500
                  hover:text-gray-700 px-4 py-2">
                Cancel
              </button>
              <button type="submit"
                className="bg-indigo-600 hover:bg-indigo-700
                  text-white text-sm font-medium px-6 py-2
                  rounded-lg transition">
                Save Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Search & Filter Bar ────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border
        border-gray-200 dark:border-gray-800 rounded-xl
        p-4 mb-4 shadow-sm">

        {/* Search Input */}
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2
              -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by description, category or account..."
              className="w-full pl-9 pr-4 py-2 border
                border-gray-300 dark:border-gray-700
                bg-white dark:bg-gray-800 text-gray-900
                dark:text-white rounded-lg text-sm
                focus:outline-none focus:ring-2
                focus:ring-indigo-500"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2
                  -translate-y-1/2 text-gray-400
                  hover:text-gray-600 text-lg leading-none">
                ×
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 rounded-lg text-sm
              font-medium border transition ${
              showAdvanced
                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}>
            Filters {hasActiveFilters ? '🔴' : ''}
          </button>

          {hasActiveFilters && (
            <button onClick={clearAllFilters}
              className="px-3 py-2 text-sm text-red-500
                hover:text-red-700 transition">
              Clear all
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-2 md:grid-cols-4
            gap-3 pt-3 border-t border-gray-100
            dark:border-gray-800">

            {/* Type */}
            <div>
              <label className="block text-xs
                text-gray-500 dark:text-gray-400 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={e => setFilters({
                  ...filters, type: e.target.value })}
                className={inputClass}>
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs
                text-gray-500 dark:text-gray-400 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={e => setFilters({
                  ...filters, category: e.target.value })}
                className={inputClass}>
                <option value="">All Categories</option>
                {[...CATEGORIES.income,
                  ...CATEGORIES.expense]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-xs
                text-gray-500 dark:text-gray-400 mb-1">
                From Date
              </label>
              <input type="date"
                value={filters.from}
                onChange={e => setFilters({
                  ...filters, from: e.target.value })}
                className={inputClass} />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-xs
                text-gray-500 dark:text-gray-400 mb-1">
                To Date
              </label>
              <input type="date"
                value={filters.to}
                onChange={e => setFilters({
                  ...filters, to: e.target.value })}
                className={inputClass} />
            </div>

            {/* Min Amount */}
            <div>
              <label className="block text-xs
                text-gray-500 dark:text-gray-400 mb-1">
                Min Amount (₹)
              </label>
              <input type="number" min="0"
                value={filters.minAmount || ''}
                onChange={e => setFilters({
                  ...filters,
                  minAmount: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined })}
                placeholder="0"
                className={inputClass} />
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-xs
                text-gray-500 dark:text-gray-400 mb-1">
                Max Amount (₹)
              </label>
              <input type="number" min="0"
                value={filters.maxAmount || ''}
                onChange={e => setFilters({
                  ...filters,
                  maxAmount: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined })}
                placeholder="Any"
                className={inputClass} />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs
                text-gray-500 dark:text-gray-400 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={e => setFilters({
                  ...filters, sortBy: e.target.value })}
                className={inputClass}>
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
              </select>
            </div>

            {/* Sort Direction */}
            <div>
              <label className="block text-xs
                text-gray-500 dark:text-gray-400 mb-1">
                Order
              </label>
              <select
                value={filters.sortDir}
                onChange={e => setFilters({
                  ...filters, sortDir: e.target.value })}
                className={inputClass}>
                <option value="desc">
                  Newest First
                </option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-900 border
        border-gray-200 dark:border-gray-800 rounded-xl
        shadow-sm overflow-hidden">

        {loading ? (
          <TransactionSkeleton count={5} />
        ) : transactions?.content.length === 0 ? (
          <div className="text-center py-16
            text-gray-400 dark:text-gray-600">
            <div className="text-4xl mb-3">
              {hasActiveFilters ? '🔍' : '💸'}
            </div>
            <p className="font-medium">
              {hasActiveFilters
                ? 'No transactions match your filters'
                : 'No transactions yet'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters}
                className="mt-3 text-sm text-indigo-500
                  hover:text-indigo-700">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50
            dark:divide-gray-800">
            {transactions?.content.map(tx => (
              <div key={tx.id}
                className="flex items-center
                  justify-between px-5 py-4
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  transition">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full
                    flex items-center justify-center
                    text-base ${TYPE_BG[
                      tx.type as keyof typeof TYPE_BG
                    ]}`}>
                    {tx.type === 'income' ? '↑'
                      : tx.type === 'expense' ? '↓'
                      : '⇄'}
                  </div>
                  <div>
                    <div className="text-sm font-medium
                      text-gray-900 dark:text-white">
                      {tx.description || tx.category}
                    </div>
                    <div className="text-xs
                      text-gray-400 dark:text-gray-500 mt-0.5">
                      {tx.accountName} · {tx.category}
                      · {tx.transactionDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`text-sm font-bold
                    ${TYPE_COLORS[
                      tx.type as keyof typeof TYPE_COLORS
                    ]}`}>
                    {tx.type === 'income' ? '+'
                      : tx.type === 'expense' ? '-' : ''}
                    {fmt(tx.amount)}
                  </div>
                  <button onClick={() => handleDelete(tx.id)}
                    className="text-gray-300 hover:text-red-500
                      dark:text-gray-700
                      dark:hover:text-red-400 transition">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {transactions && transactions.totalPages > 1 && (
          <div className="flex items-center justify-between
            px-5 py-3 border-t border-gray-100
            dark:border-gray-800">
            <button
              disabled={currentPage === 0}
              onClick={() =>
                setCurrentPage(p => Math.max(0, p - 1))}
              className="text-sm text-indigo-600
                dark:text-indigo-400 disabled:opacity-30
                disabled:cursor-not-allowed hover:underline">
              ← Previous
            </button>
            <span className="text-xs
              text-gray-500 dark:text-gray-400">
              Page {currentPage + 1} of{' '}
              {transactions.totalPages} ·{' '}
              {transactions.totalElements} transactions
            </span>
            <button
              disabled={transactions.last}
              onClick={() => setCurrentPage(p => p + 1)}
              className="text-sm text-indigo-600
                dark:text-indigo-400 disabled:opacity-30
                disabled:cursor-not-allowed hover:underline">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// import { useEffect, useState } from 'react'
// import { getAccountsApi, type Account } from '../../api/accountApi'
// import { TransactionSkeleton } from '../../components/ui/Skeleton'
// import { toast } from '../../components/ui/Toast'

// import {
//   getTransactionsApi,
//   createTransactionApi,
//   deleteTransactionApi,
//   type Transaction,
//   type PageResponse
// } from '../../api/transactionApi'

// const CATEGORIES = {
//   income:   ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'],
//   expense:  ['Food', 'Rent', 'Transport', 'Shopping', 'Healthcare',
//              'Entertainment', 'Education', 'Utilities', 'EMI', 'Other'],
//   transfer: ['Transfer']
// }

// const TYPE_COLORS = {
//   income:   'text-green-600 dark:text-green-400',
//   expense:  'text-red-500 dark:text-red-400',
//   transfer: 'text-blue-500 dark:text-blue-400'
// }

// const TYPE_BG = {
//   income:   'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
//   expense:  'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
//   transfer: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
// }

// export default function TransactionsPage() {
//   const [transactions, setTransactions] =
//     useState<PageResponse<Transaction> | null>(null)
//   const [accounts, setAccounts] = useState<Account[]>([])
//   const [showForm, setShowForm] = useState(false)
//   const [loading, setLoading] = useState(true)
//   const [filter, setFilter] = useState({ type: '', category: '' })
//   const [form, setForm] = useState({
//     accountId: '',
//     type: 'expense',
//     amount: '',
//     currency: 'INR',
//     category: 'Food',
//     description: '',
//     transactionDate: new Date().toISOString().split('T')[0],
//     transferToAccountId: ''
//   })

//   useEffect(() => {
//     fetchAll()
//   }, [filter])

//   const fetchAll = async () => {
//     setLoading(true)
//     try {
//       const [txRes, accRes] = await Promise.all([
//         getTransactionsApi({
//           ...(filter.type && { type: filter.type }),
//           ...(filter.category && { category: filter.category })
//         }),
//         getAccountsApi()
//       ])
//       setTransactions(txRes.data)
//       setAccounts(accRes.data)
//       if (accRes.data.length > 0 && !form.accountId) {
//         setForm(f => ({ ...f, accountId: accRes.data[0].id }))
//       }
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleTypeChange = (type: string) => {
//     const cats = CATEGORIES[type as keyof typeof CATEGORIES]
//     setForm(f => ({ ...f, type, category: cats[0] }))
//   }

// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault()
//   try {
//     await createTransactionApi({
//       accountId: form.accountId,
//       type: form.type,
//       amount: parseFloat(form.amount),
//       currency: form.currency,
//       category: form.category,
//       description: form.description,
//       transactionDate: form.transactionDate,
//       transferToAccountId: form.transferToAccountId || undefined
//     })
//     toast.success('Transaction added successfully!')
//     setShowForm(false)
//     setForm(f => ({
//       ...f,
//       amount: '',
//       description: '',
//       transactionDate: new Date().toISOString().split('T')[0]
//     }))
//     fetchAll()
//   } catch {
//     toast.error('Failed to add transaction. Please try again.')
//   }
// }

//   const handleDelete = async (id: string) => {
//   if (!confirm('Delete this transaction?')) return
//   try {
//     await deleteTransactionApi(id)
//     toast.success('Transaction deleted. Balance reversed.')
//     fetchAll()
//   } catch {
//     toast.error('Failed to delete transaction.')
//   }
// }

//   const fmt = (n: number) =>
//     '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })

//   return (
//     <div>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
//             Transactions
//           </h1>
//           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//             {transactions?.totalElements ?? 0} total transactions
//           </p>
//         </div>
//         <button
//           onClick={() => setShowForm(!showForm)}
//           className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
//         >
//           + Add Transaction
//         </button>
//       </div>

//       {/* Add Transaction Form */}
//       {showForm && (
//         <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
//           <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
//             New Transaction
//           </h2>
//           <form onSubmit={handleSubmit}>
//             {/* Type selector */}
//             <div className="flex gap-2 mb-4">
//               {(['expense', 'income', 'transfer'] as const).map(t => (
//                 <button
//                   key={t} type="button"
//                   onClick={() => handleTypeChange(t)}
//                   className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition border ${
//                     form.type === t
//                       ? TYPE_BG[t] + ' border-transparent'
//                       : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
//                   }`}
//                 >
//                   {t === 'income' ? '↑ Income' : t === 'expense' ? '↓ Expense' : '⇄ Transfer'}
//                 </button>
//               ))}
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               {/* Account */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
//                   Account
//                 </label>
//                 <select
//                   required value={form.accountId}
//                   onChange={e => setForm({ ...form, accountId: e.target.value })}
//                   className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 >
//                   <option value="">Select account</option>
//                   {accounts.map(a => (
//                     <option key={a.id} value={a.id}>{a.name}</option>
//                   ))}
//                 </select>
//               </div>

//               {/* Amount */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
//                   Amount (₹)
//                 </label>
//                 <input
//                   required type="number" min="0.01" step="0.01"
//                   value={form.amount}
//                   onChange={e => setForm({ ...form, amount: e.target.value })}
//                   placeholder="0.00"
//                   className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Category */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
//                   Category
//                 </label>
//                 <select
//                   value={form.category}
//                   onChange={e => setForm({ ...form, category: e.target.value })}
//                   className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 >
//                   {CATEGORIES[form.type as keyof typeof CATEGORIES].map(c => (
//                     <option key={c} value={c}>{c}</option>
//                   ))}
//                 </select>
//               </div>

//               {/* Date */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
//                   Date
//                 </label>
//                 <input
//                   required type="date"
//                   value={form.transactionDate}
//                   onChange={e => setForm({ ...form, transactionDate: e.target.value })}
//                   className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Transfer to account */}
//               {form.type === 'transfer' && (
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
//                     To Account
//                   </label>
//                   <select
//                     value={form.transferToAccountId}
//                     onChange={e => setForm({ ...form, transferToAccountId: e.target.value })}
//                     className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                   >
//                     <option value="">Select destination</option>
//                     {accounts
//                       .filter(a => a.id !== form.accountId)
//                       .map(a => (
//                         <option key={a.id} value={a.id}>{a.name}</option>
//                       ))}
//                   </select>
//                 </div>
//               )}

//               {/* Description */}
//               <div className={form.type === 'transfer' ? '' : 'col-span-2'}>
//                 <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
//                   Description (optional)
//                 </label>
//                 <input
//                   type="text"
//                   value={form.description}
//                   onChange={e => setForm({ ...form, description: e.target.value })}
//                   placeholder="e.g. Swiggy order, Monthly rent..."
//                   className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//             </div>

//             {/* Actions */}
//             <div className="flex gap-3 justify-end mt-4">
//               <button
//                 type="button" onClick={() => setShowForm(false)}
//                 className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition"
//               >
//                 Save Transaction
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="flex gap-3 mb-4">
//         <select
//           value={filter.type}
//           onChange={e => setFilter({ ...filter, type: e.target.value })}
//           className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
//         >
//           <option value="">All Types</option>
//           <option value="income">Income</option>
//           <option value="expense">Expense</option>
//           <option value="transfer">Transfer</option>
//         </select>

//         <select
//           value={filter.category}
//           onChange={e => setFilter({ ...filter, category: e.target.value })}
//           className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
//         >
//           <option value="">All Categories</option>
//           {[...CATEGORIES.income, ...CATEGORIES.expense].map(c => (
//             <option key={c} value={c}>{c}</option>
//           ))}
//         </select>

//         {(filter.type || filter.category) && (
//           <button
//             onClick={() => setFilter({ type: '', category: '' })}
//             className="text-sm text-red-500 hover:text-red-700 px-3"
//           >
//             Clear filters
//           </button>
//         )}
//       </div>

//       {/* Transaction List */}
//       <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
//        {loading ? (
//   <TransactionSkeleton count={5} />
// ) : transactions?.content.length === 0 ? (
//           <div className="text-center py-16 text-gray-400 dark:text-gray-600">
//             <div className="text-4xl mb-3">💸</div>
//             <p className="font-medium">No transactions yet</p>
//             <p className="text-sm mt-1">Add your first income or expense</p>
//           </div>
//         ) : (
//           <div className="divide-y divide-gray-50 dark:divide-gray-800">
//             {transactions?.content.map(tx => (
//               <div
//                 key={tx.id}
//                 className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
//               >
//                 <div className="flex items-center gap-4">
//                   {/* Icon */}
//                   <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base ${TYPE_BG[tx.type as keyof typeof TYPE_BG]}`}>
//                     {tx.type === 'income' ? '↑' : tx.type === 'expense' ? '↓' : '⇄'}
//                   </div>
//                   {/* Info */}
//                   <div>
//                     <div className="text-sm font-medium text-gray-900 dark:text-white">
//                       {tx.description || tx.category}
//                     </div>
//                     <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
//                       {tx.accountName} · {tx.category} · {tx.transactionDate}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-4">
//                   <div className={`text-sm font-bold ${TYPE_COLORS[tx.type as keyof typeof TYPE_COLORS]}`}>
//                     {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
//                     {fmt(tx.amount)}
//                   </div>
//                   <button
//                     onClick={() => handleDelete(tx.id)}
//                     className="text-gray-300 hover:text-red-500 dark:text-gray-700 dark:hover:text-red-400 transition text-sm"
//                   >
//                     ✕
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Pagination */}
//         {transactions && transactions.totalPages > 1 && (
//           <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
//             <span className="text-xs text-gray-500 dark:text-gray-400">
//               Page {transactions.page + 1} of {transactions.totalPages}
//             </span>
//             <span className="text-xs text-gray-500 dark:text-gray-400">
//               {transactions.totalElements} transactions total
//             </span>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }