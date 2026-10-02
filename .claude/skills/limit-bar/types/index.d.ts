export type FiveHour = { percent: number; resetsAt: string | null }

declare module 'claude-code' {
  interface PluginState {
    'limit-bar': { fiveHour: FiveHour | null }
  }
}
