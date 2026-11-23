import { Link } from 'react-router'
import { useI18n } from '../lib/i18n'

export function NotFound() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <p className="text-7xl font-extrabold text-accent">404</p>
      <h1 className="text-2xl font-bold">{t('notFound.title')}</h1>
      <Link to="/" className="btn-secondary">{t('notFound.home')}</Link>
    </div>
  )
}
