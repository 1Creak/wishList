export type ProfileLite = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export type Profile = ProfileLite & { created_at: string }

export type Wishlist = {
  id: string
  owner_id: string
  title: string
  description: string | null
  is_private: boolean
  event_date: string | null
  created_at: string
}

export type Reservation = {
  user_id: string
  created_at: string
  reserver: ProfileLite | null
}

export type Item = {
  id: string
  wishlist_id: string
  title: string
  url: string | null
  price: number | null
  image_path: string | null
  rarity: number
  note: string | null
  position: number
  received_at: string | null
  created_at: string
  reservation: Reservation | null
}

/** PostgREST may return a 1:1 embed either as an object or as an array. */
export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}
