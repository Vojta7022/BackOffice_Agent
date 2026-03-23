'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Users, SlidersHorizontal, UserPlus, Pencil, Trash2 } from 'lucide-react'
import { agents } from '@/data/agents'
import FormModal from '@/components/ui/FormModal'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn, fetchJson, relativeTime } from '@/lib/utils'
import type { Client, ClientStatus, ClientType, ClientSource } from '@/types'

const TYPE_LABELS: Record<ClientType, string> = {
  buyer: 'Kupující',
  seller: 'Prodávající',
  investor: 'Investor',
  tenant: 'Nájemník',
}

const SOURCE_LABELS: Record<ClientSource, string> = {
  website: 'Web',
  referral: 'Doporučení',
  sreality: 'Sreality',
  bezrealitky: 'Bezrealitky',
  instagram: 'Instagram',
  facebook: 'Facebook',
  cold_call: 'Cold call',
  walk_in: 'Walk-in',
  other: 'Jiné',
}

const STATUS_COLORS: Record<ClientStatus, string> = {
  active: 'bg-primary/10 text-primary',
  inactive: 'bg-amber-500/15 text-amber-500',
  closed: 'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Aktivní',
  inactive: 'Neaktivní',
  closed: 'Uzavřený',
}

const TYPE_COLORS: Record<ClientType, string> = {
  buyer: 'bg-primary/10 text-primary',
  seller: 'bg-violet-500/15 text-violet-500',
  investor: 'bg-primary/10 text-primary',
  tenant: 'bg-amber-500/15 text-amber-500',
}

const FIELD_CLASSNAME = 'control-focus w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none'

interface ClientFormValues {
  name: string
  email: string
  phone: string
  type: ClientType
  source: ClientSource
  status: ClientStatus
  notes: string
  assigned_agent: string
}

function createEmptyClientForm(): ClientFormValues {
  return {
    name: '',
    email: '',
    phone: '',
    type: 'buyer',
    source: 'website',
    status: 'active',
    notes: '',
    assigned_agent: agents[0]?.id ?? '',
  }
}

function toClientFormValues(client: Client): ClientFormValues {
  return {
    name: client.name,
    email: client.email,
    phone: client.phone,
    type: client.type,
    source: client.source,
    status: client.status,
    notes: client.notes,
    assigned_agent: client.assigned_agent,
  }
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function ClientRow({
  client,
  onEdit,
  onDelete,
}: {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}) {
  return (
    <tr className="group border-b border-border/60 transition-colors even:bg-muted/15 hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/15 to-violet-500/20 text-[11px] font-semibold text-primary">
            {initials(client.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{client.name}</p>
            <p className="truncate text-xs text-muted-foreground">{client.email}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', TYPE_COLORS[client.type])}>
          {TYPE_LABELS[client.type]}
        </span>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {SOURCE_LABELS[client.source]}
        </span>
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <span className="text-xs text-muted-foreground">{client.phone}</span>
      </td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_COLORS[client.status])}>
          {STATUS_LABELS[client.status]}
        </span>
      </td>
      <td className="hidden px-4 py-3 xl:table-cell text-right">
        <span className="text-xs text-muted-foreground">{relativeTime(client.created_at)}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(client)}
            className="button-smooth rounded-xl border border-border bg-background px-2 py-1 text-muted-foreground hover:border-primary/20 hover:text-primary"
            aria-label={`Upravit klienta ${client.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(client)}
            className="button-smooth rounded-xl border border-border bg-background px-2 py-1 text-muted-foreground hover:border-red-500/30 hover:text-red-500"
            aria-label={`Smazat klienta ${client.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <tr key={i} className="border-b border-border/50 animate-pulse">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-muted/40" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-muted" />
                <div className="h-3 w-36 rounded bg-muted/60" />
              </div>
            </div>
          </td>
          <td className="hidden px-4 py-3 sm:table-cell"><div className="h-5 w-16 rounded-full bg-muted/40" /></td>
          <td className="hidden px-4 py-3 md:table-cell"><div className="h-5 w-20 rounded-full bg-muted/40" /></td>
          <td className="hidden px-4 py-3 lg:table-cell"><div className="h-3 w-28 rounded bg-muted/40" /></td>
          <td className="px-4 py-3"><div className="h-5 w-16 rounded-full bg-muted/40" /></td>
          <td className="hidden px-4 py-3 xl:table-cell"><div className="ml-auto h-3 w-16 rounded bg-muted/40" /></td>
          <td className="px-4 py-3"><div className="ml-auto h-8 w-20 rounded-xl bg-muted/40" /></td>
        </tr>
      ))}
    </>
  )
}

