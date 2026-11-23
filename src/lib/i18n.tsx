import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'uk' | 'en'

const uk = {
  'nav.myLists': 'Мої списки',
  'nav.login': 'Увійти',
  'nav.logout': 'Вийти',
  'nav.profile': 'Мій профіль',
  'nav.settings': 'Налаштування',

  'home.title': 'Список бажань, який не зіпсує сюрприз',
  'home.subtitle':
    'Створюйте вішлісти, позначайте рідкісність бажань і діліться з друзями. Друзі бронюють подарунки — а ви не знаєте, хто і що.',
  'home.cta': 'Створити вішліст',
  'home.f1.title': 'Рідкісність бажань',
  'home.f1.text': 'Від звичайного до міфічного — друзі одразу бачать, що для вас найважливіше.',
  'home.f2.title': 'Таємне бронювання',
  'home.f2.text': 'Друзі бачать, хто що забронював, а ви — ні. Жодних дублікатів і зіпсованих сюрпризів.',
  'home.f3.title': 'Приватні списки',
  'home.f3.text': 'Відкривайте список лише тим, кому надіслали запрошення.',

  'auth.signIn': 'Вхід',
  'auth.signUp': 'Реєстрація',
  'auth.google': 'Продовжити з Google',
  'auth.or': 'або',
  'auth.email': 'Email',
  'auth.password': 'Пароль',
  'auth.passwordHint': 'Мінімум 8 символів',
  'auth.submitSignIn': 'Увійти',
  'auth.submitSignUp': 'Зареєструватися',
  'auth.forgot': 'Забули пароль?',
  'auth.enterEmailFirst': 'Введіть email, щоб відновити пароль.',
  'auth.resetSent': 'Ми надіслали лист для відновлення пароля на {email}.',
  'auth.confirmSent': 'Майже готово! Підтвердіть email — ми надіслали лист на {email}.',
  'auth.invalidCredentials': 'Невірний email або пароль.',
  'auth.emailNotConfirmed': 'Спершу підтвердіть email — перевірте пошту.',
  'auth.newPassword': 'Новий пароль',
  'auth.savePassword': 'Зберегти пароль',
  'auth.resetInvalid': 'Посилання недійсне або застаріле. Спробуйте відновити пароль ще раз.',

  'common.save': 'Зберегти',
  'common.cancel': 'Скасувати',
  'common.delete': 'Видалити',
  'common.edit': 'Редагувати',
  'common.close': 'Закрити',
  'common.copy': 'Копіювати',
  'common.copied': 'Скопійовано!',
  'common.error': 'Щось пішло не так. Спробуйте ще раз.',
  'common.private': 'Приватний',
  'common.saved': 'Збережено!',

  'dash.title': 'Мої списки',
  'dash.create': 'Новий список',
  'dash.empty': 'У вас ще немає списків. Створіть перший!',
  'dash.shared': 'Доступні мені',
  'plural.wishes': 'бажання|бажання|бажань',

  'wlForm.new': 'Новий список',
  'wlForm.edit': 'Редагувати список',
  'wlForm.title': 'Назва',
  'wlForm.titlePlaceholder': 'Мій день народження',
  'wlForm.description': 'Опис',
  'wlForm.eventDate': 'Дата події',
  'wlForm.private': 'Приватний список',
  'wlForm.privateHint': 'Бачать лише ті, кого ви запросили',

  'wl.addItem': 'Додати бажання',
  'wl.share': 'Поділитися',
  'wl.deleteConfirm': 'Видалити список «{title}» разом з усіма бажаннями?',
  'wl.empty': 'Тут поки порожньо.',
  'wl.emptyOwner': 'Додайте перше бажання!',
  'wl.archive': 'Отримані',
  'wl.notFound': 'Список не знайдено або він приватний.',
  'wl.loginToSee': 'Якщо у вас є запрошення — увійдіть.',
  'wl.leave': 'Покинути список',
  'wl.leaveConfirm': 'Покинути цей список? Повернутися можна лише за новим запрошенням.',
  'wl.dragHint': 'Перетягуйте картки за ⠿, щоб змінити порядок',

  'countdown.today': 'Сьогодні!',
  'countdown.in': 'Через {n} {days}',
  'countdown.past': 'Подія минула',
  'plural.days': 'день|дні|днів',

  'itemForm.new': 'Нове бажання',
  'itemForm.edit': 'Редагувати бажання',
  'itemForm.title': 'Назва',
  'itemForm.url': 'Посилання на товар',
  'itemForm.urlInvalid': 'Посилання має починатися з http:// або https://',
  'itemForm.price': 'Ціна, ₴',
  'itemForm.rarity': 'Рідкісність',
  'itemForm.note': 'Коментар',
  'itemForm.notePlaceholder': 'Розмір, колір, модель…',
  'itemForm.image': 'Фото',

  'item.reserve': 'Забронювати',
  'item.cancelReserve': 'Скасувати бронь',
  'item.reservedByMe': 'Ви забронювали',
  'item.reservedBy': 'Забронював(ла) {name}',
  'item.loginToReserve': 'Увійдіть, щоб забронювати',
  'item.alreadyReserved': 'Цей подарунок уже забронювали.',
  'item.markReceived': 'Отримав(ла)',
  'item.unarchive': 'Повернути в список',
  'item.deleteConfirm': 'Видалити «{title}»?',
  'item.open': 'Відкрити',
  'item.drag': 'Перетягнути',
  'item.received': 'Отримано',

  'rarity.1': 'Звичайне',
  'rarity.2': 'Рідкісне',
  'rarity.3': 'Епічне',
  'rarity.4': 'Легендарне',
  'rarity.5': 'Міфічне',

  'image.choose': 'Обрати фото',
  'image.replace': 'Змінити',
  'image.remove': 'Прибрати',
  'image.processing': 'Обробка…',
  'image.hint': 'JPEG, PNG або WebP · до 5 МБ · до 3000×3000 px',
  'image.err.type': 'Підтримуються лише JPEG, PNG і WebP.',
  'image.err.size': 'Файл завеликий — максимум 5 МБ.',
  'image.err.dimensions': 'Завелике зображення — максимум 3000×3000 px.',
  'image.err.decode': 'Не вдалося прочитати зображення.',
  'image.err.encode': 'Не вдалося стиснути зображення.',
  'image.err.upload': 'Не вдалося завантажити фото.',

  'share.title': 'Поділитися списком',
  'share.publicLink': 'Посилання на список',
  'share.publicHint': 'Будь-хто з посиланням може переглянути список.',
  'share.inviteLink': 'Посилання-запрошення',
  'share.inviteHint': 'Хто відкриє це посилання й увійде — отримає доступ до списку.',
  'share.regenerate': 'Створити нове посилання',
  'share.regenerateConfirm': 'Старе посилання перестане працювати. Продовжити?',
  'share.members': 'Учасники',
  'share.noMembers': 'Ще ніхто не приєднався.',
  'share.removeMember': 'Прибрати',
  'share.removeConfirm': 'Прибрати {name} зі списку?',

  'invite.joining': 'Приєднуємось до списку…',
  'invite.invalid': 'Запрошення недійсне або застаріле.',
  'invite.loginFirst': 'Увійдіть, щоб прийняти запрошення до списку.',

  'profile.lists': 'Списки',
  'profile.empty': 'Тут поки немає доступних списків.',
  'profile.notFound': 'Користувача не знайдено.',

  'settings.title': 'Налаштування',
  'settings.username': "Ім'я користувача",
  'settings.usernameHint': 'Використовується в посиланні на профіль',
  'settings.usernameInvalid': 'Лише латиниця в нижньому регістрі, цифри та _, від 3 до 30 символів.',
  'settings.usernameTaken': "Це ім'я вже зайняте.",
  'settings.displayName': "Ім'я",

  'notFound.title': 'Сторінку не знайдено',
  'notFound.home': 'На головну',
}

