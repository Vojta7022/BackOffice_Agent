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

const SREALITY_CATEGORY_SUB_MAP: Record<number, string> = {
  2: '1+kk',
  3: '1+1',
  4: '2+kk',
  5: '2+1',
  6: '3+kk',
  7: '3+1',
  8: '4+kk',
  9: '4+1',
  10: '5+kk',
  11: '5+1',
  12: '6-a-vice',
  47: 'atypicky',
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
// 1. SREALITY.CZ — HTML scraping + API fallback
// ============================================
function processEstates(estates: Array<Record<string, unknown>>, location: string): ListingResult[] {
  const filtered = estates.filter((estate) => {
    const locality = normalizeLocation(String(estate.locality ?? ''))
    const seo = (estate.seo as Record<string, unknown> | undefined) ?? {}
    const seoLocality = String(seo.locality ?? '').toLowerCase()
    return locality.includes('holesovic') || locality.includes('praha 7') || seoLocality.includes('holesovic')
  })

  const toUse = filtered.length > 0 ? filtered : estates
  console.log(`[Fetcher] Sreality: ${estates.length} total, ${filtered.length} matched location, using ${toUse.length}`)

  return toUse.slice(0, 8).map((estate) => {
    const seo = (estate.seo as Record<string, unknown> | undefined) ?? {}
    const categorySubRaw = seo.category_sub_cb
    const categorySub = typeof categorySubRaw === 'number'
      ? categorySubRaw
      : typeof categorySubRaw === 'string'
      ? Number(categorySubRaw)
      : NaN
    const roomType = SREALITY_CATEGORY_SUB_MAP[categorySub] || 'byt'
    const seoLocality = typeof seo.locality === 'string' && seo.locality.trim().length > 0
      ? seo.locality
      : 'praha'
    const hashId = String(estate.hash_id ?? '')
    const detailUrl = hashId
      ? `https://www.sreality.cz/detail/prodej/byt/${roomType}/${seoLocality}/${hashId}`
      : 'https://www.sreality.cz/hledani/prodej/byty/praha-holesovice?razeni=0'

    const rawPrice =
      typeof (estate.price_czk as { value_raw?: unknown } | undefined)?.value_raw === 'number'
        ? Number((estate.price_czk as { value_raw: number }).value_raw)
        : typeof estate.price === 'number'
        ? Number(estate.price)
        : 0

    return {
      name: String(estate.name ?? 'Nemovitost'),
      price: rawPrice ? `${rawPrice.toLocaleString('cs-CZ')} CZK` : 'Cena na vyžádání',
      price_raw: rawPrice,
      area: '',
      address: String(estate.locality ?? location),
      source: 'Sreality.cz',
      url: detailUrl,
      posted: 'nové',
    }
  })
}

async function fetchSreality(location: string): Promise<ListingResult[]> {
  try {
    const url = 'https://www.sreality.cz/hledani/prodej/byty/praha-holesovice'

    console.log('[Fetcher] Sreality HTML scraping:', url)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) throw new Error(`Sreality: ${response.status}`)
    const html = await response.text()

    const jsonMatch = html.match(/"_embedded"\s*:\s*\{"estates"\s*:\s*(\[[\s\S]*?\])\s*\}/)
    if (jsonMatch) {
      try {
        const estates = JSON.parse(jsonMatch[1]) as Array<Record<string, unknown>>
        if (estates[0]) {
          console.log('[Fetcher] Sreality raw estate[0]:', JSON.stringify(estates[0], null, 2))
        }
        return processEstates(estates, location)
      } catch {
        console.log('[Fetcher] Sreality JSON parse failed, trying regex')
      }
    }

    const apiUrl = `https://www.sreality.cz/api/cs/v2/estates?category_main_cb=1&category_type_cb=1&per_page=20&page=0&sort=0&locality_search_name=praha+holesovice&tms=${Date.now()}`
    console.log('[Fetcher] Sreality API fallback:', apiUrl)

    const apiResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!apiResponse.ok) throw new Error(`Sreality API: ${apiResponse.status}`)
    const data = await apiResponse.json()
    const estates = data?._embedded?.estates || []
    if (estates[0]) {
      console.log('[Fetcher] Sreality raw estate[0]:', JSON.stringify(estates[0], null, 2))
    }

    return processEstates(estates, location)
  } catch (error) {
    console.error('[Fetcher] Sreality failed:', (error as Error).message)
    return []
  }
}

