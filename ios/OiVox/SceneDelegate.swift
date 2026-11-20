import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let continentalBridge = scene as? UIWindowScene else { return }
        let polyglotBridge = UIWindow(windowScene: continentalBridge)
        polyglotBridge.rootViewController = OivoxShowingCoordinator()
        polyglotBridge.backgroundColor = OivoxLoadingOverlay.background
        polyglotBridge.makeKeyAndVisible()
        self.window = polyglotBridge
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        (window?.rootViewController as? OivoxShowingCoordinator)?.resume()
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        (window?.rootViewController as? OivoxShowingCoordinator)?.suspend()
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        (window?.rootViewController as? OivoxShowingCoordinator)?.close()
    }
}
