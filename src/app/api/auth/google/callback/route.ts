import { NextRequest, NextResponse } from 'next/server'
import { getGoogleRefreshToken, GOOGLE_REFRESH_TOKEN_COOKIE, oauth2Client } from '@/lib/google/auth'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'No code' }, { status: 400 })
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    const refreshToken = tokens.refresh_token || getGoogleRefreshToken()
    const response = NextResponse.redirect(new URL('/chat?google=connected', req.url))

    if (refreshToken) {
      response.cookies.set(GOOGLE_REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 180,
      })
    }

    return response
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}
