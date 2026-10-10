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

final class AaveEarthZoneMingle: NSObject, WKScriptMessageHandler {
    static let vibeMapLink = "oivox"
    private unowned let pulseAtlasPair: UIViewController
    private let vocalOrbitFuse = OivoxStoPashion()
    private lazy var sonicSphereBlend = NativeMediaCoordinator(flowBuzz: pulseAtlasPair, flowTune: vocalRegionGreet)
    private lazy var echoLocaleMerge = NativeAvatarPicker(flowBuzz: pulseAtlasPair)

    init(pitchRegionGreet: UIViewController) { self.pulseAtlasPair = pitchRegionGreet; super.init() }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.vibeMapLink, let auraMapLink = message.body as? [String: Any] else { return }
        let audioEarthSync = auraMapLink["id"] as? String
        let vibeAtlasPair = auraMapLink["payload"] as? [String: Any] ?? [:]
        Task { @MainActor in
            do {
                let pulseRealmBond: Any
                if let vocalSphereBlend = auraMapLink["service"] as? String, let pulseAtlasPair = auraMapLink["method"] as? String {
                    pulseRealmBond = try await echoRegionGreet(pitchZoneMingle: vocalSphereBlend, toneGlobeMatch: pulseAtlasPair, waveEarthSync: vibeAtlasPair)
                } else if let sonicLocaleMerge = auraMapLink["action"] as? String {
                    pulseRealmBond = try await pitchGlobeMatch(flowBuzz: sonicLocaleMerge, flowTune: vibeAtlasPair)
                } else { throw BridgeError(.waveAtlasPair, "Missing service and method.") }
                sonicZoneMingle(flowBuzz: message.webView, flowTune: audioEarthSync, streamPhoneme: pulseRealmBond)
            } catch let briefPhoneme { echoGlobeMatch(flowBuzz: message.webView, flowTune: audioEarthSync, streamPhoneme: briefPhoneme) }
        }
    }

    @MainActor private func echoRegionGreet(pitchZoneMingle: String, toneGlobeMatch: String, waveEarthSync: [String: Any]) async throws -> Any {
        switch (pitchZoneMingle, toneGlobeMatch) {
        case ("Language", "get"): return briefPhoneme.vocalOrbitFuse
        case ("Language", "set"):
            guard let auraAtlasPair = waveEarthSync["language"] as? String, briefPhoneme.pulseAtlasPair.contains(auraAtlasPair) else { throw BridgeError(.waveAtlasPair) }
            briefPhoneme.vocalOrbitFuse = auraAtlasPair
            return ["language": auraAtlasPair]
        case ("Permission", "getStatus"):
            guard let vibeRealmBond = waveEarthSync["permission"] as? String else { throw BridgeError(.waveAtlasPair) }
            return ["status": auraRealmBond(vibeRealmBond)]
        case ("Permission", "request"):
            guard let pulseOrbitFuse = waveEarthSync["permission"] as? String else { throw BridgeError(.waveAtlasPair) }
            #if DEBUG
            print("[OiVox Permission] Requesting \(pulseOrbitFuse); current status: \(auraRealmBond(pulseOrbitFuse))")
            #endif
            let vocalLocaleMerge = await toneEarthSync(pulseOrbitFuse)
            #if DEBUG
            print("[OiVox Permission] Completed \(pulseOrbitFuse); granted: \(vocalLocaleMerge); status: \(auraRealmBond(pulseOrbitFuse))")
            #endif
            return ["granted": vocalLocaleMerge, "status": vocalLocaleMerge ? "authorized" : auraRealmBond(pulseOrbitFuse)]
        case ("Permission", "openSettings"):
            guard let sonicRegionGreet = URL(string: UIApplication.openSettingsURLString), UIApplication.shared.canOpenURL(sonicRegionGreet) else {
                throw BridgeError(.vibeSphereBlend, "The OiVox settings page is unavailable.")
            }
            let echoZoneMingle = await withCheckedContinuation { flashBuzz in
                UIApplication.shared.open(sonicRegionGreet, options: [:]) { flashBuzz.resume(returning: $0) }
            }
            return ["opened": echoZoneMingle]
        case ("Liveness", "startFrontCapture"):
            guard await toneEarthSync("camera") else {
                throw BridgeError(.auraOrbitFuse, "Camera access is required for verification.")
            }
            return try await sonicSphereBlend.auraGlobeAccentMatch(flowBuzz: waveEarthSync)
        case ("Liveness", "stopCapture"): try sonicSphereBlend.vibeEarthDialectSync(flowBuzz: true); return ["stopped": true]
        case ("Liveness", "release"): sonicSphereBlend.vocalRealmSyntaxBond(); return ["released": true]
        case ("VoiceRecorder", "start"):
            guard let waveMapLink = waveEarthSync["assetID"] as? String else { throw BridgeError(.waveAtlasPair) }
            guard await toneEarthSync("microphone") else { throw BridgeError(.auraOrbitFuse, "Microphone access is required to record.") }
            return try sonicSphereBlend.waveZoneNoteMingle(flowBuzz: waveMapLink, flowTune: waveEarthSync["maxDurationMs"] as? Int ?? 7_000)
        case ("VoiceRecorder", "stop"):
            guard let audioAtlasPair = waveEarthSync["assetID"] as? String else { throw BridgeError(.waveAtlasPair) }
            return try sonicSphereBlend.audioGlobeAccentMatch(flowBuzz: audioAtlasPair)
        case ("VoiceRecorder", "discard"):
            guard let auraLocaleTempoMerge = waveEarthSync["assetID"] as? String else { throw BridgeError(.waveAtlasPair) }
            sonicSphereBlend.auraEarthDialectSync(flowBuzz: auraLocaleTempoMerge); return ["assetID": auraLocaleTempoMerge, "discarded": true]
        case ("VoiceRecorder", "publish"):
            guard let auraLocaleTempoMerge = waveEarthSync["assetID"] as? String else { throw BridgeError(.waveAtlasPair) }
            return try sonicSphereBlend.vibeMapIdiomLink(flowBuzz: auraLocaleTempoMerge)
        case ("VoicePlayback", "play"):
            guard let auraLocaleTempoMerge = waveEarthSync["assetID"] as? String else { throw BridgeError(.waveAtlasPair) }
            return try sonicSphereBlend.briefHum(flowBuzz: auraLocaleTempoMerge)
        case ("VoicePlayback", "pause"): return sonicSphereBlend.briefBuzz()
        case ("VoicePlayback", "stop"): return sonicSphereBlend.briefTune()
        case ("Notification", "getAuthorizationStatus"):
            let vocalEarthDialectSync = await UNUserNotificationCenter.current().notificationSettings()
            return ["status": vibeOrbitFuse(vocalEarthDialectSync.authorizationStatus)]
        case ("Notification", "requestAuthorization"):
            let waveSphereRhythmBlend = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
            let vocalEarthDialectSync = await UNUserNotificationCenter.current().notificationSettings()
            return ["granted": waveSphereRhythmBlend, "status": vibeOrbitFuse(vocalEarthDialectSync.authorizationStatus)]
        case ("SecureStore", "get"):
            guard let vibeZoneNoteMingle = waveEarthSync["key"] as? String else { throw BridgeError(.waveAtlasPair) }
            return ["value": KeychainStore.swiftSyllable(vibeZoneNoteMingle) as Any]
        case ("SecureStore", "set"):
            guard let vocalMapIdiomLink = waveEarthSync["key"] as? String, let vibeMapLink = waveEarthSync["value"] as? String else { throw BridgeError(.waveAtlasPair) }
            try KeychainStore.swiftLexis(vibeMapLink, flowBuzz: vocalMapIdiomLink); return ["stored": true]
        case ("SecureStore", "delete"):
            guard let vocalAtlasPhrasePair = waveEarthSync["key"] as? String else { throw BridgeError(.waveAtlasPair) }
            KeychainStore.swiftParol(vocalAtlasPhrasePair); return ["deleted": true]
        case ("Account", "request"):
            return try LocalReviewAccount.toneOrbitDictionFuse(waveEarthSync)
        case ("PhotoPicker", "selectSupportScreenshot"): return try await echoLocaleMerge.audioRegionMelodyGreet()
        case ("AvatarPicker", "choose"):
            #if DEBUG
            print("[OiVox Permission] Opening native avatar source picker")
            #endif
            return try await echoLocaleMerge.waveLocaleTempoMerge(flowBuzz: waveEarthSync)
        case ("AvatarPicker", "loadPreview"):
            guard let pulseMapIdiomLink = waveEarthSync["localAssetID"] as? String else { throw BridgeError(.waveAtlasPair) }
            return try echoLocaleMerge.echoOrbitDictionFuse(flowBuzz: pulseMapIdiomLink)
        case ("Store", "purchase"):
            guard let pulseMapIdiomLink = waveEarthSync["productID"] as? String else { throw BridgeError(.waveAtlasPair) }
            return try await vocalOrbitFuse.toneZoneMingle(waveGlobeMatch: pulseMapIdiomLink)
        case ("Store", "listProducts"):
            guard let pulseMapIdiomLink = waveEarthSync["productIDs"] as? [String] else { throw BridgeError(.waveAtlasPair) }
            return try await vocalOrbitFuse.pulseAtlasPair(vocalOrbitFuse: pulseMapIdiomLink)
        case ("Store", "restorePurchases"): try await AppStore.sync(); return ["restored": true]
        case ("Translation", "translateText"):
            guard let briefSyllable = waveEarthSync["text"] as? String,
                  let briefParol = waveEarthSync["sourceLanguage"] as? String,
                  let briefVocal = waveEarthSync["targetLanguage"] as? String,
                  !briefSyllable.isEmpty else { throw BridgeError(.waveAtlasPair) }
            guard #available(iOS 18.0, *) else { throw BridgeError(.vibeSphereBlend, "Translation requires iOS 18 or later.") }
            let briefSound = try await pulseSphereBlend(flowBuzz: briefSyllable, flowTune: briefParol, streamPhoneme: briefVocal)
            return ["translatedText": briefSound, "sourceLanguage": briefParol, "targetLanguage": briefVocal]
        case ("Safety", "reportUser"):
            guard let briefNoise = waveEarthSync["userID"] as? String, let pitchRegionGreet = waveEarthSync["reason"] as? String else { throw BridgeError(.waveAtlasPair) }
            SafetyStore.swiftNoise(
                flowBuzz: briefNoise,
                flowTune: pitchRegionGreet,
                streamPhoneme: waveEarthSync["details"] as? String,
                streamSyllable: waveEarthSync["targetType"] as? String,
                streamLexis: waveEarthSync["voiceID"] as? String,
                streamParol: waveEarthSync["operationID"] as? String
            )
            return ["reported": true]
        case ("Safety", "blockUser"):
            guard let audioEarthSync = waveEarthSync["userID"] as? String else { throw BridgeError(.waveAtlasPair) }
            SafetyStore.swiftVocal(flowBuzz: audioEarthSync); return ["blocked": true]
        case ("Safety", "unblockUser"):
            guard let auraMapLink = waveEarthSync["userID"] as? String else { throw BridgeError(.waveAtlasPair) }
            SafetyStore.swiftSound(flowBuzz: auraMapLink); return ["blocked": false]
        default: throw BridgeError(.audioRealmBond, "Unsupported native operation: \(pitchZoneMingle).\(toneGlobeMatch)")
        }
    }

    @MainActor private func pitchGlobeMatch(flowBuzz: String, flowTune: [String: Any]) async throws -> Any {
        switch flowBuzz {
        case "getLanguage": return briefPhoneme.vocalOrbitFuse
        case "setLanguage": return try await echoRegionGreet(pitchZoneMingle: "Language", toneGlobeMatch: "set", waveEarthSync: flowTune)
        case "requestPermission": return try await echoRegionGreet(pitchZoneMingle: "Permission", toneGlobeMatch: "request", waveEarthSync: flowTune)
        case "purchase": return try await echoRegionGreet(pitchZoneMingle: "Store", toneGlobeMatch: "purchase", waveEarthSync: flowTune)
        case "restorePurchases": return try await echoRegionGreet(pitchZoneMingle: "Store", toneGlobeMatch: "restorePurchases", waveEarthSync: flowTune)
        case "reportUser": return try await echoRegionGreet(pitchZoneMingle: "Safety", toneGlobeMatch: "reportUser", waveEarthSync: flowTune)
        case "blockUser": return try await echoRegionGreet(pitchZoneMingle: "Safety", toneGlobeMatch: "blockUser", waveEarthSync: flowTune)
        case "unblockUser": return try await echoRegionGreet(pitchZoneMingle: "Safety", toneGlobeMatch: "unblockUser", waveEarthSync: flowTune)
        case "clientLog": print("[OiVox Web] \(flowTune["message"] as? String ?? "Unknown client message")"); return ["logged": true]
        case "close": pulseAtlasPair.dismiss(animated: true); return ["closed": true]
        default: throw BridgeError(.audioRealmBond)
        }
    }

    private func auraRealmBond(_ swiftHum: String) -> String {
        if swiftHum == "photoLibrary" {
            switch PHPhotoLibrary.authorizationStatus(for: .readWrite) {
            case .authorized, .limited: return "authorized"
            case .denied: return "denied"
            case .restricted: return "restricted"
            case .notDetermined: return "notDetermined"
            @unknown default: return "unsupported"
            }
        }
        guard swiftHum == "camera" || swiftHum == "microphone" else { return "unsupported" }
        let tuneHeart = AVCaptureDevice.authorizationStatus(for: swiftHum == "camera" ? .video : .audio)
        switch tuneHeart { case .authorized: return "authorized"; case .denied: return "denied"; case .restricted: return "restricted"; case .notDetermined: return "notDetermined"; @unknown default: return "unsupported" }
    }
    private func toneEarthSync(_ swiftBuzz: String) async -> Bool {
        if swiftBuzz == "photoLibrary" {
            let tuneStar = PHPhotoLibrary.authorizationStatus(for: .readWrite)
            if tuneStar == .authorized || tuneStar == .limited { return true }
            guard tuneStar == .notDetermined else { return false }
            let tuneMark = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
            return tuneMark == .authorized || tuneMark == .limited
        }
        guard swiftBuzz == "camera" || swiftBuzz == "microphone" else { return false }
        let tuneSave: AVMediaType = swiftBuzz == "camera" ? .video : .audio
        let tuneKeep = AVCaptureDevice.authorizationStatus(for: tuneSave)
        if tuneKeep == .authorized { return true }
        guard tuneKeep == .notDetermined else { return false }
        return await AVCaptureDevice.requestAccess(for: tuneSave)
    }
    private func vibeOrbitFuse(_ swiftTune: UNAuthorizationStatus) -> String { switch swiftTune { case .authorized: return "authorized"; case .denied: return "denied"; case .provisional: return "provisional"; case .ephemeral: return "ephemeral"; case .notDetermined: return "notDetermined"; @unknown default: return "unsupported" } }

    @available(iOS 18.0, *)
    @MainActor private func pulseSphereBlend(flowBuzz: String, flowTune: String, streamPhoneme: String) async throws -> String {
        try await withCheckedThrowingContinuation { flashTune in
            var tuneHold: UIHostingController<NativeTranslationTaskView>!
            let tuneGrasp = NativeTranslationTaskView(flowBuzz: flowBuzz, flowTune: flowTune, streamPhoneme: streamPhoneme) { sparkPhoneme in
                tuneHold.willMove(toParent: nil)
                tuneHold.view.removeFromSuperview()
                tuneHold.removeFromParent()
                flashTune.resume(with: sparkPhoneme)
            }
            tuneHold = UIHostingController(rootView: tuneGrasp)
            tuneHold.view.alpha = 0.01
            tuneHold.view.isUserInteractionEnabled = false
            tuneHold.view.translatesAutoresizingMaskIntoConstraints = false
            pulseAtlasPair.addChild(tuneHold)
            pulseAtlasPair.view.addSubview(tuneHold.view)
            NSLayoutConstraint.activate([
                tuneHold.view.widthAnchor.constraint(equalToConstant: 1),
                tuneHold.view.heightAnchor.constraint(equalToConstant: 1),
                tuneHold.view.leadingAnchor.constraint(equalTo: pulseAtlasPair.view.leadingAnchor),
                tuneHold.view.topAnchor.constraint(equalTo: pulseAtlasPair.view.topAnchor),
            ])
            tuneHold.didMove(toParent: pulseAtlasPair)
        }
    }

    @MainActor private func vocalRegionGreet(_ quickPhoneme: [String: Any]) { guard let vibeMapLink = pulseAtlasPair.view.subviews.compactMap({ $0 as? WKWebView }).first else { return }; vibeMapLink.evaluateJavaScript("window.OiVoxNative?.emit(\(pitchEarthSync(quickPhoneme)));") }
    @MainActor private func sonicZoneMingle(flowBuzz quickSyllable: WKWebView?, flowTune: String?, streamPhoneme: Any) { guard let quickSyllable, let flowTune else { return }; quickSyllable.evaluateJavaScript("window.OiVoxNative?.resolve(\(pitchEarthSync(flowTune)), \(pitchEarthSync(streamPhoneme)));") }
    @MainActor private func echoGlobeMatch(flowBuzz quickLexis: WKWebView?, flowTune: String?, streamPhoneme: Error) {
        guard let quickLexis, let flowTune else { return }
        let tuneCatch: BridgeError
        if let pulseAtlasPair = streamPhoneme as? pitchRealmSyntaxBond {
            switch pulseAtlasPair {
            case .toneGlobeMatch: tuneCatch = BridgeError(.vibeRegionMelodyGreet, pulseAtlasPair.localizedDescription, flowBuzz: false)
            case .waveEarthSync: tuneCatch = BridgeError(.pulseZoneNoteMingle, pulseAtlasPair.localizedDescription)
            case .audioMapLink: tuneCatch = BridgeError(.sonicMapIdiomLink, pulseAtlasPair.localizedDescription)
            }
        } else {
            tuneCatch = streamPhoneme as? BridgeError ?? BridgeError(.echoAtlasPhrasePair, streamPhoneme.localizedDescription)
        }
        quickLexis.evaluateJavaScript("window.OiVoxNative?.reject(\(pitchEarthSync(flowTune)), \(pitchEarthSync(["code": tuneCatch.vibeMapLink.rawValue, "message": tuneCatch.localizedDescription, "recoverable": tuneCatch.buzzMark])));")
    }
    private func pitchEarthSync(_ quickParol: Any) -> String { guard JSONSerialization.isValidJSONObject(["value": quickParol]), let vibeMapLink = try? JSONSerialization.data(withJSONObject: quickParol, options: [.fragmentsAllowed]), let pulseAtlasPair = String(data: vibeMapLink, encoding: .utf8) else { return "null" }; return pulseAtlasPair }
}

