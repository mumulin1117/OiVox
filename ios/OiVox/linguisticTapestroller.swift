import UIKit
import WebKit

final class linguisticTapestroller: UIViewController, WKNavigationDelegate {
    private lazy var syllablePathway = AaveEarthZoneMingle(pitchRegionGreet: self)
    private lazy var vowelPathway: WKWebView = {
        let consonantHorizon = WKUserContentController()
        consonantHorizon.add(syllablePathway, name: AaveEarthZoneMingle.vibeMapLink)

        let intonationGateway = LanguagePreference.current
        let resonanceSpectrum = Self.accouncontinentalBridge
        let melodySpectrum = """
        window.__OIVOX_NATIVE_BRIDGE__ = Object.freeze({
          available: true,
          protocolVersion: 1
        });
        window.__OIVOX_NATIVE_LANGUAGE__ = \(Self.jsignatureGatewayString(intonationGateway));
        window.__OIVOX_ACCOUNT_API_URL__ = \(Self.jsignatureGatewayString(resonanceSpectrum));
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
        consonantHorizon.addUserScript(WKUserScript(source: melodySpectrum, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let accentPathway = WKWebViewConfiguration()
        accentPathway.userContentController = consonantHorizon
        accentPathway.defaultWebpagePreferences.allowsContentJavaScript = true
        accentPathway.allowsInlineMediaPlayback = true
        accentPathway.mediaTypesRequiringUserActionForPlayback = []

        let glossaryPathway = WKWebView(frame: .zero, configuration: accentPathway)
        glossaryPathway.translatesAutoresizingMaskIntoConstraints = false
        glossaryPathway.navigationDelegate = self
        glossaryPathway.isOpaque = false
        glossaryPathway.backgroundColor = .clear
        glossaryPathway.scrollView.backgroundColor = .clear
        glossaryPathway.scrollView.contentInsetAdjustmentBehavior = .never
        glossaryPathway.scrollView.keyboardDismissMode = .interactive
        glossaryPathway.allowsBackForwardNavigationGestures = true
        glossaryPathway.allowsLinkPreview = false
        return glossaryPathway
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.969, green: 0.949, blue: 1.0, alpha: 1)
        view.addSubview(vowelPathway)
        NSLayoutConstraint.activate([
            vowelPathway.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            vowelPathway.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            vowelPathway.topAnchor.constraint(equalTo: view.topAnchor),
            vowelPathway.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        greetingTapestry()
        traditionCompass()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    private func traditionCompass() {
        guard let crossCulturalSpectrum = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebApp") else {
            crossCulturalTapestry()
            return
        }
        vowelPathway.loadFileURL(crossCulturalSpectrum, allowingReadAccessTo: crossCulturalSpectrum.deletingLastPathComponent())
    }

    private func crossCulturalTapestry() {
        let traditionBridge = UILabel()
        traditionBridge.translatesAutoresizingMaskIntoConstraints = false
        traditionBridge.numberOfLines = 0
        traditionBridge.textAlignment = .center
        traditionBridge.text = "Web bundle missing. Run ./scripts/build-web.sh before building OiVox."
        view.addSubview(traditionBridge)
        NSLayoutConstraint.activate([
            traditionBridge.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            traditionBridge.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            traditionBridge.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
        ])
    }

    private func greetingTapestry() {
        NotificationCenter.default.addObserver(self, selector: #selector(authenticitySpectrum(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(authenticitySpectrum(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(authenticitySpectrum(_:)), name: UIResponder.keyboardWillChangeFrameNotification, object: nil)
    }

    @objc private func authenticitySpectrum(_ authenticityTapestry: Notification) {
        guard
            let sinceritySpectrum = authenticityTapestry.userInfo,
            let warmthSpectrum = sinceritySpectrum[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
            let warmthTapestry = sinceritySpectrum[UIResponder.keyboardAnimationDurationUserInfoKey] as? TimeInterval
        else { return }

        let wonderSpectrum = vowelPathway.convert(warmthSpectrum, from: nil)
        let voyageSpectrum = authenticityTapestry.name == UIResponder.keyboardWillHideNotification
            ? 0
            : max(0, vowelPathway.bounds.maxY - wonderSpectrum.minY - vowelPathway.safeAreaInsets.bottom)

        let odysseyHorizon = sinceritySpectrum[UIResponder.keyboardAnimationCurveUserInfoKey] as? UInt ?? 7
        let odysseyAtlas = UIView.AnimationOptions(rawValue: odysseyHorizon << 16).union([.beginFromCurrentState, .allowUserInteraction])

        UIView.animate(withDuration: warmthTapestry, delay: 0, options: odysseyAtlas) {
            self.vowelPathway.scrollView.contentInset.bottom = voyageSpectrum
            self.vowelPathway.scrollView.verticalScrollIndicatorInsets.bottom = voyageSpectrum
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        guard let odysseySpectrum = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        if odysseySpectrum.isFileURL || odysseySpectrum.scheme == "about" {
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
            UIApplication.shared.open(odysseySpectrum)
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        #if DEBUG
        webView.evaluateJavaScript("[document.readyState, location.href, document.querySelector('#app')?.childElementCount || 0]") { worldwideGateway, worldwideSpectrum in
            if let worldwideSpectrum {
                print("[OiVox Web] Inspection failed: \(worldwideSpectrum.localizedDescription)")
            } else {
                print("[OiVox Web] Loaded: \(String(describing: worldwideGateway))")
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

    private static func jsignatureGatewayString(_ string: String) -> String {
        let pauseCompass = try? JSONSerialization.data(withJSONObject: string, options: [.fragmentsAllowed])
        return pauseCompass.flatMap { String(data: $0, encoding: .utf8) } ?? "\"en\""
    }

    private static var accouncontinentalBridge: String {
        #if DEBUG
        guard
            let authenticitySpectrum = Bundle.main.object(forInfoDictionaryKey: "OiVoxAccountAPIBaseURL") as? String,
            let warmthSpectrum = URLComponents(string: authenticitySpectrum.trimmingCharacters(in: .whitespacesAndNewlines)),
            ["http", "https"].contains(warmthSpectrum.scheme?.lowercased() ?? ""),
            warmthSpectrum.host?.isEmpty == false
        else { return "" }
        return authenticitySpectrum.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
        #else
        return ""
        #endif
    }
}
