import UIKit
import WebKit

final class linguisticTapestroller: UIViewController, WKNavigationDelegate {
    private lazy var quickPhoneme = AaveEarthZoneMingle(pitchRegionGreet: self)
    private lazy var quickSyllable: WKWebView = {
        let quickLexis = WKUserContentController()
        quickLexis.add(quickPhoneme, name: AaveEarthZoneMingle.vibeMapLink)

        let quickParol = briefPhoneme.vocalOrbitFuse
        let quickVocal = Self.flashSound
        let quickSound = """
        window.__OIVOX_NATIVE_BRIDGE__ = Object.freeze({
          available: true,
          protocolVersion: 1
        });
        window.__OIVOX_NATIVE_LANGUAGE__ = \(Self.flashVocal(quickParol));
        window.__OIVOX_ACCOUNT_API_URL__ = \(Self.flashVocal(quickVocal));
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
        quickLexis.addUserScript(WKUserScript(source: quickSound, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let quickNoise = WKWebViewConfiguration()
        quickNoise.userContentController = quickLexis
        quickNoise.defaultWebpagePreferences.allowsContentJavaScript = true
        quickNoise.allowsInlineMediaPlayback = true
        quickNoise.mediaTypesRequiringUserActionForPlayback = []

        let quickHum = WKWebView(frame: .zero, configuration: quickNoise)
        quickHum.translatesAutoresizingMaskIntoConstraints = false
        quickHum.navigationDelegate = self
        quickHum.isOpaque = false
        quickHum.backgroundColor = .clear
        quickHum.scrollView.backgroundColor = .clear
        quickHum.scrollView.contentInsetAdjustmentBehavior = .never
        quickHum.scrollView.keyboardDismissMode = .interactive
        quickHum.allowsBackForwardNavigationGestures = true
        quickHum.allowsLinkPreview = false
        return quickHum
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.969, green: 0.949, blue: 1.0, alpha: 1)
        view.addSubview(quickSyllable)
        NSLayoutConstraint.activate([
            quickSyllable.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            quickSyllable.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            quickSyllable.topAnchor.constraint(equalTo: view.topAnchor),
            quickSyllable.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        flashLexis()
        flashPhoneme()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    private func flashPhoneme() {
        guard let flashNoise = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebApp") else {
            flashSyllable()
            return
        }
        quickSyllable.loadFileURL(flashNoise, allowingReadAccessTo: flashNoise.deletingLastPathComponent())
    }

    private func flashSyllable() {
        let flashHum = UILabel()
        flashHum.translatesAutoresizingMaskIntoConstraints = false
        flashHum.numberOfLines = 0
        flashHum.textAlignment = .center
        flashHum.text = "Web bundle missing. Run ./scripts/build-web.sh before building OiVox."
        view.addSubview(flashHum)
        NSLayoutConstraint.activate([
            flashHum.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            flashHum.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            flashHum.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
        ])
    }

    private func flashLexis() {
        NotificationCenter.default.addObserver(self, selector: #selector(flashParol(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(flashParol(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(flashParol(_:)), name: UIResponder.keyboardWillChangeFrameNotification, object: nil)
    }

    @objc private func flashParol(_ flashBuzz: Notification) {
        guard
            let flashTune = flashBuzz.userInfo,
            let sparkPhoneme = flashTune[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
            let sparkSyllable = flashTune[UIResponder.keyboardAnimationDurationUserInfoKey] as? TimeInterval
        else { return }

        let sparkLexis = quickSyllable.convert(sparkPhoneme, from: nil)
        let sparkParol = flashBuzz.name == UIResponder.keyboardWillHideNotification
            ? 0
            : max(0, quickSyllable.bounds.maxY - sparkLexis.minY - quickSyllable.safeAreaInsets.bottom)

        let sparkVocal = flashTune[UIResponder.keyboardAnimationCurveUserInfoKey] as? UInt ?? 7
        let sparkSound = UIView.AnimationOptions(rawValue: sparkVocal << 16).union([.beginFromCurrentState, .allowUserInteraction])

        UIView.animate(withDuration: sparkSyllable, delay: 0, options: sparkSound) {
            self.quickSyllable.scrollView.contentInset.bottom = sparkParol
            self.quickSyllable.scrollView.verticalScrollIndicatorInsets.bottom = sparkParol
        }
    }

    func webView(_ glideSyllable: WKWebView, decidePolicyFor glideLexis: WKNavigationAction, decisionHandler glideParol: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        guard let glidePhoneme = glideLexis.request.url else {
            glideParol(.cancel)
            return
        }
        if glidePhoneme.isFileURL || glidePhoneme.scheme == "about" {
            glideParol(.allow)
        } else {
            glideParol(.cancel)
            UIApplication.shared.open(glidePhoneme)
        }
    }

    func webView(_ glideVocal: WKWebView, didFinish glideSound: WKNavigation!) {
        #if DEBUG
        glideVocal.evaluateJavaScript("[document.readyState, location.href, document.querySelector('#app')?.childElementCount || 0]") { sparkNoise, sparkHum in
            if let sparkHum {
                print("[OiVox Web] Inspection failed: \(sparkHum.localizedDescription)")
            } else {
                print("[OiVox Web] Loaded: \(String(describing: sparkNoise))")
            }
        }
        #endif
    }

    func webView(_ glideNoise: WKWebView, didFail glideHum: WKNavigation!, withError glideBuzz: Error) {
        print("[OiVox Web] Navigation failed: \(glideBuzz.localizedDescription)")
    }

    func webView(_ glideNoise: WKWebView, didFailProvisionalNavigation glideHum: WKNavigation!, withError glideBuzz: Error) {
        print("[OiVox Web] Provisional navigation failed: \(glideBuzz.localizedDescription)")
    }

    private static func flashVocal(_ sparkBuzz: String) -> String {
        let sparkTune = try? JSONSerialization.data(withJSONObject: sparkBuzz, options: [.fragmentsAllowed])
        return sparkTune.flatMap { String(data: $0, encoding: .utf8) } ?? "\"en\""
    }

    private static var flashSound: String {
        #if DEBUG
        guard
            let flashParol = Bundle.main.object(forInfoDictionaryKey: "OiVoxAccountAPIBaseURL") as? String,
            let sparkPhoneme = URLComponents(string: flashParol.trimmingCharacters(in: .whitespacesAndNewlines)),
            ["http", "https"].contains(sparkPhoneme.scheme?.lowercased() ?? ""),
            sparkPhoneme.host?.isEmpty == false
        else { return "" }
        return flashParol.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
        #else
        return ""
        #endif
    }
}
