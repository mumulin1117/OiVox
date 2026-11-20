// TropicalCourtyardLife.swift
// Havra · B module

import AVFoundation
import SafariServices
import UIKit
import UserNotifications
import WebKit

private final class HavraBMessageProxy: NSObject, WKScriptMessageHandler {
    weak var owner: TropicalCourtyardLife?
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        owner?.userContentController(controller, didReceive: message)
    }
}

final class TropicalCourtyardLife: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    private typealias B = HavraBConfiguration.Bridge
    private typealias C = HavraBConfiguration.Callback
    private enum Phase { case loading, ready, failed, closed }
    private let configuration: HavraBEntryConfiguration
    private let session: MonsoonStreetWalk
    private let fallback: () -> Void
    private let reconnect: () -> Void
    private let logout: () -> Void
    private let webView = HavraLifeWebPage.makeWebView()
    var onLoadingChange: ((TropicalCourtyardLife, Bool, Bool) -> Void)?
    private let retryButton = UIButton(type: .system)
    private var purchaseInProgress = false
    private var phase = Phase.loading
    private var visible = false
    private var registered = false
    private var navigation: WKNavigation?
    private var loadTask: Task<Void, Never>?
    private var observers: [NSObjectProtocol] = []
    private var messages: [[String: Any]] = []
    private var toastTask: DispatchWorkItem?
    private weak var toast: HavraBPurchaseNotice?
    private var toastID: String?

    init(configuration: HavraBEntryConfiguration,
         refresh: @escaping () async throws -> HavraBEntryConfiguration?,
         fallback: @escaping () -> Void, reconnect: @escaping () -> Void, logout: @escaping () -> Void) {
        self.configuration = configuration
        self.fallback = fallback
        self.reconnect = reconnect
        self.logout = logout
        session = MonsoonStreetWalk(configuration: configuration, refresh: refresh)
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) { nil }
    deinit {
        loadTask?.cancel()
        toastTask?.cancel()
        observers.forEach(NotificationCenter.default.removeObserver)
    }
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(white: 0.02, alpha: 1)
        let handler = HavraBMessageProxy()
        handler.owner = self
        [BambooLanternPath.close, B.directCloseHandler].forEach { webView.configuration.userContentController.add(handler, name: $0) }
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.backgroundColor = view.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.allowsBackForwardNavigationGestures = true
        webView.havraFill(view)
        retryButton.translatesAutoresizingMaskIntoConstraints = false
        retryButton.tintColor = HavraLifeLoadingView.gold
        retryButton.setTitle("Try again", for: .normal)
        retryButton.addTarget(self, action: #selector(loadPage), for: .touchUpInside)
        view.addSubview(retryButton)
        NSLayoutConstraint.activate([
            retryButton.centerXAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerXAnchor),
            retryButton.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
            retryButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)
        ])
        session.onMessage = { [weak self] in self?.route($0, timestamp: $1) }
        session.onUnavailable = { [weak self] in
            self?.gentleExpressionBeacon()
            self?.fallback()
        }
        session.onChanged = { [weak self] in
            self?.gentleExpressionBeacon()
            self?.reconnect()
        }
        FamilyTableRitual.crystalDreamCanvas.crystalExpressionCanvas = { [weak self] channel, payload in
            guard let self, self.phase != .closed, channel == self.configuration.channel else { return false }
            self.enqueue(payload)
            self.showResult(payload)
            return true
        }
        FamilyTableRitual.crystalDreamCanvas.gentleReflectionArc(configuration.channel)
        for name in [UIApplication.didEnterBackgroundNotification, UIApplication.didBecomeActiveNotification] {
            observers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated {
                    guard let self else { return }
                    if name == UIApplication.didEnterBackgroundNotification { self.session.stop() }
                    else if self.visible && self.phase != .closed { self.session.start() }
                }
            })
        }
        loadPage()
    }
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        visible = true
        if phase != .closed { session.start() }
        flush()
    }
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        visible = false
        if !(presentedViewController is SFSafariViewController) { session.stop() }
    }
    func gentleExpressionBeacon() {
        phase = .closed
        visible = false
        updateLoadingControls()
        loadTask?.cancel()
        toastTask?.cancel()
        toast?.removeFromSuperview()
        navigation = nil
        session.stop()
        for name in [BambooLanternPath.close, B.directCloseHandler] {
            webView.configuration.userContentController.removeScriptMessageHandler(forName: name)
        }
        webView.stopLoading()
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
        messages.removeAll()
    }
    @objc private func loadPage() {
        guard phase != .closed else { return }
        navigation = nil
        webView.stopLoading()
        if let request = webView.load(URLRequest(url: configuration.pageURL)) {
            track(request)
        } else {
            showLoadFailure()
        }
    }

    private func track(_ request: WKNavigation) {
        guard phase != .closed, request !== navigation else { return }
        navigation = request
        phase = .loading
        updateLoadingControls()
        loadTask?.cancel()
        loadTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 30_000_000_000)
            guard !Task.isCancelled, let self, self.navigation === request else { return }
            self.showLoadFailure()
        }
    }

    private func showLoadFailure() {
        guard phase != .closed else { return }
        loadTask?.cancel()
        navigation = nil
        phase = .failed
        webView.stopLoading()
        webView.isHidden = true
        updateLoadingControls()
    }

    private func updateLoadingControls() {
        retryButton.isHidden = phase != .failed
        if phase != .closed {
            let isPageLoading = phase == .loading
            onLoadingChange?(self, isPageLoading || (phase == .ready && purchaseInProgress), isPageLoading)
        }
    }
    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        guard isViewLoaded else { return }
        webView.callAsyncJavaScript(
            "document.documentElement.style.setProperty(topName, top + 'px'); document.documentElement.style.setProperty(bottomName, bottom + 'px');",
            arguments: ["top": view.safeAreaInsets.top, "bottom": view.safeAreaInsets.bottom,
                "topName": HavraBConfiguration.Presentation.safeAreaTopCSS, "bottomName": HavraBConfiguration.Presentation.safeAreaBottomCSS],
            in: nil, in: .page, completionHandler: nil)
    }
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        if let navigation { track(navigation) }
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let navigation, phase != .closed, navigation === self.navigation else { return }
        loadTask?.cancel()
        phase = .ready
        webView.isHidden = false
        updateLoadingControls()
        viewSafeAreaInsetsDidChange()
        flush()
        if !registered {
            registered = true
            Task {
                let center = UNUserNotificationCenter.current()
                if await center.notificationSettings().authorizationStatus == .notDetermined {
                    _ = try? await center.requestAuthorization(options: [.alert, .badge, .sound])
                }
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if navigation === self.navigation && (error as NSError).code != NSURLErrorCancelled { showLoadFailure() }
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        self.webView(webView, didFailProvisionalNavigation: navigation, withError: error)
    }

    func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        guard phase != .closed else { return decisionHandler(.cancel) }
        if response.isForMainFrame,
           let http = response.response as? HTTPURLResponse, !(200..<400).contains(http.statusCode) {
            decisionHandler(.cancel)
            showLoadFailure()
        } else {
            decisionHandler(.allow)
        }
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { showLoadFailure() }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let url = message.frameInfo.request.url,
              BambooLanternPath.sameOrigin(url, configuration.pageURL), [BambooLanternPath.close, B.directCloseHandler].contains(message.name) else { return }
        route([B.closeSelector: BambooLanternPath.close])
    }
    private func route(_ payload: [String: Any], timestamp: TimeInterval? = nil) {
        guard phase != .closed, let action = BambooLanternPath.action(payload) else { return }
        let data = payload[B.data] as? [String: Any] ?? [:]
        switch action {
        case B.purchaseAction:
            guard phase == .ready, visible,
                  timestamp.map({ abs(Date().timeIntervalSince1970 * 1000 - $0) <= 120_000 }) ?? true else { return }
            let product = BambooLanternPath.text(data[B.productID])
            guard let product, let order = BambooLanternPath.text(data[B.orderID]) else {
                let result = BambooLanternPath.purchaseResult(order: "", product: product ?? "", status: "failed",
                    message: product == nil ? "This product is unavailable. Please try again later." : "The purchase request is invalid. Please try again later.",
                    reason: product == nil ? "productUnavailable" : "orderUnavailable")
                enqueue(result)
                showResult(result)
                return
            }
            Task { [weak self] in
                guard let self else { return }
                self.purchaseInProgress = true
                self.updateLoadingControls()
                await FamilyTableRitual.crystalDreamCanvas.lunarReflectionArc(auroraPetalRibbon: product, airyWonderCanvas: order, brightMood: self.configuration.channel)
                self.purchaseInProgress = FamilyTableRitual.crystalDreamCanvas.crystalInspirationCanvas
                self.updateLoadingControls()
            }
        case BambooLanternPath.close:
            gentleExpressionBeacon()
            onLoadingChange?(self, true, true)
            Task {
                let store = webView.configuration.websiteDataStore
                let types = WKWebsiteDataStore.allWebsiteDataTypes()
                let host = configuration.pageURL.host?.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: ".")) ?? ""
                let records = await store.dataRecords(ofTypes: types).filter {
                    let name = $0.displayName.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: "."))
                    return host == name || host.hasSuffix("." + name) || name.hasSuffix("." + host)
                }
                await store.removeData(ofTypes: types, for: records)
                logout()
            }
        case B.openAction:
            guard visible, let url = BambooLanternPath.externalURL(data[B.externalURL]) else { return }
            open(url) { [weak self] success in
                self?.enqueue([C.event: C.openEvent, C.openState: success ? "success" : "failed", C.source: C.nativeSource])
            }
        case B.forwardAction: enqueue(payload)
        default: break
        }
    }
    private func enqueue(_ payload: [String: Any]) {
        guard phase != .closed else { return }
        messages = Array((messages + [payload]).suffix(256))
        flush()
    }
    private func flush() {
        guard phase == .ready, visible else { return }
        let pending = messages
        messages.removeAll()
        for payload in pending {
            let script = payload[C.event] as? String == C.openEvent
                ? "window.dispatchEvent(new CustomEvent(eventName, {detail: payload}));"
                : "window.dispatchEvent(new MessageEvent('message', {data: payload}));"
            webView.callAsyncJavaScript(script, arguments: ["payload": payload, "eventName": C.openEvent], in: nil, in: .page, completionHandler: nil)
        }
    }
    private func open(_ url: URL, completion: @escaping (Bool) -> Void = { _ in }) {
        guard HavraBConfiguration.Network.externalSchemes.contains(url.scheme?.lowercased() ?? ""), url.host != nil else { return completion(false) }
        UIApplication.shared.open(url, options: [:], completionHandler: completion)
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.cancel) }
        if url.scheme?.lowercased() == "itms-apps" {
            decisionHandler(.cancel)
            return open(url)
        }
        if action.targetFrame?.isMainFrame == false || BambooLanternPath.sameOrigin(url, configuration.pageURL) { decisionHandler(.allow) }
        else {
            decisionHandler(.cancel)
            if phase == .ready || action.navigationType == .linkActivated { open(url) }
        }
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url { open(url) }
        return nil
    }
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        var components = URLComponents()
        components.scheme = origin.protocol
        components.host = origin.host
        components.port = origin.port == 0 ? nil : origin.port
        guard frame.isMainFrame, let current = webView.url, let url = components.url,
              BambooLanternPath.sameOrigin(current, configuration.pageURL), BambooLanternPath.sameOrigin(url, configuration.pageURL)
        else { return decisionHandler(.deny) }
        if type != .camera {
            do {
                try AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .videoChat)
                try AVAudioSession.sharedInstance().setActive(true)
            } catch { return decisionHandler(.deny) }
        }
        decisionHandler(.grant)
    }
    private func showResult(_ payload: [String: Any]) {
        guard visible, payload[C.event] as? String == C.purchaseEvent, let status = BambooLanternPath.text(payload[C.status]),
              viewIfLoaded?.window != nil else { return }
        let reason = BambooLanternPath.text(payload[C.reason]) ?? ""
        let message = BambooLanternPath.text(payload[C.message]) ?? "Unable to complete the purchase. Please try again later."
        let id = [BambooLanternPath.text(payload[C.orderID]) ?? BambooLanternPath.text(payload[C.productID]) ?? "", status, reason, message].joined(separator: "|")
        guard toastID != id else { return }
        let pendingTitles = ["purchasePending": "Awaiting Approval", "purchaseInProgress": "Purchase in Progress",
            "purchaseUnverified": "Purchase Unconfirmed", "purchaseUnknown": "Purchase Unconfirmed",
            "purchaseRetry": "Ready to Try Again", "verificationPending": "Purchase Processing"]
        let success = payload[C.success] as? Bool == true || status == "verified"
        let title = success ? "Purchase Successful" : pendingTitles[reason]
            ?? (["productUnavailable", "productConfiguration"].contains(reason) ? "Product Unavailable"
                : reason == "paymentsDisabled" ? "Purchases Unavailable" : status == "cancelled" ? "Purchase Cancelled" : "Purchase Failed")
        let cancelled = status == "cancelled" && !["productUnavailable", "productConfiguration", "paymentsDisabled"].contains(reason)
        let color = success ? UIColor(red: 0.25, green: 0.85, blue: 0.59, alpha: 1)
            : pendingTitles[reason] != nil ? UIColor(red: 0.50, green: 0.67, blue: 0.94, alpha: 1)
            : cancelled ? UIColor(red: 0.67, green: 0.61, blue: 0.82, alpha: 1)
            : UIColor(red: 1, green: 0.36, blue: 0.47, alpha: 1)
        let toast = HavraBPurchaseNotice(title: title, message: message, icon: success ? "checkmark" : pendingTitles[reason] != nil ? "clock" : "xmark", color: color)
        toastTask?.cancel()
        self.toast?.removeFromSuperview()
        self.toast = toast
        toastID = id
        view.addSubview(toast)
        let width = toast.widthAnchor.constraint(equalTo: view.safeAreaLayoutGuide.widthAnchor, constant: -48)
        width.priority = .defaultHigh
        NSLayoutConstraint.activate([toast.centerXAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerXAnchor),
            toast.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
            toast.leadingAnchor.constraint(greaterThanOrEqualTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            toast.trailingAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            toast.widthAnchor.constraint(lessThanOrEqualToConstant: 360), width])
        toast.alpha = 0
        toast.transform = CGAffineTransform(translationX: 0, y: 10).scaledBy(x: 0.94, y: 0.94)
        UIView.animate(withDuration: UIAccessibility.isReduceMotionEnabled ? 0.16 : 0.36, delay: 0, usingSpringWithDamping: 0.78,
                       initialSpringVelocity: 0.6, options: [.beginFromCurrentState, .curveEaseOut]) {
            toast.alpha = 1
            toast.transform = .identity
        }
        UIAccessibility.post(notification: .announcement, argument: "\(title). \(message)")
        let dismiss = DispatchWorkItem { [weak self, weak toast] in
            guard let self, let toast, self.toast === toast else { return }
            UIView.animate(withDuration: UIAccessibility.isReduceMotionEnabled ? 0.12 : 0.22, delay: 0, options: [.beginFromCurrentState, .curveEaseIn]) {
                toast.alpha = 0
                toast.transform = CGAffineTransform(translationX: 0, y: -8).scaledBy(x: 0.97, y: 0.97)
            } completion: { _ in
                toast.removeFromSuperview()
                if self.toast === toast {
                    self.toast = nil
                    self.toastID = nil
                }
            }
        }
        toastTask = dismiss
        DispatchQueue.main.asyncAfter(deadline: .now() + 2, execute: dismiss)
    }
}

