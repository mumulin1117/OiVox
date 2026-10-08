@preconcurrency import AVFoundation
import Security
import StoreKit
@preconcurrency import Translation
import SwiftUI
import UIKit
import UserNotifications
import Vision
import WebKit
import Photos
import PhotosUI
import UniformTypeIdentifiers

final class NativeBridge: NSObject, WKScriptMessageHandler {
    static let handlerName = "oivox"
    private unowned let presenter: UIViewController
    private let store = StoreService()
    private lazy var media = NativeMediaCoordinator(presenter: presenter, emit: emit)
    private lazy var avatarPicker = NativeAvatarPicker(presenter: presenter)

    init(presenter: UIViewController) { self.presenter = presenter; super.init() }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.handlerName, let body = message.body as? [String: Any] else { return }
        let requestID = body["id"] as? String
        let payload = body["payload"] as? [String: Any] ?? [:]
        Task { @MainActor in
            do {
                let result: Any
                if let service = body["service"] as? String, let method = body["method"] as? String {
                    result = try await handle(service: service, method: method, payload: payload)
                } else if let action = body["action"] as? String {
                    result = try await handleLegacy(action: action, payload: payload)
                } else { throw BridgeError(.invalidPayload, "Missing service and method.") }
                respond(to: message.webView, requestID: requestID, result: result)
            } catch { reject(on: message.webView, requestID: requestID, error: error) }
        }
    }

    @MainActor private func handle(service: String, method: String, payload: [String: Any]) async throws -> Any {
        switch (service, method) {
        case ("Language", "get"): return LanguagePreference.current
        case ("Language", "set"):
            guard let language = payload["language"] as? String, LanguagePreference.supported.contains(language) else { throw BridgeError(.invalidPayload) }
            LanguagePreference.current = language
            return ["language": language]
        case ("Permission", "getStatus"):
            guard let permission = payload["permission"] as? String else { throw BridgeError(.invalidPayload) }
            return ["status": permissionStatus(permission)]
        case ("Permission", "request"):
            guard let permission = payload["permission"] as? String else { throw BridgeError(.invalidPayload) }
            #if DEBUG
            print("[OiVox Permission] Requesting \(permission); current status: \(permissionStatus(permission))")
            #endif
            let granted = await requestPermission(permission)
            #if DEBUG
            print("[OiVox Permission] Completed \(permission); granted: \(granted); status: \(permissionStatus(permission))")
            #endif
            return ["granted": granted, "status": granted ? "authorized" : permissionStatus(permission)]
        case ("Permission", "openSettings"):
            guard let settingsURL = URL(string: UIApplication.openSettingsURLString), UIApplication.shared.canOpenURL(settingsURL) else {
                throw BridgeError(.deviceUnsupported, "The OiVox settings page is unavailable.")
            }
            let opened = await withCheckedContinuation { continuation in
                UIApplication.shared.open(settingsURL, options: [:]) { continuation.resume(returning: $0) }
            }
            return ["opened": opened]
        case ("Liveness", "startFrontCapture"):
            guard await requestPermission("camera") else {
                throw BridgeError(.permissionDenied, "Camera access is required for verification.")
            }
            return try await media.startLiveness(payload: payload)
        case ("Liveness", "stopCapture"): try media.stopLiveness(deleteMedia: true); return ["stopped": true]
        case ("Liveness", "release"): media.releaseLiveness(); return ["released": true]
        case ("VoiceRecorder", "start"):
            guard let assetID = payload["assetID"] as? String else { throw BridgeError(.invalidPayload) }
            guard await requestPermission("microphone") else { throw BridgeError(.permissionDenied, "Microphone access is required to record.") }
            return try media.startVoice(assetID: assetID, maxDurationMs: payload["maxDurationMs"] as? Int ?? 7_000)
        case ("VoiceRecorder", "stop"):
            guard let assetID = payload["assetID"] as? String else { throw BridgeError(.invalidPayload) }
            return try media.stopVoice(assetID: assetID)
        case ("VoiceRecorder", "discard"):
            guard let assetID = payload["assetID"] as? String else { throw BridgeError(.invalidPayload) }
            media.discardVoice(assetID: assetID); return ["assetID": assetID, "discarded": true]
        case ("VoiceRecorder", "publish"):
            guard let assetID = payload["assetID"] as? String else { throw BridgeError(.invalidPayload) }
            return try media.publishVoice(assetID: assetID)
        case ("VoicePlayback", "play"):
            guard let assetID = payload["assetID"] as? String else { throw BridgeError(.invalidPayload) }
            return try media.playVoice(assetID: assetID)
        case ("VoicePlayback", "pause"): return media.pauseVoice()
        case ("VoicePlayback", "stop"): return media.stopVoicePlayback()
        case ("Notification", "getAuthorizationStatus"):
            let settings = await UNUserNotificationCenter.current().notificationSettings()
            return ["status": notificationStatus(settings.authorizationStatus)]
        case ("Notification", "requestAuthorization"):
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
            let settings = await UNUserNotificationCenter.current().notificationSettings()
            return ["granted": granted, "status": notificationStatus(settings.authorizationStatus)]
        case ("SecureStore", "get"):
            guard let key = payload["key"] as? String else { throw BridgeError(.invalidPayload) }
            return ["value": KeychainStore.read(key) as Any]
        case ("SecureStore", "set"):
            guard let key = payload["key"] as? String, let value = payload["value"] as? String else { throw BridgeError(.invalidPayload) }
            try KeychainStore.write(value, key: key); return ["stored": true]
        case ("SecureStore", "delete"):
            guard let key = payload["key"] as? String else { throw BridgeError(.invalidPayload) }
            KeychainStore.delete(key); return ["deleted": true]
        case ("Account", "request"):
            return try LocalReviewAccount.request(payload)
        case ("PhotoPicker", "selectSupportScreenshot"): return try await avatarPicker.selectSupportScreenshot()
        case ("AvatarPicker", "choose"):
            #if DEBUG
            print("[OiVox Permission] Opening native avatar source picker")
            #endif
            return try await avatarPicker.choose(labels: payload)
        case ("AvatarPicker", "loadPreview"):
            guard let localAssetID = payload["localAssetID"] as? String else { throw BridgeError(.invalidPayload) }
            return try avatarPicker.loadPreview(localAssetID: localAssetID)
        case ("Store", "purchase"):
            guard let productID = payload["productID"] as? String else { throw BridgeError(.invalidPayload) }
            return try await store.purchase(productID: productID)
        case ("Store", "listProducts"):
            guard let productIDs = payload["productIDs"] as? [String] else { throw BridgeError(.invalidPayload) }
            return try await store.products(productIDs: productIDs)
        case ("Store", "restorePurchases"): try await AppStore.sync(); return ["restored": true]
        case ("Translation", "translateText"):
            guard let text = payload["text"] as? String,
                  let sourceLanguage = payload["sourceLanguage"] as? String,
                  let targetLanguage = payload["targetLanguage"] as? String,
                  !text.isEmpty else { throw BridgeError(.invalidPayload) }
            guard #available(iOS 18.0, *) else { throw BridgeError(.deviceUnsupported, "Translation requires iOS 18 or later.") }
            let translatedText = try await translate(text: text, sourceLanguage: sourceLanguage, targetLanguage: targetLanguage)
            return ["translatedText": translatedText, "sourceLanguage": sourceLanguage, "targetLanguage": targetLanguage]
        case ("Safety", "reportUser"):
            guard let userID = payload["userID"] as? String, let reason = payload["reason"] as? String else { throw BridgeError(.invalidPayload) }
            SafetyStore.report(
                userID: userID,
                reason: reason,
                details: payload["details"] as? String,
                targetType: payload["targetType"] as? String,
                voiceID: payload["voiceID"] as? String,
                operationID: payload["operationID"] as? String
            )
            return ["reported": true]
        case ("Safety", "blockUser"):
            guard let userID = payload["userID"] as? String else { throw BridgeError(.invalidPayload) }
            SafetyStore.block(userID: userID); return ["blocked": true]
        case ("Safety", "unblockUser"):
            guard let userID = payload["userID"] as? String else { throw BridgeError(.invalidPayload) }
            SafetyStore.unblock(userID: userID); return ["blocked": false]
        default: throw BridgeError(.unsupportedAction, "Unsupported native operation: \(service).\(method)")
        }
    }

    @MainActor private func handleLegacy(action: String, payload: [String: Any]) async throws -> Any {
        switch action {
        case "getLanguage": return LanguagePreference.current
        case "setLanguage": return try await handle(service: "Language", method: "set", payload: payload)
        case "requestPermission": return try await handle(service: "Permission", method: "request", payload: payload)
        case "purchase": return try await handle(service: "Store", method: "purchase", payload: payload)
        case "restorePurchases": return try await handle(service: "Store", method: "restorePurchases", payload: payload)
        case "reportUser": return try await handle(service: "Safety", method: "reportUser", payload: payload)
        case "blockUser": return try await handle(service: "Safety", method: "blockUser", payload: payload)
        case "unblockUser": return try await handle(service: "Safety", method: "unblockUser", payload: payload)
        case "clientLog": print("[OiVox Web] \(payload["message"] as? String ?? "Unknown client message")"); return ["logged": true]
        case "close": presenter.dismiss(animated: true); return ["closed": true]
        default: throw BridgeError(.unsupportedAction)
        }
    }

    private func permissionStatus(_ permission: String) -> String {
        if permission == "photoLibrary" {
            switch PHPhotoLibrary.authorizationStatus(for: .readWrite) {
            case .authorized, .limited: return "authorized"
            case .denied: return "denied"
            case .restricted: return "restricted"
            case .notDetermined: return "notDetermined"
            @unknown default: return "unsupported"
            }
        }
        guard permission == "camera" || permission == "microphone" else { return "unsupported" }
        let status = AVCaptureDevice.authorizationStatus(for: permission == "camera" ? .video : .audio)
        switch status { case .authorized: return "authorized"; case .denied: return "denied"; case .restricted: return "restricted"; case .notDetermined: return "notDetermined"; @unknown default: return "unsupported" }
    }
    private func requestPermission(_ permission: String) async -> Bool {
        if permission == "photoLibrary" {
            let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
            if status == .authorized || status == .limited { return true }
            guard status == .notDetermined else { return false }
            let requested = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
            return requested == .authorized || requested == .limited
        }
        guard permission == "camera" || permission == "microphone" else { return false }
        let mediaType: AVMediaType = permission == "camera" ? .video : .audio
        let status = AVCaptureDevice.authorizationStatus(for: mediaType)
        if status == .authorized { return true }
        guard status == .notDetermined else { return false }
        return await AVCaptureDevice.requestAccess(for: mediaType)
    }
    private func notificationStatus(_ status: UNAuthorizationStatus) -> String { switch status { case .authorized: return "authorized"; case .denied: return "denied"; case .provisional: return "provisional"; case .ephemeral: return "ephemeral"; case .notDetermined: return "notDetermined"; @unknown default: return "unsupported" } }

    @available(iOS 18.0, *)
    @MainActor private func translate(text: String, sourceLanguage: String, targetLanguage: String) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            var host: UIHostingController<NativeTranslationTaskView>!
            let view = NativeTranslationTaskView(text: text, sourceLanguage: sourceLanguage, targetLanguage: targetLanguage) { result in
                host.willMove(toParent: nil)
                host.view.removeFromSuperview()
                host.removeFromParent()
                continuation.resume(with: result)
            }
            host = UIHostingController(rootView: view)
            host.view.alpha = 0.01
            host.view.isUserInteractionEnabled = false
            host.view.translatesAutoresizingMaskIntoConstraints = false
            presenter.addChild(host)
            presenter.view.addSubview(host.view)
            NSLayoutConstraint.activate([
                host.view.widthAnchor.constraint(equalToConstant: 1),
                host.view.heightAnchor.constraint(equalToConstant: 1),
                host.view.leadingAnchor.constraint(equalTo: presenter.view.leadingAnchor),
                host.view.topAnchor.constraint(equalTo: presenter.view.topAnchor),
            ])
            host.didMove(toParent: presenter)
        }
    }

    @MainActor private func emit(_ event: [String: Any]) { guard let webView = presenter.view.subviews.compactMap({ $0 as? WKWebView }).first else { return }; webView.evaluateJavaScript("window.OiVoxNative?.emit(\(json(event)));") }
    @MainActor private func respond(to webView: WKWebView?, requestID: String?, result: Any) { guard let webView, let requestID else { return }; webView.evaluateJavaScript("window.OiVoxNative?.resolve(\(json(requestID)), \(json(result)));") }
    @MainActor private func reject(on webView: WKWebView?, requestID: String?, error: Error) {
        guard let webView, let requestID else { return }
        let value: BridgeError
        if let storeError = error as? StoreServiceError {
            switch storeError {
            case .unknownProduct: value = BridgeError(.storeUnknownProduct, storeError.localizedDescription, recoverable: false)
            case .unavailable: value = BridgeError(.storeProductUnavailable, storeError.localizedDescription)
            case .failedVerification: value = BridgeError(.storeVerificationFailed, storeError.localizedDescription)
            }
        } else {
            value = error as? BridgeError ?? BridgeError(.nativeFailure, error.localizedDescription)
        }
        webView.evaluateJavaScript("window.OiVoxNative?.reject(\(json(requestID)), \(json(["code": value.code.rawValue, "message": value.localizedDescription, "recoverable": value.recoverable])));")
    }
    private func json(_ value: Any) -> String { guard JSONSerialization.isValidJSONObject(["value": value]), let data = try? JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), let string = String(data: data, encoding: .utf8) else { return "null" }; return string }
}

