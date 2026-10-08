import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { discoveryCoinProducts } from '../data/discoveryCommerceContent'

describe('coin store contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/CoinStoreScreen.vue'), 'utf8')
  const purchaseService = readFileSync(resolve(process.cwd(), 'src/services/storeKitCoinPurchase.js'), 'utf8')
  const nativeStore = readFileSync(resolve(process.cwd(), 'ios/OiVox/StoreService.swift'), 'utf8')
  const nativeBridge = readFileSync(resolve(process.cwd(), 'ios/OiVox/NativeBridge.swift'), 'utf8')

  it('maps every configured pack to the native StoreKit allowlist', () => {
    expect(discoveryCoinProducts).toEqual([
      { productID: 'mwxeencdjybvgjcs', coins: 60, fallbackPrice: '$0.99' },
      { productID: 'onlalqehwglvxxap', coins: 120, fallbackPrice: '$1.99' },
      { productID: 'siudvsdvobihufhn', coins: 180, fallbackPrice: '$2.99' },
      { productID: 'ajegsghcdaipmmyu', coins: 300, fallbackPrice: '$4.99' },
      { productID: 'ksajndfouauhfeiold', coins: 500, fallbackPrice: '$6.99' },
      { productID: 'uwnvihqdincfbzai', coins: 605, fallbackPrice: '$9.99' },
      { productID: 'oewifhuhwbbbcs', coins: 1200, fallbackPrice: '$14.99' },
      { productID: 'ospifrcuvdmxofos', coins: 1250, fallbackPrice: '$19.99' },
      { productID: 'hsvnuavckiaolvbu', coins: 3200, fallbackPrice: '$49.99' },
      { productID: 'uuerzkaujlakezbw', coins: 6750, fallbackPrice: '$99.99' },
    ])
    expect(new Set(discoveryCoinProducts.map((item) => item.productID)).size).toBe(10)
    discoveryCoinProducts.forEach((item) => expect(nativeStore).toContain(`"${item.productID}"`))
  })

  it('uses StoreKit localized prices and has no restore purchase control', () => {
    expect(component).toContain('loadCoinProductPrices')
    expect(component).toContain('purchaseCoinProduct')
    expect(purchaseService).toContain('bridge.listProducts')
    expect(purchaseService).toContain('bridge.purchase')
    expect(purchaseService).toContain('result?.purchased')
    expect(component).toContain("emit('purchase-complete'")
    expect(component).not.toContain('restorePurchases')
    expect(component).not.toContain('Restore Purchases')
    expect(component).not.toContain('copy.storePurchases')
    expect(component).not.toContain('copy.storeTerms')
    expect(component).not.toContain('copy.storePrivacy')
    expect(purchaseService).toContain('result.productID !== product.productID')
    expect(component).toContain('copy.value.purchaseCancelled')
    expect(component).toContain('copy.value.purchaseProcessing')
    expect(nativeBridge).toContain('STORE_VERIFICATION_FAILED')
    expect(nativeBridge).toContain('STORE_PRODUCT_UNAVAILABLE')
  })

  it('matches the HTML storefront structure without changing purchase settlement', () => {
    expect(component).toContain('discoveryCoinProducts.map((item)')
    expect(component).not.toContain('.filter((item) => featuredCoinAmounts.has(item.coins))')
    expect(component).toContain('role="radiogroup"')
    expect(component).toContain('coin-store-uses')
    expect(component).toContain('@click="buy(selectedProduct)"')
  })
})
