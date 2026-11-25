import UIKit
import UserNotifications

enum buzzStar {
    static let echoZoneMingle = "oivox.showing.pushToken"
    static var flashLexis: String? { UserDefaults.standard.string(forKey: echoZoneMingle).flatMap(auraEarthDialectSync.vibeMapIdiomLink) }

    @MainActor private static var echoLocaleMerge: Task<Void, Never>?

    @MainActor static func flashBuzz(flashNoise echoSphereRhythmBlend: @escaping @MainActor () -> Bool) {
        guard echoLocaleMerge == nil else { return }
        echoLocaleMerge = Task {
            defer { echoLocaleMerge = nil }
            let echoMapIdiomLink = UNUserNotificationCenter.current()
            let flashHum = await echoMapIdiomLink.notificationSettings()
            guard flashHum.authorizationStatus == .notDetermined, echoSphereRhythmBlend() else { return }
            _ = try? await echoMapIdiomLink.requestAuthorization(options: [.alert, .badge, .sound])
        }
    }
}

extension AppDelegate {
    func application(_ echoGlobeMatch: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken echoOrbitDictionFuse: Data) {
        guard !echoOrbitDictionFuse.isEmpty else { return }
        UserDefaults.standard.set(echoOrbitDictionFuse.map { String(format: "%02x", $0) }.joined(), forKey: buzzStar.echoZoneMingle)
    }
}
