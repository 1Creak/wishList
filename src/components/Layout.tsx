import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { useI18n, type Lang } from '../lib/i18n'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

function LangSwitch() {
  const { lang, setLang } = useI18n()
  const options: Lang[] = ['uk', 'en']
  return (
    <div className="flex rounded-lg border border-white/10 bg-ink/40 p-0.5 text-xs font-bold">
      {options.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`rounded-md px-2 py-1 transition ${lang === l ? 'bg-navy text-white' : 'text-slate-400 hover:text-white'}`}
        >
          {l === 'uk' ? 'UA' : 'EN'}
        </button>
      ))}
    </div>
  )
}

function UserMenu() {
  const { profile, signOut } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!profile) return null

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center rounded-full" aria-label="menu">
        <Avatar profile={profile} size={34} />
      </button>
      {open && (
        <div className="card absolute right-0 z-40 mt-2 w-56 overflow-hidden p-1.5 shadow-2xl">
          <div className="truncate px-3 py-2 text-xs text-slate-400">@{profile.username}</div>
          <Link to={`/u/${profile.username}`} className="btn-ghost w-full justify-start">
            <Icon name="user" /> {t('nav.profile')}
          </Link>
          <Link to="/settings" className="btn-ghost w-full justify-start">
            <Icon name="settings" /> {t('nav.settings')}
          </Link>
          <button
            type="button"
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
            className="btn-ghost w-full justify-start"
          >
            <Icon name="logout" /> {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  )
}

export function Layout() {
  const { user, loading } = useAuth()
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Icon name="gift" className="size-5" />
            </span>
            <span>
              wish<span className="text-accent">list</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            {user && (
              <Link to="/me" className="btn-ghost hidden sm:inline-flex">
                {t('nav.myLists')}
              </Link>
            )}
            <LangSwitch />
            {!loading && (user ? <UserMenu /> : <Link to="/login" className="btn-primary py-2">{t('nav.login')}</Link>)}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        wishlist · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
