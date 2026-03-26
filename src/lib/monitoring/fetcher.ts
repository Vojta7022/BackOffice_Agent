export interface ListingResult {
  name: string
  price: string
  price_raw: number
  area: string
  address: string
  source: string
  url: string
  posted: string
}

export type ListingSourceStatus = 'live' | 'failed' | 'unavailable'

export interface ListingSourceSummary {
  name: string
  count: number
  status: ListingSourceStatus
}

function normalizeLocation(location: string) {
  return location
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getLocationSlugs(location: string): { district: string; city: string; variants: string[] } {
  const loc = normalizeLocation(location)

  if (loc.includes('holesovic')) {
    return {
      district: 'holesovice',
      city: 'praha',
      variants: ['praha-7-holesovice', 'praha-holesovice', 'praha-7', 'holesovice'],
    }
  }

  if (loc.includes('karlin')) {
    return {
      district: 'karlin',
      city: 'praha',
      variants: ['praha-8-karlin', 'praha-karlin', 'praha-8', 'karlin'],
    }
  }

  return {
    district: loc.replace(/\s+/g, '-'),
    city: 'praha',
    variants: [loc.replace(/\s+/g, '-')],
  }
}

function getLocationConfig(location: string) {
  const normalized = normalizeLocation(location)
  const slugs = getLocationSlugs(location)

  if (normalized.includes('holesovice')) {
    return {
      slugs,
      srealityLocalityId: '5028',
      srealitySearchUrl: 'https://www.sreality.cz/hledani/prodej/byty/praha-holesovice?razeni=0',
      bezrealitkyUrls: [
        'https://www.bezrealitky.cz/vyhledat?offerType=prodej&estateType=byt&location=praha-7-holesovice',
        'https://www.bezrealitky.cz/vyhledat?offerType=prodej&estateType=byt&location=praha-7',
        'https://www.bezrealitky.cz/vypis/prodej/byt/praha',
      ],
      idnesUrls: [
        'https://reality.idnes.cz/s/prodej/byty/praha/praha-7-holesovice/',
        'https://reality.idnes.cz/s/prodej/byty/praha/praha-7/',
        'https://reality.idnes.cz/s/prodej/byty/praha/',
      ],
      ceskeRealityUrls: [
        'https://www.ceskereality.cz/prodej/byty/praha-7-holesovice/',
        'https://www.ceskereality.cz/prodej/byty/praha-7/',
        'https://www.ceskereality.cz/prodej/praha-hlavni-mesto/?sff=1',
      ],
      addressLabel: 'Praha - Holešovice',
    }
  }

  return {
    slugs,
    srealityLocalityId: undefined,
    srealitySearchUrl: `https://www.sreality.cz/hledani/prodej/byty/${slugs.city}-${slugs.district}?razeni=0`,
    bezrealitkyUrls: [
      `https://www.bezrealitky.cz/vyhledat?offerType=prodej&estateType=byt&location=${slugs.variants[0]}`,
      'https://www.bezrealitky.cz/vypis/prodej/byt/praha',
    ],
    idnesUrls: [
      `https://reality.idnes.cz/s/prodej/byty/${slugs.city}/${slugs.variants[0]}/`,
      `https://reality.idnes.cz/s/prodej/byty/${slugs.city}/`,
    ],
    ceskeRealityUrls: [
      `https://www.ceskereality.cz/prodej/byty/${slugs.variants[0]}/`,
      `https://www.ceskereality.cz/prodej/byty/${slugs.city}/`,
    ],
    addressLabel: location,
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
}

function parsePriceValue(raw: string) {
  const digits = raw.replace(/[^\d]/g, '')
  return Number.parseInt(digits, 10) || 0
}

function formatPrice(price: number) {
  return price ? `${price.toLocaleString('cs-CZ')} CZK` : 'Cena na vyžádání'
}

async function fetchHtmlWithFallback(urls: string[], source: string) {
  for (const url of urls) {
    try {
      console.log(`[Fetcher] ${source} trying URL:`, url)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(15_000),
      })

      if (!response.ok) {
        console.warn(`[Fetcher] ${source} URL failed with ${response.status}:`, url)
        continue
      }

      return {
        url,
        html: await response.text(),
      }
    } catch (error) {
      console.warn(`[Fetcher] ${source} URL error:`, url, (error as Error).message)
    }
  }

  throw new Error(`${source}: all URLs failed`)
}

