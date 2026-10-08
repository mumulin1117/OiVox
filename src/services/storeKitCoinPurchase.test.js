import { describe, expect, it, vi } from 'vitest'
import { coinPurchaseErrorMessage, loadCoinProductPrices, purchaseCoinProduct } from './storeKitCoinPurchase'

describe('shared StoreKit coin purchase flow', () => {
  it('loads only requested localized product prices', async () => {
    const bridge = {
      isNative: true,
      listProducts: vi.fn().mockResolvedValue({ products: [
        { productID: 'pack-60', displayPrice: '¥8' },
        { productID: 'not-requested', displayPrice: '¥999' },
      ] }),
    }
    const result = await loadCoinProductPrices(['pack-60'], { bridge, pageInstanceID: 'sheet' })
    expect(result).toEqual({ available: true, prices: { 'pack-60': '¥8' } })
    expect(bridge.listProducts).toHaveBeenCalledWith(['pack-60'], { pageInstanceID: 'sheet', timeout: 30000 })
  })

  it('settles a verified matching product once through the wallet', async () => {
    const bridge = {
      isNative: true,
      purchase: vi.fn().mockResolvedValue({ purchased: true, productID: 'pack-180', transactionID: 'apple-180' }),
    }
    const wallet = { creditPurchase: vi.fn().mockReturnValue({ balance: 185 }) }
    const product = { productID: 'pack-180', coins: 180 }
    const result = await purchaseCoinProduct({ product, wallet, bridge, pageInstanceID: 'sheet' })
    expect(wallet.creditPurchase).toHaveBeenCalledWith({ amount: 180, productID: 'pack-180', transactionID: 'storekit-apple-180' })
    expect(result).toEqual({ status: 'complete', balance: 185, coins: 180, productID: 'pack-180', transactionID: 'storekit-apple-180' })
  })

  it.each([
    [{ pending: true }, 'pending'],
    [{ cancelled: true }, 'cancelled'],
    [{ purchased: true, productID: 'wrong-pack', transactionID: 'apple-1' }, 'failed'],
  ])('does not credit non-complete result %#', async (nativeResult, status) => {
    const bridge = { isNative: true, purchase: vi.fn().mockResolvedValue(nativeResult) }
    const wallet = { creditPurchase: vi.fn() }
    const result = await purchaseCoinProduct({ product: { productID: 'pack-60', coins: 60 }, wallet, bridge })
    expect(result.status).toBe(status)
    expect(wallet.creditPurchase).not.toHaveBeenCalled()
  })

  it('uses the same stable localized error mapping for store and popup', () => {
    const copy = { purchaseTimeout: 'timeout', purchaseVerificationFailed: 'verify', purchaseProductUnavailable: 'missing', purchaseFailed: 'failed' }
    expect(coinPurchaseErrorMessage(copy, { code: 'TIMEOUT' })).toBe('timeout')
    expect(coinPurchaseErrorMessage(copy, { code: 'STORE_VERIFICATION_FAILED' })).toBe('verify')
    expect(coinPurchaseErrorMessage(copy, { code: 'STORE_PRODUCT_UNAVAILABLE' })).toBe('missing')
    expect(coinPurchaseErrorMessage(copy, { code: 'OTHER' })).toBe('failed')
  })
})