export type TKey = keyof typeof uk

const en: Record<TKey, string> = {
  'nav.myLists': 'My lists',
  'nav.login': 'Sign in',
  'nav.logout': 'Sign out',
  'nav.profile': 'My profile',
  'nav.settings': 'Settings',

  'home.title': "A wishlist that won't spoil the surprise",
  'home.subtitle':
    'Create wishlists, tag how rare each wish is and share them with friends. Friends reserve gifts — and you never know who picked what.',
  'home.cta': 'Create a wishlist',
  'home.f1.title': 'Wish rarity',
  'home.f1.text': 'From common to mythic — friends instantly see what matters most to you.',
  'home.f2.title': 'Secret reservations',
  'home.f2.text': 'Friends see who reserved what, you don’t. No duplicate gifts, no spoiled surprises.',
  'home.f3.title': 'Private lists',
  'home.f3.text': 'Open a list only to people you have invited.',

  'auth.signIn': 'Sign in',
  'auth.signUp': 'Sign up',
  'auth.google': 'Continue with Google',
  'auth.or': 'or',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.passwordHint': 'At least 8 characters',
  'auth.submitSignIn': 'Sign in',
  'auth.submitSignUp': 'Create account',
  'auth.forgot': 'Forgot password?',
  'auth.enterEmailFirst': 'Enter your email to reset the password.',
  'auth.resetSent': 'We sent a password reset link to {email}.',
  'auth.confirmSent': 'Almost done! Confirm your email — we sent a link to {email}.',
  'auth.invalidCredentials': 'Wrong email or password.',
  'auth.emailNotConfirmed': 'Please confirm your email first — check your inbox.',
  'auth.newPassword': 'New password',
  'auth.savePassword': 'Save password',
  'auth.resetInvalid': 'The link is invalid or expired. Please request a new one.',

  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.copy': 'Copy',
  'common.copied': 'Copied!',
  'common.error': 'Something went wrong. Please try again.',
  'common.private': 'Private',
  'common.saved': 'Saved!',

  'dash.title': 'My lists',
  'dash.create': 'New list',
  'dash.empty': "You don't have any lists yet. Create the first one!",
  'dash.shared': 'Shared with me',
  'plural.wishes': 'wish|wishes',

  'wlForm.new': 'New list',
  'wlForm.edit': 'Edit list',
  'wlForm.title': 'Title',
  'wlForm.titlePlaceholder': 'My birthday',
  'wlForm.description': 'Description',
  'wlForm.eventDate': 'Event date',
  'wlForm.private': 'Private list',
  'wlForm.privateHint': 'Only people you invite can see it',

  'wl.addItem': 'Add a wish',
  'wl.share': 'Share',
  'wl.deleteConfirm': 'Delete the list “{title}” with all its wishes?',
  'wl.empty': 'Nothing here yet.',
  'wl.emptyOwner': 'Add your first wish!',
  'wl.archive': 'Received',
  'wl.notFound': 'List not found or it is private.',
  'wl.loginToSee': 'If you have an invite — sign in.',
  'wl.leave': 'Leave list',
  'wl.leaveConfirm': 'Leave this list? You can only come back with a new invite.',
  'wl.dragHint': 'Drag cards by ⠿ to reorder',

  'countdown.today': 'Today!',
  'countdown.in': 'In {n} {days}',
  'countdown.past': 'Event has passed',
  'plural.days': 'day|days',

  'itemForm.new': 'New wish',
  'itemForm.edit': 'Edit wish',
  'itemForm.title': 'Title',
  'itemForm.url': 'Product link',
  'itemForm.urlInvalid': 'The link must start with http:// or https://',
  'itemForm.price': 'Price, ₴',
  'itemForm.rarity': 'Rarity',
  'itemForm.note': 'Note',
  'itemForm.notePlaceholder': 'Size, colour, model…',
  'itemForm.image': 'Photo',

  'item.reserve': 'Reserve',
  'item.cancelReserve': 'Cancel reservation',
  'item.reservedByMe': 'You reserved this',
  'item.reservedBy': 'Reserved by {name}',
  'item.loginToReserve': 'Sign in to reserve',
  'item.alreadyReserved': 'This gift has already been reserved.',
  'item.markReceived': 'Received',
  'item.unarchive': 'Back to the list',
  'item.deleteConfirm': 'Delete “{title}”?',
  'item.open': 'Open',
  'item.drag': 'Drag',
  'item.received': 'Received',

  'rarity.1': 'Common',
  'rarity.2': 'Rare',
  'rarity.3': 'Epic',
  'rarity.4': 'Legendary',
  'rarity.5': 'Mythic',

  'image.choose': 'Choose photo',
  'image.replace': 'Replace',
  'image.remove': 'Remove',
  'image.processing': 'Processing…',
  'image.hint': 'JPEG, PNG or WebP · up to 5 MB · up to 3000×3000 px',
  'image.err.type': 'Only JPEG, PNG and WebP are supported.',
  'image.err.size': 'File is too large — 5 MB max.',
  'image.err.dimensions': 'Image is too large — 3000×3000 px max.',
  'image.err.decode': 'Could not read the image.',
  'image.err.encode': 'Could not compress the image.',
  'image.err.upload': 'Could not upload the photo.',

  'share.title': 'Share list',
  'share.publicLink': 'List link',
  'share.publicHint': 'Anyone with the link can view the list.',
  'share.inviteLink': 'Invite link',
  'share.inviteHint': 'Whoever opens this link and signs in gets access to the list.',
  'share.regenerate': 'Create a new link',
  'share.regenerateConfirm': 'The old link will stop working. Continue?',
  'share.members': 'Members',
  'share.noMembers': 'Nobody has joined yet.',
  'share.removeMember': 'Remove',
  'share.removeConfirm': 'Remove {name} from the list?',

  'invite.joining': 'Joining the list…',
  'invite.invalid': 'The invite is invalid or expired.',
  'invite.loginFirst': 'Sign in to accept the invite to the list.',

  'profile.lists': 'Lists',
  'profile.empty': 'No lists available here yet.',
  'profile.notFound': 'User not found.',

  'settings.title': 'Settings',
  'settings.username': 'Username',
  'settings.usernameHint': 'Used in your profile link',
  'settings.usernameInvalid': 'Only lowercase latin letters, digits and _, 3 to 30 characters.',
  'settings.usernameTaken': 'This username is taken.',
  'settings.displayName': 'Name',

  'notFound.title': 'Page not found',
  'notFound.home': 'Go home',
}

const DICTS: Record<Lang, Record<TKey, string>> = { uk, en }
const STORAGE_KEY = 'wishlist.lang'

type I18n = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TKey, vars?: Record<string, string | number>) => string
  /** Picks the plural form from a "one|few|many" (uk) or "one|other" (en) string. */
  plural: (key: TKey, n: number) => string
}

const I18nContext = createContext<I18n | null>(null)

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'uk' || saved === 'en') return saved
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'uk'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable */
    }
  }, [])

  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang]
    const t: I18n['t'] = (key, vars) => {
      let s = dict[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
      return s
    }
    const rules = new Intl.PluralRules(lang === 'uk' ? 'uk' : 'en')
    const plural: I18n['plural'] = (key, n) => {
      const forms = dict[key].split('|')
      const cat = rules.select(n)
      if (lang === 'uk') return forms[cat === 'one' ? 0 : cat === 'few' ? 1 : 2] ?? forms[0]
      return forms[cat === 'one' ? 0 : 1] ?? forms[0]
    }
    return { lang, setLang, t, plural }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