@available(iOS 18.0, *)
private struct NativeTranslationTaskView: View {
    let text: String
    let completion: (Result<String, Error>) -> Void
    @State private var configuration: TranslationSession.Configuration?

    init(text: String, sourceLanguage: String, targetLanguage: String, completion: @escaping (Result<String, Error>) -> Void) {
        self.text = text
        self.completion = completion
        _configuration = State(initialValue: TranslationSession.Configuration(
            source: Locale.Language(identifier: sourceLanguage),
            target: Locale.Language(identifier: targetLanguage)
        ))
    }

    var body: some View {
        Color.clear.translationTask(configuration) { session in
            do {
                let response = try await session.translate(text)
                completion(.success(response.targetText))
            } catch {
                completion(.failure(error))
            }
        }
    }
}

private struct BridgeError: LocalizedError {
    enum Code: String { case invalidPayload = "INVALID_PAYLOAD", unsupportedAction = "UNSUPPORTED_ACTION", permissionDenied = "PERMISSION_DENIED", deviceUnsupported = "DEVICE_UNSUPPORTED", mediaBusy = "MEDIA_BUSY", recordingFailed = "RECORDING_FAILED", assetNotFound = "ASSET_NOT_FOUND", avatarDecodeFailed = "AVATAR_DECODE_FAILED", avatarCropFailed = "AVATAR_CROP_FAILED", invalidAvatar = "INVALID_AVATAR", accountNotFound = "ACCOUNT_NOT_FOUND", invalidPassword = "INVALID_PASSWORD", invalidEmail = "INVALID_EMAIL", invalidPasswordFormat = "INVALID_PASSWORD_FORMAT", invalidDisplayName = "INVALID_DISPLAY_NAME", invalidHandle = "INVALID_HANDLE", invalidAboutMe = "INVALID_ABOUT_ME", invalidLanguages = "INVALID_LANGUAGES", invalidInterests = "INVALID_INTERESTS", invalidCountry = "INVALID_COUNTRY", unauthorized = "UNAUTHORIZED", accountServiceUnavailable = "ACCOUNT_SERVICE_UNAVAILABLE", storeUnknownProduct = "STORE_UNKNOWN_PRODUCT", storeProductUnavailable = "STORE_PRODUCT_UNAVAILABLE", storeVerificationFailed = "STORE_VERIFICATION_FAILED", nativeFailure = "NATIVE_FAILURE" }
    let code: Code; let message: String; let recoverable: Bool
    init(_ code: Code, _ message: String? = nil, recoverable: Bool = true) { self.code = code; self.message = message ?? code.rawValue; self.recoverable = recoverable }
    var errorDescription: String? { message }
}

