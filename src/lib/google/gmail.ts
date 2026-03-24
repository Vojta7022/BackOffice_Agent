import { google } from 'googleapis'
import { getOAuth2Client, hasGoogleRefreshToken } from './auth'

function buildRawMessage(to: string, subject: string, body: string) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ]

  return Buffer.from(messageParts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function sendEmail(to: string, subject: string, body: string) {
  try {
    if (!hasGoogleRefreshToken()) {
      return { sent: false, reason: 'Google not connected', draft: { to, subject, body } }
    }

    const auth = getOAuth2Client()
    const gmail = google.gmail({ version: 'v1', auth })
    const raw = buildRawMessage(to, subject, body)

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    })

    return { sent: true, messageId: result.data.id }
  } catch (error) {
    console.error('Gmail send error:', error)
    return { sent: false, reason: 'Gmail error', draft: { to, subject, body } }
  }
}

export async function createDraft(to: string, subject: string, body: string) {
  try {
    if (!hasGoogleRefreshToken()) {
      return { created: false, reason: 'Google not connected', draft: { to, subject, body } }
    }

    const auth = getOAuth2Client()
    const gmail = google.gmail({ version: 'v1', auth })
    const raw = buildRawMessage(to, subject, body)

    const result = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: { message: { raw } },
    })

    return { created: true, draftId: result.data.id }
  } catch (error) {
    console.error('Gmail draft error:', error)
    return { created: false, reason: 'Gmail error', draft: { to, subject, body } }
  }
}
