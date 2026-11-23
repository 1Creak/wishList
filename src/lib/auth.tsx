import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from './types'

type Auth = {
  session: Session | null
  user: User | null
  profile: Profile | null
  /** true until the initial session (and profile, if signed in) is known */
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setSessionReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id ?? null

  const loadProfile = useCallback(async (id: string | null) => {
    if (!id) {
      setProfile(null)
      setProfileReady(true)
      return
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    setProfile((data as Profile | null) ?? null)
    setProfileReady(true)
  }, [])

  useEffect(() => {
    if (!sessionReady) return
    setProfileReady(false)
    void loadProfile(userId)
  }, [sessionReady, userId, loadProfile])

  const value = useMemo<Auth>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading: !sessionReady || !profileReady,
      refreshProfile: () => loadProfile(userId),
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, profile, sessionReady, profileReady, loadProfile, userId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
