import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { absoluteUrl, supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { PageSpinner } from '../components/Spinner'

type Mode = 'signIn' | 'signUp'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.7 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  )
}

export function Login() {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/me'

  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (loading) return <PageSpinner />
  if (user) return <Navigate to={from} replace />

  async function google() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: absoluteUrl(from) },
    })
    if (error) setError(t('common.error'))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    if (mode === 'signIn') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          error.code === 'email_not_confirmed'
            ? t('auth.emailNotConfirmed')
            : error.code === 'invalid_credentials'
              ? t('auth.invalidCredentials')
              : t('common.error'),
        )
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: absoluteUrl(from) },
      })
      if (error) setError(error.message || t('common.error'))
      else if (!data.session) setInfo(t('auth.confirmSent', { email }))
    }
    setBusy(false)
  }

  async function forgot() {
    setError(null)
    setInfo(null)
    if (!email) {
      setError(t('auth.enterEmailFirst'))
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: absoluteUrl('/reset-password') })
    setBusy(false)
    if (error) setError(t('common.error'))
    else setInfo(t('auth.resetSent', { email }))
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 sm:p-8">
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-ink/60 p-1">
          {(['signIn', 'signUp'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m)
                setError(null)
                setInfo(null)
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${mode === m ? 'bg-navy text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {t(m === 'signIn' ? 'auth.signIn' : 'auth.signUp')}
            </button>
          ))}
        </div>

        <button type="button" onClick={google} className="btn w-full bg-white py-3 text-slate-900 hover:bg-slate-200">
          <GoogleLogo /> {t('auth.google')}
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
          <span className="h-px flex-1 bg-white/10" /> {t('auth.or')} <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">{t('auth.email')}</label>
            <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              required
              minLength={mode === 'signUp' ? 8 : undefined}
              autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === 'signUp' && <p className="mt-1.5 text-xs text-slate-500">{t('auth.passwordHint')}</p>}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {info && <p className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-slate-100">{info}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            {t(mode === 'signIn' ? 'auth.submitSignIn' : 'auth.submitSignUp')}
          </button>
          {mode === 'signIn' && (
            <button type="button" onClick={forgot} disabled={busy} className="block w-full text-center text-sm text-slate-400 hover:text-white">
              {t('auth.forgot')}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
