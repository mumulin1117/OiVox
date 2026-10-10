<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import deleteTrashIcon from '../assets/icons/account-delete-trash.svg'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import chevronIcon from '../assets/icons/profile-chevron.svg'
import crossIcon from '../assets/icons/guideline-cross.svg'
import heartIcon from '../assets/icons/guideline-heart.svg'
import microphoneIcon from '../assets/icons/guideline-mic.svg'
import checkGreenIcon from '../assets/icons/check-green.svg'
import shieldIcon from '../assets/icons/shield-check.svg'
import { postRegistrationContent } from '../data/postRegistrationContent'
import { privacyAccountContent } from '../data/privacyAccountContent'
import { legalDocuments } from '../data/legalDocuments'
import { useI18n } from '../i18n'
import { nativeBridge } from '../nativeBridge'
import { createCoinWalletStore } from '../services/coinWalletStore'
import { clearAccountLocalData } from '../services/accountDeletionStore'
import { oivoxAccountApi } from '../services/oivoxAccountApi'

const props = defineProps({
  accountId: { type: String, required: true },
  blockedPeople: { type: Array, default: () => [] },
  verified: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'open-language', 'open-store', 'logout', 'unblock'])
const { locale } = useI18n()
const copy = computed(() => privacyAccountContent(locale.value))
const supportCopy = computed(() => postRegistrationContent(locale.value))
const legalCopy = computed(() => legalDocuments(locale.value))
const legalMode = ref('terms')
const activeLegalDocument = computed(() => legalCopy.value[legalMode.value] || legalCopy.value.terms)
const legalScroll = ref(null)
const page = ref('main')
const pageTransitionDirection = ref('forward')
const notice = ref('')
const error = ref('')
const busy = ref(false)
const notificationStatus = ref('notDetermined')
const supportCategory = ref(0)
const supportDetails = ref('')
const supportTickets = ref([])
const purchaseHistory = ref([])
const supportSubmissionState = ref('idle')
const unblockingID = ref('')
const deleteText = ref('')
const deleteDialogOpen = ref(false)
const deleteSubmissionState = ref('editing')
const deleteBusy = ref(false)
const deleteInput = ref(null)
let noticeTimer = 0
let unblockTimer = 0
let mounted = true