// ============================================
// 2. BEZREALITKY.CZ — HTML scraping
// ============================================
async function fetchBezrealitky(location: string): Promise<ListingResult[]> {
  try {
    const config = getLocationConfig(location)
    const { url: usedUrl, html } = await fetchHtmlWithFallback(config.bezrealitkyUrls, 'Bezrealitky')
    console.log('[Fetcher] Bezrealitky scraping from:', usedUrl)

    const listings: ListingResult[] = []
    const seen = new Set<string>()
    const linkRegex = /href="([^"]*(?:\/nemovitosti-byty-domy\/|\/properties\/)[^"]*)"/gi
    let match: RegExpExecArray | null

    while ((match = linkRegex.exec(html)) !== null && listings.length < 8) {
      const href = decodeHtml(match[1])
      const url = href.startsWith('http') ? href : `https://www.bezrealitky.cz${href.startsWith('/') ? '' : '/'}${href}`
      if (seen.has(url)) continue
      seen.add(url)

      const contextStart = Math.max(0, match.index - 800)
      const contextEnd = Math.min(html.length, match.index + 1200)
      const context = html.slice(contextStart, contextEnd)

      const nameMatch =
        context.match(/<(?:h2|h3)[^>]*>([\s\S]*?)<\/(?:h2|h3)>/i) ??
        context.match(/title="([^"]+)"/i) ??
        context.match(/aria-label="([^"]+)"/i)
      const rawName = nameMatch ? stripHtml(decodeHtml(nameMatch[1])) : `Byt, ${location}`

      const priceMatch = context.match(/(\d[\d\s,.]{4,})\s*(Kč|CZK|,-)/i)
      const priceRaw = priceMatch ? parsePriceValue(priceMatch[1]) : 0

      const areaMatch = context.match(/(\d{1,3})\s*m²/i)
      const area = areaMatch ? `${areaMatch[1]} m²` : ''

      listings.push({
        name: rawName || `Byt, ${location}`,
        price: formatPrice(priceRaw),
        price_raw: priceRaw,
        area,
        address: config.addressLabel,
        source: 'Bezrealitky.cz',
        url,
        posted: 'nové',
      })
    }

    console.log(`[Fetcher] Bezrealitky parsed ${listings.length} listings`)
    return listings
  } catch (error) {
    console.error('[Fetcher] Bezrealitky failed:', (error as Error).message)
    return []
  }
}