export default function ClientsPage() {
  const { confirm, dialog } = useConfirmDialog()
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ClientStatus | ''>('')
  const [type, setType] = useState<ClientType | ''>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formValues, setFormValues] = useState<ClientFormValues>(createEmptyClientForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (type) params.set('type', type)

    try {
      const data = await fetchJson<{ clients: Client[]; total: number }>(`/api/clients?${params.toString()}`)
      setClients(data.clients ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [search, status, type])

  useEffect(() => {
    const timeout = setTimeout(fetchClients, search ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [fetchClients, search])

  const activeCount = clients.filter(client => client.status === 'active').length

  function openCreateModal() {
    setEditingClient(null)
    setFormValues(createEmptyClientForm())
    setFormError(null)
    setIsModalOpen(true)
  }

  function openEditModal(client: Client) {
    setEditingClient(client)
    setFormValues(toClientFormValues(client))
    setFormError(null)
    setIsModalOpen(true)
  }

  async function handleDelete(client: Client) {
    const approved = await confirm({
      title: 'Smazat klienta',
      message: `Opravdu smazat klienta ${client.name}?`,
      confirmLabel: 'Smazat',
    })

    if (!approved) return

    await fetchJson<{ success: boolean }>('/api/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: client.id }),
    })

    await fetchClients()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!formValues.name.trim()) {
      setFormError('Zadejte jméno klienta.')
      return
    }

    if (!formValues.email.trim()) {
      setFormError('Zadejte e-mail klienta.')
      return
    }

    if (!formValues.email.includes('@')) {
      setFormError('E-mail nemá správný formát.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        ...formValues,
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
      }

      if (editingClient) {
        await fetchJson<{ client: Client }>('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingClient.id, ...payload }),
        })
      } else {
        await fetchJson<{ client: Client }>('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      setIsModalOpen(false)
      setEditingClient(null)
      setFormValues(createEmptyClientForm())
      await fetchClients()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nepodařilo se uložit klienta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="surface-card flex items-center gap-2 px-4 py-2.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{total}</span>
            <span className="text-xs text-muted-foreground">klientů celkem</span>
          </div>
          {!loading && (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 shadow-sm dark:shadow-none">
              <span className="text-sm font-semibold text-primary">{activeCount}</span>
              <span className="text-xs text-primary/70">aktivních</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="button-smooth inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 dark:shadow-none"
        >
          <UserPlus className="h-4 w-4" />
          Nový klient
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Hledat klienty…"
            className={cn(
              'control-focus w-full rounded-2xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm shadow-sm dark:shadow-none',
              'text-foreground placeholder:text-muted-foreground/50',
            )}
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm dark:shadow-none">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ClientStatus | '')}
            className="bg-transparent text-sm text-foreground outline-none"
          >
            <option value="">Všechny stavy</option>
            <option value="active">Aktivní</option>
            <option value="inactive">Neaktivní</option>
            <option value="closed">Uzavřený</option>
          </select>
        </div>

        <select
          value={type}
          onChange={(event) => setType(event.target.value as ClientType | '')}
          className="control-focus rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none"
        >
          <option value="">Všechny typy</option>
          <option value="buyer">Kupující</option>
          <option value="seller">Prodávající</option>
          <option value="investor">Investor</option>
          <option value="tenant">Nájemník</option>
        </select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Klient</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">Typ</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Zdroj</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Telefon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stav</th>
                <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">Přidán</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Akce</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">Žádní klienti nenalezeni</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">Zkuste upravit filtry</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingClient ? 'Upravit klienta' : 'Nový klient'}
        submitLabel={editingClient ? 'Uložit změny' : 'Vytvořit klienta'}
        submitLoadingLabel={editingClient ? 'Ukládám změny…' : 'Vytvářím klienta…'}
        isSubmitting={isSubmitting}
        error={formError}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Jméno</span>
            <input
              value={formValues.name}
              onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
              className={FIELD_CLASSNAME}
              placeholder="Např. Jan Novák"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">E-mail</span>
            <input
              type="email"
              value={formValues.email}
              onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))}
              className={FIELD_CLASSNAME}
              placeholder="jan.novak@email.cz"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Telefon</span>
            <input
              value={formValues.phone}
              onChange={(event) => setFormValues((current) => ({ ...current, phone: event.target.value }))}
              className={FIELD_CLASSNAME}
              placeholder="+420 777 123 456"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Typ klienta</span>
            <select
              value={formValues.type}
              onChange={(event) => setFormValues((current) => ({ ...current, type: event.target.value as ClientType }))}
              className={FIELD_CLASSNAME}
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Zdroj</span>
            <select
              value={formValues.source}
              onChange={(event) => setFormValues((current) => ({ ...current, source: event.target.value as ClientSource }))}
              className={FIELD_CLASSNAME}
            >
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Stav</span>
            <select
              value={formValues.status}
              onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value as ClientStatus }))}
              className={FIELD_CLASSNAME}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Přiřazený agent</span>
            <select
              value={formValues.assigned_agent}
              onChange={(event) => setFormValues((current) => ({ ...current, assigned_agent: event.target.value }))}
              className={FIELD_CLASSNAME}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Poznámky</span>
            <textarea
              value={formValues.notes}
              onChange={(event) => setFormValues((current) => ({ ...current, notes: event.target.value }))}
              className={cn(FIELD_CLASSNAME, 'min-h-[120px] resize-y')}
              placeholder="Poznámky ke klientovi…"
            />
          </label>
        </div>
      </FormModal>

      {dialog}
    </div>
  )
}