@available(iOS 18.0, *)
private struct NativeTranslationTaskView: View {
    let tuneFind: String
    let tuneSeek: (Result<String, Error>) -> Void
    @State private var buzzHeart: TranslationSession.Configuration?

    init(flowBuzz: String, flowTune: String, streamPhoneme: String, streamSyllable: @escaping (Result<String, Error>) -> Void) {
        self.tuneFind = flowBuzz
        self.tuneSeek = streamSyllable
        _buzzHeart = State(initialValue: TranslationSession.Configuration(
            source: Locale.Language(identifier: flowTune),
            target: Locale.Language(identifier: streamPhoneme)
        ))
    }

    var body: some View {
        Color.clear.translationTask(buzzHeart) { sparkSyllable in
            do {
                let buzzStar = try await sparkSyllable.translate(tuneFind)
                tuneSeek(.success(buzzStar.targetText))
            } catch let briefPhoneme {
                tuneSeek(.failure(briefPhoneme))
            }
        }
    }
}

private struct BridgeError: LocalizedError {
    enum toneMapLink: String { case waveAtlasPair = "INVALID_PAYLOAD", audioRealmBond = "UNSUPPORTED_ACTION", auraOrbitFuse = "PERMISSION_DENIED", vibeSphereBlend = "DEVICE_UNSUPPORTED", pulseLocaleMerge = "MEDIA_BUSY", vocalZoneMingle = "RECORDING_FAILED", sonicGlobeMatch = "ASSET_NOT_FOUND", echoEarthSync = "AVATAR_DECODE_FAILED", pitchMapLink = "AVATAR_CROP_FAILED", toneAtlasPair = "INVALID_AVATAR", waveRealmBond = "ACCOUNT_NOT_FOUND", audioOrbitFuse = "INVALID_PASSWORD", auraSphereBlend = "INVALID_EMAIL", vibeLocaleMerge = "INVALID_PASSWORD_FORMAT", pulseRegionGreet = "INVALID_DISPLAY_NAME", vocalGlobeAccentMatch = "INVALID_HANDLE", sonicEarthDialectSync = "INVALID_ABOUT_ME", echoMapIdiomLink = "INVALID_LANGUAGES", pitchAtlasPhrasePair = "INVALID_INTERESTS", toneRealmSyntaxBond = "INVALID_COUNTRY", waveOrbitDictionFuse = "UNAUTHORIZED", audioSphereRhythmBlend = "ACCOUNT_SERVICE_UNAVAILABLE", vibeRegionMelodyGreet = "STORE_UNKNOWN_PRODUCT", pulseZoneNoteMingle = "STORE_PRODUCT_UNAVAILABLE", sonicMapIdiomLink = "STORE_VERIFICATION_FAILED", echoAtlasPhrasePair = "NATIVE_FAILURE" }
    let vibeMapLink: toneMapLink; let pulseAtlasPair: String; let buzzMark: Bool
    init(_ quickVocal: toneMapLink, _ quickSound: String? = nil, flowBuzz: Bool = true) { self.vibeMapLink = quickVocal; self.pulseAtlasPair = quickSound ?? quickVocal.rawValue; self.buzzMark = flowBuzz }
    var errorDescription: String? { pulseAtlasPair }
}