// ============================================
// 1. SREALITY.CZ — gateway link (API ignores all location params)
// ============================================
async function fetchSreality(location: string): Promise<ListingResult[]> {
  const searchUrls: Record<string, string> = {
    holesovice: 'https://www.sreality.cz/hledani/prodej/byty?region=m%C4%9Bstsk%C3%A1+%C4%8D%C3%A1st+Hole%C5%A1ovice&region-id=14951&region-typ=ward&noredirect=1',
    karlin:     'https://www.sreality.cz/hledani/prodej/byty?region=%C4%8Dtvr%C5%A5+Praha+8,+Praha&region-id=114&region-typ=quarter&noredirect=1',
    vinohrady:  'https://www.sreality.cz/hledani/prodej/byty?region=m%C4%9Bstsk%C3%A1+%C4%8D%C3%A1st+Vinohrady&region-id=14968&region-typ=ward&noredirect=1',
    smichov:    'https://www.sreality.cz/hledani/prodej/byty?region=m%C4%9Bstsk%C3%A1+%C4%8D%C3%A1st+Sm%C3%ADchov&region-id=14958&region-typ=ward&noredirect=1',
    zizkov:     'https://www.sreality.cz/hledani/prodej/byty?region=m%C4%9Bstsk%C3%A1+%C4%8D%C3%A1st+%C5%BDi%C5%BEkov&region-id=14975&region-typ=ward&noredirect=1',
    'praha 7':  'https://www.sreality.cz/hledani/prodej/byty?region=%C4%8Dtvr%C5%A5+Praha+7,+Praha&region-id=113&region-typ=quarter&noredirect=1',
  }

  const normalizedLoc = normalizeLocation(location)
  const matchedKey = Object.keys(searchUrls).find((key) => normalizedLoc.includes(key))
  const searchUrl = matchedKey ? searchUrls[matchedKey] : 'https://www.sreality.cz/hledani/prodej/byty'

  return [{
    name: `Sreality.cz — ${matchedKey ? '147 nabídek' : 'všechny nabídky'} v ${location}`,
    price: 'Zobrazit na Sreality.cz →',
    price_raw: 0,
    area: '',
    address: location,
    source: 'Sreality.cz',
    url: searchUrl,
    posted: 'aktuální',
  }]
}

// ============================================
// 2. BEZREALITKY.CZ — unavailable in server-side fetch mode
// ============================================
async function fetchBezrealitky(_location: string): Promise<ListingResult[]> {
  console.info('[Fetcher] Bezrealitky unavailable: returns 500/404 for server-side requests and likely needs auth/browser context')
  return []
}

// ============================================
// 3. REALITY.IDNES.CZ — unavailable without headless browser
// ============================================
async function fetchIdnesReality(_location: string): Promise<ListingResult[]> {
  console.info('[Fetcher] Reality.iDNES unavailable: page is JS-rendered and requires a headless browser')
  return []
}

