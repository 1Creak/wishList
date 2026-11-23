import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set (see .env.example)')
}

export const supabase = createClient(url, key)

export const IMAGE_BUCKET = 'item-images'

export function imageUrl(path: string): string {
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Absolute URL of the site root, e.g. https://1creak.github.io/wishList/ */
export const SITE_URL = window.location.origin + import.meta.env.BASE_URL

/** Absolute URL for an in-app path like "/w/123". */
export function absoluteUrl(path: string): string {
  return SITE_URL + path.replace(/^\//, '')
}
