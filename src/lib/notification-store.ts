'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type NotificationType = 'info' | 'warning' | 'success'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  timestamp: string
  read: boolean
}

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & Partial<Pick<AppNotification, 'timestamp' | 'read'>>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const DEFAULT_TIMESTAMP = '2026-03-22T12:00:00'

const seededNotifications: AppNotification[] = [
  {
    id: 'notification-001',
    title: 'Monitoring: 2 nove nabidky v Holesovicich',
    message: 'Byly nalezeny 2 nove byty 2+kk v cenovem rozmezi do 9 mil. CZK.',
    type: 'info',
    timestamp: '2026-03-22T10:30:00',
    read: false,
  },
  {
    id: 'notification-002',
    title: 'Novy lead z webu - Byt 3+kk Holesovice',
    message: 'Zajemce vyplnil formular a chce domluvit prohlidku jeste tento tyden.',
    type: 'info',
    timestamp: '2026-03-22T10:00:00',
    read: false,
  },
  {
    id: 'notification-003',
    title: 'Klient Jan Novak potvrdil prohlidku',
    message: 'Prohlidka penthousu v Karline je potvrzena na zitra v 16:00.',
    type: 'success',
    timestamp: '2026-03-22T07:00:00',
    read: false,
  },
  {
    id: 'notification-004',
    title: 'Smlouva ceka na podpis - Mezonet DOX',
    message: 'Kupni smlouva je pripravena a ceka na finalni podpis klienta.',
    type: 'warning',
    timestamp: '2026-03-21T11:30:00',
    read: false,
  },
  {
    id: 'notification-005',
    title: '3 nemovitosti maji neuplne udaje',
    message: 'Chybi data o rekonstrukci nebo stavebnim stavu u 3 aktivnich nabidek.',
    type: 'warning',
    timestamp: '2026-03-21T09:15:00',
    read: false,
  },
  {
    id: 'notification-006',
    title: 'Tydenni report je pripraven ke kontrole',
    message: 'Report za posledni tyden je vygenerovany a ceka na schvaleni.',
    type: 'info',
    timestamp: '2026-03-20T14:00:00',
    read: true,
  },
  {
    id: 'notification-007',
    title: 'Hypoteka schvalena - River Lofts Karlin',
    message: 'Klient muze pokracovat k podpisu rezervacni smlouvy.',
    type: 'success',
    timestamp: '2026-03-19T16:10:00',
    read: true,
  },
  {
    id: 'notification-008',
    title: 'Najemni smlouva Smichov expiruje za 60 dni',
    message: 'Je cas overit zajem najemce o prodlouzeni smlouvy.',
    type: 'warning',
    timestamp: '2026-03-19T09:00:00',
    read: true,
  },
]

function countUnread(notifications: AppNotification[]) {
  return notifications.filter((notification) => !notification.read).length
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: seededNotifications,
      unreadCount: countUnread(seededNotifications),
      addNotification: (notification) =>
        set((state) => {
          const notifications = [
            {
              id: `notification-${Date.now()}`,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              timestamp: notification.timestamp ?? DEFAULT_TIMESTAMP,
              read: notification.read ?? false,
            },
            ...state.notifications,
          ]

          return {
            notifications,
            unreadCount: countUnread(notifications),
          }
        }),
      markAsRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          )

          return {
            notifications,
            unreadCount: countUnread(notifications),
          }
        }),
      markAllAsRead: () =>
        set((state) => {
          const notifications = state.notifications.map((notification) => ({
            ...notification,
            read: true,
          }))

          return {
            notifications,
            unreadCount: 0,
          }
        }),
    }),
    {
      name: 're-agent-notifications',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
