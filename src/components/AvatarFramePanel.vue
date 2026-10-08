<script setup>
import { computed, ref } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import coinIcon from '../assets/coin.png'
import { avatarFrameByID, avatarFrameCatalog, avatarFrameContent } from '../data/avatarFrameCatalog'
import { useI18n } from '../i18n'
import { CoinWalletError, createCoinWalletStore } from '../services/coinWalletStore'
import CoinSpendDialog from './CoinSpendDialog.vue'

const props = defineProps({
  accountId: { type: String, required: true },
  avatar: { type: String, required: true },
  initialBalance: { type: Number, default: 0 },
  initialFrameId: { type: String, default: 'none' },
  initialSelectionId: { type: String, default: '' },
})
const emit = defineEmits(['back', 'selected', 'open-store', 'balance-changed'])
const { locale } = useI18n()
const copy = computed(() => avatarFrameContent(locale.value))
const wallet = createCoinWalletStore({ accountID: props.accountId, initialBalance: props.initialBalance })
const walletSnapshot = ref(wallet.getSnapshot())
const selectedID = ref(avatarFrameByID(props.initialSelectionId || props.initialFrameId).id)
const busy = ref(false)
const coinDialog = ref('')
const message = ref('')
const messageKind = ref('status')
const selectedFrame = computed(() => avatarFrameByID(selectedID.value))
const ownedIDs = computed(() => new Set([
  'none',
  ...walletSnapshot.value.transactions
    .filter((transaction) => transaction.reason === 'avatar_frame_unlock' && transaction.metadata?.frameID)
    .map((transaction) => transaction.metadata.frameID),
]))
const selectedOwned = computed(() => ownedIDs.value.has(selectedID.value))
const isCurrent = computed(() => selectedID.value === avatarFrameByID(props.initialFrameId).id)
const ctaLabel = computed(() => {
  if (isCurrent.value) return copy.value.inUse
  if (selectedOwned.value) return selectedID.value === 'none' ? copy.value.useNoFrame : copy.value.useFrame
  return copy.value.unlock.replace('{count}', selectedFrame.value.price)
})

function frameStyle(frame, large = false) {
  if (frame.ring === 'none') return {}
  return { '--avatar-frame-ring': frame.ring, '--avatar-frame-inset': large ? '-7px' : '-4px' }
}

function pick(id) {
  if (busy.value) return
  selectedID.value = id
  message.value = ''
}

function completeSelection() {
  emit('selected', { id: selectedFrame.value.id, label: copy.value.names[avatarFrameCatalog.indexOf(selectedFrame.value)] })
}

function useSelected() {
  if (busy.value || isCurrent.value) return
  message.value = ''
  if (selectedOwned.value) {
    completeSelection()
    return
  }
  if (walletSnapshot.value.balance < selectedFrame.value.price) {
    coinDialog.value = 'insufficient'
    return
  }
  coinDialog.value = 'confirm'
}

function confirmUnlock() {
  if (busy.value || selectedOwned.value || isCurrent.value) return
  if (walletSnapshot.value.balance < selectedFrame.value.price) {
    coinDialog.value = 'insufficient'
    return
  }
  busy.value = true
  const transactionID = `avatar-frame-${selectedFrame.value.id}-${globalThis.crypto?.randomUUID?.() || Date.now()}`
  try {
    walletSnapshot.value = wallet.spend({
      amount: selectedFrame.value.price,
      reason: 'avatar_frame_unlock',
      transactionID,
      metadata: { frameID: selectedFrame.value.id },
    })
    emit('balance-changed', walletSnapshot.value.balance)
    messageKind.value = 'success'
    message.value = copy.value.unlocked
    coinDialog.value = ''
    completeSelection()
  } catch (error) {
    messageKind.value = 'error'
    message.value = error instanceof CoinWalletError && error.code === 'INSUFFICIENT_BALANCE' ? copy.value.insufficient : copy.value.failed
    if (error instanceof CoinWalletError && error.code === 'INSUFFICIENT_BALANCE') coinDialog.value = 'insufficient'
  } finally {
    busy.value = false
  }
}

function openStore() {
  coinDialog.value = ''
  emit('open-store', { selectedFrameID: selectedID.value })
}
</script>

<template>
  <main class="avatar-frame-screen app-screen">
    <header class="avatar-frame-nav">
      <button type="button" :aria-label="copy.title" :disabled="busy" @click="emit('back')"><img :src="arrowLeftIcon" alt=""></button>
      <h1>{{ copy.title }}</h1>
      <button class="avatar-frame-balance" type="button" :disabled="busy" @click="openStore"><img :src="coinIcon" alt=""><b dir="ltr">{{ walletSnapshot.balance }}</b></button>
    </header>

    <section class="avatar-frame-content">
      <div class="avatar-frame-preview">
        <span class="avatar-frame-ring is-large" :class="{ 'is-none': selectedFrame.ring === 'none', 'is-animated': selectedFrame.animated }" :style="frameStyle(selectedFrame, true)"><img :src="avatar" alt=""></span>
        <strong>{{ copy.names[avatarFrameCatalog.indexOf(selectedFrame)] }}</strong>
      </div>

      <div class="avatar-frame-grid" role="listbox" :aria-label="copy.title">
        <button
          v-for="(frame, index) in avatarFrameCatalog"
          :key="frame.id"
          type="button"
          role="option"
          :aria-selected="selectedID === frame.id"
          :class="{ selected: selectedID === frame.id }"
          :disabled="busy"
          @click="pick(frame.id)"
        >
          <span class="avatar-frame-ring" :class="{ 'is-none': frame.ring === 'none', 'is-animated': frame.animated }" :style="frameStyle(frame)"><img :src="avatar" alt=""></span>
          <strong>{{ copy.names[index] }}</strong>
          <small v-if="ownedIDs.has(frame.id)">{{ frame.id === initialFrameId ? copy.inUse : copy.owned }}</small>
          <small v-else>{{ frame.price === 0 ? copy.free : copy.coins.replace('{count}', frame.price) }}</small>
        </button>
      </div>
    </section>

    <footer class="avatar-frame-footer">
      <p v-if="message" :class="messageKind" role="status">{{ message }}</p>
      <button class="avatar-frame-cta" type="button" :disabled="busy || isCurrent" @click="useSelected">{{ ctaLabel }}</button>
      <small>{{ copy.note }}</small>
    </footer>

    <CoinSpendDialog
      v-if="coinDialog"
      :mode="coinDialog"
      :title="coinDialog === 'confirm' ? copy.confirmTitle : copy.insufficientTitle"
      :body="coinDialog === 'confirm' ? copy.confirmBody : copy.insufficientBody.replace('{amount}', Math.max(0, selectedFrame.price - walletSnapshot.balance))"
      :cost="selectedFrame.price"
      :balance="walletSnapshot.balance"
      :cost-label="copy.cost"
      :balance-label="copy.balance"
      :after-label="copy.after"
      :short-by-label="copy.shortBy"
      :cancel-label="copy.cancel"
      :confirm-label="copy.confirmPurchase"
      :get-coins-label="copy.getCoins"
      :busy-label="copy.processing"
      :note="copy.purchaseNote"
      :error="messageKind === 'error' ? message : ''"
      :busy="busy"
      @close="coinDialog = ''"
      @confirm="confirmUnlock"
      @get-coins="openStore"
    />
  </main>
</template>