// ============================================
// 3. REALITY.IDNES.CZ — HTML scraping
// ============================================
async function fetchIdnesReality(location: string): Promise<ListingResult[]> {
  try {
    const config = getLocationConfig(location)
    const { url: usedUrl, html } = await fetchHtmlWithFallback(config.idnesUrls, 'Reality.iDNES')
    console.log('[Fetcher] Reality.iDNES scraping success from:', usedUrl)
    console.log('[Fetcher] iDNES HTML sample:', html.substring(0, 500))

    const listings: ListingResult[] = []
    const blocks = html.split(/class="c-products__item"/i)

    for (let i = 1; i < Math.min(blocks.length, 9); i += 1) {
      const block = blocks[i]
      const linkMatch = block.match(/href="(\/detail\/[^"]+)"/i)
      const url = linkMatch ? `https://reality.idnes.cz${linkMatch[1]}` : ''
      if (!url) continue

      const nameMatch = block.match(/class="[^"]*c-products__name[^"]*"[^>]*>([\s\S]*?)<\//i)
      const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : `Byt, ${location}`

      const priceMatch = block.match(/(\d[\d\s,.]*)\s*(Kč|CZK)/i)
      const priceText = priceMatch ? priceMatch[1].replace(/\s/g, '').replace(/,/g, '') : ''
      const priceNum = Number.parseInt(priceText, 10) || 0

      const addressMatch = block.match(/class="[^"]*c-products__info[^"]*"[^>]*>([\s\S]*?)<\//i)
      const address = addressMatch
        ? addressMatch[1].replace(/<[^>]+>/g, '').trim()
        : config.addressLabel

      listings.push({
        name: name || `Prodej bytu, ${location}`,
        price: priceNum ? `${priceNum.toLocaleString('cs-CZ')} CZK` : 'Cena na vyžádání',
        price_raw: priceNum,
        area: '',
        address,
        source: 'Reality.iDNES.cz',
        url,
        posted: 'nové',
      })
    }

    console.log(`[Fetcher] iDNES parsed ${listings.length} listings`)
    return listings
  } catch (error) {
    console.error('[Fetcher] iDNES failed:', (error as Error).message)
    return []
  }
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
    const linkRegex = /href="(\/prodej\/[^"]*-\d+\.html)"/gi
    const absLinkRegex = /href="(https?:\/\/www\.ceskereality\.cz\/prodej\/[^"]*-\d+\.html)"/gi
    const seen = new Set<string>()
    const matches: Array<{ href: string; index: number }> = []
    let match: RegExpExecArray | null

    while ((match = linkRegex.exec(html)) !== null) {
      matches.push({ href: match[1], index: match.index })
    }

    while ((match = absLinkRegex.exec(html)) !== null) {
      matches.push({ href: match[1], index: match.index })
    }

    for (const entry of matches) {
      if (listings.length >= 6) break

      const href = decodeHtml(entry.href)
      const url = href.startsWith('http') ? href : `https://www.ceskereality.cz${href.startsWith('/') ? '' : '/'}${href}`
      if (config.ceskeRealityUrls.includes(url)) continue
      if (seen.has(url)) continue
      seen.add(url)

      const anchorContext = html.substring(entry.index, Math.min(html.length, entry.index + 700))
      const linkTextMatch = anchorContext.match(/<a[^>]*>([\s\S]*?)<\/a>/i)
      const contextStart = Math.max(0, entry.index - 500)
      const contextEnd = Math.min(html.length, entry.index + 500)
      const context = html.substring(contextStart, contextEnd)

      const priceMatch = context.match(/(\d[\d\s,.]{4,})\s*(Kč|CZK)/i)
      const priceNum = priceMatch ? parsePriceValue(priceMatch[1]) : 0

      const headingMatch = context.match(/<(?:h2|h3|h4)[^>]*>([\s\S]*?)<\/(?:h2|h3|h4)>/i)
      const linkText = linkTextMatch ? stripHtml(decodeHtml(linkTextMatch[1])) : ''
      const headingText = headingMatch ? stripHtml(decodeHtml(headingMatch[1])) : ''
      const fallbackNameMatch = context.match(/(?:Prodej|prodej)\s+(?:bytu|domu|pozemku)\s+([^<,]+)/i)
      const name = (linkText || headingText || (fallbackNameMatch ? stripHtml(fallbackNameMatch[0]).trim() : '') || `Prodej bytu, ${location}`).slice(0, 100)
      const combinedText = normalizeLocation(`${name} ${context} ${url}`)
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
  sources: { name: string; count: number; status: 'live' | 'failed' }[]
  fetchedAt: string
}> {
  const settled = await Promise.allSettled([
    fetchSreality(location),
    fetchBezrealitky(location),
    fetchIdnesReality(location),
    fetchCeskeReality(location),
  ])

  const [srealityResult, bezrealitkyResult, idnesResult, ceskeResult] = settled
  const sreality = srealityResult.status === 'fulfilled' ? srealityResult.value : []
  const bezrealitky = bezrealitkyResult.status === 'fulfilled' ? bezrealitkyResult.value : []
  const idnes = idnesResult.status === 'fulfilled' ? idnesResult.value : []
  const ceske = ceskeResult.status === 'fulfilled' ? ceskeResult.value : []

  if (srealityResult.status === 'rejected') {
    console.error('[Fetcher] Sreality aggregate failure:', srealityResult.reason)
  }
  if (bezrealitkyResult.status === 'rejected') {
    console.error('[Fetcher] Bezrealitky aggregate failure:', bezrealitkyResult.reason)
  }
  if (idnesResult.status === 'rejected') {
    console.error('[Fetcher] iDNES aggregate failure:', idnesResult.reason)
  }
  if (ceskeResult.status === 'rejected') {
    console.error('[Fetcher] Ceske reality aggregate failure:', ceskeResult.reason)
  }

  const sources: Array<{ name: string; count: number; status: 'live' | 'failed' }> = [
    { name: 'Sreality.cz', count: sreality.length, status: sreality.length > 0 ? 'live' : 'failed' },
    { name: 'Bezrealitky.cz', count: bezrealitky.length, status: bezrealitky.length > 0 ? 'live' : 'failed' },
    { name: 'Reality.iDNES.cz', count: idnes.length, status: idnes.length > 0 ? 'live' : 'failed' },
    { name: 'České reality.cz', count: ceske.length, status: ceske.length > 0 ? 'live' : 'failed' },
  ]

  const listings = [...sreality, ...bezrealitky, ...idnes, ...ceske]

  console.log(
    `[Fetcher] Total: ${listings.length} listings from ${sources.filter((source) => source.status === 'live').length}/4 portals`
  )

  return {
    listings,
    sources,
    fetchedAt: new Date().toISOString(),
  }
}
