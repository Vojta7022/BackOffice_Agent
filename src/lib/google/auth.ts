import { google } from 'googleapis'
import { cookies } from 'next/headers'

export const GOOGLE_REFRESH_TOKEN_COOKIE = 'google_refresh_token'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
)

export function hasGoogleOAuthConfig() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

function getRefreshTokenFromCookie() {
  try {
    return cookies().get(GOOGLE_REFRESH_TOKEN_COOKIE)?.value ?? null
  } catch {
    return null
  }
}

export function getGoogleRefreshToken() {
  const cookieToken = getRefreshTokenFromCookie()
  if (cookieToken && cookieToken !== 'your-refresh-token') {
    return cookieToken
  }

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  return refreshToken && refreshToken !== 'your-refresh-token' ? refreshToken : null
}

export function hasValidGoogleRefreshToken() {
  const refreshToken = getGoogleRefreshToken()
  return Boolean(refreshToken && refreshToken !== 'your-refresh-token')
}

export function hasGoogleRefreshToken() {
  return hasValidGoogleRefreshToken()
}

export function getAuthUrl() {
  if (!hasGoogleOAuthConfig()) {
    throw new Error('Google OAuth neni nakonfigurovan')
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
    ],
  })
}

export function getOAuth2Client() {
  const refreshToken = getGoogleRefreshToken()
  if (hasValidGoogleRefreshToken() && refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
  }
  return oauth2Client
}

export { oauth2Client }
