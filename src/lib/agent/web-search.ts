export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
}

function resolveDuckDuckGoUrl(rawUrl: string): string {
  const cleaned = decodeHtml(rawUrl).trim()

  try {
    const normalized = cleaned.startsWith('//') ? `https:${cleaned}` : cleaned
    const parsed = new URL(normalized, 'https://duckduckgo.com')
    const redirectUrl = parsed.searchParams.get('uddg')
    return redirectUrl ? decodeURIComponent(redirectUrl) : parsed.toString()
  } catch {
    return cleaned
  }
}

export async function searchWeb(query: string): Promise<WebSearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodedQuery}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RE-Agent/1.0)',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    const html = await response.text()
    const results: WebSearchResult[] = []
    const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g

    let match: RegExpExecArray | null
    while ((match = resultRegex.exec(html)) !== null && results.length < 10) {
      results.push({
        url: resolveDuckDuckGoUrl(match[1]),
        title: stripHtml(decodeHtml(match[2])),
        snippet: stripHtml(decodeHtml(match[3])),
      })
    }

    if (results.length === 0) {
      const titleRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g
      while ((match = titleRegex.exec(html)) !== null && results.length < 10) {
        results.push({
          url: resolveDuckDuckGoUrl(match[1]),
          title: stripHtml(decodeHtml(match[2])),
          snippet: '',
        })
      }
    }

    return results
  } catch (error) {
    console.error('Web search error:', error)
    return []
  }
}
