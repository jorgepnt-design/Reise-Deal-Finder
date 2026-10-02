import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

import type { FiveHour } from '../types'

const fiveHour = atom({ plugin: 'limit-bar', key: 'fiveHour' } as const, null)

const WIDTH = 30

function pick(limits: SessionRateLimit[]): FiveHour | null {
  const w = limits.find(l => l.kind === 'five_hour')

  return w ? { percent: w.percentUsed, resetsAt: w.resetsAt ?? null } : null
}

export function colorFor(percent: number): string {
  if (percent >= 90) return 'red'
  if (percent >= 70) return 'yellow'

  return 'green'
}

export function clockTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const usage = await $.session.usage()
    await update($, fiveHour, () => pick(usage.rateLimits))

    return result
  })

  on('session.measure', async ($, e, next) => {
    const w = pick(e.rateLimits)
    if (w) await update($, fiveHour, () => w)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const w = await read($, fiveHour)
    if (e.props.hasSurvey || w === null) return next(e)

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
  })
}