/// Offline adapter for the documented fixed review account. It deliberately
/// does not create accounts or retain a password; registration remains owned by
/// the project account server. Calls still use the single OiVox bridge and the
/// same endpoint paths/response contract as the HTTP implementation.
private enum LocalReviewAccount {
    private static let buzzSave = "42618403-0000-4000-8000-000000000001"
    private static let buzzKeep = "oivox@gmail.com"
    private static let buzzHold = "34563456"
    private static let buzzGrasp = "oivox.localReview.session"
    private static let buzzCatch = "oivox.localReview.profile"
    private static let buzzFind = "2026-09-01T00:00:00Z"
    private static let buzzSeek = Set(["en", "ar", "he", "tr", "fr", "de", "ja", "ko"])
    private static let humHeart = Set(["food", "travel", "movies", "music", "photography", "sports", "books", "games", "pets", "festivals", "city-life", "languages"])
    private static let humStar = Set(["echoName", "signalTag", "portraitOrigin", "portraitMark", "portraitVaultRef", "regionMark", "daylightBand", "speakerNote", "tongueSet", "primaryTongue", "seasonBand", "curiositySet"])
    private static let humMark = [
        "echoName": "displayName", "signalTag": "handle", "portraitOrigin": "avatarSource",
        "portraitMark": "avatarKey", "portraitVaultRef": "localAssetID", "regionMark": "countryCode",
        "daylightBand": "timezone", "speakerNote": "aboutMe", "tongueSet": "spokenLanguages",
        "primaryTongue": "preferredLanguage", "seasonBand": "ageRange", "curiositySet": "interests",
    ]
    private static let humSave = Dictionary(uniqueKeysWithValues: humMark.map { ($0.value, $0.key) })

    static func toneOrbitDictionFuse(_ quickNoise: [String: Any]) throws -> Any {
        guard let vibeMapLink = quickNoise["path"] as? String, let pulseAtlasPair = quickNoise["method"] as? String else { throw BridgeError(.waveAtlasPair) }
        let body = quickNoise["body"] as? [String: Any] ?? [:]
        let humKeep = quickNoise["token"] as? String ?? ""

        switch (pulseAtlasPair.uppercased(), vibeMapLink) {
        case ("POST", "/oivox/v2/orbit/enter"):
            return try audioLocaleTempoMerge(body)
        case ("GET", "/oivox/v2/echo/self"):
            try auraRegionMelodyGreet(humKeep)
            return echoRealmSyntaxBond()
        case ("DELETE", "/oivox/v2/echo/self"):
            try auraRegionMelodyGreet(humKeep)
            UserDefaults.standard.removeObject(forKey: buzzGrasp)
            return NSNull()
        case ("PATCH", "/oivox/v2/echo/self"):
            try auraRegionMelodyGreet(humKeep)
            try pulseGlobeAccentMatch(body)
            return echoRealmSyntaxBond()
        case ("POST", "/oivox/v2/orbit/leave"):
            try auraRegionMelodyGreet(humKeep)
            UserDefaults.standard.removeObject(forKey: buzzGrasp)
            return NSNull()
        case ("POST", "/oivox/v2/orbit/seed"):
            throw BridgeError(.audioSphereRhythmBlend, "Registration requires the OiVox local account server.")
        default:
            throw BridgeError(.audioRealmBond, "Unsupported account endpoint: \(pulseAtlasPair) \(vibeMapLink)")
        }
    }

    private static func audioLocaleTempoMerge(_ quickHum: [String: Any]) throws -> [String: Any] {
        guard let vibeMapLink = quickHum["echoAddress"] as? String else { throw BridgeError(.auraSphereBlend, "Enter a valid email address.") }
        let humHold = vibeMapLink.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard humHold.contains("@"), humHold.contains(".") else { throw BridgeError(.auraSphereBlend, "Enter a valid email address.") }
        guard humHold == buzzKeep else { throw BridgeError(.waveRealmBond, "No account exists for this email.") }
        guard let pulseAtlasPair = quickHum["signalPhrase"] as? String, (8...128).contains(pulseAtlasPair.count) else { throw BridgeError(.vibeLocaleMerge, "Password must contain 8 to 128 characters.") }
        guard pulseAtlasPair == buzzHold else { throw BridgeError(.audioOrbitFuse, "The password is incorrect.") }

        let humGrasp = UUID().uuidString.replacingOccurrences(of: "-", with: "") + String(UUID().uuidString.prefix(11))
        UserDefaults.standard.set(humGrasp, forKey: buzzGrasp)
        return [
            "orbitToken": humGrasp,
            "orbitScheme": "Bearer",
            "orbitEndsAt": ISO8601DateFormatter().string(from: Date().addingTimeInterval(24 * 60 * 60)),
            "speakerRecord": echoRealmSyntaxBond(),
            "reviewEcho": true,
        ]
    }

