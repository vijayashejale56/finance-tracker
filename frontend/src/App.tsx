import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import DashboardPage from './features/dashboard/DashboardPage'
import AccountsPage from './features/accounts/AccountsPage'
import TransactionsPage from './features/transactions/TransactionsPage'
import AnalyticsPage from './features/analytics/AnalyticsPage'
import ProfilePage from './features/profile/ProfilePage'
import BudgetPage from './features/budget/BudgetPage'
import GoalsPage from "./features/goals/GoalPage"
import RecurringPage from './features/recurring/RecurringPage'

import Layout from './components/ui/Layout'
import PWAInstallPrompt from './components/ui/PWAInstallPrompt'
import ProtectedRoute from './routes/ProtectedRoute'



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no login needed */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — needs login, all share Layout */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard"     element={<DashboardPage />} />
          <Route path="/accounts"      element={<AccountsPage />} />
          <Route path="/transactions"  element={<TransactionsPage />} />
          <Route path="/analytics"     element={<AnalyticsPage />} />
          <Route path="/profile"       element={<ProfilePage />} />
          <Route path="/budget"        element={<BudgetPage />} />
          <Route path="/goals"          element={<GoalsPage />} />
          <Route path="/recurring"      element={<RecurringPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <PWAInstallPrompt />
    </BrowserRouter>
  )
}