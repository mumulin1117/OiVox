# OiVox launch and WebView handoff

The iOS scene starts at OivoxShowingCoordinator. Open uses the OiVox contract as documented in Oivox-仅活体-42618403: POST /moment8/hear/personality, the three required identity headers and no account credentials. Missing or non-HTTPS destination, network errors, HTTP errors and nonzero result codes retry after 1.5 seconds. Each transition cancels the previous task and drops stale completions. The device identifier stays in Keychain with an install fallback. An optional push token is only included when available.

Debug builds print Open's request method, URL, explicit request headers and JSON parameters, followed by the HTTP status, response headers and JSON body. Each attempt has a shared request/response UUID, including retries; transport failures print only the error domain and code. Headers added by URLSession or the network stack are not included in the request snapshot. Credentials, cookies, the optional push token and private destination paths/query strings are redacted. These diagnostics use the existing console logger and do not add an in-app screen or persist payloads. Release builds do not emit them.

| Destination | Entry | Handoff |
| --- | --- | --- |
| Welcome message | Any valid HTTPS destination from Open or registration; its path and filename do not select a route | OivoxWelcome with Sure or Continue and source OivoxWelcome opens bundled registration |
| Community message | Same | OivoxCommunityRules with Sure or Iknow and source OivoxCommunity enters A with the captured or resumed account. Missing account identity returns to registration |
| Registration | VivoxsoundKeep/Registration/index.html with appId, appVersion, deviceId and optional pushToken | Its existing openUrl string is distributed through the same rules. An isolated script correlates the callback with the submitted login identifier or nickname. It never reads the password |
| Business | HTTPS destination with an Ably token grant and an authorized concrete channel | For a URL-only callback, refresh Open once and use the grant only on origin and path match. Check the explicit room against the grant or infer exactly one concrete channel. An allowed Ably WSS override is optional. Send ATTACH (`10`) after CONNECTED (`4`) and wait for ATTACHED (`11`) for the current channel before consuming MESSAGE (`15`) |
| Other HTTPS | No usable business connection | Loads the returned URL directly and listens for both onboarding messages, without enabling purchases. oivoxSignOut with action logout returns to registration |
| A | Approved Community action plus captured or resumed local account | Existing A view and native media bridge, with local profile and business storage. oivoxShowingAccount reports logout or account-loading failure to the host |

Remote pages register both existing onboarding message channels before loading the exact backend-selected URL. Native code chooses the next step from the channel, source and action, not the document filename. Invalid or mismatched messages are ignored rather than being treated as logout. Onboarding callbacks must come from the ready active main WebView document at the original destination's origin and path; subframes, other pages, disposed views and repeated callbacks cannot trigger another handoff. A nonbusiness registration callback's account stays in memory until the Community action selects it; business handoff retains its existing account selection. Load failures show the existing retry UI instead of guessing a bundled onboarding page. The unused bundled page copies remain part of the unchanged resource archive. The registration distribution is bundled from New_login_dist with the OiVox endpoint and localization. The original /client/ paths and payload fields remain as shipped. The privileged H5 bridge checks the active main frame and its document or origin.

The selected account identifier is kept in Keychain. A matches preexisting cached ordinary profiles by exact account identifier when the match is unique. New local profiles use a digest scoped to their identifier. The fixed test account retains its original ID and default profile. Existing profiles, messages, wallets and discovery, voice and translation state retain their existing storage keys. Logging out removes session selection without clearing business data. Deleting an account removes its profile and associated A data. No old A HTTP account endpoints are used. A device coming from an older install without a selected account needs to enter via New_login_dist once.

Business bridge fields and the enabled receipt configuration are in `VivoxsoundKeep/oivox-business.json`. H5 can subscribe to native `window.message` events for `oivoxBusinessState` version 1 and read the last value from `window.OiVoxBusinessState`. `purchaseEnabled` requires a visible ready business page, ATTACHED for the current connection, foreground state, readable order storage, StoreKit availability, and an approved enabled receipt endpoint. The native purchase handler checks command freshness and order ownership. No backend subscription-ready HTTP request is configured.

The B purchase observer registers with `SKPaymentQueue` at process launch and retries owned transactions on foreground activation. B saves the order before submitting a StoreKit 1 payment. It sets `SKMutablePayment.productIdentifier` to `data.TempoMerge`, sets quantity to 1, and puts the B order UUID in `applicationUsername`. The backend supplies the App Store Connect product ID for this app. Recovery matches the original product and order UUID or the exact Apple transaction ID previously bound to the order. Existing v1 records are read from preferences when the file is absent. A uses its existing StoreKit 2 catalog and purchase flow.

The configured OiVox verifier is `https://oiv.fenneldrift93.bid/oivox/checkorder`. The native URL validator also accepts the legacy double-slash path, without rewriting either URL or following redirects. It expects `streamPhoneme` (Apple transaction ID), `flowLexis` (Base64 App Store receipt), and `quickSyllable` (original order ID). HTTP 2xx with an empty JSON object is success. A missing receipt can be refreshed after a purchase or an explicit retry. Persist verified status before ending the transaction. `payResult` is delivered only to the initiating document session. After a reload or account switch, H5 reads the backend order state.