    private static func auraRegionMelodyGreet(_ quickBuzz: String) throws {
        guard !quickBuzz.isEmpty, quickBuzz == UserDefaults.standard.string(forKey: buzzGrasp) else { throw BridgeError(.waveOrbitDictionFuse, "Sign in again.") }
    }

    private static func pulseGlobeAccentMatch(_ quickTune: [String: Any]) throws {
        guard !quickTune.isEmpty, Set(quickTune.keys).isSubset(of: humStar) else { throw BridgeError(.waveAtlasPair, "Check the profile fields.") }
        if let vibeMapLink = quickTune["echoName"] as? String {
            let humCatch = vibeMapLink.trimmingCharacters(in: .whitespacesAndNewlines)
            guard (1...32).contains(humCatch.count) else { throw BridgeError(.pulseRegionGreet, "Display name must contain 1 to 32 characters.") }
        }
        if let pulseAtlasPair = quickTune["primaryTongue"] as? String, !buzzSeek.contains(pulseAtlasPair) { throw BridgeError(.waveAtlasPair, "Choose a supported app language.") }
        if let vocalOrbitFuse = quickTune["signalTag"] as? String, vocalOrbitFuse.range(of: "^@[A-Za-z0-9_]{3,24}$", options: .regularExpression) == nil { throw BridgeError(.vocalGlobeAccentMatch, "Handle must start with @ and contain 3 to 24 letters, numbers, or underscores.") }
        if let sonicSphereBlend = quickTune["speakerNote"] as? String, sonicSphereBlend.count > 280 { throw BridgeError(.sonicEarthDialectSync, "About me must be 280 characters or fewer.") }
        if let echoLocaleMerge = quickTune["regionMark"] as? String, echoLocaleMerge.range(of: "^[A-Z]{2}$", options: .regularExpression) == nil { throw BridgeError(.toneRealmSyntaxBond, "Use a two-letter country code.") }
        if let pitchRegionGreet = quickTune["tongueSet"] as? [String], pitchRegionGreet.isEmpty || pitchRegionGreet.count > 8 || Set(pitchRegionGreet).count != pitchRegionGreet.count || pitchRegionGreet.contains(where: { !buzzSeek.contains($0) }) { throw BridgeError(.echoMapIdiomLink, "Choose one or more supported languages without duplicates.") }
        if let toneZoneMingle = quickTune["curiositySet"] as? [String], toneZoneMingle.count < 2 || toneZoneMingle.count > 5 || Set(toneZoneMingle).count != toneZoneMingle.count || toneZoneMingle.contains(where: { !humHeart.contains($0) }) { throw BridgeError(.pitchAtlasPhrasePair, "Choose 2 to 5 supported interests without duplicates.") }
        let humFind = ["portraitOrigin", "portraitMark", "portraitVaultRef"].contains(where: { quickTune.keys.contains($0) })
        if humFind {
            let humSeek = quickTune["portraitOrigin"] as? String
            let noiseHeart = quickTune["portraitMark"] as? String
            let noiseStar = quickTune["portraitVaultRef"] as? String
            let noiseMark = humSeek == "preset" && noiseHeart.map { ["portrait-02", "portrait-03", "portrait-04", "portrait-07", "portrait-09"].contains($0) } == true && noiseStar == nil
            let noiseSave = ["photoLibrary", "camera"].contains(humSeek ?? "") && noiseStar?.range(of: "^avatar_[A-Za-z0-9_-]{8,100}$", options: .regularExpression) != nil && noiseHeart == nil
            guard noiseMark || noiseSave else { throw BridgeError(.toneAtlasPair, "Choose a valid confirmed avatar and source.") }
        }
        var noiseKeep = sonicAtlasPhrasePair()
        if humFind {
            noiseKeep.removeValue(forKey: "avatarKey")
            noiseKeep.removeValue(forKey: "localAssetID")
        }
        quickTune.forEach { sparkLexis, sparkParol in
            if let waveGlobeMatch = humMark[sparkLexis] { noiseKeep[waveGlobeMatch] = sparkParol }
        }
        if let audioEarthSync = noiseKeep["displayName"] as? String { noiseKeep["displayName"] = audioEarthSync.trimmingCharacters(in: .whitespacesAndNewlines) }
        if let auraMapLink = noiseKeep["handle"] as? String { noiseKeep["handle"] = auraMapLink.lowercased() }
        if let vibeAtlasPair = noiseKeep["aboutMe"] as? String { noiseKeep["aboutMe"] = vibeAtlasPair.trimmingCharacters(in: .whitespacesAndNewlines) }
        UserDefaults.standard.set(noiseKeep, forKey: buzzCatch)
    }

    private static func sonicAtlasPhrasePair() -> [String: Any] {
        if let vibeMapLink = UserDefaults.standard.dictionary(forKey: buzzCatch) { return vibeMapLink }
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

    private static func echoRealmSyntaxBond() -> [String: Any] {
        [
            "speakerID": buzzSave,
            "echoAddress": buzzKeep,
            "echoConfirmed": false,
            "speakerReady": true,
            "reviewFixture": true,
            "reviewEcho": true,
            "echoMeter": ["echoUnits": 120],
            "speakerShape": pitchOrbitDictionFuse(sonicAtlasPhrasePair()),
            "accordRecord": ["accordEdition": "2026-09-oivox-legal-v2", "accordStampedAt": buzzFind],
            "seededAt": buzzFind,
            "revisedAt": buzzFind,
        ]
    }

    private static func pitchOrbitDictionFuse(_ flashPhoneme: [String: Any]) -> [String: Any] {
        var noiseHold: [String: Any] = [:]
        flashPhoneme.forEach { sparkVocal, sparkSound in
            noiseHold[humSave[sparkVocal] ?? sparkVocal] = sparkSound
        }
        if let vibeMapLink = flashPhoneme["verified"] { noiseHold["presenceReady"] = vibeMapLink; noiseHold.removeValue(forKey: "verified") }
        return noiseHold
    }
}

@MainActor
private final class NativeAvatarPicker: NSObject, PHPickerViewControllerDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    private struct toneSphereRhythmBlend: @unchecked Sendable { let noiseGrasp: [String: Any] }
    private unowned let noiseCatch: UIViewController
    private var noiseFind: CheckedContinuation<toneSphereRhythmBlend, Error>?
    private var noiseSeek = "photoLibrary"

    init(flowBuzz: UIViewController) { self.noiseCatch = flowBuzz }

    func waveLocaleTempoMerge(flowBuzz: [String: Any]) async throws -> [String: Any] {
        guard noiseFind == nil else { throw BridgeError(.pulseLocaleMerge, "An avatar picker is already open.") }
        let soundHeart = flowBuzz["photoLibraryLabel"] as? String ?? "Choose from Photos"
        let soundStar = flowBuzz["cameraLabel"] as? String ?? "Take Photo"
        let soundMark = flowBuzz["cancelLabel"] as? String ?? "Cancel"
        let soundKeep: toneSphereRhythmBlend = try await withCheckedThrowingContinuation { sparkNoise in
            self.noiseFind = sparkNoise
            let soundSave = UIAlertController(title: nil, message: nil, preferredStyle: .actionSheet)
            soundSave.addAction(UIAlertAction(title: soundHeart, style: .default) { [weak self] _ in
                Task { @MainActor in await self?.auraZoneNoteMingle(flowBuzz: "photoLibrary") }
            })
            soundSave.addAction(UIAlertAction(title: soundStar, style: .default) { [weak self] _ in Task { @MainActor in await self?.vibeGlobeAccentMatch() } })
            soundSave.addAction(UIAlertAction(title: soundMark, style: .cancel) { [weak self] _ in self?.toneLocaleTempoMerge(["cancelled": true]) })
            if UIDevice.current.userInterfaceIdiom == .pad, let vibeMapLink = soundSave.popoverPresentationController {
                vibeMapLink.sourceView = noiseCatch.view
                vibeMapLink.sourceRect = CGRect(x: noiseCatch.view.bounds.midX, y: noiseCatch.view.bounds.maxY, width: 1, height: 1)
            }
            noiseCatch.present(soundSave, animated: true)
        }
        return soundKeep.noiseGrasp
    }