/// Offline adapter for the documented fixed review account. It deliberately
/// does not create accounts or retain a password; registration remains owned by
/// the project account server. Calls still use the single OiVox bridge and the
/// same endpoint paths/response contract as the HTTP implementation.
private enum LocalReviewAccount {
    private static let accountID = "42618403-0000-4000-8000-000000000001"
    private static let email = "oivox@gmail.com"
    private static let password = "34563456"
    private static let sessionKey = "oivox.localReview.session"
    private static let profileKey = "oivox.localReview.profile"
    private static let createdAt = "2026-09-01T00:00:00Z"
    private static let supportedLanguages = Set(["en", "ar", "he", "tr", "fr", "de", "ja", "ko"])
    private static let supportedInterests = Set(["food", "travel", "movies", "music", "photography", "sports", "books", "games", "pets", "festivals", "city-life", "languages"])
    private static let allowedProfileFields = Set(["echoName", "signalTag", "portraitOrigin", "portraitMark", "portraitVaultRef", "regionMark", "daylightBand", "speakerNote", "tongueSet", "primaryTongue", "seasonBand", "curiositySet"])
    private static let wireToProfileKey = [
        "echoName": "displayName", "signalTag": "handle", "portraitOrigin": "avatarSource",
        "portraitMark": "avatarKey", "portraitVaultRef": "localAssetID", "regionMark": "countryCode",
        "daylightBand": "timezone", "speakerNote": "aboutMe", "tongueSet": "spokenLanguages",
        "primaryTongue": "preferredLanguage", "seasonBand": "ageRange", "curiositySet": "interests",
    ]
    private static let profileToWireKey = Dictionary(uniqueKeysWithValues: wireToProfileKey.map { ($0.value, $0.key) })

    static func request(_ payload: [String: Any]) throws -> Any {
        guard let path = payload["path"] as? String, let method = payload["method"] as? String else { throw BridgeError(.invalidPayload) }
        let body = payload["body"] as? [String: Any] ?? [:]
        let token = payload["token"] as? String ?? ""

        switch (method.uppercased(), path) {
        case ("POST", "/oivox/v2/orbit/enter"):
            return try login(body)
        case ("GET", "/oivox/v2/echo/self"):
            try authorize(token)
            return publicUser()
        case ("PATCH", "/oivox/v2/echo/self"):
            try authorize(token)
            try updateProfile(body)
            return publicUser()
        case ("POST", "/oivox/v2/orbit/leave"):
            try authorize(token)
            UserDefaults.standard.removeObject(forKey: sessionKey)
            return NSNull()
        case ("POST", "/oivox/v2/orbit/seed"):
            throw BridgeError(.accountServiceUnavailable, "Registration requires the OiVox local account server.")
        default:
            throw BridgeError(.unsupportedAction, "Unsupported account endpoint: \(method) \(path)")
        }
    }

    private static func login(_ body: [String: Any]) throws -> [String: Any] {
        guard let rawEmail = body["echoAddress"] as? String else { throw BridgeError(.invalidEmail, "Enter a valid email address.") }
        let normalizedEmail = rawEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard normalizedEmail.contains("@"), normalizedEmail.contains(".") else { throw BridgeError(.invalidEmail, "Enter a valid email address.") }
        guard normalizedEmail == email else { throw BridgeError(.accountNotFound, "No account exists for this email.") }
        guard let suppliedPassword = body["signalPhrase"] as? String, (8...128).contains(suppliedPassword.count) else { throw BridgeError(.invalidPasswordFormat, "Password must contain 8 to 128 characters.") }
        guard suppliedPassword == password else { throw BridgeError(.invalidPassword, "The password is incorrect.") }

        let session = UUID().uuidString.replacingOccurrences(of: "-", with: "") + String(UUID().uuidString.prefix(11))
        UserDefaults.standard.set(session, forKey: sessionKey)
        return [
            "orbitToken": session,
            "orbitScheme": "Bearer",
            "orbitEndsAt": ISO8601DateFormatter().string(from: Date().addingTimeInterval(24 * 60 * 60)),
            "speakerRecord": publicUser(),
            "reviewEcho": true,
        ]
    }

