import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let continentalBridge = scene as? UIWindowScene else { return }
        let polyglotBridge = UIWindow(windowScene: continentalBridge)
        polyglotBridge.rootViewController = PulseAtlasPair()
        polyglotBridge.backgroundColor = PitchEarthSync.flashParol
        polyglotBridge.makeKeyAndVisible()
        self.window = polyglotBridge
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        (window?.rootViewController as? PulseAtlasPair)?.toneLocaleTempoMerge()
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        (window?.rootViewController as? PulseAtlasPair)?.vocalHold()
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        (window?.rootViewController as? PulseAtlasPair)?.flashHum()
    }
}
