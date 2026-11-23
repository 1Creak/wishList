import { Link } from 'react-router'
import { useAuth } from '../lib/auth'
import { useI18n, type TKey } from '../lib/i18n'
import { RARITIES } from '../lib/rarity'
import { Icon, type IconName } from '../components/Icon'

const FEATURES: { icon: IconName; title: TKey; text: TKey }[] = [
  { icon: 'sparkles', title: 'home.f1.title', text: 'home.f1.text' },
  { icon: 'eyeOff', title: 'home.f2.title', text: 'home.f2.text' },
  { icon: 'lock', title: 'home.f3.title', text: 'home.f3.text' },
]

export function Home() {
  const { user } = useAuth()
  const { t } = useI18n()

  return (
    <div className="space-y-20 py-6 sm:py-12">
      <section className="mx-auto max-w-3xl text-center">
        <div className="mb-6 flex justify-center gap-1.5">
          {RARITIES.map((r) => (
            <span key={r.level} className="h-1.5 w-8 rounded-full" style={{ backgroundColor: r.color, boxShadow: `0 0 12px ${r.color}` }} />
          ))}
        </div>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          {t('home.title')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">{t('home.subtitle')}</p>
        <div className="mt-10 flex justify-center">
          <Link to={user ? '/me' : '/login'} className="btn-primary px-6 py-3 text-base">
            <Icon name="gift" className="size-5" />
            {user ? t('nav.myLists') : t('home.cta')}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Icon name={f.icon} className="size-5" />
            </span>
            <h2 className="mb-2 text-lg font-bold">{t(f.title)}</h2>
            <p className="text-sm text-slate-400">{t(f.text)}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
