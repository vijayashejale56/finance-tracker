import { useEffect, useState } from 'react'
import {
  getProfileApi,
  updateProfileApi,
  changePasswordApi,
  getUserStatsApi,
  type UserProfile,
  type UserStats
} from '../../api/userApi'
// import { useAuthStore } from '../../store/authStore'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD']

export default function ProfilePage() {
  // const { fullName: storeFullName } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: '', currency: 'INR'
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Show/hide password fields
  const [showPasswords, setShowPasswords] = useState(false)

  useEffect(() => {
    Promise.all([getProfileApi(), getUserStatsApi()])
      .then(([profileRes, statsRes]) => {
        setProfile(profileRes.data)
        setStats(statsRes.data)
        setProfileForm({
          fullName: profileRes.data.fullName,
          currency: profileRes.data.currency
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg('')
    setProfileError('')
    try {
      const res = await updateProfileApi(profileForm)
      setProfile(res.data)
      // Update name in navbar
      localStorage.setItem('fullName', res.data.fullName)
      setProfileMsg('Profile updated successfully!')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch {
      setProfileError('Failed to update profile. Please try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg('')
    setPasswordError('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    setPasswordSaving(true)
    try {
      await changePasswordApi({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setPasswordForm({
        currentPassword: '', newPassword: '', confirmPassword: ''
      })
      setPasswordMsg('Password changed successfully!')
      setShowPasswords(false)
      setTimeout(() => setPasswordMsg(''), 3000)
    } catch {
      setPasswordError('Current password is incorrect')
    } finally {
      setPasswordSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i}
            className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"/>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm mb-6">

        {/* Avatar + Info */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {profile?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {profile?.fullName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile?.email}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
                {stats?.totalAccounts} accounts
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Member since {stats?.memberSince
                  ? formatDate(stats.memberSince)
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Edit Profile
        </h3>

        {profileMsg && (
          <div className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg mb-4">
            ✅ {profileMsg}
          </div>
        )}
        {profileError && (
          <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            ❌ {profileError}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text" required
              value={profileForm.fullName}
              onChange={e => setProfileForm({
                ...profileForm, fullName: e.target.value
              })}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email" disabled value={profile?.email}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Currency
            </label>
            <select
              value={profileForm.currency}
              onChange={e => setProfileForm({
                ...profileForm, currency: e.target.value
              })}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit" disabled={profileSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Change Password
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Use a strong password with at least 8 characters
            </p>
          </div>
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {showPasswords ? 'Cancel' : 'Change'}
          </button>
        </div>

        {passwordMsg && (
          <div className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg mb-4">
            ✅ {passwordMsg}
          </div>
        )}
        {passwordError && (
          <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            ❌ {passwordError}
          </div>
        )}

        {showPasswords && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password" required
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({
                  ...passwordForm, currentPassword: e.target.value
                })}
                placeholder="Enter current password"
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password" required
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({
                  ...passwordForm, newPassword: e.target.value
                })}
                placeholder="Minimum 8 characters"
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password" required
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({
                  ...passwordForm, confirmPassword: e.target.value
                })}
                placeholder="Repeat new password"
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit" disabled={passwordSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
              >
                {passwordSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-1">
          Danger Zone
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          These actions are permanent and cannot be undone
        </p>
        <button
          onClick={() => alert('Contact support to delete your account')}
          className="text-sm border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 px-4 py-2 rounded-lg transition"
        >
          Delete Account
        </button>
      </div>

    </div>
  )
}