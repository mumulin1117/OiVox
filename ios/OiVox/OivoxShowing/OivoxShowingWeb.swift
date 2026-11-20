import UIKit
import WebKit

@MainActor
final class OivoxShowingMessageProxy: NSObject, WKScriptMessageHandler {
    private let deliver: (WKScriptMessage) -> Void

    init(_ deliver: @escaping (WKScriptMessage) -> Void) { self.deliver = deliver }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        deliver(message)
    }
}

@MainActor
final class OivoxShowingWeb: UIViewController, WKNavigationDelegate, WKUIDelegate {
    enum Purpose {
        case onboarding(OivoxShowingPage, fallback: URL?)
        case registration
        case remote(business: Bool)
    }

    enum Event {
        case loading, ready, failed, confirmed, logout
        case registered(URL, OivoxShowingAccount?)
    }

    private static let identityWorld = WKContentWorld.world(name: "OiVoxRegistrationIdentity")
    private static let businessWebsiteDataID = UUID(uuidString: "32B34B44-5C14-426E-98A8-0DD8FE6420CA")!
    private let purpose: Purpose
    private let original: URL
    private let onEvent: (Event) -> Void
    private var document: URL
    private var handlers: [String] = []
    private var navigation: WKNavigation?
    private var ready = false
    private var closed = false
    private var submitted = false
    private var fallbackUsed = false
    private var loadID = UUID()
    private var loadTimeout: Task<Void, Never>?
    private var firstFrame: Task<Void, Never>?
    private var queued: [[String: Any]] = []
    private var sentBusinessReadiness: OivoxBusinessReadiness?
    private var businessDocumentID: String?
    private var purchaseProgress: (order: String, notice: OivoxPurchaseNotice)?
    private var purchaseProgressTimeout: Task<Void, Never>?
    private var purchaseNotice: (order: String, notice: OivoxPurchaseNotice)?
    private var purchaseNoticeDismissal: Task<Void, Never>?
    private var purchaseFeedbackView: OivoxPurchaseFeedbackView?
    private lazy var web = makeWebView()

    private static let businessMediaGestureScript = """
        (() => {
          let lastActivation = -Infinity;
          const activate = event => {
            if (event.isTrusted) lastActivation = performance.now();
          };
          addEventListener('pointerup', activate, { capture: true, passive: true });
          addEventListener('click', activate, { capture: true, passive: true });
          addEventListener('keydown', event => {
            if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) activate(event);
          }, true);
          globalThis.oivoxCanPromptForMedia = () => performance.now() - lastActivation <= 10000;
        })();
        """

    var canAcceptBusinessActions: Bool { ready && !closed && viewIfLoaded?.window != nil }
    var isRemoteBusiness: Bool {
        if case .remote(true) = purpose { return true }
        return false
    }

