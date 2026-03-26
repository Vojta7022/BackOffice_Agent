import type { MonitoringRule } from '@/types'

type MonitoringRuleUpdates = Partial<MonitoringRule> & {
  filters?: Partial<MonitoringRule['filters']>
}

class MonitoringStore {
  private rules: MonitoringRule[] = []

  getRules(): MonitoringRule[] {
    return [...this.rules].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  addRule(rule: MonitoringRule): MonitoringRule {
    this.rules = [rule, ...this.rules.filter((existingRule) => existingRule.id !== rule.id)]
    return rule
  }

  removeRule(id: string): boolean {
    const nextRules = this.rules.filter((rule) => rule.id !== id)
    if (nextRules.length === this.rules.length) return false

    this.rules = nextRules
    return true
  }

  updateRule(id: string, updates: MonitoringRuleUpdates): MonitoringRule | null {
    const index = this.rules.findIndex((rule) => rule.id === id)
    if (index === -1) return null

    const currentRule = this.rules[index]
    const nextRule: MonitoringRule = {
      ...currentRule,
      ...updates,
      id: currentRule.id,
      created_at: currentRule.created_at,
      filters: updates.filters
        ? {
            ...currentRule.filters,
            ...updates.filters,
          }
        : currentRule.filters,
    }

    this.rules[index] = nextRule
    return nextRule
  }
}

const globalForMonitoringStore = globalThis as typeof globalThis & {
  __monitoringStore?: MonitoringStore
}

export const monitoringStore = globalForMonitoringStore.__monitoringStore ?? new MonitoringStore()

if (!globalForMonitoringStore.__monitoringStore) {
  globalForMonitoringStore.__monitoringStore = monitoringStore
}
