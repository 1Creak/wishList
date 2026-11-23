import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IMAGE_BUCKET, supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { displayName } from '../lib/format'
import { one, type Item, type ProfileLite, type Reservation, type Wishlist } from '../lib/types'
import { ItemCard } from '../components/ItemCard'
import { ItemForm } from '../components/ItemForm'
import { WishlistForm } from '../components/WishlistForm'
import { ShareDialog } from '../components/ShareDialog'
import { Countdown } from '../components/Countdown'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { PageSpinner } from '../components/Spinner'

const PROFILE_FIELDS = 'id, username, display_name, avatar_url'
const ITEM_SELECT = `*, reservation:reservations(user_id, created_at, reserver:profiles(${PROFILE_FIELDS}))`

type RawItem = Omit<Item, 'reservation'> & {
  reservation: (Omit<Reservation, 'reserver'> & { reserver: ProfileLite | ProfileLite[] | null }) | unknown[] | null
}

function normalizeItem(raw: RawItem): Item {
  const r = one(raw.reservation as (Omit<Reservation, 'reserver'> & { reserver: ProfileLite | ProfileLite[] | null }) | null)
  return { ...raw, reservation: r ? { ...r, reserver: one(r.reserver) } : null }
}

type CardHandlers = Omit<Parameters<typeof ItemCard>[0], 'dragHandle'>

function SortableItem(props: CardHandlers) {
  const { t } = useI18n()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined }}
      className={`relative ${isDragging ? 'scale-[1.02] opacity-90' : ''}`}
    >
      <ItemCard
        {...props}
        dragHandle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={t('item.drag')}
            className="flex size-8 cursor-grab touch-none items-center justify-center rounded-lg bg-ink/60 text-slate-300 backdrop-blur hover:text-white active:cursor-grabbing"
          >
            <Icon name="grip" />
          </button>
        }
      />
    </div>
  )
}