    private static func authorize(_ token: String) throws {
        guard !token.isEmpty, token == UserDefaults.standard.string(forKey: sessionKey) else { throw BridgeError(.unauthorized, "Sign in again.") }
    }

    private static func updateProfile(_ patch: [String: Any]) throws {
        guard !patch.isEmpty, Set(patch.keys).isSubset(of: allowedProfileFields) else { throw BridgeError(.invalidPayload, "Check the profile fields.") }
        if let displayName = patch["echoName"] as? String {
            let value = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
            guard (1...32).contains(value.count) else { throw BridgeError(.invalidDisplayName, "Display name must contain 1 to 32 characters.") }
        }
        if let preferredLanguage = patch["primaryTongue"] as? String, !supportedLanguages.contains(preferredLanguage) { throw BridgeError(.invalidPayload, "Choose a supported app language.") }
        if let handle = patch["signalTag"] as? String, handle.range(of: "^@[A-Za-z0-9_]{3,24}$", options: .regularExpression) == nil { throw BridgeError(.invalidHandle, "Handle must start with @ and contain 3 to 24 letters, numbers, or underscores.") }
        if let aboutMe = patch["speakerNote"] as? String, aboutMe.count > 280 { throw BridgeError(.invalidAboutMe, "About me must be 280 characters or fewer.") }
        if let countryCode = patch["regionMark"] as? String, countryCode.range(of: "^[A-Z]{2}$", options: .regularExpression) == nil { throw BridgeError(.invalidCountry, "Use a two-letter country code.") }
        if let spokenLanguages = patch["tongueSet"] as? [String], spokenLanguages.isEmpty || spokenLanguages.count > 8 || Set(spokenLanguages).count != spokenLanguages.count || spokenLanguages.contains(where: { !supportedLanguages.contains($0) }) { throw BridgeError(.invalidLanguages, "Choose one or more supported languages without duplicates.") }
        if let interests = patch["curiositySet"] as? [String], interests.count < 2 || interests.count > 5 || Set(interests).count != interests.count || interests.contains(where: { !supportedInterests.contains($0) }) { throw BridgeError(.invalidInterests, "Choose 2 to 5 supported interests without duplicates.") }
        let includesAvatar = ["portraitOrigin", "portraitMark", "portraitVaultRef"].contains(where: { patch.keys.contains($0) })
        if includesAvatar {
            let source = patch["portraitOrigin"] as? String
            let avatarKey = patch["portraitMark"] as? String
            let localAssetID = patch["portraitVaultRef"] as? String
            let presetValid = source == "preset" && avatarKey.map { ["portrait-02", "portrait-03", "portrait-04", "portrait-07", "portrait-09"].contains($0) } == true && localAssetID == nil
            let customValid = ["photoLibrary", "camera"].contains(source ?? "") && localAssetID?.range(of: "^avatar_[A-Za-z0-9_-]{8,100}$", options: .regularExpression) != nil && avatarKey == nil
            guard presetValid || customValid else { throw BridgeError(.invalidAvatar, "Choose a valid confirmed avatar and source.") }
        }
        var profile = storedProfile()
        if includesAvatar {
            profile.removeValue(forKey: "avatarKey")
            profile.removeValue(forKey: "localAssetID")
        }
        patch.forEach { key, value in
            if let profileKey = wireToProfileKey[key] { profile[profileKey] = value }
        }
        if let displayName = profile["displayName"] as? String { profile["displayName"] = displayName.trimmingCharacters(in: .whitespacesAndNewlines) }
        if let handle = profile["handle"] as? String { profile["handle"] = handle.lowercased() }
        if let aboutMe = profile["aboutMe"] as? String { profile["aboutMe"] = aboutMe.trimmingCharacters(in: .whitespacesAndNewlines) }
        UserDefaults.standard.set(profile, forKey: profileKey)
    }

    private static func storedProfile() -> [String: Any] {
        if let value = UserDefaults.standard.dictionary(forKey: profileKey) { return value }
        return [
            "displayName": "Mia",
            "handle": "@mia_voice",
            "avatarSource": "preset",
            "avatarKey": "portrait-09",
            "countryCode": "GB",
            "timezone": "UTC+0",
            "aboutMe": "Seven seconds at a time.",
            "spokenLanguages": ["en", "fr"],
            "preferredLanguage": "en",
            "ageRange": "25-34",
            "interests": ["food", "travel"],
            "verified": true,
        ]
    }

    private static func publicUser() -> [String: Any] {
        [
            "speakerID": accountID,
            "echoAddress": email,
            "echoConfirmed": false,
            "speakerReady": true,
            "reviewFixture": true,
            "reviewEcho": true,
            "echoMeter": ["echoUnits": 120],
            "speakerShape": signalProfile(storedProfile()),
            "accordRecord": ["accordEdition": "2026-09-oivox-legal-v2", "accordStampedAt": createdAt],
            "seededAt": createdAt,
            "revisedAt": createdAt,
        ]
    }

    private static func signalProfile(_ profile: [String: Any]) -> [String: Any] {
        var result: [String: Any] = [:]
        profile.forEach { key, value in
            result[profileToWireKey[key] ?? key] = value
        }
        if let verified = profile["verified"] { result["presenceReady"] = verified; result.removeValue(forKey: "verified") }
        return result
    }
}