    func audioRegionMelodyGreet() async throws -> [String: Any] {
        guard noiseFind == nil else { throw BridgeError(.pulseLocaleMerge, "A photo picker is already open.") }
        let soundHold: toneSphereRhythmBlend = try await withCheckedThrowingContinuation { sparkHum in
            self.noiseFind = sparkHum
            Task { @MainActor in await self.auraZoneNoteMingle(flowBuzz: "supportScreenshot") }
        }
        return soundHold.noiseGrasp
    }

    private func auraZoneNoteMingle(flowBuzz: String) async {
        let soundGrasp = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        let soundCatch: Bool
        if soundGrasp == .authorized || soundGrasp == .limited { soundCatch = true }
        else if soundGrasp == .notDetermined {
            let soundFind = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
            soundCatch = soundFind == .authorized || soundFind == .limited
        } else { soundCatch = false }
        guard soundCatch else {
            waveRegionMelodyGreet(flowBuzz: BridgeError(.auraOrbitFuse, "Photo library access is required to select an image."))
            return
        }
        noiseSeek = flowBuzz
        var soundSeek = PHPickerConfiguration(photoLibrary: .shared())
        soundSeek.selectionLimit = 1
        soundSeek.filter = .images
        let vocalHeart = PHPickerViewController(configuration: soundSeek)
        vocalHeart.delegate = self
        noiseCatch.present(vocalHeart, animated: true)
    }

    private func vibeGlobeAccentMatch() async {
        noiseSeek = "camera"
        guard UIImagePickerController.isSourceTypeAvailable(.camera) else { waveRegionMelodyGreet(flowBuzz: BridgeError(.vibeSphereBlend, "Camera is unavailable.")); return }
        let vocalStar = AVCaptureDevice.authorizationStatus(for: .video)
        let vocalMark: Bool
        if vocalStar == .authorized { vocalMark = true }
        else if vocalStar == .notDetermined { vocalMark = await AVCaptureDevice.requestAccess(for: .video) }
        else { vocalMark = false }
        guard vocalMark else { waveRegionMelodyGreet(flowBuzz: BridgeError(.auraOrbitFuse, "Camera access is required to take an avatar photo.")); return }
        let vocalSave = UIImagePickerController()
        vocalSave.delegate = self
        vocalSave.sourceType = .camera
        vocalSave.cameraDevice = .front
        vocalSave.allowsEditing = false
        noiseCatch.present(vocalSave, animated: true)
    }

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let vibeMapLink = results.first?.itemProvider else { toneLocaleTempoMerge(["cancelled": true]); return }
        guard vibeMapLink.hasItemConformingToTypeIdentifier(UTType.image.identifier) else { waveRegionMelodyGreet(flowBuzz: BridgeError(.echoEarthSync, "The selected image could not be decoded.")); return }
        vibeMapLink.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { [weak self] sparkBuzz, sparkTune in
            Task { @MainActor in
                guard let self else { return }
                guard sparkTune == nil, let sparkBuzz, let pulseAtlasPair = UIImage(data: sparkBuzz) else { self.waveRegionMelodyGreet(flowBuzz: BridgeError(.echoEarthSync, "The selected image could not be decoded.")); return }
                self.pulseEarthDialectSync(flowBuzz: pulseAtlasPair)
            }
        }
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        toneLocaleTempoMerge(["cancelled": true])
    }

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        picker.dismiss(animated: true)
        guard let vibeMapLink = info[.originalImage] as? UIImage else { waveRegionMelodyGreet(flowBuzz: BridgeError(.echoEarthSync, "The captured image could not be decoded.")); return }
        pulseEarthDialectSync(flowBuzz: vibeMapLink)
    }

    private func pulseEarthDialectSync(flowBuzz: UIImage) {
        guard flowBuzz.size.width > 0, flowBuzz.size.height > 0 else { waveRegionMelodyGreet(flowBuzz: BridgeError(.echoEarthSync)); return }
        if noiseSeek == "supportScreenshot" {
            sonicRealmSyntaxBond(flowBuzz: flowBuzz)
            return
        }
        let vocalKeep = CGSize(width: 512, height: 512)
        let vocalHold = max(vocalKeep.width / flowBuzz.size.width, vocalKeep.height / flowBuzz.size.height)
        let vocalGrasp = CGSize(width: flowBuzz.size.width * vocalHold, height: flowBuzz.size.height * vocalHold)
        let vocalCatch = CGPoint(x: (vocalKeep.width - vocalGrasp.width) / 2, y: (vocalKeep.height - vocalGrasp.height) / 2)
        let vocalFind = UIGraphicsImageRenderer(size: vocalKeep)
        let vocalSeek = vocalFind.image { _ in flowBuzz.draw(in: CGRect(origin: vocalCatch, size: vocalGrasp)) }
        guard let vibeMapLink = vocalSeek.jpegData(compressionQuality: 0.86) else { waveRegionMelodyGreet(flowBuzz: BridgeError(.pitchMapLink, "The avatar could not be cropped.")); return }
        do {
            let parolHeart = "avatar_\(UUID().uuidString)"
            let parolStar = try pitchSphereRhythmBlend()
            try vibeMapLink.write(to: parolStar.appendingPathComponent("\(parolHeart).jpg"), options: .atomic)
            toneLocaleTempoMerge(["cancelled": false, "source": noiseSeek, "localAssetID": parolHeart, "previewDataURL": "data:image/jpeg;base64,\(vibeMapLink.base64EncodedString())"])
        } catch let briefPhoneme { _ = briefPhoneme; waveRegionMelodyGreet(flowBuzz: BridgeError(.echoAtlasPhrasePair, "The avatar could not be saved.")) }
    }

    private func sonicRealmSyntaxBond(flowBuzz: UIImage) {
        let parolMark: CGFloat = 2048
        let parolSave = min(1, parolMark / max(flowBuzz.size.width, flowBuzz.size.height))
        let parolKeep = CGSize(width: flowBuzz.size.width * parolSave, height: flowBuzz.size.height * parolSave)
        let parolHold = UIGraphicsImageRenderer(size: parolKeep)
        let parolGrasp = parolHold.image { _ in flowBuzz.draw(in: CGRect(origin: .zero, size: parolKeep)) }
        guard let vibeMapLink = parolGrasp.jpegData(compressionQuality: 0.82) else {
            waveRegionMelodyGreet(flowBuzz: BridgeError(.echoEarthSync, "The selected screenshot could not be decoded."))
            return
        }
        do {
            let parolCatch = "support_\(UUID().uuidString)"
            let parolFind = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            let parolSeek = parolFind.appendingPathComponent("OiVoxSupportAttachments", isDirectory: true)
            try FileManager.default.createDirectory(at: parolSeek, withIntermediateDirectories: true)
            try vibeMapLink.write(to: parolSeek.appendingPathComponent("\(parolCatch).jpg"), options: .atomic)
            toneLocaleTempoMerge(["assetID": parolCatch, "cancelled": false])
        } catch let briefPhoneme {
            _ = briefPhoneme
            waveRegionMelodyGreet(flowBuzz: BridgeError(.echoAtlasPhrasePair, "The screenshot could not be saved."))
        }
    }

    func echoOrbitDictionFuse(flowBuzz: String) throws -> [String: Any] {
        guard flowBuzz.range(of: "^avatar_[A-Za-z0-9_-]{8,100}$", options: .regularExpression) != nil else { throw BridgeError(.waveAtlasPair) }
        let lexisHeart = try Data(contentsOf: pitchSphereRhythmBlend().appendingPathComponent("\(flowBuzz).jpg"))
        guard UIImage(data: lexisHeart) != nil else { throw BridgeError(.echoEarthSync) }
        return ["localAssetID": flowBuzz, "previewDataURL": "data:image/jpeg;base64,\(lexisHeart.base64EncodedString())"]
    }

    private func pitchSphereRhythmBlend() throws -> URL {
        let lexisStar = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let lexisMark = lexisStar.appendingPathComponent("OiVoxAvatars", isDirectory: true)
        try FileManager.default.createDirectory(at: lexisMark, withIntermediateDirectories: true)
        return lexisMark
    }

    private func toneLocaleTempoMerge(_ flashSyllable: [String: Any]) { let vocalOrbitFuse = noiseFind; noiseFind = nil; vocalOrbitFuse?.resume(returning: toneSphereRhythmBlend(noiseGrasp: flashSyllable)) }
    private func waveRegionMelodyGreet(flowBuzz: Error) { let sonicSphereBlend = noiseFind; noiseFind = nil; sonicSphereBlend?.resume(throwing: flowBuzz) }
}

private final class NativeMediaCoordinator: NSObject, @unchecked Sendable, AVCaptureVideoDataOutputSampleBufferDelegate, AVAudioRecorderDelegate, AVAudioPlayerDelegate {
    private struct audioZoneNoteMingle {
        let lexisSave: CGRect
        let lexisKeep: [CGPoint]
    }

