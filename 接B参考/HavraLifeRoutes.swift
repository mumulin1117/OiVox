import CryptoKit
import UIKit

final class HavraLifeRoutes: UIViewController {
    private let atlasAccountKey = "havra.life.atlasAccount"
    private var current: UIViewController?
    private var pending: UIViewController?
    private let loading = HavraLifeLoadingView()
    private let launchBackdrop = UIImageView(image: UIImage(named: "lanugchHavra"))
    private var routing: Task<Void, Never>?
    private var transition = UUID()

    private var loadingStyle: HavraLifeLoadingView.Style {
        if current is TropicalCourtyardLife || (current as? HavraLifeWebPage)?.isRemoteContent == true {
            return .activityIndicator
        }
        return .lantern
    }

    private static let webResources = Bundle.main.resourceURL?.appendingPathComponent("Web", isDirectory: true)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(white: 0.02, alpha: 1)
        launchBackdrop.contentMode = .scaleAspectFill
        launchBackdrop.clipsToBounds = true
        launchBackdrop.havraFill(view)
        loading.havraFill(view)
        bootstrap()
    }

    deinit { routing?.cancel() }

    private func remove(_ controller: UIViewController) {
        if let page = controller as? HavraLifeWebPage { page.close() }
        if let business = controller as? TropicalCourtyardLife { business.gentleExpressionBeacon() }
        controller.willMove(toParent: nil)
        controller.view.removeFromSuperview()
        controller.removeFromParent()
    }

    private func beginLoading() {
        if let pending {
            self.pending = nil
            remove(pending)
        }
        current?.view.endEditing(true)
        loading.setLoading(true, immediately: current == nil, overLaunchArtwork: current == nil, style: loadingStyle)
    }

    private func stage(_ next: UIViewController) {
        beginLoading()
        pending = next
        addChild(next)
        next.view.accessibilityElementsHidden = true
        next.view.havraFill(view, below: current?.view ?? launchBackdrop)
        next.didMove(toParent: self)
    }

    private func loadingChanged(_ controller: UIViewController, isLoading: Bool, blocksInteraction: Bool = true) {
        guard pending === controller || (pending == nil && current === controller) else { return }
        if !isLoading, pending === controller {
            if controller.viewIfLoaded?.superview !== view {
                Task { [weak self, weak controller] in
                    guard let controller else { return }
                    self?.loadingChanged(controller, isLoading: false)
                }
                return
            }
            pending = nil
            view.insertSubview(controller.view, belowSubview: loading)
            if let current { remove(current) }
            current = controller
            controller.view.accessibilityElementsHidden = false
        }
        loading.setLoading(isLoading, immediately: controller is HavraShellJaonController,
                           blocksInteraction: blocksInteraction, overLaunchArtwork: current == nil, style: loadingStyle)
    }

    private func stage(_ page: HavraLifeWebPage) {
        page.onLoadingChange = { [weak self] page, isLoading in
            self?.loadingChanged(page, isLoading: isLoading)
        }
        stage(page as UIViewController)
    }

    private func perform(_ work: @escaping (UUID) async -> Void) {
        routing?.cancel()
        let marker = UUID()
        transition = marker
        routing = Task { [weak self] in
            await work(marker)
            if self?.transition == marker { self?.routing = nil }
        }
    }

    private func active(_ marker: UUID) -> Bool { transition == marker && !Task.isCancelled }

    private func bootstrap() {
        guard routing == nil else { return }
        beginLoading()
        perform { [weak self] marker in
            guard let reply = try? await HavraLifeLaunch.openAtStartup(),
                  let self, self.active(marker) else { return }
            await self.dispatch(reply.url, reply: reply, source: .startup, marker: marker)
        }
    }

    private enum Source { case startup, registration }

    private func dispatch(_ url: URL, reply: HavraLifeLaunch.Reply?, source: Source, marker: UUID,
                          atlasAccount: HavraLifeAtlasAccount? = nil) async {
        guard active(marker) else { return }
        if let page = HavraLifeLaunch.onboardingPage(url) {
            let account = source == .startup
                ? HavraLifeAtlasAccount(saved: UserDefaults.standard.dictionary(forKey: atlasAccountKey))
                : atlasAccount
            let file = Self.webResources?.appendingPathComponent("Pages/\(page.rawValue).html")
            let pageController = HavraLifeWebPage(document: url, purpose: .onboarding(page, fallback: file)) {
                [weak self] event in
                guard case .continued = event, let self else { return }
                if page == .community, let account {
                    self.showAtlas(account)
                } else {
                    self.showRegistration()
                }
            }
            stage(pageController)
            return
        }

        // The bundled H5 returns only its exact destination URL; never replace it with a refreshed route.
        var details = reply
        if source == .registration, details == nil {
            if let refreshed = try? await HavraLifeLaunch.open(identity: .current()),
               HavraLifeLaunch.sameDocument(refreshed.url, url) {
                details = .init(url: url, fields: refreshed.fields)
            }
        }
        guard active(marker) else { return }
        do {
            if let details, let business = try await HavraLifeLaunch.business(for: details) {
                guard active(marker) else { return }
                showBusiness(business)
                return
            }
        } catch {
            guard active(marker) else { return }
            loading.showFailure { [weak self] in
                switch source {
                case .startup: self?.bootstrap()
                case .registration: self?.openRegistrationDestination(url, account: atlasAccount)
                }
            }
            return
        }
        guard active(marker) else { return }
        stage(HavraLifeWebPage(document: url, purpose: .remote) { [weak self] event in
            if case .signedOut = event { self?.signedOut() }
        })
    }

    private func openRegistrationDestination(_ address: URL, account: HavraLifeAtlasAccount?) {
        beginLoading()
        perform { [weak self] marker in
            await self?.dispatch(address, reply: nil, source: .registration, marker: marker, atlasAccount: account)
        }
    }

    private func showRegistration() {
        let launchIdentity = HavraLifeLaunch.Identity.current()
        guard let directory = Self.webResources?.appendingPathComponent("dist", isDirectory: true),
              let address = launchIdentity.registrationURL(directory.appendingPathComponent("index.html"))
        else { return loading.showFailure(retry: { [weak self] in self?.showRegistration() }) }
        stage(HavraLifeWebPage(document: address, purpose: .registration(directory: directory)) { [weak self] event in
            guard case let .opened(address, identity) = event, let self else { return }
            UserDefaults.standard.removeObject(forKey: self.atlasAccountKey)
            let account = HavraLifeAtlasAccount(submitted: identity, deviceID: launchIdentity.deviceID)
            self.openRegistrationDestination(address, account: account)
        })
    }

    private func showBusiness(_ configuration: HavraBEntryConfiguration) {
        let page = TropicalCourtyardLife(configuration: configuration,
            refresh: {
                let reply = try await HavraLifeLaunch.open(identity: .current())
                return try await HavraLifeLaunch.business(for: reply)
            }, fallback: { [weak self] in self?.bootstrap() }, reconnect: { [weak self] in self?.bootstrap() },
            logout: { [weak self] in self?.signedOut() })
        page.onLoadingChange = { [weak self] page, isLoading, blocksInteraction in
            self?.loadingChanged(page, isLoading: isLoading, blocksInteraction: blocksInteraction)
        }
        stage(page)
    }

    private func showAtlas(_ account: HavraLifeAtlasAccount) {
        guard !(pending is HavraShellJaonController) else { return }
        guard let script = Self.webResources?.appendingPathComponent("Pages/HavraLifeAtlas.js"),
              let source = try? String(contentsOf: script, encoding: .utf8) else {
            return loading.showFailure(retry: { [weak self] in self?.showAtlas(account) })
        }
        UserDefaults.standard.set(account.saved, forKey: atlasAccountKey)
        let atlas = HavraShellJaonController()
        atlas.configureHavraLife(source: source, arguments: [
            "localKey": account.localKey,
            "localPassword": UUID().uuidString,
            "displayName": account.nickname ?? "Havra Member",
            "usesTestProfile": account.usesTestProfile
        ], logout: { [weak self] in self?.signedOut() }, loadingChanged: { [weak self, weak atlas] isLoading in
            guard let atlas else { return }
            self?.loadingChanged(atlas, isLoading: isLoading)
        })
        stage(atlas)
    }

    private func signedOut() {
        routing?.cancel()
        routing = nil
        transition = UUID()
        UserDefaults.standard.removeObject(forKey: atlasAccountKey)
        loading.setLoading(true, immediately: true, style: loadingStyle)
        showRegistration()
    }
}

private struct HavraLifeAtlasAccount {
    private static let testIdentifier = "havra@gmail.com"
    let localKey: String
    let nickname: String?
    let usesTestProfile: Bool

    init?(submitted: [String: String]?, deviceID: String) {
        guard let submitted, let value = submitted["login"] ?? submitted["nickname"],
              let identifier = BambooLanternPath.text(value), identifier.utf16.count <= 254 else { return nil }
        let email = identifier.range(of: #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#, options: .regularExpression) != nil
        let normalized = email ? identifier.lowercased() : identifier
        let input = "havra-life-profile:v2:\(deviceID):\(normalized)"
        localKey = SHA256.hash(data: Data(input.utf8)).prefix(16).map { String(format: "%02x", $0) }.joined()
        nickname = email ? nil : submitted["nickname"]
        usesTestProfile = normalized == Self.testIdentifier
    }

    init?(saved: [String: Any]?) {
        guard let key = saved?["key"] as? String, key.range(of: #"^[0-9a-f]{32}$"#, options: .regularExpression) != nil,
              let isTest = saved?["test"] as? Bool else { return nil }
        localKey = key
        nickname = nil
        usesTestProfile = isTest
    }

    var saved: [String: Any] { ["key": localKey, "test": usesTestProfile] }
}
