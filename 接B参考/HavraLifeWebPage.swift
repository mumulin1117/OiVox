import AVFoundation
import UIKit
import WebKit

final class HavraLifeWebPage: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    enum Purpose {
        case onboarding(HavraLifeLaunch.Page, fallback: URL?)
        case registration(directory: URL)
        case remote
    }

    enum Event {
        case continued
        case opened(URL, identity: [String: String]?)
        case signedOut
    }

    private final class Bridge: NSObject, WKScriptMessageHandler {
        weak var owner: HavraLifeWebPage?

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            owner?.userContentController(userContentController, didReceive: message)
        }
    }

    private let purpose: Purpose
    private var document: URL
    private let onEvent: (Event) -> Void
    private let webView = HavraLifeWebPage.makeWebView()
    var onLoadingChange: ((HavraLifeWebPage, Bool) -> Void)?
    private let retryButton = UIButton(type: .system)
    private var waitingForPage = true
    private var openingDestination = false
    private var closed = false
    private var handlers: [String] = []

    var isRemoteContent: Bool {
        if case .remote = purpose { return true }
        return false
    }

    static func makeWebView() -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        return WKWebView(frame: .zero, configuration: configuration)
    }

    private static let registrationWorld = WKContentWorld.world(name: "HavraLifeRegistration")
    // Retain the submitted identifier across the registration steps in the host's content world.
    private static let registrationIdentityScript = """
    (() => {
        let login, nickname;
        const route = () => location.hash.slice(1).split("?")[0];
        const remember = (form, name) => {
            const submit = document.querySelector('button[type="submit"][form="' + form.id + '"]');
            if (!submit || submit.disabled) return;
            const identifier = form.querySelector('input[autocomplete="' + name + '"]')?.value.trim();
            if (name === "username") login = identifier;
            else nickname = identifier;
        };
        document.addEventListener("submit", event => {
            if (route() === "/login" && event.target.id === "login-form") remember(event.target, "username");
            if (route() === "/register/nickname" && event.target.id === "register-form") remember(event.target, "nickname");
        }, true);
        document.addEventListener("keydown", event => {
            if (event.key !== "Enter" || event.repeat || event.isComposing || event.keyCode === 229) return;
            if (route() === "/login" && event.target.matches?.('#login-form input[autocomplete="current-password"]')) {
                remember(event.target.form, "username");
            }
        }, true);
        window.addEventListener("hashchange", () => {
            if (route() !== "/login") login = undefined;
            if (!route().startsWith("/register/")) nickname = undefined;
        });
        window.havraLifeSubmittedIdentity = () => {
            if (route() === "/login" && login) return {login};
            if (route().startsWith("/register/") && nickname) return {nickname};
            return null;
        };
    })();
    """

    init(document: URL, purpose: Purpose, onEvent: @escaping (Event) -> Void) {
        self.document = document
        self.purpose = purpose
        self.onEvent = onEvent
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(white: 0.02, alpha: 1)
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.backgroundColor = view.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.allowsBackForwardNavigationGestures = false
        if case .onboarding = purpose {
            webView.scrollView.bounces = false
            // The host overlay owns the animation while the button retains its busy state and label.
            webView.configuration.userContentController.addUserScript(WKUserScript(
                source: "document.querySelector('.primary .spinner')?.style.setProperty('visibility', 'hidden');",
                injectionTime: .atDocumentEnd, forMainFrameOnly: true
            ))
        }
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.havraFill(view)

        switch purpose {
        case .onboarding(.welcome, _): handlers = ["havraWelcome"]
        case .onboarding(.community, _): handlers = ["havraCommunityRules"]
        case .registration:
            handlers = ["openUrl"]
            webView.configuration.userContentController.addUserScript(WKUserScript(
                source: Self.registrationIdentityScript, injectionTime: .atDocumentStart,
                forMainFrameOnly: true, in: Self.registrationWorld
            ))
        case .remote: handlers = Array(Set(["Close", BambooLanternPath.close]))
        }
        let bridge = Bridge()
        bridge.owner = self
        for name in handlers { webView.configuration.userContentController.add(bridge, name: name) }

        retryButton.translatesAutoresizingMaskIntoConstraints = false
        retryButton.setTitle("Try again", for: .normal)
        retryButton.tintColor = HavraLifeLoadingView.gold
        retryButton.addTarget(self, action: #selector(load), for: .touchUpInside)
        view.addSubview(retryButton)
        NSLayoutConstraint.activate([
            retryButton.centerXAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerXAnchor),
            retryButton.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
            retryButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)
        ])
        load()
    }

    @objc private func load() {
        guard !closed else { return }
        waitingForPage = true
        retryButton.isHidden = true
        onLoadingChange?(self, true)
        if document.isFileURL {
            let access: URL
            if case let .registration(directory) = purpose { access = directory } else { access = document }
            webView.loadFileURL(document, allowingReadAccessTo: access)
        } else {
            webView.load(URLRequest(url: document, timeoutInterval: 20))
        }
    }

    func close() {
        guard !closed else { return }
        closed = true
        for name in handlers { webView.configuration.userContentController.removeScriptMessageHandler(forName: name) }
        webView.stopLoading()
        webView.setCameraCaptureState(.none, completionHandler: nil)
        webView.setMicrophoneCaptureState(.none, completionHandler: nil)
        webView.navigationDelegate = nil
        webView.uiDelegate = nil
    }

    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        updateSafeArea()
    }

    private func updateSafeArea() {
        guard isViewLoaded, !waitingForPage, !closed else { return }
        let safe = view.safeAreaInsets
        webView.callAsyncJavaScript(
            """
            const style = document.documentElement.style;
            for (const [edge, value] of Object.entries(insets)) style.setProperty('--native-safe-' + edge, value + 'px');
            """,
            arguments: ["insets": ["top": safe.top, "right": safe.right, "bottom": safe.bottom, "left": safe.left]],
            in: nil, in: .page, completionHandler: nil
        )
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard !closed, message.frameInfo.isMainFrame,
              let source = message.frameInfo.request.url, let current = webView.url,
              accepts(source), accepts(current) else { return }

        switch purpose {
        case .onboarding(let page, _):
            let name = page == .welcome ? "havraWelcome" : "havraCommunityRules"
            let source = page == .welcome ? "havraWelcome" : "havraCommunity"
            guard message.name == name, let body = message.body as? [String: String],
                  body["action"] == "Sure", body["source"] == source else { return }
            close()
            onEvent(.continued)
        case .registration:
            guard !openingDestination, message.name == "openUrl", let address = message.body as? String,
                  let target = HavraLifeLaunch.httpsURL(address) else { return }
            openingDestination = true
            if HavraLifeLaunch.onboardingPage(target) != .community {
                close()
                onEvent(.opened(target, identity: nil))
                return
            }
            webView.callAsyncJavaScript("return window.havraLifeSubmittedIdentity?.() ?? null;",
                arguments: [:], in: message.frameInfo, in: Self.registrationWorld) { [weak self] result in
                    guard let self, !self.closed else { return }
                    self.close()
                    self.onEvent(.opened(target, identity: (try? result.get()) as? [String: String]))
                }
        case .remote:
            guard handlers.contains(message.name) else { return }
            close()
            onEvent(.signedOut)
        }
    }

    private func accepts(_ url: URL) -> Bool {
        if document.isFileURL {
            return url.isFileURL && document.standardizedFileURL.path == url.standardizedFileURL.path
        }
        if case .remote = purpose { return BambooLanternPath.sameOrigin(document, url) }
        return HavraLifeLaunch.sameDocument(document, url)
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard !closed, let url = action.request.url else { return decisionHandler(.cancel) }
        if action.targetFrame?.isMainFrame == false { return decisionHandler(.allow) }
        if action.targetFrame == nil {
            decisionHandler(.cancel)
            if action.navigationType == .linkActivated, HavraLifeLaunch.httpsURL(url.absoluteString) != nil {
                UIApplication.shared.open(url)
            }
        } else if accepts(url) {
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
            if action.navigationType == .linkActivated, HavraLifeLaunch.httpsURL(url.absoluteString) != nil {
                UIApplication.shared.open(url)
            }
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        guard !closed else { return decisionHandler(.cancel) }
        if response.isForMainFrame,
           let address = response.response.url,
           !accepts(address) || ((response.response as? HTTPURLResponse).map { !(200..<400).contains($0.statusCode) } ?? false) {
            decisionHandler(.cancel)
            pageFailed()
        } else {
            decisionHandler(.allow)
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard !closed, let address = webView.url, accepts(address) else { return }
        waitingForPage = false
        updateSafeArea()
        onLoadingChange?(self, false)
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        guard !closed else { return }
        waitingForPage = true
        retryButton.isHidden = true
        onLoadingChange?(self, true)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code != NSURLErrorCancelled { pageFailed() }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        self.webView(webView, didFailProvisionalNavigation: navigation, withError: error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { pageFailed() }

    private func pageFailed() {
        guard !closed else { return }
        waitingForPage = true
        if !document.isFileURL, case .onboarding(_, let local) = purpose, let local {
            document = local
            load()
            return
        }
        retryButton.isHidden = false
        onLoadingChange?(self, false)
    }

    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
//        guard !closed, case .registration = purpose, frame.isMainFrame, type == .camera,
//              let source = frame.request.url, source.isFileURL, accepts(source),
//              let current = webView.url, accepts(current) else { return decisionHandler(.deny) }
//        switch AVCaptureDevice.authorizationStatus(for: .video) {
//        case .authorized: decisionHandler(.grant)
//        case .notDetermined:
//            Task { @MainActor in
//                let allowed = await AVCaptureDevice.requestAccess(for: .video)
//                decisionHandler(allowed && !self.closed ? .grant : .deny)
//            }
//        default: decisionHandler(.deny)
//        }
        
        decisionHandler(.grant)
    }
}

extension UIView {
    func havraFill(_ parent: UIView, below sibling: UIView? = nil) {
        translatesAutoresizingMaskIntoConstraints = false
        if let sibling {
            parent.insertSubview(self, belowSubview: sibling)
        } else {
            parent.addSubview(self)
        }
        NSLayoutConstraint.activate([
            topAnchor.constraint(equalTo: parent.topAnchor),
            bottomAnchor.constraint(equalTo: parent.bottomAnchor),
            leadingAnchor.constraint(equalTo: parent.leadingAnchor),
            trailingAnchor.constraint(equalTo: parent.trailingAnchor)
        ])
    }
}
