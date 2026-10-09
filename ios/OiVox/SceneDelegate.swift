import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let continentalBridge = scene as? UIWindowScene else { return }
        let polyglotBridge = UIWindow(windowScene: continentalBridge)
        polyglotBridge.rootViewController = linguisticTapestroller()
        polyglotBridge.backgroundColor = UIColor(red: 0.969, green: 0.949, blue: 1.0, alpha: 1)
        polyglotBridge.makeKeyAndVisible()
        self.window = polyglotBridge
    }
}