@MainActor
private final class NativeAvatarPicker: NSObject, PHPickerViewControllerDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    private struct Result: @unchecked Sendable { let value: [String: Any] }
    private unowned let presenter: UIViewController
    private var continuation: CheckedContinuation<Result, Error>?
    private var selectedSource = "photoLibrary"

    init(presenter: UIViewController) { self.presenter = presenter }

    func choose(labels: [String: Any]) async throws -> [String: Any] {
        guard continuation == nil else { throw BridgeError(.mediaBusy, "An avatar picker is already open.") }
        let photoLibraryLabel = labels["photoLibraryLabel"] as? String ?? "Choose from Photos"
        let cameraLabel = labels["cameraLabel"] as? String ?? "Take Photo"
        let cancelLabel = labels["cancelLabel"] as? String ?? "Cancel"
        let result: Result = try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            let sheet = UIAlertController(title: nil, message: nil, preferredStyle: .actionSheet)
            sheet.addAction(UIAlertAction(title: photoLibraryLabel, style: .default) { [weak self] _ in
                Task { @MainActor in await self?.presentPhotoLibrary(source: "photoLibrary") }
            })
            sheet.addAction(UIAlertAction(title: cameraLabel, style: .default) { [weak self] _ in Task { @MainActor in await self?.presentCamera() } })
            sheet.addAction(UIAlertAction(title: cancelLabel, style: .cancel) { [weak self] _ in self?.finish(["cancelled": true]) })
            if UIDevice.current.userInterfaceIdiom == .pad, let popover = sheet.popoverPresentationController {
                popover.sourceView = presenter.view
                popover.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.maxY, width: 1, height: 1)
            }
            presenter.present(sheet, animated: true)
        }
        return result.value
    }

    func selectSupportScreenshot() async throws -> [String: Any] {
        guard continuation == nil else { throw BridgeError(.mediaBusy, "A photo picker is already open.") }
        let result: Result = try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            Task { @MainActor in await self.presentPhotoLibrary(source: "supportScreenshot") }
        }
        return result.value
    }

    private func presentPhotoLibrary(source: String) async {
        let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        let granted: Bool
        if status == .authorized || status == .limited { granted = true }
        else if status == .notDetermined {
            let requested = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
            granted = requested == .authorized || requested == .limited
        } else { granted = false }
        guard granted else {
            finish(error: BridgeError(.permissionDenied, "Photo library access is required to select an image."))
            return
        }
        selectedSource = source
        var configuration = PHPickerConfiguration(photoLibrary: .shared())
        configuration.selectionLimit = 1
        configuration.filter = .images
        let picker = PHPickerViewController(configuration: configuration)
        picker.delegate = self
        presenter.present(picker, animated: true)
    }

    private func presentCamera() async {
        selectedSource = "camera"
        guard UIImagePickerController.isSourceTypeAvailable(.camera) else { finish(error: BridgeError(.deviceUnsupported, "Camera is unavailable.")); return }
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        let granted: Bool
        if status == .authorized { granted = true }
        else if status == .notDetermined { granted = await AVCaptureDevice.requestAccess(for: .video) }
        else { granted = false }
        guard granted else { finish(error: BridgeError(.permissionDenied, "Camera access is required to take an avatar photo.")); return }
        let picker = UIImagePickerController()
        picker.delegate = self
        picker.sourceType = .camera
        picker.cameraDevice = .front
        picker.allowsEditing = false
        presenter.present(picker, animated: true)
    }

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let provider = results.first?.itemProvider else { finish(["cancelled": true]); return }
        guard provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) else { finish(error: BridgeError(.avatarDecodeFailed, "The selected image could not be decoded.")); return }
        provider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { [weak self] data, error in
            Task { @MainActor in
                guard let self else { return }
                guard error == nil, let data, let image = UIImage(data: data) else { self.finish(error: BridgeError(.avatarDecodeFailed, "The selected image could not be decoded.")); return }
                self.store(image: image)
            }
        }
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        finish(["cancelled": true])
    }

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        picker.dismiss(animated: true)
        guard let image = info[.originalImage] as? UIImage else { finish(error: BridgeError(.avatarDecodeFailed, "The captured image could not be decoded.")); return }
        store(image: image)
    }

    private func store(image: UIImage) {
        guard image.size.width > 0, image.size.height > 0 else { finish(error: BridgeError(.avatarDecodeFailed)); return }
        if selectedSource == "supportScreenshot" {
            storeSupportScreenshot(image: image)
            return
        }
        let target = CGSize(width: 512, height: 512)
        let scale = max(target.width / image.size.width, target.height / image.size.height)
        let drawSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let origin = CGPoint(x: (target.width - drawSize.width) / 2, y: (target.height - drawSize.height) / 2)
        let renderer = UIGraphicsImageRenderer(size: target)
        let cropped = renderer.image { _ in image.draw(in: CGRect(origin: origin, size: drawSize)) }
        guard let data = cropped.jpegData(compressionQuality: 0.86) else { finish(error: BridgeError(.avatarCropFailed, "The avatar could not be cropped.")); return }
        do {
            let localAssetID = "avatar_\(UUID().uuidString)"
            let folder = try avatarFolder()
            try data.write(to: folder.appendingPathComponent("\(localAssetID).jpg"), options: .atomic)
            finish(["cancelled": false, "source": selectedSource, "localAssetID": localAssetID, "previewDataURL": "data:image/jpeg;base64,\(data.base64EncodedString())"])
        } catch { finish(error: BridgeError(.nativeFailure, "The avatar could not be saved.")) }
    }

    private func storeSupportScreenshot(image: UIImage) {
        let maximumDimension: CGFloat = 2048
        let scale = min(1, maximumDimension / max(image.size.width, image.size.height))
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: size)
        let normalized = renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
        guard let data = normalized.jpegData(compressionQuality: 0.82) else {
            finish(error: BridgeError(.avatarDecodeFailed, "The selected screenshot could not be decoded."))
            return
        }
        do {
            let assetID = "support_\(UUID().uuidString)"
            let base = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            let folder = base.appendingPathComponent("OiVoxSupportAttachments", isDirectory: true)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            try data.write(to: folder.appendingPathComponent("\(assetID).jpg"), options: .atomic)
            finish(["assetID": assetID, "cancelled": false])
        } catch {
            finish(error: BridgeError(.nativeFailure, "The screenshot could not be saved."))
        }
    }

    func loadPreview(localAssetID: String) throws -> [String: Any] {
        guard localAssetID.range(of: "^avatar_[A-Za-z0-9_-]{8,100}$", options: .regularExpression) != nil else { throw BridgeError(.invalidPayload) }
        let data = try Data(contentsOf: avatarFolder().appendingPathComponent("\(localAssetID).jpg"))
        guard UIImage(data: data) != nil else { throw BridgeError(.avatarDecodeFailed) }
        return ["localAssetID": localAssetID, "previewDataURL": "data:image/jpeg;base64,\(data.base64EncodedString())"]
    }

    private func avatarFolder() throws -> URL {
        let base = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let folder = base.appendingPathComponent("OiVoxAvatars", isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder
    }

    private func finish(_ value: [String: Any]) { let pending = continuation; continuation = nil; pending?.resume(returning: Result(value: value)) }
    private func finish(error: Error) { let pending = continuation; continuation = nil; pending?.resume(throwing: error) }
}

private final class NativeMediaCoordinator: NSObject, @unchecked Sendable, AVCaptureVideoDataOutputSampleBufferDelegate, AVAudioRecorderDelegate, AVAudioPlayerDelegate {
    private struct FaceMotionSample {
        let boundingBox: CGRect
        let landmarks: [CGPoint]
    }

    private unowned let presenter: UIViewController
    private let emitEvent: @MainActor ([String: Any]) -> Void
    private let captureQueue = DispatchQueue(label: "com.oivox.capture", qos: .userInitiated)
    private let visionQueue = DispatchQueue(label: "com.oivox.vision", qos: .userInitiated)
    private var captureSession: AVCaptureSession?
    private var previewView: UIView?
    private var sessionID: String?
    private var lastFaceCount = -1
    private var livenessFrameNumber = 0
    private var singleFaceFrameCount = 0
    private var faceMotionBaseline: FaceMotionSample?
    private var faceMotionBaselineTime = 0.0
    private var dynamicFaceDetected = false
    private var audioRecorder: AVAudioRecorder?
    private var audioPlayer: AVAudioPlayer?
    private var audioPlayerAssetID: String?
    private var playbackProgressTimer: Timer?
    private var voiceURLs: [String: URL] = [:]
    private var recordingStartedAt: Date?

