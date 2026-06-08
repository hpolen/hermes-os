import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

// ─── Known Services Database ──────────────────────────────────────────────────

interface ServiceMeta {
  displayName: string
  category: string
  icon: string
}

const KNOWN_SERVICES: Record<string, ServiceMeta> = {
  // Streaming
  netflix: { displayName: 'Netflix', category: 'Streaming', icon: '🎬' },
  hulu: { displayName: 'Hulu', category: 'Streaming', icon: '🎬' },
  disney: { displayName: 'Disney+', category: 'Streaming', icon: '🎬' },
  disneyplus: { displayName: 'Disney+', category: 'Streaming', icon: '🎬' },
  hbo: { displayName: 'HBO Max', category: 'Streaming', icon: '🎬' },
  hbomax: { displayName: 'HBO Max', category: 'Streaming', icon: '🎬' },
  max: { displayName: 'Max', category: 'Streaming', icon: '🎬' },
  peacock: { displayName: 'Peacock', category: 'Streaming', icon: '🎬' },
  paramount: { displayName: 'Paramount+', category: 'Streaming', icon: '🎬' },
  paramountplus: { displayName: 'Paramount+', category: 'Streaming', icon: '🎬' },
  'apple tv': { displayName: 'Apple TV+', category: 'Streaming', icon: '🎬' },
  appletv: { displayName: 'Apple TV+', category: 'Streaming', icon: '🎬' },
  'amazon prime video': { displayName: 'Prime Video', category: 'Streaming', icon: '🎬' },
  primevideo: { displayName: 'Prime Video', category: 'Streaming', icon: '🎬' },
  fubo: { displayName: 'FuboTV', category: 'Streaming', icon: '🎬' },
  fubotv: { displayName: 'FuboTV', category: 'Streaming', icon: '🎬' },
  sling: { displayName: 'Sling TV', category: 'Streaming', icon: '🎬' },
  philo: { displayName: 'Philo', category: 'Streaming', icon: '🎬' },
  crunchyroll: { displayName: 'Crunchyroll', category: 'Streaming', icon: '🎬' },
  mubi: { displayName: 'MUBI', category: 'Streaming', icon: '🎬' },
  shudder: { displayName: 'Shudder', category: 'Streaming', icon: '🎬' },
  // Music
  spotify: { displayName: 'Spotify', category: 'Music', icon: '🎵' },
  'apple music': { displayName: 'Apple Music', category: 'Music', icon: '🎵' },
  applemusic: { displayName: 'Apple Music', category: 'Music', icon: '🎵' },
  tidal: { displayName: 'Tidal', category: 'Music', icon: '🎵' },
  'youtube music': { displayName: 'YouTube Music', category: 'Music', icon: '🎵' },
  youtubemusic: { displayName: 'YouTube Music', category: 'Music', icon: '🎵' },
  pandora: { displayName: 'Pandora', category: 'Music', icon: '🎵' },
  'amazon music': { displayName: 'Amazon Music', category: 'Music', icon: '🎵' },
  amazonmusic: { displayName: 'Amazon Music', category: 'Music', icon: '🎵' },
  deezer: { displayName: 'Deezer', category: 'Music', icon: '🎵' },
  // Audio
  audible: { displayName: 'Audible', category: 'Audio', icon: '🎧' },
  sirius: { displayName: 'SiriusXM', category: 'Audio', icon: '🎧' },
  siriusxm: { displayName: 'SiriusXM', category: 'Audio', icon: '🎧' },
  // News
  nytimes: { displayName: 'New York Times', category: 'News', icon: '📰' },
  'new york times': { displayName: 'New York Times', category: 'News', icon: '📰' },
  newyorktimes: { displayName: 'New York Times', category: 'News', icon: '📰' },
  'washington post': { displayName: 'Washington Post', category: 'News', icon: '📰' },
  washingtonpost: { displayName: 'Washington Post', category: 'News', icon: '📰' },
  'wall street journal': { displayName: 'WSJ', category: 'News', icon: '📰' },
  wsj: { displayName: 'WSJ', category: 'News', icon: '📰' },
  theatlantic: { displayName: 'The Atlantic', category: 'News', icon: '📰' },
  economist: { displayName: 'The Economist', category: 'News', icon: '📰' },
  // Fitness
  headspace: { displayName: 'Headspace', category: 'Fitness', icon: '🏋️' },
  calm: { displayName: 'Calm', category: 'Fitness', icon: '🏋️' },
  peloton: { displayName: 'Peloton', category: 'Fitness', icon: '🏋️' },
  'planet fitness': { displayName: 'Planet Fitness', category: 'Fitness', icon: '🏋️' },
  planetfitness: { displayName: 'Planet Fitness', category: 'Fitness', icon: '🏋️' },
  noom: { displayName: 'Noom', category: 'Fitness', icon: '🏋️' },
  whoop: { displayName: 'WHOOP', category: 'Fitness', icon: '🏋️' },
  strava: { displayName: 'Strava', category: 'Fitness', icon: '🏋️' },
  myfitnesspal: { displayName: 'MyFitnessPal', category: 'Fitness', icon: '🏋️' },
  // Software
  adobe: { displayName: 'Adobe Creative Cloud', category: 'Software', icon: '💻' },
  microsoft: { displayName: 'Microsoft 365', category: 'Software', icon: '💻' },
  'office 365': { displayName: 'Microsoft 365', category: 'Software', icon: '💻' },
  office365: { displayName: 'Microsoft 365', category: 'Software', icon: '💻' },
  dropbox: { displayName: 'Dropbox', category: 'Software', icon: '💻' },
  icloud: { displayName: 'iCloud', category: 'Software', icon: '💻' },
  'google one': { displayName: 'Google One', category: 'Software', icon: '💻' },
  googleone: { displayName: 'Google One', category: 'Software', icon: '💻' },
  notion: { displayName: 'Notion', category: 'Software', icon: '💻' },
  lastpass: { displayName: 'LastPass', category: 'Software', icon: '💻' },
  '1password': { displayName: '1Password', category: 'Software', icon: '💻' },
  github: { displayName: 'GitHub', category: 'Software', icon: '💻' },
  render: { displayName: 'Render', category: 'Software', icon: '💻' },
  'render com': { displayName: 'Render', category: 'Software', icon: '💻' },
  heroku: { displayName: 'Heroku', category: 'Software', icon: '💻' },
  digitalocean: { displayName: 'DigitalOcean', category: 'Software', icon: '💻' },
  aws: { displayName: 'AWS', category: 'Software', icon: '💻' },
  vercel: { displayName: 'Vercel', category: 'Software', icon: '💻' },
  netlify: { displayName: 'Netlify', category: 'Software', icon: '💻' },
  linode: { displayName: 'Linode', category: 'Software', icon: '💻' },
  cloudflare: { displayName: 'Cloudflare', category: 'Software', icon: '💻' },
  zapier: { displayName: 'Zapier', category: 'Software', icon: '💻' },
  slack: { displayName: 'Slack', category: 'Software', icon: '💻' },
  zoom: { displayName: 'Zoom', category: 'Software', icon: '💻' },
  figma: { displayName: 'Figma', category: 'Software', icon: '💻' },
  canva: { displayName: 'Canva', category: 'Software', icon: '💻' },
  grammarly: { displayName: 'Grammarly', category: 'Software', icon: '💻' },
  'nordvpn': { displayName: 'NordVPN', category: 'Software', icon: '💻' },
  expressvpn: { displayName: 'ExpressVPN', category: 'Software', icon: '💻' },
  backblaze: { displayName: 'Backblaze', category: 'Software', icon: '💻' },
  // Gaming
  xbox: { displayName: 'Xbox Game Pass', category: 'Gaming', icon: '🎮' },
  playstation: { displayName: 'PlayStation Plus', category: 'Gaming', icon: '🎮' },
  nintendo: { displayName: 'Nintendo Online', category: 'Gaming', icon: '🎮' },
  'ea play': { displayName: 'EA Play', category: 'Gaming', icon: '🎮' },
  eaplay: { displayName: 'EA Play', category: 'Gaming', icon: '🎮' },
  steam: { displayName: 'Steam', category: 'Gaming', icon: '🎮' },
  // Food
  doordash: { displayName: 'DoorDash DashPass', category: 'Food', icon: '🍔' },
  instacart: { displayName: 'Instacart+', category: 'Food', icon: '🍔' },
  grubhub: { displayName: 'Grubhub+', category: 'Food', icon: '🍔' },
  ubereats: { displayName: 'Uber Eats', category: 'Food', icon: '🍔' },
  'hello fresh': { displayName: 'HelloFresh', category: 'Food', icon: '🍔' },
  hellofresh: { displayName: 'HelloFresh', category: 'Food', icon: '🍔' },
  'factor meals': { displayName: 'Factor Meals', category: 'Food', icon: '🍔' },
  // Shopping
  'amazon prime': { displayName: 'Amazon Prime', category: 'Shopping', icon: '🛒' },
  amazonprime: { displayName: 'Amazon Prime', category: 'Shopping', icon: '🛒' },
  amazon: { displayName: 'Amazon Prime', category: 'Shopping', icon: '🛒' },
  costcoauto: { displayName: 'Costco Membership', category: 'Shopping', icon: '🛒' },
  // Education
  duolingo: { displayName: 'Duolingo', category: 'Education', icon: '📚' },
  coursera: { displayName: 'Coursera', category: 'Education', icon: '📚' },
  masterclass: { displayName: 'MasterClass', category: 'Education', icon: '📚' },
  linkedin: { displayName: 'LinkedIn Premium', category: 'Education', icon: '📚' },
  skillshare: { displayName: 'Skillshare', category: 'Education', icon: '📚' },
  udemy: { displayName: 'Udemy', category: 'Education', icon: '📚' },
  // Entertainment
  'youtube premium': { displayName: 'YouTube Premium', category: 'Entertainment', icon: '▶️' },
  youtubepremium: { displayName: 'YouTube Premium', category: 'Entertainment', icon: '▶️' },
  youtube: { displayName: 'YouTube Premium', category: 'Entertainment', icon: '▶️' },
  twitch: { displayName: 'Twitch', category: 'Entertainment', icon: '▶️' },
  patreon: { displayName: 'Patreon', category: 'Entertainment', icon: '▶️' },
  substack: { displayName: 'Substack', category: 'Entertainment', icon: '▶️' },
  // Apple catch-all
  apple: { displayName: 'Apple Services', category: 'Software', icon: '💻' },
}