Cold start and foreground recovery also retry durable unverified records with a nonempty Apple transaction ID when no matching StoreKit queue entry exists. Records without an Apple transaction ID and transactions linked to multiple local orders are retained without submission. Recovery reuses the original order, transaction ID and receipt; it never adds a payment, credits a wallet locally or dispatches an old result to a new document. Each recovery batch and each order's verification are coalesced; automatic recovery attempts for the same order are spaced by at least 30 seconds, while explicit retries may bypass this interval. HTTP response status and byte count are logged in Debug builds, including HTTP 200.

A new purchase for the same product also retries an eligible saved pending order before submitting any new payment, even with an empty StoreKit queue. The verifier requires a JSON request body: the 2026-11-20 iPhonex comparison returned HTTP 415 with `JSON request body required` for form encoding. Initial JSON requests using a local StoreKit receipt returned HTTP 400 with `Invalid parameters`. After moving the device test to Sandbox, the device logged HTTP 200 with a two-byte response, `storeKitReceiptConfirmed` and `purchaseResultDispatched`; the two nonlocal transaction-linked records were verified. Debug request metadata logs only parameter lengths, never receipt or order values.

The same device audit found a cryptographically signed local StoreKit receipt for `com.zww.app.cn.com`, issued by a self-signed StoreKit certificate rather than Apple. Three saved records matched the product and transaction IDs inside that local receipt. Those original records are retained with optional `storeEnvironment: "xcode"` metadata, remain unverified, and are excluded from real-server recovery and purchase blocking. Missing metadata remains backward-compatible. The shared Run scheme no longer enables `uuuu.storekit` by default; keep the file for explicit local tests. After an HTTP 400, an explicit retry may refresh an already-cached receipt through StoreKit; startup recovery never opens a receipt refresh prompt on its own. Local StoreKit receipts cannot be validated by Apple's receipt verification service.

The dedicated B WebView uses an isolated, persistent website data store on iOS 17 and later and a temporary session on earlier iOS. B logout clears its website data store before opening registration. Same-origin popups stay in the WebView. Approved external HTTPS and App Store URLs go through the system opener. Media capture requires a recent trusted interaction in the active, same-origin main document, then uses the WebKit permission prompt. Native navigation and background cleanup stop camera and microphone capture. The page may consume `--oivox-safe-area-top`, `--oivox-safe-area-right`, `--oivox-safe-area-bottom`, and `--oivox-safe-area-left` when it needs native insets.

The 2026-11-20 iPhonex audit identified two signed, unfinished Sandbox transactions for `zww_4` and `zww_5`. Neither matched the current A product catalog or an exact B order in the current or legacy store. The separate read-only audit confirmed that Apple returned `zww_4` for the installed bundle. Both unfinished transactions were retained pending ownership confirmation. No new purchase was submitted for this audit.

See [跨项目接入指令](b-integration-playbook.md) for the copy-ready prompt, frontend event example, and device acceptance checklist.

Run the deterministic Open and Ably checks without contacting a backend:

```sh
swiftc -swift-version 6 ios/OiVox/OivoxShowing/OivoxtuneFind.swift ios/OiVox/OivoxShowing/OivoxnoiseFind.swift ios/OiVox/OivoxShowing/Tests/ContractTests.swift -o /tmp/oivox-showing-tests
/tmp/oivox-showing-tests
pnpm exec vitest run src/services/oivoxAccountApi.test.js
```

For integration testing, deploy the two onboarding pages at arbitrary paths and preserve the distinct message channel/source/action combinations above. No new backend page-type field is required. Verify disconnect and retry, Welcome to registration, Community handoff to A with two accounts and the missing-account fallback, reconnect and logout, and all active StoreKit states on an authorized test device. No credential or complete H5 destination should be printed.

## Packaged local H5 resources

Edit the H5 source under `ios/OiVox/VivoxsoundKeep/`. Xcode copies the prebuilt `meadow-resources.bundle` into the app and can build without the H5 source folder. Running `scripts/build-web.sh` regenerates the archive when the source folder is available. To refresh just this archive, run the following from the repository root. If the source lives elsewhere, pass its path as the first argument.

```sh
sh scripts/package-webapp.sh ios/OiVox/VivoxsoundKeep ios/OiVox/OivoxShowing/meadow-resources.bundle vivox
```

The package uses two LZFSE compression passes followed by AES-256-GCM with a random nonce. The 64-character resource key is defined once in `VivoxsoundKeep.swift` and shared by the build tool and runtime. The existing A bundle keeps its original key and format. The key ships with the client for offline loading; this protects packaged resources, and is not a place to store service credentials.

Before Open or StoreKit observation, the coordinator prepares these assets off the main actor, loads the unchanged business configuration, and then follows the existing route. Decryption authenticates the package; extraction checks bounds, duplicate paths, traversal, required entries, and symlinks. The versioned cache is rebuilt if a resource is missing or damaged. Failures retain the existing loading/retry UI. No account, website data store, or order data is reset.

```sh
swiftc -swift-version 6 ios/OiVox/OivoxShowing/VivoxsoundKeep.swift ios/OiVox/OivoxShowing/Tests/WebArchiveTests.swift -o /tmp/oivox-web-archive-tests
/tmp/oivox-web-archive-tests
```
