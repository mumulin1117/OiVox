import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Main Hub utility page transition contract', () => {
  const hub = readFileSync(resolve(process.cwd(), 'src/components/MainHub.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('opens coin store and Messages from their real header control positions', () => {
    expect(hub).toContain('ref="coinButton"')
    expect(hub).toContain('ref="messagesButton"')
    expect(hub).toContain("prepareUtilityRoute(screen)")
    expect(hub).toContain("screen === 'coin-store' ? coinButton.value : messagesButton.value")
    expect(hub).toContain("screen === 'coin-store' ? '40px' : '24px'")
  })

  it('uses a reversible transition and locks duplicate navigation while moving', () => {
    expect(hub).toContain("utilityRouteDirection.value = 'forward'")
    expect(hub).toContain("utilityRouteDirection.value = 'back'")
    expect(hub).toContain(':name="hubRouteTransitionName"')
    expect(hub).toContain(':disabled="utilityRouteBusy"')
    expect(hub).toContain('if (utilityRouteBusy.value) return')
    expect(hub).toContain("function openDiscoveryFromSocial() {\n  utilityRouteKind.value = ''")
  })

  it('reveals and returns the destination at the source control without long motion', () => {
    expect(css).toContain('.coin-store-screen.hub-utility-forward-enter-active')
    expect(css).toContain('.social-messages.hub-utility-forward-enter-active')
    expect(css).toContain('clip-path: circle(var(--hub-utility-origin-radius) at var(--hub-utility-origin-x) var(--hub-utility-origin-y))')
    expect(css).toContain('clip-path 300ms')
    expect(css).toContain('clip-path 260ms')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
