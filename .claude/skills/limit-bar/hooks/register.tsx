import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderInput, SessionRateLimit } from 'claude-code'

import type { FiveHour } from '../types'

const fiveHour = atom({ plugin: 'limit-bar', key: 'fiveHour' } as const, null)

const WIDTH = 30
const PANE = 'limit-bar'
const PANE_TITLE = '5h-Limit'
// Across sessions: the highest threshold already pushed in the current window.
const NOTIFIED = 'notified'

function pick(limits: SessionRateLimit[]): FiveHour | null {
  const w = limits.find(l => l.kind === 'five_hour')

  return w ? { percent: w.percentUsed, resetsAt: w.resetsAt ?? null } : null
}

export function colorFor(percent: number): string {
  if (percent >= 90) return 'red'
  if (percent >= 70) return 'yellow'

  return 'green'
}

export function thresholdFor(percent: number): number {
  if (percent >= 90) return 90
  if (percent >= 70) return 70

  return 0
}

export function clockTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function bar($: EngineInterface, e: RenderInput, w: FiveHour) {
  const { Box, Text } = $.ui.resolve(e)
  const pct = Math.max(0, Math.min(100, w.percent))
  const filled = Math.round((pct / 100) * WIDTH)
  const color = colorFor(pct)

  return (
    <Box>
      <Text dimColor>5h-Limit </Text>
      <Text color={color}>{'█'.repeat(filled)}</Text>
      <Text dimColor>{'░'.repeat(WIDTH - filled)}</Text>
      <Text color={color} bold> {Math.round(w.percent)}%</Text>
      {w.resetsAt ? <Text dimColor>  · Reset um {clockTime(w.resetsAt)} Uhr</Text> : null}
    </Box>
  )
}

async function maybePush($: EngineInterface, w: FiveHour) {
  const level = thresholdFor(w.percent)
  if (level === 0) return

  const window = w.resetsAt ?? 'unknown'
  const last = (await $.store.get(NOTIFIED)) as { window: string; level: number } | undefined
  if (last && last.window === window && last.level >= level) return

  await $.store.set(NOTIFIED, { window, level })
  const reset = w.resetsAt ? ` Reset um ${clockTime(w.resetsAt)} Uhr.` : ''
  const message = `5h-Limit bei ${Math.round(w.percent)}%.${reset}`

  try {
    // Rejects where the host has no PushNotification tool (e.g. a local terminal).
    await $.tool.call({ tool: 'PushNotification', message, status: 'proactive' })
  } catch {
    $.ui.toast(message)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({ name: 'limit', description: '5h-Limit als Panel anzeigen' })
    const usage = await $.session.usage()
    await update($, fiveHour, () => pick(usage.rateLimits))

    return result
  })

  on('command.run', { command: 'limit' }, async $ => {
    await $.ui.open({ id: PANE, title: PANE_TITLE })

    return { text: '5h-Limit-Panel geöffnet.' }
  })

  // The band above the prompt is not drawn on the phone: open the pane there.
  on('session.attach', { surface: 'mobile' }, async ($, e, next) => {
    const result = await next(e)
    void $.ui.open({ id: PANE, title: PANE_TITLE })

    return result
  })

  on('session.measure', async ($, e, next) => {
    const w = pick(e.rateLimits)
    if (w) {
      await update($, fiveHour, () => w)
      try {
        await maybePush($, w)
      } catch {
        // A failed push must never stop the bar from updating.
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const w = await read($, fiveHour)
    if (e.props.hasSurvey || w === null) return next(e)

    return bar($, e, w)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const w = await read($, fiveHour)
    if (w === null) {
      const { Text } = $.ui.resolve(e)

      return <Text dimColor>Noch kein Messwert, er kommt mit der nächsten Antwort.</Text>
    }

    return bar($, e, w)
  })
}
