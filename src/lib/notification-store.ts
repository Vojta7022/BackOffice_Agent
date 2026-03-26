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
    title: 'Monitoring: 2 nové nabídky v Holešovicích',
    message: 'Byly nalezeny 2 nové byty 2+kk v cenovém rozmezí do 9 mil. CZK.',
    type: 'info',
    timestamp: '2026-03-22T10:30:00',
    read: false,
  },
  {
    id: 'notification-002',
    title: 'Nový lead z webu - byt 3+kk Holešovice',
    message: 'Zájemce vyplnil formulář a chce domluvit prohlídku ještě tento týden.',
    type: 'info',
    timestamp: '2026-03-22T10:00:00',
    read: false,
  },
  {
    id: 'notification-003',
    title: 'Klient Jan Novák potvrdil prohlídku',
    message: 'Prohlídka penthousu v Karlíně je potvrzena na zítřek v 16:00.',
    type: 'success',
    timestamp: '2026-03-22T07:00:00',
    read: false,
  },
  {
    id: 'notification-004',
    title: 'Smlouva čeká na podpis - mezonet DOX',
    message: 'Kupní smlouva je připravena a čeká na finální podpis klienta.',
    type: 'warning',
    timestamp: '2026-03-21T11:30:00',
    read: false,
  },
  {
    id: 'notification-005',
    title: '3 nemovitosti mají neúplné údaje',
    message: 'Chybí data o rekonstrukci nebo stavebním stavu u 3 aktivních nabídek.',
    type: 'warning',
    timestamp: '2026-03-21T09:15:00',
    read: false,
  },
  {
    id: 'notification-006',
    title: 'Týdenní report je připraven ke kontrole',
    message: 'Report za poslední týden je vygenerovaný a čeká na schválení.',
    type: 'info',
    timestamp: '2026-03-20T14:00:00',
    read: true,
  },
  {
    id: 'notification-007',
    title: 'Hypotéka schválena - River Lofts Karlín',
    message: 'Klient může pokračovat k podpisu rezervační smlouvy.',
    type: 'success',
    timestamp: '2026-03-19T16:10:00',
    read: true,
  },
  {
    id: 'notification-008',
    title: 'Nájemní smlouva Smíchov expiruje za 60 dní',
    message: 'Je čas ověřit zájem nájemce o prodloužení smlouvy.',
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
