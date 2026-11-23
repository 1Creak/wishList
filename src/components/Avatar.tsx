import type { ProfileLite } from '../lib/types'
import { displayName } from '../lib/format'

export function Avatar({ profile, size = 32 }: { profile: Pick<ProfileLite, 'avatar_url' | 'display_name' | 'username'>; size?: number }) {
  const name = displayName(profile)
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) }
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={name}
        style={style}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover ring-1 ring-white/15"
      />
    )
  }
  return (
    <span
      style={style}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-navy font-bold uppercase text-accent ring-1 ring-white/15"
    >
      {name.slice(0, 1)}
    </span>
  )
}