export function WishlistPage() {
  const { id = '' } = useParams()
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()

  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [owner, setOwner] = useState<ProfileLite | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'notFound'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [editingList, setEditingList] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [itemForm, setItemForm] = useState<{ item?: Item } | null>(null)
  const [showArchive, setShowArchive] = useState(false)

  const load = useCallback(async () => {
    const [wl, its] = await Promise.all([
      supabase.from('wishlists').select(`*, owner:profiles(${PROFILE_FIELDS})`).eq('id', id).maybeSingle(),
      supabase
        .from('items')
        .select(ITEM_SELECT)
        .eq('wishlist_id', id)
        .order('position')
        .order('created_at'),
    ])
    if (!wl.data) {
      setStatus('notFound')
      return
    }
    const { owner: rawOwner, ...rest } = wl.data as Wishlist & { owner: ProfileLite | ProfileLite[] | null }
    setWishlist(rest)
    setOwner(one(rawOwner))
    setItems(((its.data ?? []) as RawItem[]).map(normalizeItem))
    setStatus('ok')
  }, [id])

  // Reload when the signed-in user changes: visibility and reservations depend on it.
  useEffect(() => {
    if (authLoading) return
    setStatus('loading')
    void load()
  }, [load, authLoading, user?.id])

  const isOwner = !!user && !!wishlist && user.id === wishlist.owner_id
  const active = useMemo(() => items.filter((i) => !i.received_at), [items])
  const archived = useMemo(
    () => items.filter((i) => i.received_at).sort((a, b) => (b.received_at ?? '').localeCompare(a.received_at ?? '')),
    [items],
  )
  const nextPosition = items.reduce((max, i) => Math.max(max, i.position), 0) + 1

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function onDragEnd(e: DragEndEvent) {
    const { active: a, over } = e
    if (!over || a.id === over.id) return
    const from = active.findIndex((i) => i.id === a.id)
    const to = active.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(active, from, to)
    const positions = new Map(reordered.map((it, idx) => [it.id, idx + 1]))
    setItems((prev) =>
      prev
        .map((it) => (positions.has(it.id) ? { ...it, position: positions.get(it.id)! } : it))
        .sort((x, y) => x.position - y.position),
    )
    const { error } = await supabase.rpc('reorder_items', { p_wishlist: id, p_ids: reordered.map((i) => i.id) })
    if (error) void load()
  }

  async function withBusy(itemId: string, fn: () => Promise<void>) {
    setBusyId(itemId)
    setMessage(null)
    try {
      await fn()
    } finally {
      setBusyId(null)
    }
  }

  const reserve = (item: Item) =>
    withBusy(item.id, async () => {
      const { error } = await supabase.from('reservations').insert({ item_id: item.id })
      if (error) setMessage(error.code === '23505' ? t('item.alreadyReserved') : t('common.error'))
      await load()
    })

  const cancelReservation = (item: Item) =>
    withBusy(item.id, async () => {
      await supabase.from('reservations').delete().eq('item_id', item.id).eq('user_id', user!.id)
      await load()
    })

  const toggleReceived = (item: Item) =>
    withBusy(item.id, async () => {
      const received_at = item.received_at ? null : new Date().toISOString()
      const { error } = await supabase.from('items').update({ received_at }).eq('id', item.id)
      if (error) setMessage(t('common.error'))
      await load()
    })

  const deleteItem = (item: Item) => {
    if (!confirm(t('item.deleteConfirm', { title: item.title }))) return
    void withBusy(item.id, async () => {
      const { error } = await supabase.from('items').delete().eq('id', item.id)
      if (error) setMessage(t('common.error'))
      else if (item.image_path) await supabase.storage.from(IMAGE_BUCKET).remove([item.image_path])
      await load()
    })
  }

  async function deleteWishlist() {
    if (!wishlist || !confirm(t('wl.deleteConfirm', { title: wishlist.title }))) return
    const paths = items.map((i) => i.image_path).filter((p): p is string => !!p)
    const { error } = await supabase.from('wishlists').delete().eq('id', wishlist.id)
    if (error) {
      setMessage(t('common.error'))
      return
    }
    if (paths.length) await supabase.storage.from(IMAGE_BUCKET).remove(paths)
    navigate('/me', { replace: true })
  }

  async function leave() {
    if (!wishlist || !user || !confirm(t('wl.leaveConfirm'))) return
    await supabase.from('wishlist_members').delete().eq('wishlist_id', wishlist.id).eq('user_id', user.id)
    navigate('/me', { replace: true })
  }

  if (status === 'loading' || authLoading) return <PageSpinner />

  if (status === 'notFound' || !wishlist) {
    return (
      <div className="card mx-auto max-w-md space-y-5 p-8 text-center">
        <Icon name="lock" className="mx-auto size-10 text-accent" />
        <p className="text-slate-300">{t('wl.notFound')}</p>
        {!user && (
          <>
            <p className="text-sm text-slate-400">{t('wl.loginToSee')}</p>
            <Link to="/login" state={{ from: location.pathname }} className="btn-primary">
              {t('nav.login')}
            </Link>
          </>
        )}
      </div>
    )
  }

  const cardProps = (item: Item): CardHandlers => ({
    item,
    isOwner,
    currentUserId: user?.id ?? null,
    busy: busyId === item.id,
    onEdit: () => setItemForm({ item }),
    onDelete: () => deleteItem(item),
    onToggleReceived: () => void toggleReceived(item),
    onReserve: () => void reserve(item),
    onCancelReservation: () => void cancelReservation(item),
  })

  return (
    <div className="space-y-10">
      {/* header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{wishlist.title}</h1>
              {wishlist.is_private && (
                <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-slate-300">
                  <Icon name="lock" className="size-3" /> {t('common.private')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {owner && !isOwner && (
                <Link to={`/u/${owner.username}`} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
                  <Avatar profile={owner} size={24} /> {displayName(owner)}
                </Link>
              )}
              {wishlist.event_date && <Countdown date={wishlist.event_date} />}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner ? (
              <>
                <button type="button" onClick={() => setItemForm({})} className="btn-primary">
                  <Icon name="plus" /> {t('wl.addItem')}
                </button>
                <button type="button" onClick={() => setSharing(true)} className="btn-secondary">
                  <Icon name="share" /> {t('wl.share')}
                </button>
                <button type="button" onClick={() => setEditingList(true)} className="btn-ghost px-3" aria-label={t('common.edit')}>
                  <Icon name="edit" />
                </button>
                <button type="button" onClick={deleteWishlist} className="btn-ghost px-3 hover:text-red-400" aria-label={t('common.delete')}>
                  <Icon name="trash" />
                </button>
              </>
            ) : (
              user &&
              wishlist.is_private && (
                <button type="button" onClick={leave} className="btn-ghost text-xs">
                  {t('wl.leave')}
                </button>
              )
            )}
          </div>
        </div>
        {wishlist.description && <p className="max-w-3xl whitespace-pre-line text-slate-300">{wishlist.description}</p>}
        {message && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{message}</p>}
      </header>

      {/* active items */}
      {active.length === 0 ? (
        isOwner ? (
          <button
            type="button"
            onClick={() => setItemForm({})}
            className="card flex w-full flex-col items-center gap-3 border-dashed p-14 text-slate-400 transition hover:border-accent/50 hover:text-white"
          >
            <Icon name="plus" className="size-10 text-accent" />
            {t('wl.emptyOwner')}
          </button>
        ) : (
          <p className="card p-10 text-center text-slate-400">{t('wl.empty')}</p>
        )
      ) : isOwner ? (
        <div className="space-y-3">
          {active.length > 1 && <p className="text-xs text-slate-500">{t('wl.dragHint')}</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={active.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((item) => (
                  <SortableItem key={item.id} {...cardProps(item)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((item) => (
            <ItemCard key={item.id} {...cardProps(item)} />
          ))}
        </div>
      )}

      {/* archive */}
      {archived.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowArchive((v) => !v)}
            className="btn-ghost -ml-2 mb-4 px-2 text-base"
          >
            <Icon name="archive" />
            {t('wl.archive')} ({archived.length})
            <span className={`transition ${showArchive ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {showArchive && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {archived.map((item) => (
                <ItemCard key={item.id} {...cardProps(item)} />
              ))}
            </div>
          )}
        </section>
      )}

      {editingList && (
        <WishlistForm
          wishlist={wishlist}
          onClose={() => setEditingList(false)}
          onSaved={(w) => {
            setWishlist(w)
            setEditingList(false)
          }}
        />
      )}
      {sharing && <ShareDialog wishlist={wishlist} onClose={() => setSharing(false)} />}
      {itemForm && (
        <ItemForm
          wishlistId={wishlist.id}
          item={itemForm.item}
          nextPosition={nextPosition}
          onClose={() => setItemForm(null)}
          onSaved={() => {
            setItemForm(null)
            void load()
          }}
        />
      )}
    </div>
  )
}
