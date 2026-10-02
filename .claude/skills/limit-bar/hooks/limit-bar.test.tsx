import { describe, expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { clockTime, colorFor, thresholdFor } from './register'

const PROPS = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 100,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
} as const

const RESETS_AT = '2026-10-02T17:30:00Z'

function bottom(on: On) {
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box key="engine" />
  })
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  mock.store(on)
  const pushes: string[] = []
  on('tool.call', (_$, e) => {
    if (e.tool === 'PushNotification') pushes.push(e.message)

    return { result: null } as never
  })

  return pushes
}

function measure(percentUsed: number) {
  return {
    context: { window: 200000 },
    rateLimits: [
      { kind: 'seven_day', percentUsed: 12 },
      { kind: 'five_hour', percentUsed, resetsAt: RESETS_AT },
    ],
    changed: ['rateLimits' as const],
  }
}

describe('limit-bar', () => {
  test('Farbe und Schwelle', async () => {
    expect(colorFor(69.9)).toBe('green')
    expect(colorFor(70)).toBe('yellow')
    expect(colorFor(90)).toBe('red')
    expect(thresholdFor(69.9)).toBe(0)
    expect(thresholdFor(75)).toBe(70)
    expect(thresholdFor(95)).toBe(90)
  })

  test('Balken über dem Prompt mit Prozent und Reset-Uhrzeit', async ($, on) => {
    bottom(on)
    await $.session.measure(measure(92.5))
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: 'limit-bar', surface, component: 'AbovePrompt', props: PROPS })
      expect(await ui.find({ type: 'Text', text: /93%/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: new RegExp(`Reset um ${clockTime(RESETS_AT)} Uhr`) })).toBeDefined()
      await ui.unmount()
    }
  })

  test('ohne Messwert kein Balken', async ($, on) => {
    bottom(on)
    const ui = await $.ui.mount({ plugin: 'limit-bar', surface: 'terminal', component: 'AbovePrompt', props: PROPS })
    expect(await ui.find({ type: 'Text', text: /5h-Limit/ })).toBeUndefined()
    await ui.unmount()
  })

  test('Panel zeigt den Balken auf jeder Oberfläche', async ($, on) => {
    bottom(on)
    await $.session.measure(measure(42))
    for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
      const ui = await $.ui.mount({
        plugin: 'limit-bar',
        surface,
        component: 'Pane',
        requestId: 'limit-bar',
        props: {} as never,
      })
      expect(await ui.find({ type: 'Text', text: /42%/ })).toBeDefined()
      await ui.unmount()
    }
  })

  test('Push genau einmal bei 70 % und einmal bei 90 %', async ($, on) => {
    const pushes = bottom(on)
    await $.session.measure(measure(50))
    await $.session.measure(measure(71))
    await $.session.measure(measure(75))
    await $.session.measure(measure(91))
    await $.session.measure(measure(95))
    expect(pushes).toHaveLength(2)
    expect(pushes[0]).toContain('71%')
    expect(pushes[1]).toContain('91%')
    expect(pushes[1]).toContain(`Reset um ${clockTime(RESETS_AT)} Uhr`)
  })
})