    init(presenter: UIViewController, emit: @escaping @MainActor ([String: Any]) -> Void) { self.presenter = presenter; self.emitEvent = emit; super.init(); NotificationCenter.default.addObserver(self, selector: #selector(didEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil) }
    deinit { NotificationCenter.default.removeObserver(self) }

    @MainActor func startLiveness(payload: [String: Any]) async throws -> [String: Any] {
        guard let rect = payload["previewRect"] as? [String: Any], let x = rect["x"] as? Double, let y = rect["y"] as? Double, let width = rect["width"] as? Double, let height = rect["height"] as? Double else { throw BridgeError(.invalidPayload) }
        #if targetEnvironment(simulator)
        sessionID = UUID().uuidString
        resetLivenessTracking()
        lastFaceCount = 1
        dynamicFaceDetected = true
        return ["sessionID": sessionID!, "faceCount": 1, "dynamicFaceDetected": true, "simulated": true, "usesNativePreview": false]
        #else
        guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else { throw BridgeError(.permissionDenied, "Camera access is required.") }
        releaseLiveness()
        guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) else { throw BridgeError(.deviceUnsupported, "Front camera is unavailable.") }
        let capture = AVCaptureSession(); capture.beginConfiguration(); capture.sessionPreset = .medium
        let videoInput = try AVCaptureDeviceInput(device: camera)
        guard capture.canAddInput(videoInput) else { throw BridgeError(.deviceUnsupported) }
        capture.addInput(videoInput)
        let dataOutput = AVCaptureVideoDataOutput(); dataOutput.alwaysDiscardsLateVideoFrames = true; dataOutput.setSampleBufferDelegate(self, queue: visionQueue)
        guard capture.canAddOutput(dataOutput) else { throw BridgeError(.deviceUnsupported) }
        capture.addOutput(dataOutput)
        capture.commitConfiguration()
        let view = UIView(frame: CGRect(x: x, y: y, width: width, height: height))
        view.backgroundColor = .clear
        view.clipsToBounds = false
        view.isUserInteractionEnabled = false

        let cameraSurface = UIView()
        cameraSurface.translatesAutoresizingMaskIntoConstraints = false
        cameraSurface.backgroundColor = UIColor(red: 42 / 255, green: 43 / 255, blue: 68 / 255, alpha: 1)
        cameraSurface.layer.cornerRadius = CGFloat(payload["cornerRadius"] as? Double ?? width / 2)
        cameraSurface.layer.borderWidth = 1
        cameraSurface.layer.borderColor = UIColor(red: 201 / 255, green: 182 / 255, blue: 245 / 255, alpha: 1).cgColor
        cameraSurface.clipsToBounds = true
        view.addSubview(cameraSurface)
        NSLayoutConstraint.activate([
            cameraSurface.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            cameraSurface.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            cameraSurface.topAnchor.constraint(equalTo: view.topAnchor),
            cameraSurface.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        view.layoutIfNeeded()

        let layer = AVCaptureVideoPreviewLayer(session: capture); layer.frame = cameraSurface.bounds; layer.videoGravity = .resizeAspectFill
        if let connection = layer.connection, connection.isVideoMirroringSupported { connection.automaticallyAdjustsVideoMirroring = false; connection.isVideoMirrored = true }
        cameraSurface.layer.insertSublayer(layer, at: 0)

        let labelText = String((payload["recordingLabel"] as? String ?? "REC").prefix(24))
        let recordingBadge = UILabel()
        recordingBadge.translatesAutoresizingMaskIntoConstraints = false
        recordingBadge.attributedText = NSAttributedString(
            string: labelText,
            attributes: [.font: UIFont.systemFont(ofSize: 10, weight: .bold), .kern: 1]
        )
        recordingBadge.textColor = UIColor(red: 26 / 255, green: 27 / 255, blue: 46 / 255, alpha: 1)
        recordingBadge.textAlignment = .center
        recordingBadge.backgroundColor = UIColor(red: 201 / 255, green: 182 / 255, blue: 245 / 255, alpha: 1)
        recordingBadge.layer.cornerRadius = 12
        recordingBadge.clipsToBounds = true
        recordingBadge.setContentCompressionResistancePriority(.required, for: .horizontal)
        view.addSubview(recordingBadge)
        NSLayoutConstraint.activate([
            recordingBadge.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            recordingBadge.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: 13),
            recordingBadge.heightAnchor.constraint(equalToConstant: 24),
            recordingBadge.widthAnchor.constraint(greaterThanOrEqualToConstant: 48),
            recordingBadge.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 10),
            recordingBadge.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -10),
        ])

        presenter.view.addSubview(view); previewView = view; captureSession = capture; sessionID = UUID().uuidString
        resetLivenessTracking()
        captureQueue.async { [weak capture] in capture?.startRunning() }
        return ["sessionID": sessionID!, "faceCount": 0, "dynamicFaceDetected": false, "usesNativePreview": true]
        #endif
    }

