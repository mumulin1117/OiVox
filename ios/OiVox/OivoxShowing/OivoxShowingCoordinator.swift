import UIKit

@MainActor
final class OivoxShowingCoordinator: UIViewController {
    private let service = OivoxOpenService()
    private let resolver = OivoxAblyResolver()
    private let identity: OivoxShowingIdentity
    private var transition: Task<Void, Never>?
    private var generation = UUID()
    private var presentedPage: UIViewController?
    private var business: OivoxBusinessStream?
    private var purchaseSession: OivoxBusinessPurchaseSession?
    private var deferred: (() -> Void)?
    private var suspended = false

    private let overlay = OivoxLoadingOverlay()
    private var hasRevealedPage = false

    init() {
        let key = "oivox.showing.deviceID"
        let device =  SmoothLightForestRaster.swiftSyllable(key)
            ?? UserDefaults.standard.string(forKey: key)
            ?? UIDevice.current.identifierForVendor?.uuidString
            ?? UUID().uuidString
        if SmoothLightForestRaster.swiftSyllable(key) == nil {
            try? SmoothLightForestRaster.swiftLexis(device, flowBuzz: key)
            UserDefaults.standard.set(device, forKey: key)
        }
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
        let push = UserDefaults.standard.string(forKey: "oivox.showing.pushToken").flatMap(OivoxShowingURL.text)
        identity = OivoxShowingIdentity(deviceID: device, version: version ?? "1.1", pushToken: push)
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = OivoxLoadingOverlay.background
        installOverlay()
        bootstrap()
    }

    func resume() {
        suspended = false
        overlay.setMotionActive(true)
        if let deferred {
            self.deferred = nil
            deferred()
        } else if isViewLoaded, presentedPage == nil, transition == nil {
            bootstrap()
        }
        business?.start()
        refreshBusinessReadiness()
        (presentedPage as? OivoxShowingWeb)?.resumePurchaseFeedback()
        OivoxBusinessPurchases.shared.recoverUnfinished()
    }

    func suspend() {
        suspended = true
        overlay.setMotionActive(false)
        business?.stop()
        if let web = presentedPage as? OivoxShowingWeb {
            web.stopBusinessCapture()
            web.pausePurchaseFeedback()
        }
        refreshBusinessReadiness()
        if presentedPage == nil { cancelTransition() }
    }

    func close() {
        cancelTransition()
        deferred = nil
        stopBusiness()
        (presentedPage as? OivoxShowingWeb)?.close()
        overlay.clear()
    }

    private func cancelTransition() {
        generation = UUID()
        transition?.cancel()
        transition = nil
    }

    private func active(_ marker: UUID) -> Bool { generation == marker && !Task.isCancelled }

    private func perform(_ action: @escaping @MainActor (OivoxShowingCoordinator, UUID) async -> Void) {
        cancelTransition()
        let marker = generation
        transition = Task { [weak self] in
            guard let self else { return }
            await action(self, marker)
            if self.generation == marker { self.transition = nil }
        }
    }

    private func bootstrap() {
        guard !suspended else {
            deferred = { [weak self] in self?.bootstrap() }
            return
        }
        guard transition == nil else { return }
        currentDocumentID = UUID()
        stopBusiness()
        loadOverlay()
        perform { owner, marker in
            guard let reply = try? await owner.service.openUntilSuccessful(identity: owner.identity),
                  owner.active(marker) else { return }
            OivoxBusinessDiagnostic.record("openSucceeded")
            await owner.distribute(reply.url, configuration: reply, account: OivoxShowingAccount.read(), marker: marker)
        }
    }

    private func deliverRegistrationResult(_ url: URL, account: OivoxShowingAccount?) {
        loadOverlay()
        perform { owner, marker in
            var matched: OivoxOpenReply?
            if OivoxShowingPage.recognize(url) == nil,
               let reply = try? await owner.service.open(identity: owner.identity),
               OivoxShowingURL.sameDocument(reply.url, url) {
                matched = reply
            }
            guard owner.active(marker) else { return }
            await owner.distribute(url, configuration: matched, account: account, marker: marker)
        }
    }