const preferenceKey = computed(() => `oivox.privacy.v1:${props.accountId}`)
const defaultPreferences = Object.freeze({ countryAndTimezoneOnly: true, unsafeVoiceFilter: true, globeFriendRequests: false, voiceReminders: true })
const preferences = ref({ ...defaultPreferences })
const notificationOn = computed(() => notificationStatus.value === 'authorized' || notificationStatus.value === 'provisional')
const deleteCanConfirm = computed(() => deleteText.value.trim().toUpperCase() === copy.value.deleteWord)
const latestSupportTicket = computed(() => supportTickets.value[0] || null)
const supportSubmitLabel = computed(() => {
  if (busy.value) return supportCopy.value.supportSending
  if (supportSubmissionState.value === 'sent' && latestSupportTicket.value) {
    return supportCopy.value.supportSent.replace('{id}', latestSupportTicket.value.displayID)
  }
  return supportCopy.value.supportSubmit
})
const currentTitle = computed(() => {
  if (page.value === 'eula') return legalCopy.value.eula.title
  return ({
    main: copy.value.title,
    help: copy.value.helpTitle,
    guidelines: copy.value.rulesTitle,
    support: supportCopy.value.supportTitle,
    verify: copy.value.verifyTitle,
    policies: copy.value.policiesTitle,
  }[page.value] || copy.value.title)
})

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey.value) || 'null')
    if (saved && typeof saved === 'object') preferences.value = { ...defaultPreferences, ...saved }
  } catch { preferences.value = { ...defaultPreferences } }
}
function loadPurchaseHistory() {
  try {
    const wallet = createCoinWalletStore({ accountID: props.accountId })
    purchaseHistory.value = wallet.getSnapshot().transactions.filter((item) => item.type === 'storekit_purchase')
  } catch { purchaseHistory.value = [] }
}
function loadSupportTickets() {
  try {
    const saved = JSON.parse(localStorage.getItem(`oivox.supportTickets.v1:${props.accountId}`) || '[]')
    supportTickets.value = Array.isArray(saved) ? saved : []
  } catch { supportTickets.value = [] }
}
function flash(message, isError = false) {
  window.clearTimeout(noticeTimer)
  notice.value = isError ? '' : message
  error.value = isError ? message : ''
  noticeTimer = window.setTimeout(() => { notice.value = ''; error.value = '' }, 2600)
}
function togglePreference(key) {
  preferences.value = { ...preferences.value, [key]: !preferences.value[key] }
  localStorage.setItem(preferenceKey.value, JSON.stringify(preferences.value))
  flash(copy.value.settingsSaved)
}
function open(nextPage) {
  error.value = ''
  notice.value = ''
  if (nextPage === 'support') supportSubmissionState.value = 'idle'
  if (nextPage === 'policies') legalMode.value = 'terms'
  pageTransitionDirection.value = 'forward'
  page.value = nextPage
}
function selectLegalMode(mode) {
  legalMode.value = mode
  nextTick(() => { if (legalScroll.value) legalScroll.value.scrollTop = 0 })
}
function back() {
  if (deleteDialogOpen.value) { closeDeleteDialog(); return }
  if (busy.value) return
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  error.value = ''; notice.value = ''
  if (page.value !== 'main') pageTransitionDirection.value = 'back'
  if (page.value === 'main') emit('close')
  else if (page.value === 'support') page.value = 'help'
  else page.value = 'main'
}
async function toggleNotifications() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    if (!notificationOn.value) {
      const result = await nativeBridge.requestNotifications({ pageInstanceID: 'privacy-notification' })
      notificationStatus.value = result?.status || (result?.granted ? 'authorized' : 'denied')
      if (!result?.granted) flash(copy.value.notificationDenied, true)
    } else {
      flash(copy.value.notificationDenied)
    }
  } catch { flash(copy.value.notificationError, true) }
  finally { busy.value = false }
}
async function submitSupport() {
  if (busy.value) return
  if (supportCategory.value < 0 || !supportDetails.value.trim()) { flash(supportCopy.value.supportRequired, true); return }
  busy.value = true
  supportSubmissionState.value = 'sending'
  try {
    const key = `oivox.supportTickets.v1:${props.accountId}`
    const now = Date.now()
    const ticket = { id: `local-${now}`, displayID: `#${String(now).slice(-4)}`, category: supportCategory.value, details: supportDetails.value.trim(), status: 'waiting', createdAt: new Date(now).toISOString(), localOnly: true }
    const tickets = [ticket, ...supportTickets.value]
    localStorage.setItem(key, JSON.stringify(tickets.slice(0, 10)))
    await new Promise((resolve) => window.setTimeout(resolve, 220))
    supportTickets.value = tickets.slice(0, 10)
    supportSubmissionState.value = 'sent'
    flash(supportCopy.value.supportSaved)
  } catch {
    supportSubmissionState.value = 'idle'
    flash(copy.value.notificationError, true)
  }
  finally { busy.value = false }
}
function changeSupportCategory(index) { supportCategory.value = index; supportSubmissionState.value = 'idle' }
function formatPurchaseDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return copy.value.purchaseDateUnknown
  return new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(date)
}
function formatBlockedAt(value) {
  if (!value) return copy.value.blockedOnDevice
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return copy.value.blockedOnDevice
  return copy.value.blockedDate.replace('{date}', new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(date))
}
function supportTicketSummary(ticket) {
  const value = String(ticket?.details || '').trim()
  return value.length > 48 ? `${value.slice(0, 47)}…` : value
}
function unblock(personID) {
  if (busy.value || unblockingID.value) return
  unblockingID.value = personID
  emit('unblock', personID)
  window.clearTimeout(unblockTimer)
  unblockTimer = window.setTimeout(() => { unblockingID.value = '' }, 500)
}
function openDeleteDialog() {
  deleteText.value = ''
  deleteSubmissionState.value = 'editing'
  deleteDialogOpen.value = true
}
function focusDeleteInput() { deleteInput.value?.focus({ preventScroll: true }) }
function closeDeleteDialog() {
  if (deleteBusy.value) return
  deleteInput.value?.blur()
  deleteDialogOpen.value = false
  deleteText.value = ''
  deleteSubmissionState.value = 'editing'
}
function updateDeleteText() { deleteSubmissionState.value = 'editing' }
async function attemptDelete() {
  if (deleteBusy.value || !deleteCanConfirm.value) return
  deleteBusy.value = true
  deleteSubmissionState.value = 'submitting'
  try {
    await oivoxAccountApi.deleteAccount()
    if (!mounted) return
    clearAccountLocalData(props.accountId)
    deleteSubmissionState.value = 'deleted'
    deleteDialogOpen.value = false
    emit('logout')
  } catch {
    if (!mounted) return
    deleteSubmissionState.value = 'error'
    flash(copy.value.deleteError, true)
  } finally {
    if (mounted) deleteBusy.value = false
  }
}
function handleKeydown(event) {
  if (event.key === 'Escape' && deleteDialogOpen.value) closeDeleteDialog()
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  loadPreferences()
  loadPurchaseHistory()
  loadSupportTickets()
  try { notificationStatus.value = (await nativeBridge.getNotificationStatus({ pageInstanceID: 'privacy-notification' }))?.status || 'notDetermined' } catch { notificationStatus.value = 'notDetermined' }
})
onBeforeUnmount(() => {
  mounted = false
  window.clearTimeout(noticeTimer)
  window.clearTimeout(unblockTimer)
  window.removeEventListener('keydown', handleKeydown)
  nativeBridge.cancelPage('privacy-notification')
})
</script>

