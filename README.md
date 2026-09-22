# OiVox

OiVox is a Vue H5 application embedded in a UIKit `WKWebView` iOS shell.

The local account API lives in `server/`. Login and registration are separate: an unknown login returns `ACCOUNT_NOT_FOUND` and never creates an account. See `server/README.md` for endpoints and startup instructions.

## Web development

```bash
pnpm install
pnpm dev
```

The language screen supports English, Arabic, Hebrew, Turkish, French, German, Japanese, and Korean. On first launch it uses the first supported system language. A saved choice wins on subsequent launches. Removing the app clears both `UserDefaults` and the WebKit website data container, so a reinstall follows first-launch selection again.

## iOS build

```bash
pnpm install
pnpm build
./scripts/build-web.sh
open ios/OiVox.xcodeproj
```

Select a development team and replace the placeholder StoreKit product identifiers before testing purchases. App-name and system permission localization follow the iOS system/App language; in-app language selection immediately updates H5 UI and is persisted through the native bridge.

## Native bridge

H5 calls `window.webkit.messageHandlers.oivox` through `src/nativeBridge.js`. The allow-listed actions cover language persistence, microphone/camera permission, StoreKit purchase/restore, and local report/block safety records. No production backend is connected.