    private func distribute(_ url: URL, configuration: OivoxOpenReply?, account: OivoxShowingAccount?, marker: UUID) async {
        guard active(marker) else { return }
        if let page = OivoxShowingPage.recognize(url) {
            whenVisible { owner in owner.showOnboarding(page, url: url, account: account) }
            return
        }

        do {
            let connection: OivoxBusinessConnection?
            if let configuration { connection = try await resolver.connection(for: configuration) }
            else { connection = nil }
            guard active(marker) else { return }
            whenVisible { owner in
                if let account {
                    do { try account.save() }
                    catch { return owner.showFailure { [weak owner] in owner?.deliverRegistrationResult(url, account: account) } }
                }
                owner.showRemote(url, connection: connection)
            }
        } catch {
            guard active(marker) else { return }
            OivoxBusinessDiagnostic.record("connectionRejected")
            whenVisible { owner in
                owner.showFailure { [weak owner] in
                    guard let owner else { return }
                    if configuration?.url == url { owner.bootstrap() }
                    else { owner.deliverRegistrationResult(url, account: account) }
                }
            }
        }
    }

    private func whenVisible(_ action: @escaping (OivoxShowingCoordinator) -> Void) {
        if suspended { deferred = { [weak self] in if let self { action(self) } } }
        else { action(self) }
    }

    private func showOnboarding(_ page: OivoxShowingPage, url: URL, account: OivoxShowingAccount?) {
        let file = Bundle.main.url(forResource: page.rawValue, withExtension: "html", subdirectory: "ShowingWeb/Pages")
        let fallback = file.flatMap { file -> URL? in
            var address = URLComponents(url: file, resolvingAgainstBaseURL: false)
            address?.queryItems = [URLQueryItem(name: "lang", value: briefPhoneme.vocalOrbitFuse)]
            return address?.url
        }
        showWeb(url, purpose: .onboarding(page, fallback: fallback)) { owner, event in
            if case .confirmed = event {
                if page == .community, let account { owner.showMainHub(account) }
                else { owner.showRegistration() }
            }
        }
    }