<template>
  <main class="privacy-account-screen app-screen" :class="[`privacy-page-${page}`, { 'has-delete-dialog': deleteDialogOpen }]" :aria-busy="busy || deleteBusy ? 'true' : undefined">
    <Transition :name="`ios-page-${pageTransitionDirection}`">
    <div :key="page" class="privacy-page-frame" :class="`privacy-page-frame-${page}`">
    <header v-if="page === 'support'" class="privacy-account-nav privacy-support-nav">
      <button type="button" :disabled="busy" @click="back">{{ supportCopy.supportCancel }}</button>
      <h1>{{ currentTitle }}</h1>
      <span />
    </header>
    <header v-else class="privacy-account-nav">
      <button type="button" :aria-label="copy.back" @click="back"><img :src="arrowLeftIcon" alt=""></button>
      <h1>{{ currentTitle }}</h1>
      <span />
    </header>

    <p v-if="notice" class="privacy-account-toast" role="status">{{ notice }}</p>
    <p v-if="error" class="privacy-account-toast error" role="alert">{{ error }}</p>

    <section v-if="page === 'main'" class="privacy-account-scroll">
      <div class="privacy-toggle-list">
        <button type="button" role="switch" :aria-checked="preferences.countryAndTimezoneOnly" @click="togglePreference('countryAndTimezoneOnly')"><span><strong>{{ copy.preciseTitle }}</strong><small>{{ copy.preciseNote }}</small></span><i :class="{ on: preferences.countryAndTimezoneOnly }"><b /></i></button>
        <button type="button" role="switch" :aria-checked="preferences.unsafeVoiceFilter" @click="togglePreference('unsafeVoiceFilter')"><span><strong>{{ copy.filterTitle }}</strong><small>{{ copy.filterNote }}</small></span><i :class="{ on: preferences.unsafeVoiceFilter }"><b /></i></button>
        <button type="button" role="switch" :aria-checked="preferences.globeFriendRequests" @click="togglePreference('globeFriendRequests')"><span><strong>{{ copy.requestsTitle }}</strong><small>{{ copy.requestsNote }}</small></span><i :class="{ on: preferences.globeFriendRequests }"><b /></i></button>
        <button type="button" role="switch" :aria-checked="preferences.voiceReminders" @click="togglePreference('voiceReminders')"><span><strong>{{ copy.remindersTitle }}</strong><small>{{ copy.remindersNote }}</small></span><i :class="{ on: preferences.voiceReminders }"><b /></i></button>
      </div>

      <div class="privacy-link-list">
        <button type="button" @click="open('help')"><strong>{{ copy.blocked }}</strong><span>{{ blockedPeople.length }} <img :src="chevronIcon" alt=""></span></button>
        <button type="button" @click="open('guidelines')"><strong>{{ copy.guidelines }}</strong><span><img :src="chevronIcon" alt=""></span></button>
        <button type="button" @click="open('help')"><strong>{{ copy.support }}</strong><span><img :src="chevronIcon" alt=""></span></button>
        <button type="button" @click="open('verify')"><strong>{{ copy.verify }}</strong><span :class="{ positive: verified }">{{ verified ? copy.verified : '' }} <img :src="chevronIcon" alt=""></span></button>
        <button type="button" @click="emit('open-language')"><strong>{{ copy.language }}</strong><span>{{ locale.toUpperCase() }} <img :src="chevronIcon" alt=""></span></button>
        <button type="button" :disabled="busy" @click="toggleNotifications"><strong>{{ copy.notifications }}</strong><span>{{ notificationOn ? copy.on : copy.off }} <img :src="chevronIcon" alt=""></span></button>
        <button type="button" @click="open('eula')"><strong>{{ legalCopy.labels.eula }}</strong><span><img :src="chevronIcon" alt=""></span></button>
        <button type="button" @click="open('policies')"><strong>{{ copy.terms }}</strong><span><img :src="chevronIcon" alt=""></span></button>
      </div>

      <section class="privacy-danger-zone">
        <h2>{{ copy.deleteSection }}</h2>
        <p>{{ copy.coinWarning }}</p>
        <button type="button" @click="openDeleteDialog">{{ copy.deleteAction }}</button>
      </section>
      <button class="privacy-signout" type="button" @click="emit('logout')">{{ copy.signOut }}</button>
    </section>

    <section v-else-if="page === 'help'" class="privacy-subpage-layout privacy-help-page">
      <div class="privacy-account-scroll">
        <h2>{{ copy.blockedTitle }}</h2>
        <div class="privacy-blocked-list">
          <article v-for="person in blockedPeople" :key="person.id">
            <img :src="person.avatarAsset" alt="">
            <span><strong>{{ person.displayName }}</strong><small>{{ formatBlockedAt(person.blockedAt) }}</small></span>
            <button type="button" :disabled="busy || unblockingID === person.id" @click="unblock(person.id)">{{ copy.unblock }}</button>
          </article>
          <p v-if="!blockedPeople.length">{{ copy.noBlocked }}</p>
        </div>
        <p class="privacy-help-promise"><span>{{ copy.weReply }}</span><strong>{{ copy.within24Hours }}</strong></p>
        <div class="privacy-help-links">
          <button type="button" @click="open('support')"><span>{{ copy.reportProblem }}</span><img :src="chevronIcon" alt=""></button>
          <button type="button" @click="emit('open-store')"><span>{{ copy.coinHelp }}</span><img :src="chevronIcon" alt=""></button>
          <button type="button" @click="open('guidelines')"><span>{{ copy.voiceSafety }}</span><img :src="chevronIcon" alt=""></button>
          <button type="button" @click="open('policies')"><span>{{ copy.terms }}</span><img :src="chevronIcon" alt=""></button>
        </div>
        <section class="privacy-purchase-card">
          <h2>{{ copy.purchaseHistory }}</h2>
          <div v-if="purchaseHistory.length" class="privacy-purchase-list">
            <p v-for="purchase in purchaseHistory" :key="purchase.transactionID"><span>{{ purchase.amount }} {{ copy.coinsUnit }} · {{ copy.appStore }}</span><time :datetime="purchase.createdAt">{{ formatPurchaseDate(purchase.createdAt) }}</time></p>
          </div>
          <p v-else class="privacy-empty-copy">{{ copy.noPurchases }}</p>
        </section>
      </div>
      <footer class="privacy-fixed-action"><button class="privacy-primary" type="button" @click="open('support')">{{ copy.contactSupport }}</button></footer>
    </section>

    <section v-else-if="page === 'guidelines'" class="privacy-subpage-layout privacy-guidelines-page">
      <div class="privacy-account-scroll">
        <div class="privacy-rules-card">
          <span><img :src="shieldIcon" alt="">{{ copy.rulesBadge }}</span>
          <div class="privacy-rules-card-content"><div><h2>{{ copy.rulesHeading }}</h2><p>{{ copy.rulesSubtitle }}</p></div><aside><span><img :src="heartIcon" alt=""></span><span><img :src="microphoneIcon" alt=""></span></aside></div>
        </div>
        <h3>{{ copy.notAllowed }}</h3>
        <ul><li v-for="item in copy.ruleItems" :key="item"><img :src="crossIcon" alt=""><span>{{ item }}</span></li></ul>
      </div>
      <footer class="privacy-fixed-action"><button class="privacy-primary" type="button" @click="back">{{ copy.understand }}</button><p class="privacy-footer-note">{{ copy.rulesFooter }}</p></footer>
    </section>

    <section v-else-if="page === 'support'" class="privacy-subpage-layout privacy-support-page">
      <div class="privacy-account-scroll">
        <h2>{{ supportCopy.supportAbout }}</h2>
        <div class="privacy-support-categories"><button v-for="(item, index) in supportCopy.supportCategories" :key="item" type="button" :class="{ selected: supportCategory === index }" :aria-pressed="supportCategory === index" @click="changeSupportCategory(index)"><i /><span>{{ item }}</span></button></div>
        <label for="privacy-support-details">{{ supportCopy.supportDetails }}</label>
        <div class="privacy-support-input"><textarea id="privacy-support-details" v-model="supportDetails" maxlength="500" :placeholder="supportCopy.supportPlaceholder" @input="supportSubmissionState = 'idle'"/></div>
        <div class="privacy-support-counter"><span>{{ supportCopy.supportPrivate }}</span><span>{{ supportDetails.length }}/500</span></div>
        <section v-if="latestSupportTicket" class="privacy-open-ticket">
          <h2>{{ supportCopy.supportOpen }}</h2>
          <div><b>{{ latestSupportTicket.displayID || '—' }}</b><span>{{ supportTicketSummary(latestSupportTicket) }}</span><small>{{ supportCopy.supportWaiting }}</small></div>
        </section>
      </div>
      <footer class="privacy-fixed-action"><button class="privacy-primary" :class="{ success: supportSubmissionState === 'sent' }" type="button" :disabled="busy || supportSubmissionState === 'sent'" @click="submitSupport">{{ supportSubmitLabel }}</button><p class="privacy-footer-note">{{ supportCopy.supportSimulated }}</p></footer>
    </section>

    <section v-else-if="page === 'verify'" class="privacy-account-scroll privacy-info-page"><img :src="shieldIcon" alt=""><h2>{{ copy.verifyTitle }}</h2><p>{{ copy.verifyBody }}</p><strong v-if="verified">{{ copy.verified }}</strong></section>

    <section v-else-if="page === 'eula'" class="privacy-account-scroll privacy-eula-page">
      <header class="privacy-legal-heading">
        <h2>{{ legalCopy.eula.title }}</h2>
        <p><span>{{ legalCopy.labels.effective }}</span><span>{{ legalCopy.labels.version }}</span></p>
      </header>
      <article class="privacy-legal-intro"><p>{{ legalCopy.eula.intro }}</p></article>
      <article v-for="item in legalCopy.eula.sections" :key="item.title"><h2>{{ item.title }}</h2><p>{{ item.body }}</p></article>
      <p class="privacy-legal-contact">{{ legalCopy.labels.contact }}</p>
    </section>

    <section v-else-if="page === 'policies'" ref="legalScroll" class="privacy-account-scroll privacy-policies-page">
      <nav class="legal-tabs legal-tabs-two privacy-legal-tabs" :aria-label="legalCopy.labels.contents">
        <button v-for="mode in ['terms', 'privacy']" :key="mode" type="button" :class="{ selected: legalMode === mode }" :aria-pressed="legalMode === mode" @click="selectLegalMode(mode)">{{ legalCopy.labels[mode] }}</button>
      </nav>
      <header class="privacy-legal-heading">
        <h2>{{ activeLegalDocument.title }}</h2>
        <p><span>{{ legalCopy.labels.effective }}</span><span>{{ legalCopy.labels.version }}</span></p>
      </header>
      <article class="privacy-legal-intro"><p>{{ activeLegalDocument.intro }}</p></article>
      <article v-for="item in activeLegalDocument.sections" :key="item.title"><h2>{{ item.title }}</h2><p>{{ item.body }}</p></article>
      <p class="privacy-legal-contact">{{ legalCopy.labels.contact }}</p>
    </section>
    </div>
    </Transition>

    <Transition name="privacy-delete" @after-enter="focusDeleteInput">
      <div v-if="deleteDialogOpen" class="privacy-delete-backdrop" role="presentation" @click.self="closeDeleteDialog">
        <section class="privacy-delete-sheet" role="dialog" aria-modal="true" aria-labelledby="privacy-delete-title">
          <div class="privacy-delete-icon" aria-hidden="true"><img :src="deleteTrashIcon" alt=""></div>
          <h2 id="privacy-delete-title">{{ copy.deleteTitle }}</h2>
          <p class="privacy-delete-intro">{{ copy.deleteIntro }}</p>
          <ul class="privacy-delete-impact-list">
            <li v-for="item in copy.deleteItems" :key="item"><img :src="crossIcon" alt=""><span>{{ item }}</span></li>
          </ul>
          <form @submit.prevent="attemptDelete">
            <label for="privacy-delete-confirm">{{ copy.deletePrompt }}</label>
            <div class="privacy-delete-field" :class="{ valid: deleteCanConfirm }">
              <input id="privacy-delete-confirm" ref="deleteInput" v-model="deleteText" :placeholder="copy.deleteWord" autocomplete="off" autocapitalize="characters" enterkeyhint="done" spellcheck="false" @input="updateDeleteText">
              <img v-if="deleteCanConfirm" :src="checkGreenIcon" alt="">
            </div>
            <p class="privacy-delete-note">{{ copy.coinWarning }}</p>
            <p v-if="deleteSubmissionState === 'error'" class="privacy-delete-feedback" role="alert">{{ copy.deleteError }}</p>
            <button class="privacy-delete-confirm" type="submit" :disabled="!deleteCanConfirm || deleteBusy">
              <span v-if="deleteBusy" class="button-spinner" aria-hidden="true" />
              {{ copy.deleteConfirm }}
            </button>
            <button class="privacy-delete-cancel" type="button" :disabled="deleteBusy" @click="closeDeleteDialog">{{ copy.cancel }}</button>
          </form>
        </section>
      </div>
    </Transition>
  </main>
</template>