private final class HavraBPurchaseNotice: UIView {
    private let gradient = CAGradientLayer()
    init(title: String, message: String, icon: String, color: UIColor) {
        super.init(frame: .zero)
        translatesAutoresizingMaskIntoConstraints = false
        isUserInteractionEnabled = false
        isAccessibilityElement = true
        accessibilityIdentifier = HavraBConfiguration.Presentation.purchaseAccessibilityID
        accessibilityLabel = "\(title). \(message)"
        backgroundColor = UIColor(red: 0.08, green: 0.055, blue: 0.16, alpha: 0.97)
        layer.cornerRadius = 22
        layer.borderWidth = 1
        layer.borderColor = color.withAlphaComponent(0.48).cgColor
        layer.shadowColor = color.withAlphaComponent(0.55).cgColor
        layer.shadowOpacity = 0.72
        layer.shadowRadius = 22
        layer.shadowOffset = CGSize(width: 0, height: 10)
        gradient.colors = [color.withAlphaComponent(0.22).cgColor, UIColor(red: 0.11, green: 0.07, blue: 0.22, alpha: 0.05).cgColor]
        gradient.startPoint = CGPoint(x: 0, y: 0)
        gradient.endPoint = CGPoint(x: 1, y: 1)
        gradient.cornerRadius = 22
        layer.insertSublayer(gradient, at: 0)
        let badge = UIView()
        badge.backgroundColor = color.withAlphaComponent(0.18)
        badge.layer.cornerRadius = 23
        badge.layer.borderWidth = 1
        badge.layer.borderColor = color.withAlphaComponent(0.52).cgColor
        let image = UIImageView(image: UIImage(systemName: icon))
        image.contentMode = .scaleAspectFit
        image.tintColor = color
        image.preferredSymbolConfiguration = UIImage.SymbolConfiguration(pointSize: 20, weight: .bold)
        let heading = UILabel()
        heading.text = title
        heading.textColor = .white
        heading.numberOfLines = 1
        heading.adjustsFontSizeToFitWidth = true
        heading.minimumScaleFactor = 0.82
        heading.font = .systemFont(ofSize: 17, weight: .bold)
        let detail = UILabel()
        detail.text = message
        detail.textColor = UIColor(white: 1, alpha: 0.76)
        detail.numberOfLines = 0
        detail.font = .systemFont(ofSize: 13.5, weight: .regular)
        let stack = UIStackView(arrangedSubviews: [heading, detail])
        stack.axis = .vertical
        stack.alignment = .fill
        stack.spacing = 6
        [badge, image, stack].forEach { $0.translatesAutoresizingMaskIntoConstraints = false }
        addSubview(badge)
        badge.addSubview(image)
        addSubview(stack)
        NSLayoutConstraint.activate([badge.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 18),
            badge.centerYAnchor.constraint(equalTo: centerYAnchor), badge.widthAnchor.constraint(equalToConstant: 46),
            badge.heightAnchor.constraint(equalTo: badge.widthAnchor), image.centerXAnchor.constraint(equalTo: badge.centerXAnchor),
            image.centerYAnchor.constraint(equalTo: badge.centerYAnchor), image.widthAnchor.constraint(equalToConstant: 24),
            image.heightAnchor.constraint(equalTo: image.widthAnchor), stack.topAnchor.constraint(equalTo: topAnchor, constant: 18),
            stack.leadingAnchor.constraint(equalTo: badge.trailingAnchor, constant: 14),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -18),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -18), heightAnchor.constraint(greaterThanOrEqualToConstant: 88)])
    }
    required init?(coder: NSCoder) { nil }
    override func layoutSubviews() {
        super.layoutSubviews()
        gradient.frame = bounds
    }
}
