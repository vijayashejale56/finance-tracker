import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import ToastContainer from './Toast'
import { logoutApi } from '../../api/authApi'

const navItems = [
  { path: '/dashboard',    label: 'Dashboard',    icon: '🏠' },
  { path: '/accounts',     label: 'Accounts',     icon: '🏦' },
  { path: '/transactions', label: 'Transactions', icon: '💸' },
  { path: '/analytics',    label: 'Analytics',    icon: '📊' },
  { path: '/budget',       label: 'Budget',       icon: '💰' },
  { path: '/profile',      label: 'Profile',      icon: '👤' },
  { path: '/goals',        label: 'Goals',        icon: '🎯' },
  { path: '/recurring', label: 'Recurring', icon: '🔄' },
]

export default function Layout() {
  const { fullName, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains('dark'))
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu when route changes
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setDark(prev => !prev)
  }

  const handleLogout = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      await logoutApi(refreshToken)
    }
  } catch {
    // Ignore logout errors
  } finally {
    logout()
    navigate('/login')
  }
}

  // const handleLogout = () => {
  //   logout()
  //   navigate('/login')
  // }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <ToastContainer />

      {/* Top Navbar */}
      <nav className={`bg-white dark:bg-gray-900 sticky top-0 z-50 transition-shadow ${
        scrolled
          ? 'shadow-md border-b border-gray-200 dark:border-gray-800'
          : 'border-b border-gray-200 dark:border-gray-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center h-16 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
              FT
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm hidden sm:block">
              FinanceTracker
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right Controls */}
          <div className="ml-auto flex items-center gap-2">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle theme"
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {fullName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block max-w-24 truncate">
                  {fullName?.split(' ')[0]}
                </span>
                <span className="text-gray-400 text-xs hidden sm:block">▾</span>
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-12 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {fullName}
                      </p>
                    </div>
                    <NavLink
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      👤 My Profile
                    </NavLink>
                    <hr className="my-1 border-gray-100 dark:border-gray-800"/>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav md:hidden">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}