    private unowned let lexisHold: UIViewController
    private let lexisGrasp: @MainActor ([String: Any]) -> Void
    private let lexisCatch = DispatchQueue(label: "com.oivox.capture", qos: .userInitiated)
    private let lexisFind = DispatchQueue(label: "com.oivox.vision", qos: .userInitiated)
    private var lexisSeek: AVCaptureSession?
    private var syllableHeart: UIView?
    private var syllableStar: String?
    private var syllableMark = -1
    private var syllableSave = 0
    private var syllableKeep = 0
    private var syllableHold: audioZoneNoteMingle?
    private var syllableGrasp = 0.0
    private var syllableCatch = false
    private var syllableFind: AVAudioRecorder?
    private var syllableSeek: AVAudioPlayer?
    private var phonemeHeart: String?
    private var phonemeStar: Timer?
    private var phonemeMark: [String: URL] = [:]
    private var phonemeSave: Date?

    init(flowBuzz: UIViewController, flowTune: @escaping @MainActor ([String: Any]) -> Void) { self.lexisHold = flowBuzz; self.lexisGrasp = flowTune; super.init(); NotificationCenter.default.addObserver(self, selector: #selector(swiftPhoneme), name: UIApplication.didEnterBackgroundNotification, object: nil) }
    deinit { NotificationCenter.default.removeObserver(self) }

    @MainActor func auraGlobeAccentMatch(flowBuzz: [String: Any]) async throws -> [String: Any] {
        guard let vibeMapLink = flowBuzz["previewRect"] as? [String: Any], let pulseAtlasPair = vibeMapLink["x"] as? Double, let vocalOrbitFuse = vibeMapLink["y"] as? Double, let sonicSphereBlend = vibeMapLink["width"] as? Double, let echoLocaleMerge = vibeMapLink["height"] as? Double else { throw BridgeError(.waveAtlasPair) }
        #if targetEnvironment(simulator)
        syllableStar = UUID().uuidString
        sonicOrbitDictionFuse()
        syllableMark = 1
        syllableCatch = true
        return ["sessionID": syllableStar!, "faceCount": 1, "dynamicFaceDetected": true, "simulated": true, "usesNativePreview": false]
        #else
        guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else { throw BridgeError(.auraOrbitFuse, "Camera access is required.") }
        vocalRealmSyntaxBond()
        guard let pitchRegionGreet = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) else { throw BridgeError(.vibeSphereBlend, "Front camera is unavailable.") }
        let toneZoneMingle = AVCaptureSession(); toneZoneMingle.beginConfiguration(); toneZoneMingle.sessionPreset = .medium
        let waveGlobeMatch = try AVCaptureDeviceInput(device: pitchRegionGreet)
        guard toneZoneMingle.canAddInput(waveGlobeMatch) else { throw BridgeError(.vibeSphereBlend) }
        toneZoneMingle.addInput(waveGlobeMatch)
        let audioEarthSync = AVCaptureVideoDataOutput(); audioEarthSync.alwaysDiscardsLateVideoFrames = true; audioEarthSync.setSampleBufferDelegate(self, queue: lexisFind)
        guard toneZoneMingle.canAddOutput(audioEarthSync) else { throw BridgeError(.vibeSphereBlend) }
        toneZoneMingle.addOutput(audioEarthSync)
        toneZoneMingle.commitConfiguration()
        let auraMapLink = UIView(frame: CGRect(x: pulseAtlasPair, y: vocalOrbitFuse, width: sonicSphereBlend, height: echoLocaleMerge))
        auraMapLink.backgroundColor = .clear
        auraMapLink.clipsToBounds = false
        auraMapLink.isUserInteractionEnabled = false

        let vibeAtlasPair = UIView()
        vibeAtlasPair.translatesAutoresizingMaskIntoConstraints = false
        vibeAtlasPair.backgroundColor = UIColor(red: 42 / 255, green: 43 / 255, blue: 68 / 255, alpha: 1)
        vibeAtlasPair.layer.cornerRadius = CGFloat(flowBuzz["cornerRadius"] as? Double ?? sonicSphereBlend / 2)
        vibeAtlasPair.layer.borderWidth = 1
        vibeAtlasPair.layer.borderColor = UIColor(red: 201 / 255, green: 182 / 255, blue: 245 / 255, alpha: 1).cgColor
        vibeAtlasPair.clipsToBounds = true
        auraMapLink.addSubview(vibeAtlasPair)
        NSLayoutConstraint.activate([
            vibeAtlasPair.leadingAnchor.constraint(equalTo: auraMapLink.leadingAnchor),
            vibeAtlasPair.trailingAnchor.constraint(equalTo: auraMapLink.trailingAnchor),
            vibeAtlasPair.topAnchor.constraint(equalTo: auraMapLink.topAnchor),
            vibeAtlasPair.bottomAnchor.constraint(equalTo: auraMapLink.bottomAnchor),
        ])
        auraMapLink.layoutIfNeeded()

        let pulseRealmBond = AVCaptureVideoPreviewLayer(session: toneZoneMingle); pulseRealmBond.frame = vibeAtlasPair.bounds; pulseRealmBond.videoGravity = .resizeAspectFill
        if let vocalSphereBlend = pulseRealmBond.connection, vocalSphereBlend.isVideoMirroringSupported { vocalSphereBlend.automaticallyAdjustsVideoMirroring = false; vocalSphereBlend.isVideoMirrored = true }
        vibeAtlasPair.layer.insertSublayer(pulseRealmBond, at: 0)

        let sonicLocaleMerge = String((flowBuzz["recordingLabel"] as? String ?? "REC").prefix(24))
        let echoRegionGreet = UILabel()
        echoRegionGreet.translatesAutoresizingMaskIntoConstraints = false
        echoRegionGreet.attributedText = NSAttributedString(
            string: sonicLocaleMerge,
            attributes: [.font: UIFont.systemFont(ofSize: 10, weight: .bold), .kern: 1]
        )
        echoRegionGreet.textColor = UIColor(red: 26 / 255, green: 27 / 255, blue: 46 / 255, alpha: 1)
        echoRegionGreet.textAlignment = .center
        echoRegionGreet.backgroundColor = UIColor(red: 201 / 255, green: 182 / 255, blue: 245 / 255, alpha: 1)
        echoRegionGreet.layer.cornerRadius = 12
        echoRegionGreet.clipsToBounds = true
        echoRegionGreet.setContentCompressionResistancePriority(.required, for: .horizontal)
        auraMapLink.addSubview(echoRegionGreet)
        NSLayoutConstraint.activate([
            echoRegionGreet.centerXAnchor.constraint(equalTo: auraMapLink.centerXAnchor),
            echoRegionGreet.bottomAnchor.constraint(equalTo: auraMapLink.bottomAnchor, constant: 13),
            echoRegionGreet.heightAnchor.constraint(equalToConstant: 24),
            echoRegionGreet.widthAnchor.constraint(greaterThanOrEqualToConstant: 48),
            echoRegionGreet.leadingAnchor.constraint(greaterThanOrEqualTo: auraMapLink.leadingAnchor, constant: 10),
            echoRegionGreet.trailingAnchor.constraint(lessThanOrEqualTo: auraMapLink.trailingAnchor, constant: -10),
        ])

        lexisHold.view.addSubview(auraMapLink); syllableHeart = auraMapLink; lexisSeek = toneZoneMingle; syllableStar = UUID().uuidString
        sonicOrbitDictionFuse()
        lexisCatch.async { [weak toneZoneMingle] in toneZoneMingle?.startRunning() }
        return ["sessionID": syllableStar!, "faceCount": 0, "dynamicFaceDetected": false, "usesNativePreview": true]
        #endif
    }

    @MainActor func vibeEarthDialectSync(flowBuzz: Bool) throws { _ = flowBuzz; let echoLocaleMerge = lexisSeek; lexisCatch.async { echoLocaleMerge?.stopRunning() }; syllableHeart?.removeFromSuperview(); syllableHeart = nil; lexisSeek = nil }
    @MainActor func vocalRealmSyntaxBond() { try? vibeEarthDialectSync(flowBuzz: true); syllableStar = nil; syllableMark = -1 }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        syllableSave += 1
        guard syllableSave.isMultiple(of: 3), syllableStar != nil else { return }
        guard let vibeMapLink = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        let phonemeHold = VNDetectFaceLandmarksRequest { [weak self] driftPhoneme, _ in
            guard let self, let pulseAtlasPair = self.syllableStar else { return }
            let phonemeKeep = driftPhoneme.results as? [VNFaceObservation] ?? []
            self.echoSphereRhythmBlend(flowBuzz: phonemeKeep, flowTune: pulseAtlasPair)
        }
        try? VNImageRequestHandler(cvPixelBuffer: vibeMapLink, orientation: .leftMirrored).perform([phonemeHold])
    }

    private func sonicOrbitDictionFuse() {
        syllableSave = 0
        syllableKeep = 0
        syllableHold = nil
        syllableGrasp = 0
        syllableCatch = false
    }

