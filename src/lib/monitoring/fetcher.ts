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

function getLocationConfig(location: string) {
  const normalized = normalizeLocation(location)

  if (normalized.includes('holesovice')) {
    return {
      srealityLocalityId: '5028',
      bezrealitkyBoundary: '[[14.42,50.098],[14.46,50.098],[14.46,50.115],[14.42,50.115],[14.42,50.098]]',
      idnesUrl: 'https://reality.idnes.cz/s/prodej/byty/praha-7-holesovice/',
      ceskeRealityUrl: 'https://www.ceskereality.cz/prodej/byty/praha-7/',
      addressLabel: 'Praha - Holešovice',
    }
  }

  return {
    srealityLocalityId: '5028',
    bezrealitkyBoundary: '[[14.42,50.098],[14.46,50.098],[14.46,50.115],[14.42,50.115],[14.42,50.098]]',
    idnesUrl: 'https://reality.idnes.cz/s/prodej/byty/praha-7-holesovice/',
    ceskeRealityUrl: 'https://www.ceskereality.cz/prodej/byty/praha-7/',
    addressLabel: location,
  }
}

// ============================================
// 1. SREALITY.CZ — Public JSON API
// ============================================
async function fetchSreality(location: string): Promise<ListingResult[]> {
  try {
    const config = getLocationConfig(location)
    const url = `https://www.sreality.cz/api/cs/v2/estates?category_main_cb=1&category_type_cb=1&per_page=10&page=0&sort=0&locality_search_id=${config.srealityLocalityId}&tms=${Date.now()}`

    console.log('[Fetcher] Sreality API call...', url)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) throw new Error(`Sreality: ${response.status}`)
    const data = await response.json()
    const estates = data?._embedded?.estates || []

    console.log(`[Fetcher] Sreality returned ${estates.length} estates`)

    return estates.slice(0, 8).map((estate: Record<string, unknown>) => {
      const hashId = String(estate.hash_id ?? '')
      const seo = (estate.seo as Record<string, unknown> | undefined) ?? {}
      const categorySub = String(seo.category_sub_cb ?? '').trim()
      const seoLocality = String(seo.locality ?? 'praha').trim()
      const detailUrl = hashId
        ? `https://www.sreality.cz/detail/prodej/byt/${categorySub}/${seoLocality}/${hashId}`
        : 'https://www.sreality.cz'

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
        address: String(estate.locality ?? config.addressLabel),
        source: 'Sreality.cz',
        url: detailUrl,
        posted: 'nové',
      }
    })
  } catch (error) {
    console.error('[Fetcher] Sreality failed:', (error as Error).message)
    return []
  }
}

// ============================================
// 2. BEZREALITKY.CZ — Public markers API
// ============================================
async function fetchBezrealitky(location: string): Promise<ListingResult[]> {
  try {
    const config = getLocationConfig(location)
    console.log('[Fetcher] Bezrealitky markers API call...')

    const response = await fetch('https://www.bezrealitky.cz/api/record/markers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        offerType: 'prodej',
        estateType: 'byt',
        boundary: config.bezrealitkyBoundary,
        limit: 10,
        offset: 0,
        order: 'timeOrder_desc',
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) throw new Error(`Bezrealitky: ${response.status}`)
    const data = await response.json()
    const records = Array.isArray(data) ? data : (data?.records || data?.data || [])

    console.log(`[Fetcher] Bezrealitky returned ${records.length} records`)

    return records.slice(0, 6).map((record: Record<string, unknown>) => {
      const rawPrice = typeof record.price === 'number' ? Number(record.price) : 0
      const area = typeof record.surface === 'number' ? `${record.surface} m²` : ''
      const uri = typeof record.uri === 'string' ? record.uri : ''
      const id = typeof record.id === 'string' || typeof record.id === 'number' ? String(record.id) : ''
      const url = uri
        ? `https://www.bezrealitky.cz${uri.startsWith('/') ? '' : '/'}${uri}`
        : id
        ? `https://www.bezrealitky.cz/nemovitosti-byty-domy/${id}`
        : 'https://www.bezrealitky.cz'

      return {
        name: String(record.title ?? record.name ?? `Byt, ${location}`),
        price: rawPrice ? `${rawPrice.toLocaleString('cs-CZ')} CZK` : 'Cena na vyžádání',
        price_raw: rawPrice,
        area,
        address: String(record.address ?? record.locality ?? config.addressLabel),
        source: 'Bezrealitky.cz',
        url,
        posted: 'nové',
      }
    })
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
    console.log('[Fetcher] Reality.iDNES scraping...', config.idnesUrl)

    const response = await fetch(config.idnesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) throw new Error(`iDNES: ${response.status}`)
    const html = await response.text()

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
    console.log('[Fetcher] Ceske reality scraping...', config.ceskeRealityUrl)

    const response = await fetch(config.ceskeRealityUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) throw new Error(`České reality: ${response.status}`)
    const html = await response.text()

    const listings: ListingResult[] = []
    const linkRegex = /href="(https?:\/\/www\.ceskereality\.cz\/[^"]*detail[^"]*)"/gi
    const seen = new Set<string>()
    let match: RegExpExecArray | null

    while ((match = linkRegex.exec(html)) !== null && listings.length < 6) {
      const url = match[1]
      if (seen.has(url)) continue
      seen.add(url)

      const contextStart = Math.max(0, match.index - 500)
      const contextEnd = Math.min(html.length, match.index + 500)
      const context = html.substring(contextStart, contextEnd)

      const priceMatch = context.match(/(\d[\d\s,.]{4,})\s*(Kč|CZK)/i)
      const priceText = priceMatch ? priceMatch[1].replace(/\s/g, '').replace(/,/g, '') : ''
      const priceNum = Number.parseInt(priceText, 10) || 0

      const nameMatch = context.match(/(?:Prodej|prodej)\s+(?:bytu|domu|pozemku)\s+([^<,]+)/i)
      const name = nameMatch ? nameMatch[0].trim().slice(0, 80) : `Prodej bytu, ${location}`

      listings.push({
        name,
        price: priceNum ? `${priceNum.toLocaleString('cs-CZ')} CZK` : 'Cena na vyžádání',
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
  const [sreality, bezrealitky, idnes, ceske] = await Promise.all([
    fetchSreality(location),
    fetchBezrealitky(location),
    fetchIdnesReality(location),
    fetchCeskeReality(location),
  ])

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
