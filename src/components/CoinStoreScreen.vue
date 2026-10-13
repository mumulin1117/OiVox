<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import coinIcon from '../assets/coin.png'
import { discoveryCoinProducts, discoveryCommerceContent } from '../data/discoveryCommerceContent'
import { useI18n } from '../i18n'
import { nativeBridge } from '../nativeBridge'
import { createCoinWalletStore } from '../services/coinWalletStore'
import { coinPurchaseErrorMessage, loadCoinProductPrices, purchaseCoinProduct } from '../services/storeKitCoinPurchase'

const props = defineProps({ accountId: { type: String, required: true }, initialBalance: { type: Number, default: 0 } })
const emit = defineEmits(['back', 'balance-changed', 'purchase-complete'])
const { locale } = useI18n()
const copy = computed(() => discoveryCommerceContent(locale.value))
const wallet = createCoinWalletStore({ accountID: props.accountId, initialBalance: props.initialBalance })
const balance = ref(wallet.getSnapshot().balance)
const storePrices = ref({})
const loading = ref(nativeBridge.isNative)
const busyProductID = ref('')
const message = ref('')
const messageKind = ref('')
const pageInstanceID = `coin-store-${globalThis.crypto?.randomUUID?.() || Date.now()}`
let disposed = false
const defaultProductID = discoveryCoinProducts.find((item) => item.coins === 180)?.productID || discoveryCoinProducts[0].productID
const selectedProductID = ref(defaultProductID)

const products = computed(() => discoveryCoinProducts.map((item) => ({
    ...item,
    displayPrice: storePrices.value[item.productID] || item.fallbackPrice,
    badge: item.coins === 180 ? copy.value.storePopular : item.coins === 500 ? copy.value.storeBestValue : '',
  })))
const selectedProduct = computed(() => products.value.find((item) => item.productID === selectedProductID.value) || products.value[0])
const purchaseLabel = computed(() => copy.value.storeBuyPack
  .replace('{coins}', selectedProduct.value?.coins ?? '')
  .replace('{price}', selectedProduct.value?.displayPrice ?? ''))

async function loadProducts() {
  if (!nativeBridge.isNative) { loading.value = false; return }
  try {
    const result = await loadCoinProductPrices(discoveryCoinProducts.map((item) => item.productID), { pageInstanceID })
    if (disposed) return
    storePrices.value = result.prices
  } catch {
    if (disposed) return
    messageKind.value = 'error'
    message.value = copy.value.storeLoadFailed
  } finally {
    if (!disposed) loading.value = false
  }
}

async function buy(product) {
  if (busyProductID.value) return
  message.value = ''
  if (!nativeBridge.isNative) {
    messageKind.value = 'error'
    message.value = copy.value.storeUnavailable
    return
  }
  busyProductID.value = product.productID
  messageKind.value = 'notice'
  message.value = copy.value.purchaseProcessing
  try {
    const result = await purchaseCoinProduct({ product, wallet, pageInstanceID })
    if (disposed) return
    if (result.status === 'pending') {
      messageKind.value = 'notice'
      message.value = copy.value.purchasePending
    } else if (result.status === 'complete') {
      balance.value = result.balance
      emit('balance-changed', result.balance)
      emit('purchase-complete', result)
      messageKind.value = 'success'
      message.value = copy.value.purchaseComplete.replace('{coins}', product.coins)
    } else if (result.status === 'cancelled') {
      messageKind.value = 'notice'
      message.value = copy.value.purchaseCancelled
    } else if (result.status === 'unavailable') {
      messageKind.value = 'error'
      message.value = copy.value.storeUnavailable
    } else {
      messageKind.value = 'error'
      message.value = copy.value.purchaseFailed
    }
  } catch (error) {
    if (disposed) return
    messageKind.value = 'error'
    message.value = coinPurchaseErrorMessage(copy.value, error)
  } finally {
    if (!disposed) busyProductID.value = ''
  }
}

onMounted(loadProducts)
onBeforeUnmount(() => {
  disposed = true
  nativeBridge.cancelPage(pageInstanceID)
})
</script>

<template>
  <main class="coin-store-screen app-screen" :aria-busy="Boolean(busyProductID) || loading ? 'true' : undefined">
    <header class="coin-store-nav">
      <button type="button" :disabled="Boolean(busyProductID)" @click="emit('back')">{{ copy.cancel }}</button>
      <h1>{{ copy.storeTitle }}</h1>
    </header>
    <section class="coin-store-scroll">
      <div class="coin-store-balance"><img :src="coinIcon" alt=""><div><p>{{ copy.storeBalanceLabel }}</p><strong dir="ltr">{{ balance }}</strong></div></div>
      <p v-if="loading" class="coin-store-loading" role="status">{{ copy.loadingProducts }}</p>
      <div class="coin-store-grid" role="radiogroup" :aria-label="copy.storeSubtitle">
        <button
          v-for="product in products"
          :key="product.productID"
          type="button"
          class="coin-store-product"
          :class="{ selected: selectedProductID === product.productID }"
          role="radio"
          :aria-checked="selectedProductID === product.productID"
          :disabled="Boolean(busyProductID)"
          @click="selectedProductID = product.productID"
        >
          <span><img :src="coinIcon" alt=""><strong dir="ltr">{{ product.coins }}</strong><small v-if="product.badge">{{ product.badge }}</small></span>
          <b dir="ltr">{{ product.displayPrice }}</b>
        </button>
      </div>
      <section class="coin-store-uses">
        <h2>{{ copy.storeUses }}</h2>
        <div class="coin-store-use-group">
          <h3>{{ copy.storeAiTitle }}</h3>
          <p><span>{{ copy.storeTranslateClip }}</span><b dir="ltr">5</b></p>
        </div>
        <div class="coin-store-use-group">
          <h3>{{ copy.storeMoreVoices }}</h3>
          <p><span>{{ copy.storeMoreVoicesDetail }}</span><b dir="ltr">50 / 5</b></p>
        </div>
        <div class="coin-store-use-group">
          <h3>{{ copy.storeFrames }}</h3>
          <p><span>{{ copy.storeStandardFrames }}</span><b dir="ltr">30 / 50</b></p>
          <p><span>{{ copy.storeRareFrames }}</span><b dir="ltr">80 / 100</b></p>
        </div>
      </section>
    </section>
    <footer class="coin-store-footer">
      <p v-if="message" class="coin-store-message" :class="`is-${messageKind}`" :role="messageKind === 'error' ? 'alert' : 'status'" aria-live="polite">{{ message }}</p>
      <button type="button" :disabled="Boolean(busyProductID) || loading || !selectedProduct" @click="buy(selectedProduct)">
        <span v-if="busyProductID" class="coin-store-spinner" aria-hidden="true" />
        <span v-if="busyProductID">{{ copy.purchaseProcessing }}</span>
        <template v-else>{{ purchaseLabel }}</template>
      </button>
      <p class="coin-store-legal-note">{{ copy.storeLegalNote }}</p>
    </footer>
  </main>
</template>