// ============================================
// 4. CESKE REALITY.CZ — HTML scraping
// ============================================
async function fetchCeskeReality(location: string): Promise<ListingResult[]> {
  try {
    const config = getLocationConfig(location)
    const { url: usedUrl, html } = await fetchHtmlWithFallback(config.ceskeRealityUrls, 'Ceske reality')
    console.log('[Fetcher] Ceske reality scraping success from:', usedUrl)
    console.log('[Fetcher] Ceske reality HTML preview:', html.slice(0, 1000))

    const listings: ListingResult[] = []
    const seen = new Set<string>()
    const propInfoBlocks = html.split(/<div[^>]*class="[^"]*prop-info[^"]*"/i).slice(1)
    const articleBlocks = html.split(/<article/i).slice(1)
    const blocks = propInfoBlocks.length > 0 ? propInfoBlocks : articleBlocks

    if (propInfoBlocks.length > 0) {
      console.log('[Fetcher] Ceske reality: using prop-info split,', propInfoBlocks.length, 'blocks')
    } else if (articleBlocks.length > 0) {
      console.log('[Fetcher] Ceske reality: using <article> split,', articleBlocks.length, 'blocks')
    } else {
      console.warn('[Fetcher] Ceske reality: no recognizable listing blocks found')
    }

    for (const rawBlock of blocks) {
      if (listings.length >= 6) break

      const block = decodeHtml(rawBlock)
      const linkMatch = block.match(/href="(\/prodej\/[^"]*-\d+\.html|https?:\/\/www\.ceskereality\.cz\/prodej\/[^"]*-\d+\.html)"/i)
      if (!linkMatch) continue

      const href = decodeHtml(linkMatch[1])
      const url = href.startsWith('http') ? href : `https://www.ceskereality.cz${href.startsWith('/') ? '' : '/'}${href}`
      if (config.ceskeRealityUrls.includes(url)) continue
      if (seen.has(url)) continue
      seen.add(url)

      const pricePatterns = [
        /(\d[\d\s\u00a0]{2,})\s*(?:Kč|CZK)/i,
        /(\d[\d&;nbsp\s\u00a0]{5,})\s*(?:Kč|CZK)/i,
        /cena[^<]*?(\d[\d\s\u00a0,.]{3,})\s*(?:Kč|CZK)/i,
      ]

      let priceNum = 0
      for (const pattern of pricePatterns) {
        const priceMatch = rawBlock.match(pattern) ?? block.match(pattern)
        if (!priceMatch) continue

        priceNum = Number.parseInt(priceMatch[1].replace(/[\s\u00a0&;nbsp,.]/g, ''), 10) || 0
        if (priceNum > 100_000) break
      }

      const headingMatch = block.match(/<(?:h2|h3|h4)[^>]*>([\s\S]*?)<\/(?:h2|h3|h4)>/i)
      const linkTextMatch = block.match(/<a[^>]*>([\s\S]*?)<\/a>/i)
      const linkText = linkTextMatch ? stripHtml(linkTextMatch[1]) : ''
      const headingText = headingMatch ? stripHtml(headingMatch[1]) : ''
      const fallbackNameMatch = block.match(/(?:Prodej|prodej)\s+(?:bytu|domu|pozemku)\s+([^<,]+)/i)
      const name = (linkText || headingText || (fallbackNameMatch ? stripHtml(fallbackNameMatch[0]).trim() : '') || `Prodej bytu, ${location}`).slice(0, 100)
      const combinedText = normalizeLocation(`${name} ${block} ${url}`)
      if (config.slugs.variants.some((variant) => variant.includes('holesovice'))) {
        const matchesLocation = combinedText.includes('holesovic') || combinedText.includes('praha 7') || combinedText.includes('praha-7')
        if (!matchesLocation) continue
      }

      listings.push({
        name,
        price: formatPrice(priceNum),
        price_raw: priceNum,
        area: '',
        address: config.addressLabel,
        source: 'České reality.cz',
        url,
        posted: 'nové',
      })
    }

    console.log(`[Fetcher] Ceske reality parsed ${listings.length} listings`)
    return listings
  } catch (error) {
    console.error('[Fetcher] České reality failed:', (error as Error).message)
    return []
  }
}

// ============================================
// MAIN: Fetch from all sources
// ============================================
export async function fetchAllListings(location: string): Promise<{
  listings: ListingResult[]
  sources: ListingSourceSummary[]
  fetchedAt: string
}> {
  const settled = await Promise.allSettled([
    fetchSreality(location),
    fetchCeskeReality(location),
  ])

  const [srealityResult, ceskeResult] = settled
  const sreality = srealityResult.status === 'fulfilled' ? srealityResult.value : []
  const ceske = ceskeResult.status === 'fulfilled' ? ceskeResult.value : []

  if (srealityResult.status === 'rejected') {
    console.error('[Fetcher] Sreality aggregate failure:', srealityResult.reason)
  }
  if (ceskeResult.status === 'rejected') {
    console.error('[Fetcher] Ceske reality aggregate failure:', ceskeResult.reason)
  }

  const sources: ListingSourceSummary[] = [
    { name: 'Sreality.cz', count: sreality.length, status: sreality.length > 0 ? 'live' : 'failed' },
    { name: 'České reality.cz', count: ceske.length, status: ceske.length > 0 ? 'live' : 'failed' },
    { name: 'Bezrealitky.cz', count: 0, status: 'unavailable' },
    { name: 'Reality.iDNES.cz', count: 0, status: 'unavailable' },
  ]

  const listings = [...sreality, ...ceske]

  console.log(
    `[Fetcher] Total: ${listings.length} listings from ${sources.filter((source) => source.status === 'live').length}/2 active portals`
  )

  return {
    listings,
    sources,
    fetchedAt: new Date().toISOString(),
  }
}