    @MainActor func stopLiveness(deleteMedia: Bool) throws { _ = deleteMedia; let capture = captureSession; captureQueue.async { capture?.stopRunning() }; previewView?.removeFromSuperview(); previewView = nil; captureSession = nil }
    @MainActor func releaseLiveness() { try? stopLiveness(deleteMedia: true); sessionID = nil; lastFaceCount = -1 }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        livenessFrameNumber += 1
        guard livenessFrameNumber.isMultiple(of: 3), sessionID != nil else { return }
        guard let buffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        let request = VNDetectFaceLandmarksRequest { [weak self] request, _ in
            guard let self, let id = self.sessionID else { return }
            let faces = request.results as? [VNFaceObservation] ?? []
            self.updateLivenessTracking(faces: faces, sessionID: id)
        }
        try? VNImageRequestHandler(cvPixelBuffer: buffer, orientation: .leftMirrored).perform([request])
    }

    private func resetLivenessTracking() {
        livenessFrameNumber = 0
        singleFaceFrameCount = 0
        faceMotionBaseline = nil
        faceMotionBaselineTime = 0
        dynamicFaceDetected = false
    }

    private func updateLivenessTracking(faces: [VNFaceObservation], sessionID: String) {
        let count = faces.count
        if count != lastFaceCount {
            lastFaceCount = count
            DispatchQueue.main.async { [emitEvent] in
                emitEvent(["type": "liveness.faceCountChanged", "sessionID": sessionID, "faceCount": count])
            }
        }

        guard count == 1, let face = faces.first else {
            singleFaceFrameCount = 0
            faceMotionBaseline = nil
            faceMotionBaselineTime = 0
            setDynamicFaceDetected(false, score: 0, sessionID: sessionID)
            return
        }

        let sample = FaceMotionSample(
            boundingBox: face.boundingBox,
            landmarks: Array(face.landmarks?.allPoints?.normalizedPoints ?? [])
        )
        let now = ProcessInfo.processInfo.systemUptime
        singleFaceFrameCount += 1
        guard let baseline = faceMotionBaseline else {
            faceMotionBaseline = sample
            faceMotionBaselineTime = now
            return
        }

        let score = faceMotionScore(from: baseline, to: sample)
        if !dynamicFaceDetected,
           singleFaceFrameCount >= 3,
           now - faceMotionBaselineTime >= 0.2,
           score >= 0.006 {
            setDynamicFaceDetected(true, score: score, sessionID: sessionID)
        } else if !dynamicFaceDetected, now - faceMotionBaselineTime > 2.0 {
            faceMotionBaseline = sample
            faceMotionBaselineTime = now
            singleFaceFrameCount = 1
        }
    }

    private func faceMotionScore(from baseline: FaceMotionSample, to current: FaceMotionSample) -> CGFloat {
        let first = baseline.boundingBox
        let second = current.boundingBox
        let centerMotion = hypot(first.midX - second.midX, first.midY - second.midY)
        let scaleMotion = max(abs(first.width - second.width), abs(first.height - second.height))
        let landmarkMotion: CGFloat
        if baseline.landmarks.count == current.landmarks.count, !baseline.landmarks.isEmpty {
            let total = zip(baseline.landmarks, current.landmarks).reduce(CGFloat.zero) { value, points in
                value + hypot(points.0.x - points.1.x, points.0.y - points.1.y)
            }
            landmarkMotion = total / CGFloat(baseline.landmarks.count)
        } else {
            landmarkMotion = 0
        }
        return max(centerMotion, scaleMotion * 0.8, landmarkMotion * 1.4)
    }

    private func setDynamicFaceDetected(_ detected: Bool, score: CGFloat, sessionID: String) {
        guard detected != dynamicFaceDetected else { return }
        dynamicFaceDetected = detected
        let faceCount = lastFaceCount
        #if DEBUG
        print("[OiVox Liveness] dynamicFaceDetected=\(detected) faceCount=\(faceCount) motionScore=\(score)")
        #endif
        DispatchQueue.main.async { [emitEvent] in
            emitEvent([
                "type": "liveness.dynamicFaceChanged",
                "sessionID": sessionID,
                "dynamicFaceDetected": detected,
                "faceCount": faceCount,
                "motionScore": Double(score),
            ])
        }
    }

    @MainActor func startVoice(assetID: String, maxDurationMs: Int) throws -> [String: Any] {
        guard AVCaptureDevice.authorizationStatus(for: .audio) == .authorized else { throw BridgeError(.permissionDenied, "Microphone access is required.") }
        guard audioRecorder == nil else { throw BridgeError(.mediaBusy) }
        guard assetID.range(of: #"^[A-Za-z0-9_-]{8,120}$"#, options: .regularExpression) != nil else { throw BridgeError(.invalidPayload) }
        _ = stopVoicePlayback()
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetoothHFP])
        try session.setActive(true)
        guard !(session.availableInputs ?? []).isEmpty, !session.currentRoute.inputs.isEmpty else {
            try? session.setActive(false, options: .notifyOthersOnDeactivation)
            throw BridgeError(.deviceUnsupported, "Microphone input is unavailable.")
        }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(assetID).m4a")
        let settings: [String: Any] = [AVFormatIDKey: Int(kAudioFormatMPEG4AAC), AVSampleRateKey: 44_100, AVNumberOfChannelsKey: 1, AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue]
        do {
            if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
            let recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder.delegate = self
            recorder.isMeteringEnabled = true
            guard recorder.prepareToRecord(), recorder.record(forDuration: min(7, Double(maxDurationMs) / 1000)) else {
                recorder.delegate = nil
                #if targetEnvironment(simulator)
                throw BridgeError(.deviceUnsupported, "The simulator has no usable microphone input.")
                #else
                throw BridgeError(.recordingFailed)
                #endif
            }
            audioRecorder = recorder
            voiceURLs[assetID] = url
            recordingStartedAt = Date()
            return ["assetID": assetID, "started": true]
        } catch {
            try? FileManager.default.removeItem(at: url)
            try? session.setActive(false, options: .notifyOthersOnDeactivation)
            throw error
        }
    }
    @MainActor func stopVoice(assetID: String) throws -> [String: Any] {
        guard let url = voiceURLs[assetID] else { throw BridgeError(.assetNotFound) }
        let elapsed = min(7_000, max(0, Int((Date().timeIntervalSince(recordingStartedAt ?? Date())) * 1000)))
        if let recorder = audioRecorder, recorder.url == url {
            recorder.delegate = nil
            recorder.stop()
            audioRecorder = nil
        }
        recordingStartedAt = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        return ["assetID": assetID, "durationMs": elapsed]
    }
    @MainActor func discardVoice(assetID: String) {
        if let recorder = audioRecorder, recorder.url == voiceURLs[assetID] {
            recorder.delegate = nil
            recorder.stop()
            audioRecorder = nil
            recordingStartedAt = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
        if let url = voiceURLs.removeValue(forKey: assetID) { try? FileManager.default.removeItem(at: url) }
    }
    @MainActor func publishVoice(assetID: String) throws -> [String: Any] { guard let source = voiceURLs[assetID], FileManager.default.fileExists(atPath: source.path) else { throw BridgeError(.assetNotFound) }; let folder = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true).appendingPathComponent("OiVoxVoice", isDirectory: true); try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true); let destination = folder.appendingPathComponent("\(assetID).m4a"); if FileManager.default.fileExists(atPath: destination.path) { try FileManager.default.removeItem(at: destination) }; try FileManager.default.moveItem(at: source, to: destination); voiceURLs[assetID] = destination; return ["assetID": assetID, "published": true] }
    @MainActor private func playbackSnapshot(state: String) -> [String: Any] {
        [
            "assetID": audioPlayerAssetID ?? "",
            "state": state,
            "currentTimeMs": Int((audioPlayer?.currentTime ?? 0) * 1000),
            "durationMs": Int((audioPlayer?.duration ?? 0) * 1000)
        ]
    }
    @MainActor private func startPlaybackProgressTimer() {
        playbackProgressTimer?.invalidate()
        playbackProgressTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self, self.audioPlayer?.isPlaying == true else { return }
                self.emitEvent(["type": "voice.playbackProgress"].merging(self.playbackSnapshot(state: "playing")) { _, new in new })
            }
        }
    }
    @MainActor func playVoice(assetID: String) throws -> [String: Any] {
        if audioPlayerAssetID == assetID, let player = audioPlayer {
            if player.currentTime >= player.duration { player.currentTime = 0 }
            guard player.play() else { throw BridgeError(.recordingFailed, "Playback failed.") }
            startPlaybackProgressTimer()
            return playbackSnapshot(state: "playing")
        }
        _ = stopVoicePlayback()
        let url: URL
        if let cached = voiceURLs[assetID] {
            url = cached
        } else {
            guard assetID.range(of: #"^[A-Za-z0-9_-]{8,120}$"#, options: .regularExpression) != nil else { throw BridgeError(.invalidPayload) }
            let bundled = Bundle.main.bundleURL
                .appendingPathComponent("WebApp/assets/discovery/audio", isDirectory: true)
                .appendingPathComponent(assetID)
                .appendingPathExtension("wav")
            if assetID.hasPrefix("voice-"), FileManager.default.fileExists(atPath: bundled.path) {
                url = bundled
            } else {
                let folder = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: false).appendingPathComponent("OiVoxVoice", isDirectory: true)
                let persisted = folder.appendingPathComponent("\(assetID).m4a")
                guard FileManager.default.fileExists(atPath: persisted.path) else { throw BridgeError(.assetNotFound) }
                voiceURLs[assetID] = persisted
                url = persisted
            }
        }
        let session = AVAudioSession.sharedInstance(); try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers]); try session.setActive(true)
        let player = try AVAudioPlayer(contentsOf: url); player.delegate = self; player.prepareToPlay(); guard player.play() else { throw BridgeError(.recordingFailed, "Playback failed.") }; audioPlayer = player; audioPlayerAssetID = assetID; startPlaybackProgressTimer(); return playbackSnapshot(state: "playing")
    }
    @MainActor func pauseVoice() -> [String: Any] { audioPlayer?.pause(); playbackProgressTimer?.invalidate(); playbackProgressTimer = nil; let snapshot = playbackSnapshot(state: "paused"); emitEvent(["type": "voice.playbackProgress"].merging(snapshot) { _, new in new }); return snapshot }
    @MainActor func stopVoicePlayback() -> [String: Any] { let durationMs = Int((audioPlayer?.duration ?? 0) * 1000); let assetID = audioPlayerAssetID; audioPlayer?.stop(); audioPlayer?.currentTime = 0; playbackProgressTimer?.invalidate(); playbackProgressTimer = nil; audioPlayer = nil; audioPlayerAssetID = nil; if assetID != nil { try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation) }; let snapshot: [String: Any] = ["assetID": assetID ?? "", "state": "stopped", "currentTimeMs": 0, "durationMs": durationMs]; if assetID != nil { emitEvent(["type": "voice.playbackStopped"].merging(snapshot) { _, new in new }) }; return snapshot }
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) { let durationMs = Int(player.duration * 1000); DispatchQueue.main.async { [weak self] in guard let self else { return }; let assetID = self.audioPlayerAssetID; self.playbackProgressTimer?.invalidate(); self.playbackProgressTimer = nil; player.currentTime = 0; self.audioPlayer = nil; self.audioPlayerAssetID = nil; try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation); self.emitEvent(["type": "voice.playbackEnded", "assetID": assetID ?? "", "state": "ended", "currentTimeMs": 0, "durationMs": durationMs]) } }
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        let url = recorder.url
        let duration = min(7_000, max(0, Int(recorder.currentTime * 1000)))
        DispatchQueue.main.async { [weak self] in
            guard let self, self.audioRecorder === recorder else { return }
            recorder.delegate = nil
            self.audioRecorder = nil
            self.recordingStartedAt = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            guard flag, let entry = self.voiceURLs.first(where: { $0.value == url }) else {
                self.emitEvent(["type": "media.interrupted", "reason": "recordingFailed"])
                return
            }
            self.emitEvent(["type": "voice.recordingFinished", "assetID": entry.key, "durationMs": duration])
        }
    }
    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        let url = recorder.url
        DispatchQueue.main.async { [weak self] in
            guard let self, self.audioRecorder === recorder else { return }
            recorder.delegate = nil
            recorder.stop()
            self.audioRecorder = nil
            self.recordingStartedAt = nil
            if let entry = self.voiceURLs.first(where: { $0.value == url }) { self.voiceURLs.removeValue(forKey: entry.key) }
            try? FileManager.default.removeItem(at: url)
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            self.emitEvent(["type": "media.interrupted", "reason": "recordingFailed"])
        }
    }
    @objc private func didEnterBackground() { Task { @MainActor in releaseLiveness(); if let recorder = audioRecorder, let entry = voiceURLs.first(where: { $0.value == recorder.url }) { _ = try? stopVoice(assetID: entry.key) }; _ = stopVoicePlayback(); emitEvent(["type": "media.interrupted", "reason": "background"]) } }
}

