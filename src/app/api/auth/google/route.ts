import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google/auth'

export async function GET() {
  try {
    const url = getAuthUrl()
    return NextResponse.redirect(url)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Google OAuth neni nakonfigurovan' },
      { status: 500 }
    )
  }
}
