import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { PageSpinner } from '../components/Spinner'

export function InvitePage() {
  const { token = '' } = useParams()
  const { user, loading } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (loading || !user || started.current) return
    started.current = true
    supabase.rpc('accept_invite', { p_token: token }).then(({ data, error }) => {
      if (error || !data) setFailed(true)
      else navigate(`/w/${data as string}`, { replace: true })
    })
  }, [loading, user, token, navigate])

  if (loading) return <PageSpinner />

  if (!user) {
    return (
      <div className="card mx-auto max-w-md space-y-5 p-8 text-center">
        <p className="text-slate-300">{t('invite.loginFirst')}</p>
        <Link to="/login" state={{ from: location.pathname }} className="btn-primary">
          {t('nav.login')}
        </Link>
      </div>
    )
  }

  if (failed) return <div className="card mx-auto max-w-md p-8 text-center text-slate-300">{t('invite.invalid')}</div>

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
      <PageSpinner />
      {t('invite.joining')}
    </div>
  )
}
