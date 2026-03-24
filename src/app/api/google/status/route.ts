import { NextResponse } from 'next/server'
import { hasGoogleOAuthConfig, hasGoogleRefreshToken } from '@/lib/google/auth'

export async function GET() {
  return NextResponse.json({
    connected: hasGoogleRefreshToken(),
    hasOAuthConfig: hasGoogleOAuthConfig(),
  })
}
