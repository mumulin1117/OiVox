import { nativeBridge } from '../nativeBridge'

export async function loadCoinProductPrices(productIDs, {
  bridge = nativeBridge,
  pageInstanceID,
  timeout = 30000,
} = {}) {
  if (!bridge.isNative) return { available: false, prices: {} }

  const requestedProductIDs = [...new Set(productIDs.filter(Boolean))]
  const allowedProductIDs = new Set(requestedProductIDs)
  const result = await bridge.listProducts(requestedProductIDs, { pageInstanceID, timeout })
  const prices = Object.fromEntries((result?.products || [])
    .filter((product) => allowedProductIDs.has(product?.productID) && typeof product?.displayPrice === 'string')
    .map((product) => [product.productID, product.displayPrice]))

  return { available: true, prices }
}

export async function purchaseCoinProduct({
  product,
  wallet,
  bridge = nativeBridge,
  pageInstanceID,
  timeout = 120000,
}) {
  if (!bridge.isNative) return { status: 'unavailable' }
  if (!product?.productID || !Number.isFinite(product?.coins) || product.coins <= 0) {
    return { status: 'failed' }
  }

  const result = await bridge.purchase(product.productID, { pageInstanceID, timeout })
  if (result?.pending) return { status: 'pending' }
  if (result?.cancelled) return { status: 'cancelled' }
  if (!result?.purchased || !result.transactionID || result.productID !== product.productID) {
    return { status: 'failed' }
  }

  const transactionID = `storekit-${result.transactionID}`
  const snapshot = wallet.creditPurchase({
    amount: product.coins,
    productID: product.productID,
    transactionID,
  })
  return {
    status: 'complete',
    balance: snapshot.balance,
    coins: product.coins,
    productID: product.productID,
    transactionID,
  }
}

export function coinPurchaseErrorMessage(copy, error) {
  if (error?.code === 'TIMEOUT') return copy.purchaseTimeout
  if (error?.code === 'STORE_VERIFICATION_FAILED') return copy.purchaseVerificationFailed
  if (error?.code === 'STORE_PRODUCT_UNAVAILABLE' || error?.code === 'STORE_UNKNOWN_PRODUCT') {
    return copy.purchaseProductUnavailable
  }
  return copy.purchaseFailed
}