    init(document: URL, purpose: Purpose, onEvent: @escaping (Event) -> Void) {
        self.original = document
        self.document = document
        self.purpose = purpose
        self.onEvent = onEvent
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = OivoxLoadingOverlay.background
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: view.topAnchor), web.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor), web.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        load(document)
    }

    private func makeWebView() -> WKWebView {
        let configuration = WKWebViewConfiguration()
        if isRemoteBusiness, #available(iOS 17.0, *) {
            configuration.websiteDataStore = WKWebsiteDataStore(forIdentifier: Self.businessWebsiteDataID)
        } else {
            configuration.websiteDataStore = .nonPersistent()
        }
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        let controller = configuration.userContentController
        switch purpose {
        case .onboarding(let page, _):
            handlers = [page.handler]
        case .registration:
            handlers = ["openUrl"]
            controller.addUserScript(WKUserScript(source: OivoxShowingAccount.observingSubmittedIdentity,
                                                   injectionTime: .atDocumentStart, forMainFrameOnly: true,
                                                   in: Self.identityWorld))
        case .remote(let business):
            handlers = ["oivoxSignOut"]
            if business {
                let mapping = OivoxBusinessConfiguration.profile.incoming
                handlers += Set([mapping.directCloseHandler, mapping.closeAction]).filter { !$0.isEmpty && $0 != "oivoxSignOut" }
                configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
                controller.addUserScript(WKUserScript(source: Self.businessMediaGestureScript, injectionTime: .atDocumentStart,
                                                      forMainFrameOnly: true, in: .defaultClient))
            }
            let state = """
            (() => {
              const documentID = crypto.getRandomValues(new Uint32Array(4)).join('-');
              let current = Object.freeze({
                event: 'oivoxBusinessState', version: 1, business: \(business ? "true" : "false"),
                subscribed: false, purchaseEnabled: false, reason: '\(business ? "pageLoading" : "notBusiness")'
              });
              Object.defineProperty(window, 'OiVoxBusinessDocumentID', { value: documentID });
              Object.defineProperty(window, 'OiVoxBusinessState', { get: () => current });
              window.addEventListener('message', ({data, source}) => {
                if (source === null && data?.event === 'oivoxBusinessState' && data.version === 1) {
                  current = Object.freeze({...data});
                }
              });
            })();
            """
            controller.addUserScript(WKUserScript(source: state, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        let proxy = OivoxShowingMessageProxy { [weak self] in self?.read($0) }
        for name in handlers { controller.add(proxy, name: name) }

        let view = WKWebView(frame: .zero, configuration: configuration)
        view.translatesAutoresizingMaskIntoConstraints = false
        view.navigationDelegate = self
        view.uiDelegate = self
        view.isOpaque = false
        view.backgroundColor = .clear
        view.scrollView.backgroundColor = .clear
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.scrollView.keyboardDismissMode = .interactive
        view.allowsBackForwardNavigationGestures = true
        view.allowsLinkPreview = false
        if case .onboarding = purpose {
            view.scrollView.bounces = false
        }
        return view
    }

    func reloadPage() {
        fallbackUsed = false
        load(original)
    }

    private func load(_ url: URL) {
        guard !closed else { return }
        ready = false
        submitted = false
        watchLoad()
        document = url
        if url.isFileURL {
            navigation = web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            navigation = web.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20))
        }
    }

    private func watchLoad() {
        loadID = UUID()
        clearPurchaseFeedback()
        let loading = loadID
        firstFrame?.cancel()
        firstFrame = nil
        queued.removeAll()
        sentBusinessReadiness = nil
        businessDocumentID = nil
        loadTimeout?.cancel()
        loadTimeout = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 20_000_000_000)
            guard !Task.isCancelled, let self, self.loadID == loading else { return }
            self.failLoad()
        }
    }

    func close() {
        guard !closed else { return }
        stopBusinessCapture()
        clearPurchaseFeedback()
        closed = true
        loadTimeout?.cancel()
        firstFrame?.cancel()
        queued.removeAll()
        if isViewLoaded {
            handlers.forEach { web.configuration.userContentController.removeScriptMessageHandler(forName: $0) }
            web.configuration.userContentController.removeAllUserScripts()
            web.stopLoading()
            web.navigationDelegate = nil
            web.uiDelegate = nil
        }
    }

    func clearBusinessWebsiteSession() async {
        guard isRemoteBusiness, isViewLoaded else { return }
        let store = web.configuration.websiteDataStore
        close()
        if store.isPersistent {
            await store.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast)
        }
    }

    private func accepts(_ url: URL) -> Bool {
        switch purpose {
        case .onboarding, .registration: return OivoxShowingURL.sameDocument(document, url)
        case .remote: return OivoxShowingURL.sameOrigin(document, url)
        }
    }

    private func read(_ message: WKScriptMessage) {
        guard ready, !closed, !submitted, message.frameInfo.isMainFrame, message.webView === web,
              let frame = message.frameInfo.request.url, let current = web.url,
              accepts(frame), accepts(current), handlers.contains(message.name) else { return }

        switch purpose {
        case .onboarding(let page, _):
            guard page.accepts(name: message.name, body: message.body) else { return }
            submitted = true
            onEvent(.confirmed)
        case .registration:
            guard message.name == "openUrl", let address = OivoxShowingURL.https(message.body) else { return }
            submitted = true
            let submittedFrom = loadID
            web.callAsyncJavaScript("return window.oivoxSubmittedIdentity?.() ?? null;",
                arguments: [:], in: message.frameInfo, in: Self.identityWorld) { [weak self] result in
                guard let self, !self.closed, self.loadID == submittedFrom,
                      let current = self.web.url, self.accepts(current) else { return }
                let fields = (try? result.get()) as? [String: String]
                let account = OivoxShowingAccount(login: fields?["login"], nickname: fields?["nickname"])
                self.onEvent(.registered(address, account))
            }
        case .remote(let business):
            let logout = (message.body as? [String: String])?["action"] == "logout"
            let directClose = business && message.name != "oivoxSignOut"
            guard logout || directClose else { return }
            submitted = true
            onEvent(.logout)
        }
    }

    func deliverBusinessMessage(_ payload: [String: Any]) {
        dispatchBusinessMessage(payload, isPurchaseResult: false)
    }

    func updatePurchaseProgress(order: String, phase: OivoxPurchasePhase) {
        guard canAcceptBusinessActions, isRemoteBusiness else { return }
        if phase == .finished {
            if purchaseProgress?.order == order { clearPurchaseProgress() }
            if purchaseNotice?.order == order, purchaseNotice?.notice == .waitingForUpdate { clearPurchaseNotice() }
            resumePurchaseFeedback()
            return
        }
        let notice: OivoxPurchaseNotice = phase == .submitting ? .loading : .verifying
        guard purchaseProgress?.order != order || purchaseProgress?.notice != notice else { return }
        clearPurchaseProgress()
        if phase == .submitting || purchaseNotice?.order == order { clearPurchaseNotice() }
        purchaseProgress = (order, notice)
        purchaseProgressTimeout = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 60_000_000_000)
            guard !Task.isCancelled, let self else { return }
            self.clearPurchaseProgress()
            self.queuePurchaseNotice(.waitingForUpdate, order: order)
        }
        resumePurchaseFeedback()
    }

    func deliverPurchaseResult(_ payload: [String: Any], notice: OivoxPurchaseNotice? = nil) {
        guard canAcceptBusinessActions, isRemoteBusiness else { return }
        dispatchBusinessMessage(payload, isPurchaseResult: true)

        let mapping = OivoxBusinessConfiguration.profile.outgoing
        guard let status = payload[mapping.status] as? String else { return }
        let order = payload[mapping.orderID] as? String ?? ""
        let reason = payload[mapping.reason] as? String
        guard let feedback = notice ?? OivoxPurchaseNotice.result(status: status, reason: reason) else { return }
        if purchaseProgress?.order == order, status != "pending" || purchaseProgress?.notice == .verifying {
            clearPurchaseProgress()
        }
        queuePurchaseNotice(feedback, order: order)
    }

    private func dispatchBusinessMessage(_ payload: [String: Any], isPurchaseResult: Bool) {
        guard !closed, case .remote(true) = purpose, JSONSerialization.isValidJSONObject(payload) else { return }
        if !ready {
            if queued.count == 64 { queued.removeFirst() }
            queued.append(payload)
            return
        }
        guard let businessDocumentID, let location = web.url, accepts(location) else { return }
        let callback = OivoxBusinessConfiguration.profile.outgoing
        let isOpenResult = payload[callback.event] as? String == callback.openEvent
        let script = isOpenResult
            ? "new CustomEvent(name, { detail: payload })"
            : "new MessageEvent('message', { data: payload })"
        web.callAsyncJavaScript("""
            if (window.OiVoxBusinessDocumentID !== documentID) return false;
            window.dispatchEvent(\(script));
            return true;
            """,
                                arguments: ["payload": payload, "name": callback.openEvent, "documentID": businessDocumentID],
                                in: nil, in: .page) { result in
            guard isPurchaseResult else { return }
            let dispatched = ((try? result.get()) as? Bool) == true
            OivoxBusinessDiagnostic.record(dispatched ? "purchaseResultDispatched" : "purchaseResultDispatchFailed")
        }
    }

    private func queuePurchaseNotice(_ notice: OivoxPurchaseNotice, order: String) {
        guard purchaseNotice?.order != order || purchaseNotice?.notice != notice else { return }
        clearPurchaseNotice()
        purchaseNotice = (order, notice)
        resumePurchaseFeedback()
    }

    func resumePurchaseFeedback() {
        guard canAcceptBusinessActions, isRemoteBusiness,
              view.window?.windowScene?.activationState == .foregroundActive else { return }
        guard let notice = purchaseNotice?.notice ?? purchaseProgress?.notice else {
            removePurchaseFeedbackView()
            return
        }
        if purchaseFeedbackView == nil {
            web.endEditing(true)
            web.isUserInteractionEnabled = false
            web.accessibilityElementsHidden = true
            let feedback = OivoxPurchaseFeedbackView()
            feedback.present(over: view)
            purchaseFeedbackView = feedback
        }
        purchaseFeedbackView?.show(notice.text, spinning: notice == .loading || notice == .verifying)
        if purchaseNotice != nil, purchaseNoticeDismissal == nil {
            purchaseNoticeDismissal = Task { [weak self] in
                try? await Task.sleep(nanoseconds: 4_000_000_000)
                guard !Task.isCancelled, let self else { return }
                self.clearPurchaseNotice()
                self.resumePurchaseFeedback()
            }
            OivoxBusinessDiagnostic.record("purchaseNoticeShown")
        }
    }

    func pausePurchaseFeedback() {
        purchaseNoticeDismissal?.cancel()
        purchaseNoticeDismissal = nil
        removePurchaseFeedbackView()
    }

    private func clearPurchaseFeedback() {
        clearPurchaseProgress()
        clearPurchaseNotice()
        removePurchaseFeedbackView()
    }

    private func clearPurchaseProgress() {
        purchaseProgressTimeout?.cancel()
        purchaseProgressTimeout = nil
        purchaseProgress = nil
    }

    private func clearPurchaseNotice() {
        purchaseNoticeDismissal?.cancel()
        purchaseNoticeDismissal = nil
        purchaseNotice = nil
    }

    private func removePurchaseFeedbackView() {
        guard let overlay = purchaseFeedbackView else { return }
        overlay.removeFromSuperview()
        purchaseFeedbackView = nil
        web.isUserInteractionEnabled = true
        web.accessibilityElementsHidden = false
    }

    func deliverBusinessReadiness(_ state: OivoxBusinessReadiness) {
        guard case .remote = purpose, ready, !closed, sentBusinessReadiness != state,
              let businessDocumentID, let location = web.url, accepts(location) else { return }
        sentBusinessReadiness = state
        let script = """
            if (window.OiVoxBusinessDocumentID !== documentID) return false;
            window.dispatchEvent(new MessageEvent('message', { data: payload }));
            return true;
            """
        web.callAsyncJavaScript(script, arguments: ["payload": state.bridgePayload, "documentID": businessDocumentID],
                                in: nil, in: .page) { [weak self] result in
            guard let self, self.businessDocumentID == businessDocumentID, self.sentBusinessReadiness == state else { return }
            if ((try? result.get()) as? Bool) == true {
                OivoxBusinessDiagnostic.record("webState.\(state.reason.rawValue)")
            } else {
                self.sentBusinessReadiness = nil
                OivoxBusinessDiagnostic.record("webStateDispatchFailed")
            }
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        guard !closed, let url = action.request.url else { return decisionHandler(.cancel) }
        if action.targetFrame?.isMainFrame == false { return decisionHandler(.allow) }
        if isRemoteBusiness {
            if action.targetFrame == nil {
                return decisionHandler(trustedBusinessLink(action) && OivoxShowingURL.businessLink(url.absoluteString) != nil ? .allow : .cancel)
            }
            if accepts(url) && !action.shouldPerformDownload { return decisionHandler(.allow) }
            decisionHandler(.cancel)
            if action.navigationType == .linkActivated, trustedBusinessLink(action) { openBusinessLink(url.absoluteString) }
            return
        }
        if action.targetFrame != nil, accepts(url) { return decisionHandler(.allow) }
        decisionHandler(.cancel)
        guard action.navigationType == .linkActivated, OivoxShowingURL.https(url.absoluteString) != nil else { return }
        if accepts(url) { web.load(action.request) }
        else { UIApplication.shared.open(url) }
    }

    private func trustedBusinessLink(_ action: WKNavigationAction) -> Bool {
        guard canAcceptBusinessActions, action.sourceFrame.isMainFrame,
              let source = action.sourceFrame.request.url, let current = web.url else { return false }
        return accepts(source) && accepts(current)
    }

    func openBusinessLink(_ value: Any?, completion: (@MainActor @Sendable (Bool) -> Void)? = nil) {
        guard isRemoteBusiness, canAcceptBusinessActions, let target = OivoxShowingURL.businessLink(value) else {
            completion?(false)
            return
        }
        UIApplication.shared.open(target, completionHandler: completion)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard isRemoteBusiness, action.targetFrame == nil, trustedBusinessLink(action),
              let url = action.request.url else { return nil }
        if accepts(url) && !action.shouldPerformDownload { web.load(action.request) }
        else { openBusinessLink(url.absoluteString) }
        return nil
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard !closed, navigation === self.navigation, let url = webView.url, accepts(url) else { return }
        let load = loadID
        let selector: String?
        switch purpose {
        case .registration: selector = "#app .app-page"
        case .onboarding, .remote: selector = nil
        }
        firstFrame?.cancel()
        firstFrame = Task { [weak self, weak webView] in
            guard let webView, await OivoxWebFirstFrame.wait(in: webView, selector: selector),
                  !Task.isCancelled, let self, !self.closed, self.loadID == load else { return }
            if case .remote = self.purpose {
                let token = try? await webView.callAsyncJavaScript("return window.OiVoxBusinessDocumentID;", arguments: [:],
                                                                  in: nil, contentWorld: .page)
                guard !Task.isCancelled, !self.closed, self.loadID == load else { return }
                guard let token = token as? String else { return self.failLoad() }
                self.businessDocumentID = token
            }
            self.loadTimeout?.cancel()
            self.ready = true
            self.applyBusinessSafeArea()
            self.onEvent(.ready)
            let waiting = self.queued
            self.queued.removeAll()
            waiting.forEach(self.deliverBusinessMessage)
        }
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        guard !closed else { return }
        let wasReady = ready
        ready = false
        if wasReady { stopBusinessCapture() }
        if self.navigation !== navigation {
            self.navigation = navigation
            watchLoad()
        }
        if wasReady { onEvent(.loading) }
    }

    func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse,
                 decisionHandler: @escaping @MainActor (WKNavigationResponsePolicy) -> Void) {
        if response.isForMainFrame, isRemoteBusiness,
           (!response.canShowMIMEType || response.response.url.map(accepts) != true) {
            decisionHandler(.cancel)
            failLoad()
            return
        }
        if response.isForMainFrame, let status = (response.response as? HTTPURLResponse)?.statusCode,
           !(200..<300).contains(status) {
            decisionHandler(.cancel)
            failLoad()
        } else {
            decisionHandler(.allow)
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if !closed, navigation === self.navigation, (error as NSError).code != NSURLErrorCancelled { failLoad() }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        self.webView(webView, didFail: navigation, withError: error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { failLoad() }

    private func failLoad() {
        guard !closed else { return }
        stopBusinessCapture()
        clearPurchaseFeedback()
        ready = false
        loadTimeout?.cancel()
        firstFrame?.cancel()
        firstFrame = nil
        queued.removeAll()
        sentBusinessReadiness = nil
        businessDocumentID = nil
        navigation = nil
        loadID = UUID()
        web.stopLoading()
        if case .onboarding(_, let fallback?) = purpose, !fallbackUsed {
            fallbackUsed = true
            load(fallback)
        } else {
            onEvent(.failed)
        }
    }

    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        applyBusinessSafeArea()
    }

    private func applyBusinessSafeArea() {
        guard isRemoteBusiness, ready, !closed, let businessDocumentID else { return }
        let insets = view.safeAreaInsets
        let script = """
            if (window.OiVoxBusinessDocumentID === documentID) {
                for (const [edge, value] of Object.entries(insets)) {
                    document.documentElement.style.setProperty('--oivox-safe-area-' + edge, value + 'px');
                }
            }
            """
        web.callAsyncJavaScript(script, arguments: ["documentID": businessDocumentID,
            "insets": ["top": insets.top, "right": insets.right, "bottom": insets.bottom, "left": insets.left]],
            in: nil, in: .page, completionHandler: nil)
    }

    func stopBusinessCapture() {
        guard isRemoteBusiness, isViewLoaded else { return }
        web.setCameraCaptureState(.none, completionHandler: nil)
        web.setMicrophoneCaptureState(.none, completionHandler: nil)
    }

    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                 decisionHandler: @escaping @MainActor (WKPermissionDecision) -> Void) {
//        guard !closed, frame.isMainFrame, frame.webView === web, let address = frame.request.url, accepts(address) else {
//            return decisionHandler(.deny)
//        }
//        if case .registration = purpose {
//            return decisionHandler(address.isFileURL && type == .camera ? .prompt : .deny)
//        }
//        var securityOrigin = URLComponents()
//        securityOrigin.scheme = origin.protocol
//        securityOrigin.host = origin.host
//        securityOrigin.port = origin.port == 0 ? nil : origin.port
//        guard isRemoteBusiness, canAcceptBusinessActions, view.window?.windowScene?.activationState == .foregroundActive,
//              let current = web.url, accepts(current), let originURL = securityOrigin.url, accepts(originURL) else {
//            return decisionHandler(.deny)
//        }
//        let requestLoadID = loadID
//        web.callAsyncJavaScript("return globalThis.oivoxCanPromptForMedia?.() === true;", arguments: [:],
//                                in: frame, in: .defaultClient) { [weak self] result in
//            guard let self, self.loadID == requestLoadID, self.canAcceptBusinessActions,
//                  self.view.window?.windowScene?.activationState == .foregroundActive,
//                  ((try? result.get()) as? Bool) == true else { return decisionHandler(.deny) }
//            decisionHandler(.prompt)
//        }
        
        decisionHandler(.grant)
    }
}