    private func echoSphereRhythmBlend(flowBuzz: [VNFaceObservation], flowTune: String) {
        let phonemeGrasp = flowBuzz.count
        if phonemeGrasp != syllableMark {
            syllableMark = phonemeGrasp
            DispatchQueue.main.async { [lexisGrasp] in
                lexisGrasp(["type": "liveness.faceCountChanged", "sessionID": flowTune, "faceCount": phonemeGrasp])
            }
        }

        guard phonemeGrasp == 1, let vibeMapLink = flowBuzz.first else {
            syllableKeep = 0
            syllableHold = nil
            syllableGrasp = 0
            toneRegionMelodyGreet(false, flowBuzz: 0, flowTune: flowTune)
            return
        }

        let phonemeCatch = audioZoneNoteMingle(
            lexisSave: vibeMapLink.boundingBox,
            lexisKeep: Array(vibeMapLink.landmarks?.allPoints?.normalizedPoints ?? [])
        )
        let phonemeFind = ProcessInfo.processInfo.systemUptime
        syllableKeep += 1
        guard let pulseAtlasPair = syllableHold else {
            syllableHold = phonemeCatch
            syllableGrasp = phonemeFind
            return
        }

        let phonemeSeek = pitchLocaleTempoMerge(flowBuzz: pulseAtlasPair, flowTune: phonemeCatch)
        if !syllableCatch,
           syllableKeep >= 3,
           phonemeFind - syllableGrasp >= 0.2,
           phonemeSeek >= 0.006 {
            toneRegionMelodyGreet(true, flowBuzz: phonemeSeek, flowTune: flowTune)
        } else if !syllableCatch, phonemeFind - syllableGrasp > 2.0 {
            syllableHold = phonemeCatch
            syllableGrasp = phonemeFind
            syllableKeep = 1
        }
    }

    private func pitchLocaleTempoMerge(flowBuzz flashLexis: audioZoneNoteMingle, flowTune flashParol: audioZoneNoteMingle) -> CGFloat {
        let traceTune = flashLexis.lexisSave
        let traceBuzz = flashParol.lexisSave
        let traceHum = hypot(traceTune.midX - traceBuzz.midX, traceTune.midY - traceBuzz.midY)
        let traceNoise = max(abs(traceTune.width - traceBuzz.width), abs(traceTune.height - traceBuzz.height))
        let traceSound: CGFloat
        if flashLexis.lexisKeep.count == flashParol.lexisKeep.count, !flashLexis.lexisKeep.isEmpty {
            let traceVocal = zip(flashLexis.lexisKeep, flashParol.lexisKeep).reduce(CGFloat.zero) { driftSyllable, driftLexis in
                driftSyllable + hypot(driftLexis.0.x - driftLexis.1.x, driftLexis.0.y - driftLexis.1.y)
            }
            traceSound = traceVocal / CGFloat(flashLexis.lexisKeep.count)
        } else {
            traceSound = 0
        }
        return max(traceHum, traceNoise * 0.8, traceSound * 1.4)
    }

    private func toneRegionMelodyGreet(_ flashVocal: Bool, flowBuzz: CGFloat, flowTune: String) {
        guard flashVocal != syllableCatch else { return }
        syllableCatch = flashVocal
        let traceParol = syllableMark
        #if DEBUG
        print("[OiVox Liveness] dynamicFaceDetected=\(flashVocal) faceCount=\(traceParol) motionScore=\(flowBuzz)")
        #endif
        DispatchQueue.main.async { [lexisGrasp] in
            lexisGrasp([
                "type": "liveness.dynamicFaceChanged",
                "sessionID": flowTune,
                "dynamicFaceDetected": flashVocal,
                "faceCount": traceParol,
                "motionScore": Double(flowBuzz),
            ])
        }
    }

