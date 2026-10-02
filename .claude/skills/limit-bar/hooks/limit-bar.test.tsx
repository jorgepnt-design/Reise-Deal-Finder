import { describe, expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { clockTime, colorFor } from './register'

const PROPS = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 100,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
} as const

function bottom(on: On) {
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box key="engine" />
  })
  on('session.measure', (_$, e) => ({ changed: e.changed }))
}

describe('limit-bar', () => {
  test('Farbe nach Schwelle', async () => {
    expect(colorFor(10)).toBe('green')
    expect(colorFor(69.9)).toBe('green')
    expect(colorFor(70)).toBe('yellow')
    expect(colorFor(89.9)).toBe('yellow')
    expect(colorFor(90)).toBe('red')
  })

  test('zeigt Prozent und Reset-Uhrzeit über dem Prompt', async ($, on) => {
    bottom(on)
    const resetsAt = '2026-10-02T17:30:00Z'
    await $.session.measure({
      context: { window: 200000 },
      rateLimits: [
        { kind: 'seven_day', percentUsed: 12 },
        { kind: 'five_hour', percentUsed: 92.5, resetsAt },
      ],
      changed: ['rateLimits'],
    })
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: 'limit-bar', surface, component: 'AbovePrompt', props: PROPS })
      expect(await ui.find({ type: 'Text', text: /93%/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: new RegExp(`Reset um ${clockTime(resetsAt)} Uhr`) })).toBeDefined()
      await ui.unmount()
    }
  })

  test('ohne Messwert kein Balken', async ($, on) => {
    bottom(on)
    const ui = await $.ui.mount({ plugin: 'limit-bar', surface: 'terminal', component: 'AbovePrompt', props: PROPS })
    expect(await ui.find({ type: 'Text', text: /5h-Limit/ })).toBeUndefined()
    await ui.unmount()
  })
})
