import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/google/gmail'

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body } = await req.json()
    const result = await sendEmail(to, subject, body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { sent: false, reason: error instanceof Error ? error.message : 'Unknown email error' },
      { status: 500 }
    )
  }
}
