import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginApi } from '../../api/authApi'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await loginApi(form)
      // Save token first
      login(res.data.token, res.data.email, res.data.fullName)
      // Then navigate
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Welcome back
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Sign in to your account
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <span className="btn-spinner" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}