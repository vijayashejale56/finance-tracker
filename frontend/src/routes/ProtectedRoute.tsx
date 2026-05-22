import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({
  children
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuthStore()

  // If not authenticated → redirect to login
  // The store already checked if token is expired on app load
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}