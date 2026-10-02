import { authClient } from '../lib/auth-client'

export function useAuth() {
  const { data: session, isPending, error, refetch } = authClient.useSession()
  return {
    user: session?.user ?? null,
    session,
    loading: isPending,
    error,
    refetch,
    signOut: authClient.signOut,
  }
}