/// Wait for visible DOM and give WebKit a painting opportunity before exposing its view.
@MainActor
enum OivoxWebFirstFrame {
    static func wait(in webView: WKWebView, selector: String?) async -> Bool {
        let script = """
            const root = selector ? document.querySelector(selector) : document.body;
            const hasBox = element => {
                const box = element.getBoundingClientRect();
                if (box.width <= 0 || box.height <= 0 || box.right <= 0 || box.bottom <= 0 ||
                    box.left >= innerWidth || box.top >= innerHeight ||
                    getComputedStyle(element).visibility !== 'visible') return false;
                for (let node = element; node; node = node.parentElement) {
                    if (Number(getComputedStyle(node).opacity) < 0.01) return false;
                }
                return true;
            };
            const visible = () => {
                if (!root?.isConnected) return false;
                if (selector) return hasBox(root) && !!(root.children.length || root.textContent.trim());
                const text = Array.from(root.childNodes).some(node => node.nodeType === 3 && node.textContent.trim());
                if (text && hasBox(root)) return true;
                return Array.from(root.querySelectorAll(':scope > *, :scope > * > *, main, [role="main"]'))
                    .some(hasBox);
            };
            if (!visible()) return false;
            const painted = await new Promise(resolve => {
                const timeout = setTimeout(() => resolve(false), 180);
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    clearTimeout(timeout);
                    resolve(true);
                }));
            });
            return painted && visible();
            """
        let deadline = ProcessInfo.processInfo.systemUptime + 20
        while !Task.isCancelled, ProcessInfo.processInfo.systemUptime < deadline {
            let result = try? await webView.callAsyncJavaScript(script, arguments: ["selector": selector as Any? ?? NSNull()],
                                                               in: nil, contentWorld: .defaultClient)
            if (result as? Bool) == true { return !Task.isCancelled }
            try? await Task.sleep(nanoseconds: 50_000_000)
        }
        return false
    }
}
