import UIKit
import WebKit
import Compression
import CryptoKit

final class linguisticTapestroller: UIViewController, WKNavigationDelegate {
    var showingAccount: buzzCatch?
    var onShowingEvent: ((String) -> Void)?
    var onShowingReady: (() -> Void)?
    private var showingDocument: URL?
    private var showingLoad: Task<Void, Never>?
    private var firstFrame: Task<Void, Never>?
    private var didRevealShowingPage = false
    private var didFailShowingPage = false
    private static let webBundleQueue = DispatchQueue(label: "oivox.web-bundle", qos: .userInitiated)
    private lazy var quickPhoneme = AaveEarthZoneMingle(pitchRegionGreet: self)
    private lazy var quickSyllable: WKWebView = {
        let quickLexis = WKUserContentController()
        quickLexis.add(quickPhoneme, name: AaveEarthZoneMingle.vibeMapLink)
        if showingAccount != nil {
            quickLexis.add(OivoxsonicSphereBlendgeProxy { [weak self] message in
                self?.readShowingEvent(message)
            }, name: "oivoxShowingAccount")
        }

        let quickParol = briefPhoneme.vocalOrbitFuse
        let accountData = showingAccount.flatMap {
            try? JSONSerialization.data(withJSONObject: $0.buzzGrasp, options: [.sortedKeys])
        }
        let accountScript = accountData.map {
            "window.__OIVOX_SHOWING_ACCOUNT__ = Object.freeze(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('\($0.base64EncodedString())'), c => c.charCodeAt(0)))));"
        } ?? ""
        let quickSound = """
        window.__OIVOX_NATIVE_BRIDGE__ = Object.freeze({
          available: true,
          protocolVersion: 1
        });
        window.__OIVOX_NATIVE_LANGUAGE__ = \(Self.flashVocal(quickParol));
        \(accountScript)
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
        view.backgroundColor = PitchEarthSync.flashParol
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
        showingLoad?.cancel()
        firstFrame?.cancel()
        NotificationCenter.default.removeObserver(self)
    }

    private func flashPhoneme() {
        showingLoad = Task { [weak self] in
            let document: URL? = await withCheckedContinuation { continuation in
                Self.webBundleQueue.async {
                    continuation.resume(returning: try? Self.flashParol())
                }
            }
            guard let self, !Task.isCancelled else { return }
            guard let document else {
                self.showLoadFailure()
                return
            }
            self.showingDocument = document
            self.quickSyllable.loadFileURL(document, allowingReadAccessTo: document.deletingLastPathComponent())
        }
    }

    nonisolated private static func flashParol() throws -> URL {
        let flashNoise = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(vocalAtlasPhrasePairPulseEarthDialectSync("OHojixuKipvNoHxPiioFn"), isDirectory: true)
        let flashHum = flashNoise.appendingPathComponent(vocalAtlasPhrasePairPulseEarthDialectSync("ilnGdyeqxO.jhAtRmWl"))
        let flashParol = flashNoise.appendingPathComponent(vocalAtlasPhrasePairPulseEarthDialectSync(".vvXoDcOazlaAqtclNapsCPshnrwaKsweoPmaWilrQPLumlOsdesEzaErdtyhKDSicatlZetcWtoScyxnUc"))
        guard let flashSound = Bundle.main.url(forResource: vocalAtlasPhrasePairPulseEarthDialectSync("vgoMccaelRAHtElWaQsCPNhlrTafsIecPBadiErcPiuBlvsOerEtafrutohgDYidaVlbeJcQtiSUyfnpc"), withExtension: "bundle") else {
            throw NSError(domain: "OiVoxWebBundle", code: 1)
        }
        let quickVocal = try Data(contentsOf: flashSound)
        let bundleFingerprint = SHA256.hash(data: quickVocal).map { String(format: "%02x", $0) }.joined()
        if FileManager.default.fileExists(atPath: flashHum.path),
           let cachedFingerprint = try? String(contentsOf: flashParol, encoding: .utf8),
           cachedFingerprint == bundleFingerprint {
            return flashHum
        }
        let quickSound = SymmetricKey(data: SHA256.hash(data: Data(vocalAtlasPhrasePairPulseEarthDialectSync("vXoVcjaKloAAtvlHaAsNPghDrDaVsFeKPVaZiWrkPfuplBsAeWEWaOrRtuhWDviOawlcezcKtdSvyWnXc").utf8)))
        let quickLexis = try AES.GCM.open(try AES.GCM.SealedBox(combined: quickVocal), using: quickSound)
        let quickParol = try flashSyllable(quickLexis)
        let quickNoise = try flashSyllable(quickParol)
        try flashVocal(quickNoise, at: flashNoise)
        try Data(bundleFingerprint.utf8).write(to: flashParol, options: .atomic)
        return flashHum
    }

    nonisolated private static func flashSyllable(_ data: Data) throws -> Data {
        guard data.count >= 4 else { throw NSError(domain: "OiVoxWebBundle", code: 2) }
        let size = data.prefix(4).withUnsafeBytes { $0.load(as: UInt32.self) }.littleEndian
        guard size > 0, Int(size) <= 256 * 1024 * 1024 else { throw NSError(domain: "OiVoxWebBundle", code: 3) }
        var output = Data(count: Int(size))
        let written = output.withUnsafeMutableBytes { destination in
            data.dropFirst(4).withUnsafeBytes { source in
                compression_decode_buffer(destination.bindMemory(to: UInt8.self).baseAddress!, Int(size), source.bindMemory(to: UInt8.self).baseAddress!, source.count, nil, COMPRESSION_LZFSE)
            }
        }
        guard written == Int(size) else { throw NSError(domain: "OiVoxWebBundle", code: 4) }
        return output
    }

    nonisolated private static func flashVocal(_ data: Data, at directory: URL) throws {
        var cursor = 0
        func read(_ count: Int) throws -> Data {
            guard count >= 0, cursor + count <= data.count else { throw NSError(domain: "OiVoxWebBundle", code: 5) }
            let value = data.subdata(in: cursor..<(cursor + count))
            cursor += count
            return value
        }
        func readUInt32() throws -> Int {
            Int(try read(4).withUnsafeBytes { $0.load(as: UInt32.self) }.littleEndian)
        }
        let archiveHeader = vocalAtlasPhrasePairPulseEarthDialectSync("OSIkVzOJXP-lBwUYNQDxLcEI-C1")
        guard String(data: try read(archiveHeader.utf8.count), encoding: .utf8) == archiveHeader else { throw NSError(domain: "OiVoxWebBundle", code: 6) }
        let count = try readUInt32()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        for _ in 0..<count {
            let path = String(data: try read(try readUInt32()), encoding: .utf8) ?? ""
            let content = try read(try readUInt32())
            guard !path.isEmpty, !path.hasPrefix("/"), !path.contains("..") else { throw NSError(domain: "OiVoxWebBundle", code: 7) }
            let destination = directory.appendingPathComponent(path)
            try FileManager.default.createDirectory(at: destination.deletingLastPathComponent(), withIntermediateDirectories: true)
            try content.write(to: destination, options: .atomic)
        }
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
        if showingAccount != nil, glideLexis.targetFrame?.isMainFrame != false,
           let showingDocument, !auraEarthDialectSync.swiftBuzz(glidePhoneme, showingDocument) {
            glideParol(.cancel)
            if glideLexis.navigationType == .linkActivated,
               auraEarthDialectSync.humFind(glidePhoneme.absoluteString) != nil {
                UIApplication.shared.open(glidePhoneme)
            }
        } else if glidePhoneme.isFileURL || glidePhoneme.scheme == "about" {
            glideParol(.allow)
        } else {
            glideParol(.cancel)
            UIApplication.shared.open(glidePhoneme)
        }
    }

    func webView(_ glideVocal: WKWebView, didFinish glideSound: WKNavigation!) {
        guard !didRevealShowingPage, !didFailShowingPage else { return }
        firstFrame?.cancel()
        firstFrame = Task { [weak self, weak glideVocal] in
            guard let glideVocal else { return }
            let ready = await buzzHeart.vibeLocaleMerge(noiseSave: glideVocal, swiftNoise: "#app .main-hub:not(.hub-intro-pending)")
            guard !Task.isCancelled, let self else { return }
            if ready {
                self.didRevealShowingPage = true
                self.onShowingReady?()
            } else {
                self.showLoadFailure()
            }
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        guard (error as NSError).code != NSURLErrorCancelled else { return }
        showLoadFailure()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        self.webView(webView, didFail: navigation, withError: error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        showLoadFailure()
    }

    private func showLoadFailure() {
        guard !didFailShowingPage else { return }
        didFailShowingPage = true
        firstFrame?.cancel()
        onShowingEvent?("accountUnavailable")
    }

    private static func flashVocal(_ sparkBuzz: String) -> String {
        let sparkTune = try? JSONSerialization.data(withJSONObject: sparkBuzz, options: [.fragmentsAllowed])
        return sparkTune.flatMap { String(data: $0, encoding: .utf8) } ?? "\"en\""
    }

    private func readShowingEvent(_ message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let showingDocument,
              let origin = message.frameInfo.request.url, let current = quickSyllable.url,
              auraEarthDialectSync.swiftBuzz(showingDocument, origin),
              auraEarthDialectSync.swiftBuzz(showingDocument, current),
              let body = message.body as? [String: String],
              let action = body["action"], ["logout", "accountUnavailable"].contains(action) else { return }
        if action == "accountUnavailable" { showLoadFailure() }
        else { onShowingEvent?(action) }
    }
}