// ─── Exclusion List ───────────────────────────────────────────────────────────

// If ANY of these tokens appear in the normalized payee, skip it entirely
const EXCLUSION_TOKENS = [
  // Retail / Grocery
  'walmart', 'target', 'costco', 'kroger', 'meijer', 'aldi',
  'whole foods', 'wholefoods', 'trader joes', 'traderjoes',
  'safeway', 'publix', 'cvs', 'walgreens', 'rite aid', 'riteaid',
  'dollar general', 'dollargeneral', 'dollar tree', 'dollartree',
  'family dollar', 'familydollar', 'dollar', 'five below',
  // Gas / Convenience
  'shell', 'bp', 'exxon', 'chevron', 'mobil', 'speedway', 'sunoco',
  'circle k', 'circlek', 'marathon', 'thorntons', 'pilot',
  'flying j', 'wawa', 'sheetz', 'kwik',
  // Fast Food / Restaurants
  'mcdonalds', 'burger king', 'burgerking', 'wendys', 'subway',
  'chipotle', 'taco bell', 'tacobell', 'chick fil', 'chickfil',
  'dominos', 'pizza hut', 'pizzahut', 'starbucks', 'dunkin',
  'panera', 'jersey mikes', 'jerseymikes', 'skyline', 'dorothy lane',
  'udf', 'united dairy', 'fountain square', 'arbys', 'sonic',
  'popeyes', 'raising canes', 'canes', 'whataburger',
  // Local / Misc merchants detected in this dataset
  'uep', 'z company', 'epic loot', 'hollywood fe', 'whatnot',
  // Financial noise
  'stocks', 'interest charge', 'interest chg', 'discover credit',
  'credit card payment', 'honda financial', 'apple credit card',
  'department of education', 'dept of education', 'py at your serv',
  'venmo', 'paypal', 'zelle', 'cash app', 'cashapp',
  'transfer', 'payment', 'autopay', 'auto pay',
  // Misc retail
  'best buy', 'bestbuy', 'home depot', 'homedepot', 'lowes',
  'tj maxx', 'tjmaxx', 'marshalls', 'ross', 'kohls', 'macys',
  'nordstrom', 'gap', 'old navy', 'oldnavy', 'h m',
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Subscription {
  payee: string
  payeeKey: string
  icon: string
  amount: number
  frequency: 'monthly' | 'weekly' | 'quarterly' | 'annual'
  last_charged: string
  next_expected: string
  occurrences: number
  category: string
  total_annual: number
  confidence: 'confirmed' | 'possible'
  status: 'active' | 'possibly_canceled'
  price_changed: boolean
  amounts: number[]
}

interface RawTransaction {
  id: string
  account_id: string
  posted: string
  transacted_at: string
  amount: string
  description: string
  payee: string | null
  memo: string | null
  category: string
  category_color: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePayee(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\*[\w\d]+/g, '')              // strip *XXXX
    .replace(/\.com|\.net|\.org|\.io|\.app/g, '') // strip TLDs
    .replace(/\b(inc|llc|corp|ltd|co|usa|us|ca)\b/gi, '') // strip legal/geo suffixes
    .replace(/\d{4,}/g, '')                 // strip 4+ digit numbers
    .replace(/[^a-z0-9\s]/g, ' ')           // replace special chars with space
    .replace(/\s+/g, ' ')
    .trim()
}

function isExcluded(normalizedKey: string): boolean {
  return EXCLUSION_TOKENS.some(token => normalizedKey.includes(token))
}

function lookupKnownService(normalizedKey: string): ServiceMeta | null {
  // Exact match first
  if (KNOWN_SERVICES[normalizedKey]) return KNOWN_SERVICES[normalizedKey]!
  // Substring match: check if any known key is contained in the payee key
  for (const [knownKey, meta] of Object.entries(KNOWN_SERVICES)) {
    if (normalizedKey.includes(knownKey) || knownKey.includes(normalizedKey)) {
      return meta
    }
  }
  return null
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

function coefficientOfVariation(arr: number[]): number {
  if (arr.length < 2) return 999
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  if (mean === 0) return 999
  return stddev(arr) / mean
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]!
}

function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db
      .collection('finance_transactions')
      .orderBy('posted', 'desc')
      .limit(1000)
      .get()

    const txns = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RawTransaction[]

    // Filter to expenses only (negative amounts)
    const expenses = txns.filter(t => parseFloat(t.amount) < 0)

    // Group by normalized payee key
    const groups = new Map<string, { key: string; txns: RawTransaction[] }>()
    for (const txn of expenses) {
      const rawPayee = txn.payee || txn.description
      if (!rawPayee) continue
      const key = normalizePayee(rawPayee)
      if (!key) continue

      // Skip if on exclusion list
      if (isExcluded(key)) continue

      const existing = groups.get(key)
      if (existing) {
        existing.txns.push(txn)
      } else {
        groups.set(key, { key, txns: [txn] })
      }
    }

    const subscriptions: Subscription[] = []

    for (const { key, txns: group } of groups.values()) {
      if (group.length < 2) continue

      // Sort ascending by date
      const sorted = [...group].sort(
        (a, b) => new Date(a.posted).getTime() - new Date(b.posted).getTime()
      )

      // Compute intervals between consecutive charges
      const intervals: number[] = []
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]!.posted).getTime()
        const curr = new Date(sorted[i]!.posted).getTime()
        intervals.push((curr - prev) / 86_400_000)
      }

      if (intervals.length === 0) continue

      const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length
      const intervalCV = coefficientOfVariation(intervals)

      // Detect frequency
      let frequency: Subscription['frequency'] | null = null
      if (avgInterval >= 5 && avgInterval <= 10 && intervalCV < 0.20) {
        frequency = 'weekly'
      } else if (avgInterval >= 20 && avgInterval <= 40 && intervalCV < 0.25) {
        frequency = 'monthly'
      } else if (avgInterval >= 80 && avgInterval <= 100 && intervalCV < 0.25) {
        frequency = 'quarterly'
      } else if (avgInterval >= 340 && avgInterval <= 400) {
        frequency = 'annual'
      }

      if (!frequency) continue

      // Compute amount statistics
      const amounts = sorted.map(t => Math.abs(parseFloat(t.amount)))
      const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length
      const amountCV = coefficientOfVariation(amounts)

      // Confidence scoring (computed before the CV gate so known services get a pass)
      const knownService = lookupKnownService(key)
      const isKnown = knownService !== null

      // Skip if amounts are wildly inconsistent — but give known services a wider berth
      // (usage-based billing like Render, AWS, etc. can vary by ~40%)
      const amountCVLimit = isKnown ? 0.40 : 0.20
      if (amountCV > amountCVLimit) continue
      const highConfidence =
        (intervalCV < 0.10 && amountCV < 0.05) ||
        (isKnown && frequency !== null)
      const mediumConfidence = amountCV < 0.20 && group.length >= 2

      const confidence: Subscription['confidence'] = highConfidence
        ? 'confirmed'
        : mediumConfidence
        ? 'possible'
        : null!

      if (!confidence) continue

      // Build display info
      const lastTxn = sorted[sorted.length - 1]!
      const lastDate = lastTxn.posted.split('T')[0] ?? lastTxn.posted

      const intervalDays =
        frequency === 'monthly' ? 30 :
        frequency === 'weekly'  ? 7  :
        frequency === 'quarterly' ? 90 :
        365

      const nextExpected = addDays(lastDate, intervalDays)

      const totalAnnual =
        frequency === 'monthly'   ? avgAmount * 12 :
        frequency === 'weekly'    ? avgAmount * 52 :
        frequency === 'quarterly' ? avgAmount * 4  :
        avgAmount

      // Status: possibly_canceled if > 1.5x expected interval since last charge
      const daysSinceLast =
        (Date.now() - new Date(lastDate).getTime()) / 86_400_000
      const status: Subscription['status'] =
        daysSinceLast > intervalDays * 1.5 ? 'possibly_canceled' : 'active'

      // Price changed: any charge deviates > 5% from avg
      const priceChanged = amounts.some(a => Math.abs(a - avgAmount) / avgAmount > 0.05)

      // Display name + category + icon
      const displayName = knownService
        ? knownService.displayName
        : toTitleCase(lastTxn.payee || lastTxn.description)
      const category = knownService?.category ?? lastTxn.category ?? 'Other'
      const icon = knownService?.icon ?? '💳'

      subscriptions.push({
        payee: displayName,
        payeeKey: key,
        icon,
        amount: parseFloat(avgAmount.toFixed(2)),
        frequency,
        last_charged: lastDate,
        next_expected: nextExpected,
        occurrences: sorted.length,
        category,
        total_annual: parseFloat(totalAnnual.toFixed(2)),
        confidence,
        status,
        price_changed: priceChanged,
        amounts,
      })
    }

    // Sort: confirmed first (by next_expected ASC), then possible (by total_annual DESC)
    subscriptions.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return a.confidence === 'confirmed' ? -1 : 1
      }
      if (a.confidence === 'confirmed') {
        return new Date(a.next_expected).getTime() - new Date(b.next_expected).getTime()
      }
      return b.total_annual - a.total_annual
    })

    return NextResponse.json(subscriptions)
  } catch (err) {
    console.error('[finance/subscriptions]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
