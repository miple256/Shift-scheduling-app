import { Navigate, Outlet, RouterProvider, createBrowserRouter, useNavigate } from 'react-router'
import App, { AuthView } from './App'
import { useAuth } from './hooks/useAuth'

function AuthPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/" replace />
  return (
    <div className="flex justify-center bg-gray-200 min-h-screen">
      <div className="relative w-full bg-white flex flex-col overflow-hidden" style={{ maxWidth: 430, minHeight: '100dvh' }}>
        <AuthView onAuth={() => navigate('/', { replace: true })} />
      </div>
    </div>
  )
}

function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function LoadingScreen() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">読み込み中...</div>
}

const router = createBrowserRouter([
  { path: '/login', Component: AuthPage },
  { path: '/signup', Component: AuthPage },
  { path: '/password-reset', Component: AuthPage },
  {
    Component: RequireAuth,
    children: [
      { path: '/', Component: App },
      { path: '/calendar', Component: App },
      { path: '/calendar/entry', Component: App },
      { path: '/calendar/swap', Component: App },
      { path: '/settings/mypage', Component: App },
      { path: '/settings/income', Component: App },
      { path: '/settings/help', Component: App },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
