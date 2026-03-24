import { google } from 'googleapis'
import { getOAuth2Client, hasGoogleRefreshToken } from './auth'

interface SlotEntry {
  date: string
  day: string
  time: string
}

function getSimulatedSlots(dateFrom: string, dateTo: string, durationMinutes = 60) {
  const slots: SlotEntry[] = []
  const czechDays = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota']
  const start = new Date(dateFrom || '2026-03-23')
  const end = new Date(dateTo || '2026-03-27')

  for (let d = new Date(start); d <= end && slots.length < 10; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue

    const daySlots = slots.length % 2 === 0
      ? ['09:00', '14:00']
      : ['10:00', '15:00', '16:00']

    for (const time of daySlots) {
      const [hour, minute] = time.split(':').map(Number)
      const endHour = hour + Math.floor(durationMinutes / 60)
      const endMinute = minute + (durationMinutes % 60)
      slots.push({
        date: d.toLocaleDateString('cs-CZ'),
        day: czechDays[d.getDay()],
        time: `${time}-${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
      })
      if (slots.length >= 10) break
    }
  }

  return { slots, source: 'simulated' as const }
}

export async function getAvailableSlots(dateFrom: string, dateTo: string, durationMinutes = 60) {
  try {
    const resolvedFrom = dateFrom || '2026-03-23'
    const resolvedTo = dateTo || '2026-03-27'

    if (!hasGoogleRefreshToken()) {
      return getSimulatedSlots(resolvedFrom, resolvedTo, durationMinutes)
    }

    const auth = getOAuth2Client()
    const calendar = google.calendar({ version: 'v3', auth })

    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date(resolvedFrom).toISOString(),
        timeMax: new Date(resolvedTo).toISOString(),
        items: [{ id: 'primary' }],
      },
    })

    const busySlots = freeBusy.data.calendars?.primary?.busy || []
    const slots: SlotEntry[] = []
    const start = new Date(resolvedFrom)
    const end = new Date(resolvedTo)
    const czechDays = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota']

    for (let d = new Date(start); d <= end && slots.length < 10; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue

      const businessHours = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

      for (const hour of businessHours) {
        const slotStart = new Date(d)
        const [h, m] = hour.split(':').map(Number)
        slotStart.setHours(h, m, 0, 0)
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60_000)

        const isBusy = busySlots.some((busy) => {
          const busyStart = new Date(busy.start || '')
          const busyEnd = new Date(busy.end || '')
          return slotStart < busyEnd && slotEnd > busyStart
        })

        if (!isBusy) {
          slots.push({
            date: d.toLocaleDateString('cs-CZ'),
            day: czechDays[dayOfWeek],
            time: `${hour}-${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`,
          })
        }

        if (slots.length >= 10) break
      }
    }

    return { slots, source: 'google_calendar' as const }
  } catch (error) {
    console.error('Google Calendar error, falling back to simulation:', error)
    return getSimulatedSlots(dateFrom, dateTo, durationMinutes)
  }
}