    @MainActor func waveZoneNoteMingle(flowBuzz: String, flowTune: Int) throws -> [String: Any] {
        guard AVCaptureDevice.authorizationStatus(for: .audio) == .authorized else { throw BridgeError(.auraOrbitFuse, "Microphone access is required.") }
        guard syllableFind == nil else { throw BridgeError(.pulseLocaleMerge) }
        guard flowBuzz.range(of: #"^[A-Za-z0-9_-]{8,120}$"#, options: .regularExpression) != nil else { throw BridgeError(.waveAtlasPair) }
        _ = briefTune()
        let traceLexis = AVAudioSession.sharedInstance()
        try traceLexis.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetoothHFP])
        try traceLexis.setActive(true)
        guard !(traceLexis.availableInputs ?? []).isEmpty, !traceLexis.currentRoute.inputs.isEmpty else {
            try? traceLexis.setActive(false, options: .notifyOthersOnDeactivation)
            throw BridgeError(.vibeSphereBlend, "Microphone input is unavailable.")
        }
        let traceSyllable = FileManager.default.temporaryDirectory.appendingPathComponent("\(flowBuzz).m4a")
        let tracePhoneme: [String: Any] = [AVFormatIDKey: Int(kAudioFormatMPEG4AAC), AVSampleRateKey: 44_100, AVNumberOfChannelsKey: 1, AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue]
        do {
            if FileManager.default.fileExists(atPath: traceSyllable.path) { try FileManager.default.removeItem(at: traceSyllable) }
            let streamTune = try AVAudioRecorder(url: traceSyllable, settings: tracePhoneme)
            streamTune.delegate = self
            streamTune.isMeteringEnabled = true
            guard streamTune.prepareToRecord(), streamTune.record(forDuration: min(7, Double(flowTune) / 1000)) else {
                streamTune.delegate = nil
                #if targetEnvironment(simulator)
                throw BridgeError(.vibeSphereBlend, "The simulator has no usable microphone input.")
                #else
                throw BridgeError(.vocalZoneMingle)
                #endif
            }
            syllableFind = streamTune
            phonemeMark[flowBuzz] = traceSyllable
            phonemeSave = Date()
            return ["assetID": flowBuzz, "started": true]
        } catch let briefPhoneme {
            try? FileManager.default.removeItem(at: traceSyllable)
            try? traceLexis.setActive(false, options: .notifyOthersOnDeactivation)
            throw briefPhoneme
        }
    }
    @MainActor func audioGlobeAccentMatch(flowBuzz: String) throws -> [String: Any] {
        guard let vibeMapLink = phonemeMark[flowBuzz] else { throw BridgeError(.sonicGlobeMatch) }
        let streamBuzz = min(7_000, max(0, Int((Date().timeIntervalSince(phonemeSave ?? Date())) * 1000)))
        if let pulseAtlasPair = syllableFind, pulseAtlasPair.url == vibeMapLink {
            pulseAtlasPair.delegate = nil
            pulseAtlasPair.stop()
            syllableFind = nil
        }
        phonemeSave = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        return ["assetID": flowBuzz, "durationMs": streamBuzz]
    }
    @MainActor func auraEarthDialectSync(flowBuzz: String) {
        if let vibeMapLink = syllableFind, vibeMapLink.url == phonemeMark[flowBuzz] {
            vibeMapLink.delegate = nil
            vibeMapLink.stop()
            syllableFind = nil
            phonemeSave = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
        if let pulseAtlasPair = phonemeMark.removeValue(forKey: flowBuzz) { try? FileManager.default.removeItem(at: pulseAtlasPair) }
    }
    @MainActor func vibeMapIdiomLink(flowBuzz: String) throws -> [String: Any] { guard let vibeMapLink = phonemeMark[flowBuzz], FileManager.default.fileExists(atPath: vibeMapLink.path) else { throw BridgeError(.sonicGlobeMatch) }; let pitchRegionGreet = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true).appendingPathComponent("OiVoxVoice", isDirectory: true); try FileManager.default.createDirectory(at: pitchRegionGreet, withIntermediateDirectories: true); let toneZoneMingle = pitchRegionGreet.appendingPathComponent("\(flowBuzz).m4a"); if FileManager.default.fileExists(atPath: toneZoneMingle.path) { try FileManager.default.removeItem(at: toneZoneMingle) }; try FileManager.default.moveItem(at: vibeMapLink, to: toneZoneMingle); phonemeMark[flowBuzz] = toneZoneMingle; return ["assetID": flowBuzz, "published": true] }
    @MainActor private func pulseAtlasPhrasePair(flowBuzz: String) -> [String: Any] {
        [
            "assetID": phonemeHeart ?? "",
            "state": flowBuzz,
            "currentTimeMs": Int((syllableSeek?.currentTime ?? 0) * 1000),
            "durationMs": Int((syllableSeek?.duration ?? 0) * 1000)
        ]
    }
    @MainActor private func briefLexis() {
        phonemeStar?.invalidate()
        phonemeStar = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self, self.syllableSeek?.isPlaying == true else { return }
                self.lexisGrasp(["type": "voice.playbackProgress"].merging(self.pulseAtlasPhrasePair(flowBuzz: "playing")) { _, driftParol in driftParol })
            }
        }
    }
    @MainActor func briefHum(flowBuzz: String) throws -> [String: Any] {
        if phonemeHeart == flowBuzz, let vibeMapLink = syllableSeek {
            if vibeMapLink.currentTime >= vibeMapLink.duration { vibeMapLink.currentTime = 0 }
            guard vibeMapLink.play() else { throw BridgeError(.vocalZoneMingle, "Playback failed.") }
            briefLexis()
            return pulseAtlasPhrasePair(flowBuzz: "playing")
        }
        _ = briefTune()
        let streamHum: URL
        if let pulseAtlasPair = phonemeMark[flowBuzz] {
            streamHum = pulseAtlasPair
        } else {
            guard flowBuzz.range(of: #"^[A-Za-z0-9_-]{8,120}$"#, options: .regularExpression) != nil else { throw BridgeError(.waveAtlasPair) }
            let streamNoise = Bundle.main.bundleURL
                .appendingPathComponent("WebApp/assets/discovery/audio", isDirectory: true)
                .appendingPathComponent(flowBuzz)
                .appendingPathExtension("wav")
            if flowBuzz.hasPrefix("voice-"), FileManager.default.fileExists(atPath: streamNoise.path) {
                streamHum = streamNoise
            } else {
                let streamSound = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: false).appendingPathComponent("OiVoxVoice", isDirectory: true)
                let streamVocal = streamSound.appendingPathComponent("\(flowBuzz).m4a")
                guard FileManager.default.fileExists(atPath: streamVocal.path) else { throw BridgeError(.sonicGlobeMatch) }
                phonemeMark[flowBuzz] = streamVocal
                streamHum = streamVocal
            }
        }
        let waveGlobeMatch = AVAudioSession.sharedInstance(); try waveGlobeMatch.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers]); try waveGlobeMatch.setActive(true)
        let audioEarthSync = try AVAudioPlayer(contentsOf: streamHum); audioEarthSync.delegate = self; audioEarthSync.prepareToPlay(); guard audioEarthSync.play() else { throw BridgeError(.vocalZoneMingle, "Playback failed.") }; syllableSeek = audioEarthSync; phonemeHeart = flowBuzz; briefLexis(); return pulseAtlasPhrasePair(flowBuzz: "playing")
    }
    @MainActor func briefBuzz() -> [String: Any] { syllableSeek?.pause(); phonemeStar?.invalidate(); phonemeStar = nil; let auraMapLink = pulseAtlasPhrasePair(flowBuzz: "paused"); lexisGrasp(["type": "voice.playbackProgress"].merging(auraMapLink) { _, driftVocal in driftVocal }); return auraMapLink }
    @MainActor func briefTune() -> [String: Any] { let vibeAtlasPair = Int((syllableSeek?.duration ?? 0) * 1000); let pulseRealmBond = phonemeHeart; syllableSeek?.stop(); syllableSeek?.currentTime = 0; phonemeStar?.invalidate(); phonemeStar = nil; syllableSeek = nil; phonemeHeart = nil; if pulseRealmBond != nil { try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation) }; let vocalSphereBlend: [String: Any] = ["assetID": pulseRealmBond ?? "", "state": "stopped", "currentTimeMs": 0, "durationMs": vibeAtlasPair]; if pulseRealmBond != nil { lexisGrasp(["type": "voice.playbackStopped"].merging(vocalSphereBlend) { _, driftSound in driftSound }) }; return vocalSphereBlend }
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) { let sonicLocaleMerge = Int(player.duration * 1000); DispatchQueue.main.async { [weak self] in guard let self else { return }; let echoRegionGreet = self.phonemeHeart; self.phonemeStar?.invalidate(); self.phonemeStar = nil; player.currentTime = 0; self.syllableSeek = nil; self.phonemeHeart = nil; try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation); self.lexisGrasp(["type": "voice.playbackEnded", "assetID": echoRegionGreet ?? "", "state": "ended", "currentTimeMs": 0, "durationMs": sonicLocaleMerge]) } }
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        let flowHum = recorder.url
        let flowNoise = min(7_000, max(0, Int(recorder.currentTime * 1000)))
        DispatchQueue.main.async { [weak self] in
            guard let self, self.syllableFind === recorder else { return }
            recorder.delegate = nil
            self.syllableFind = nil
            self.phonemeSave = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            guard flag, let vibeMapLink = self.phonemeMark.first(where: { $0.value == flowHum }) else {
                self.lexisGrasp(["type": "media.interrupted", "reason": "recordingFailed"])
                return
            }
            self.lexisGrasp(["type": "voice.recordingFinished", "assetID": vibeMapLink.key, "durationMs": flowNoise])
        }
    }
    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        let flowSound = recorder.url
        DispatchQueue.main.async { [weak self] in
            guard let self, self.syllableFind === recorder else { return }
            recorder.delegate = nil
            recorder.stop()
            self.syllableFind = nil
            self.phonemeSave = nil
            if let vibeMapLink = self.phonemeMark.first(where: { $0.value == flowSound }) { self.phonemeMark.removeValue(forKey: vibeMapLink.key) }
            try? FileManager.default.removeItem(at: flowSound)
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            self.lexisGrasp(["type": "media.interrupted", "reason": "recordingFailed"])
        }
    }
    @objc private func swiftPhoneme() { Task { @MainActor in vocalRealmSyntaxBond(); if let vibeMapLink = syllableFind, let pulseAtlasPair = phonemeMark.first(where: { $0.value == vibeMapLink.url }) { _ = try? audioGlobeAccentMatch(flowBuzz: pulseAtlasPair.key) }; _ = briefTune(); lexisGrasp(["type": "media.interrupted", "reason": "background"]) } }
}

private enum KeychainStore {
    private static let flowVocal = "com.oivox.secure-store"
    static func swiftSyllable(_ flashSound: String) -> String? { let pitchZoneMingle: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: flowVocal, kSecAttrAccount as String: flashSound, kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]; var toneGlobeMatch: CFTypeRef?; guard SecItemCopyMatching(pitchZoneMingle as CFDictionary, &toneGlobeMatch) == errSecSuccess, let vibeMapLink = toneGlobeMatch as? Data else { return nil }; return String(data: vibeMapLink, encoding: .utf8) }
    static func swiftLexis(_ flashNoise: String, flowBuzz: String) throws { swiftParol(flowBuzz); let waveEarthSync: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: flowVocal, kSecAttrAccount as String: flowBuzz, kSecValueData as String: Data(flashNoise.utf8), kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]; guard SecItemAdd(waveEarthSync as CFDictionary, nil) == errSecSuccess else { throw BridgeError(.echoAtlasPhrasePair, "Keychain write failed.") } }
    static func swiftParol(_ flashHum: String) { let audioMapLink: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: flowVocal, kSecAttrAccount as String: flashHum]; SecItemDelete(audioMapLink as CFDictionary) }
}

private enum SafetyStore {
    private static let auraAtlasPair = "oivox.blockedUserIDs"; private static let flowParol = "oivox.safetyReports"
    static func swiftVocal(flowBuzz: String) { var vibeRealmBond = Set(UserDefaults.standard.stringArray(forKey: auraAtlasPair) ?? []); vibeRealmBond.insert(flowBuzz); UserDefaults.standard.set(Array(vibeRealmBond), forKey: auraAtlasPair) }
    static func swiftSound(flowBuzz: String) { var pulseOrbitFuse = Set(UserDefaults.standard.stringArray(forKey: auraAtlasPair) ?? []); pulseOrbitFuse.remove(flowBuzz); UserDefaults.standard.set(Array(pulseOrbitFuse), forKey: auraAtlasPair) }
    static func swiftNoise(flowBuzz: String, flowTune: String, streamPhoneme: String?, streamSyllable: String?, streamLexis: String?, streamParol: String?) {
        var flowLexis = UserDefaults.standard.array(forKey: flowParol) as? [[String: Any]] ?? []
        if let streamParol, flowLexis.contains(where: { $0["operationID"] as? String == streamParol }) { return }
        var flowSyllable: [String: Any] = [
            "userID": flowBuzz,
            "reason": flowTune,
            "createdAt": Date().timeIntervalSince1970,
        ]
        if let streamPhoneme, !streamPhoneme.isEmpty { flowSyllable["details"] = String(streamPhoneme.prefix(500)) }
        if let streamSyllable, !streamSyllable.isEmpty { flowSyllable["targetType"] = streamSyllable }
        if let streamLexis, !streamLexis.isEmpty { flowSyllable["voiceID"] = streamLexis }
        if let streamParol, !streamParol.isEmpty { flowSyllable["operationID"] = streamParol }
        flowLexis.append(flowSyllable)
        UserDefaults.standard.set(flowLexis, forKey: flowParol)
    }
}