private enum KeychainStore {
    private static let service = "com.oivox.secure-store"
    static func read(_ key: String) -> String? { let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: key, kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]; var result: CFTypeRef?; guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }; return String(data: data, encoding: .utf8) }
    static func write(_ value: String, key: String) throws { delete(key); let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: key, kSecValueData as String: Data(value.utf8), kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]; guard SecItemAdd(query as CFDictionary, nil) == errSecSuccess else { throw BridgeError(.nativeFailure, "Keychain write failed.") } }
    static func delete(_ key: String) { let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: key]; SecItemDelete(query as CFDictionary) }
}

private enum SafetyStore {
    private static let blockedKey = "oivox.blockedUserIDs"; private static let reportsKey = "oivox.safetyReports"
    static func block(userID: String) { var values = Set(UserDefaults.standard.stringArray(forKey: blockedKey) ?? []); values.insert(userID); UserDefaults.standard.set(Array(values), forKey: blockedKey) }
    static func unblock(userID: String) { var values = Set(UserDefaults.standard.stringArray(forKey: blockedKey) ?? []); values.remove(userID); UserDefaults.standard.set(Array(values), forKey: blockedKey) }
    static func report(userID: String, reason: String, details: String?, targetType: String?, voiceID: String?, operationID: String?) {
        var values = UserDefaults.standard.array(forKey: reportsKey) as? [[String: Any]] ?? []
        if let operationID, values.contains(where: { $0["operationID"] as? String == operationID }) { return }
        var report: [String: Any] = [
            "userID": userID,
            "reason": reason,
            "createdAt": Date().timeIntervalSince1970,
        ]
        if let details, !details.isEmpty { report["details"] = String(details.prefix(500)) }
        if let targetType, !targetType.isEmpty { report["targetType"] = targetType }
        if let voiceID, !voiceID.isEmpty { report["voiceID"] = voiceID }
        if let operationID, !operationID.isEmpty { report["operationID"] = operationID }
        values.append(report)
        UserDefaults.standard.set(values, forKey: reportsKey)
    }
}
