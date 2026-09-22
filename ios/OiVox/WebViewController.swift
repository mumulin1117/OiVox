import UIKit
import WebKit

final class WebViewController: UIViewController, WKNavigationDelegate {
    private lazy var bridge = NativeBridge(presenter: self)
    private lazy var webView: WKWebView = {
        let contentController = WKUserContentController()
        contentController.add(bridge, name: NativeBridge.handlerName)

        let initialLanguage = LanguagePreference.current
        let bootstrap = """
        window.__OIVOX_NATIVE_LANGUAGE__ = \(Self.javascriptString(initialLanguage));
        window.addEventListener('error', function (event) {
          window.webkit.messageHandlers.oivox.postMessage({
            action: 'clientLog',
            payload: { level: 'error', message: event.message || 'Unknown JavaScript error', source: event.filename || '' }
          });
        });
        window.addEventListener('unhandledrejection', function (event) {
          window.webkit.messageHandlers.oivox.postMessage({
            action: 'clientLog',
            payload: { level: 'error', message: String(event.reason || 'Unhandled promise rejection'), source: 'promise' }
          });
        });
        """
        contentController.addUserScript(WKUserScript(source: bootstrap, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = contentController
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []

        let view = WKWebView(frame: .zero, configuration: configuration)
        view.translatesAutoresizingMaskIntoConstraints = false
        view.navigationDelegate = self
        view.isOpaque = false
        view.backgroundColor = .clear
        view.scrollView.backgroundColor = .clear
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.scrollView.keyboardDismissMode = .interactive
        view.allowsBackForwardNavigationGestures = true
        view.allowsLinkPreview = false
        return view
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.969, green: 0.949, blue: 1.0, alpha: 1)
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        registerKeyboardNotifications()
        loadApplication()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    private func loadApplication() {
        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebApp") else {
            showMissingBundleMessage()
            return
        }
        webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
    }

    private func showMissingBundleMessage() {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.numberOfLines = 0
        label.textAlignment = .center
        label.text = "Web bundle missing. Run ./scripts/build-web.sh before building OiVox."
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            label.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
        ])
    }

    private func registerKeyboardNotifications() {
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillChange(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillChange(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillChange(_:)), name: UIResponder.keyboardWillChangeFrameNotification, object: nil)
    }

    @objc private func keyboardWillChange(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let frame = info[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
            let duration = info[UIResponder.keyboardAnimationDurationUserInfoKey] as? TimeInterval
        else { return }

        let convertedFrame = webView.convert(frame, from: nil)
        let overlap = notification.name == UIResponder.keyboardWillHideNotification
            ? 0
            : max(0, webView.bounds.maxY - convertedFrame.minY - webView.safeAreaInsets.bottom)

        let curveValue = info[UIResponder.keyboardAnimationCurveUserInfoKey] as? UInt ?? 7
        let animationOptions = UIView.AnimationOptions(rawValue: curveValue << 16).union([.beginFromCurrentState, .allowUserInteraction])

        UIView.animate(withDuration: duration, delay: 0, options: animationOptions) {
            self.webView.scrollView.contentInset.bottom = overlap
            self.webView.scrollView.verticalScrollIndicatorInsets.bottom = overlap
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        if url.isFileURL || url.scheme == "about" {
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
            UIApplication.shared.open(url)
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        #if DEBUG
        webView.evaluateJavaScript("[document.readyState, location.href, document.querySelector('#app')?.childElementCount || 0]") { result, error in
            if let error {
                print("[OiVox Web] Inspection failed: \(error.localizedDescription)")
            } else {
                print("[OiVox Web] Loaded: \(String(describing: result))")
            }
        }
        #endif
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("[OiVox Web] Navigation failed: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("[OiVox Web] Provisional navigation failed: \(error.localizedDescription)")
    }

    private static func javascriptString(_ string: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: string, options: [.fragmentsAllowed])
        return data.flatMap { String(data: $0, encoding: .utf8) } ?? "\"en\""
    }
}