    private func showRegistration() {
        stopBusiness()
        guard let file = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "ShowingWeb/Registration"),
              let url = identity.registrationURL(file, language: briefPhoneme.vocalOrbitFuse) else {
            return showFailure { [weak self] in self?.showRegistration() }
        }
        showWeb(url, purpose: .registration) { owner, event in
            if case .registered(let url, let account) = event {
                owner.deliverRegistrationResult(url, account: account)
            }
        }
    }

    private func showMainHub(_ account: OivoxShowingAccount) {
        do { try account.save() }
        catch { return showFailure { [weak self] in self?.showMainHub(account) } }

        stopBusiness()
        loadOverlay()
        let main = linguisticTapestroller()
        main.showingAccount = account
        main.onShowingReady = { [weak self, weak main] in
            guard let self, let main, self.presentedPage === main else { return }
            self.hideOverlay()
        }
        main.onShowingEvent = { [weak self, weak main] event in
            guard let self, let main, self.presentedPage === main else { return }
            if event == "logout" { self.signedOut() }
            else { self.showFailure { [weak self] in self?.showMainHub(account) } }
        }
        stage(main)
    }

    private func showRemote(_ url: URL, connection: OivoxBusinessConnection?) {
        stopBusiness()
        let page = showWeb(url, purpose: .remote(business: connection != nil)) { owner, event in
            if case .logout = event { owner.signedOut() }
        }
        OivoxBusinessDiagnostic.record(connection == nil ? "ordinaryWebView" : "businessWebView")
        guard let connection else { return }
        let stream = OivoxBusinessStream(connection) { [weak self] in
            guard let self else { throw CancellationError() }
            let fresh = try await self.service.open(identity: self.identity)
            guard let refreshed = try await self.resolver.connection(for: fresh) else {
                throw OivoxShowingError.changedDestination
            }
            return refreshed
        } onMessage: { [weak self, weak page] message, timestamp in
            guard let self, let page, self.presentedPage === page else { return }
            self.handleBusinessMessage(message, timestamp: timestamp, page: page)
        } onChanged: { [weak self, weak page] in
            guard let self, let page, self.presentedPage === page else { return }
            self.bootstrap()
        } onSubscriptionChanged: { [weak self, weak page] in
            guard let self, let page, self.presentedPage === page else { return }
            self.refreshBusinessReadiness()
        }
        business = stream
        refreshBusinessReadiness()
        if !suspended { stream.start() }
    }

    private func refreshBusinessReadiness() {
        guard let page = presentedPage as? OivoxShowingWeb else { return }
        let purchases = OivoxBusinessPurchases.shared
        let isBusiness = page.isRemoteBusiness && business != nil
        let pageReady = page.canAcceptBusinessActions
        if isBusiness, pageReady, let business, purchaseSession == nil {
            let session = OivoxBusinessPurchaseSession(id: UUID(), channel: business.channel)
            purchaseSession = session
            purchases.attach(session, paymentProgress: { [weak self, weak page] order, phase in
                guard let self, let page, self.presentedPage === page, self.purchaseSession == session else { return }
                page.updatePurchaseProgress(order: order, phase: phase)
            }) { [weak self, weak page] payload, notice in
                guard let self, let page, self.presentedPage === page, self.purchaseSession == session else { return }
                page.deliverPurchaseResult(payload, notice: notice)
            }
        }
        let state = OivoxBusinessReadiness(business: isBusiness, pageReady: pageReady, foreground: !suspended,
                                          subscribed: business?.isSubscribed == true, paymentAvailable: purchases.isAvailable)
        if let purchaseSession { purchases.setReady(state.purchaseEnabled, for: purchaseSession) }
        page.deliverBusinessReadiness(state)
    }

    private func invalidatePurchaseSession() {
        guard let purchaseSession else { return }
        self.purchaseSession = nil
        OivoxBusinessPurchases.shared.detach(purchaseSession)
    }

    private func handleBusinessMessage(_ packet: [String: Any], timestamp: Double?, page: OivoxShowingWeb) {
        let config = OivoxBusinessConfiguration.profile
        let mapping = config.incoming
        let payload = OivoxShowingURL.object(packet[mapping.data]) ?? [:]
        let actions = [
            packet[mapping.closeSelector] as? String == mapping.closeAction,
            packet[mapping.purchaseSelector] as? String == mapping.purchaseAction,
            packet[mapping.openSelector] as? String == mapping.openAction,
            packet[mapping.forwardSelector] as? String == mapping.forwardAction,
        ]
        guard actions.filter({ $0 }).count <= 1 else { return }
        if actions[0] {
            signedOut()
        } else if actions[1] {
            OivoxBusinessDiagnostic.record("purchaseCommandReceived")
            guard let purchaseSession, page.canAcceptBusinessActions, !suspended else {
                OivoxBusinessDiagnostic.record("purchaseRejected.pageNotReady")
                return
            }
            let order = OivoxShowingURL.text(payload[mapping.orderID]).flatMap { $0.utf8.count <= 512 ? $0 : nil }
            let product = OivoxShowingURL.text(payload[mapping.productID]).flatMap { $0.utf8.count <= 255 ? $0 : nil }
            guard let order, let product else {
                OivoxBusinessDiagnostic.record("purchaseRejected.invalidPayload")
                page.deliverPurchaseResult(config.purchase(order: order ?? "", product: product ?? "",
                                                           status: "failed", reason: "invalidPurchaseRequest"))
                return
            }
            guard let timestamp, abs(Date().timeIntervalSince1970 * 1_000 - timestamp) <= 120_000 else {
                OivoxBusinessDiagnostic.record(timestamp == nil ? "purchaseRejected.timestampMissing" : "purchaseRejected.expired")
                page.deliverPurchaseResult(config.purchase(order: order, product: product, status: "failed", reason: "purchaseExpired"),
                                           notice: timestamp == nil ? .invalidPurchaseRequest : nil)
                return
            }
            OivoxBusinessDiagnostic.record("purchaseCommandValidated")
            refreshBusinessReadiness()
            OivoxBusinessPurchases.shared.request(order: order, product: product, session: purchaseSession)
        } else if actions[2] {
            guard let session = purchaseSession, page.canAcceptBusinessActions, !suspended else { return }
            page.openBusinessLink(payload[mapping.externalURL]) { [weak self, weak page] success in
                guard let self, let page, self.presentedPage === page, self.purchaseSession == session else { return }
                page.deliverBusinessMessage(config.opened(success))
            }
        } else {
            page.deliverBusinessMessage(packet)
        }
    }

    private func signedOut() {
        cancelTransition()
        deferred = nil
        OivoxShowingAccount.signOut()
        guard let page = presentedPage as? OivoxShowingWeb, page.isRemoteBusiness else {
            showRegistration()
            return
        }
        stopBusiness()
        currentDocumentID = UUID()
        loadOverlay()
        perform { owner, marker in
            await page.clearBusinessWebsiteSession()
            guard owner.active(marker) else { return }
            owner.showRegistration()
        }
    }

    private func stopBusiness() {
        let previous = business
        business = nil
        invalidatePurchaseSession()
        previous?.close()
    }

    @discardableResult
    private func showWeb(_ url: URL, purpose: OivoxShowingWeb.Purpose,
                         action: @escaping (OivoxShowingCoordinator, OivoxShowingWeb.Event) -> Void) -> OivoxShowingWeb {
        loadOverlay()
        let pageID = UUID()
        currentDocumentID = pageID
        let web = OivoxShowingWeb(document: url, purpose: purpose) { [weak self] event in
            guard let self, self.currentDocumentID == pageID else { return }
            switch event {
            case .loading:
                self.invalidatePurchaseSession()
                self.business?.stop()
                self.loadOverlay()
            case .ready:
                if !self.suspended { self.business?.start() }
                self.hideOverlay()
                self.refreshBusinessReadiness()
            case .failed:
                self.invalidatePurchaseSession()
                self.business?.stop()
                self.showFailure { [weak self] in
                    guard let self, let web = self.presentedPage as? OivoxShowingWeb else { return }
                    self.loadOverlay()
                    web.reloadPage()
                }
            default: action(self, event)
            }
        }
        stage(web)
        return web
    }

    private var currentDocumentID = UUID()

    private func stage(_ page: UIViewController) {
        let previous = presentedPage
        if page is linguisticTapestroller { currentDocumentID = UUID() }
        presentedPage = page
        (previous as? OivoxShowingWeb)?.close()
        previous?.willMove(toParent: nil)
        previous?.view.removeFromSuperview()
        previous?.removeFromParent()
        addChild(page)
        page.view.translatesAutoresizingMaskIntoConstraints = false
        view.insertSubview(page.view, belowSubview: overlay)
        NSLayoutConstraint.activate([
            page.view.topAnchor.constraint(equalTo: view.topAnchor), page.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            page.view.leadingAnchor.constraint(equalTo: view.leadingAnchor), page.view.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        page.didMove(toParent: self)
    }
}

private extension OivoxShowingCoordinator {
    func installOverlay() {
        overlay.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(overlay)
        NSLayoutConstraint.activate([
            overlay.topAnchor.constraint(equalTo: view.topAnchor), overlay.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            overlay.leadingAnchor.constraint(equalTo: view.leadingAnchor), overlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
    }

    func loadOverlay() {
        let labels = [
            "en": "Loading", "ar": "جارٍ التحميل", "he": "בטעינה", "tr": "Yükleniyor",
            "fr": "Chargement", "de": "Wird geladen", "ja": "読み込み中", "ko": "불러오는 중"
        ]
        overlay.begin(showLaunch: !hasRevealedPage, over: presentedPage?.viewIfLoaded,
                      label: labels[briefPhoneme.vocalOrbitFuse] ?? "Loading")
    }

    func hideOverlay() {
        hasRevealedPage = true
        overlay.reveal()
    }

    func showFailure(retry: @escaping () -> Void) {
        let strings: [String: (String, String)] = [
            "en": ("Couldn’t load the page. Please try again.", "Try again"),
            "ar": ("تعذّر تحميل الصفحة. يُرجى المحاولة مجددًا.", "إعادة المحاولة"),
            "he": ("לא ניתן לטעון את הדף. כדאי לנסות שוב.", "נסה שוב"),
            "tr": ("Sayfa yüklenemedi. Lütfen tekrar dene.", "Tekrar dene"),
            "fr": ("Impossible de charger la page. Veuillez réessayer.", "Réessayer"),
            "de": ("Die Seite konnte nicht geladen werden. Bitte versuche es erneut.", "Erneut versuchen"),
            "ja": ("ページを読み込めませんでした。もう一度お試しください。", "再試行"),
            "ko": ("페이지를 불러올 수 없습니다. 다시 시도해 주세요.", "다시 시도")
        ]
        let copy = strings[briefPhoneme.vocalOrbitFuse] ?? strings["en"]!
        loadOverlay()
        overlay.fail(message: copy.0, button: copy.1, retry: retry)
    }
}
