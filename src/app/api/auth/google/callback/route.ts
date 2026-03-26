import { NextRequest, NextResponse } from 'next/server'
import { oauth2Client } from '@/lib/google/auth'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'No code' }, { status: 400 })
  }

  try {
    await oauth2Client.getToken(code)
    return NextResponse.redirect(new URL('/chat?google=connected', req.url))
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}
