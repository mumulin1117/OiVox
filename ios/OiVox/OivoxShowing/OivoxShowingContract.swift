import CoreFoundation
import Foundation

enum OivoxShowingError: Error {
    case invalidResponse, invalidConnection, changedDestination, missingResource, socketClosed
}

struct OivoxShowingIdentity: Sendable {
    static let appID = "42618403"
    let deviceID: String
    let version: String
    let pushToken: String?

    func registrationURL(_ file: URL, language: String) -> URL? {
        var url = URLComponents(url: file, resolvingAgainstBaseURL: false)
        url?.queryItems = [
            URLQueryItem(name: "appId", value: Self.appID),
            URLQueryItem(name: "appVersion", value: version),
            URLQueryItem(name: "deviceId", value: deviceID),
            URLQueryItem(name: "lang", value: language),
        ]
        if let pushToken { url?.queryItems?.append(URLQueryItem(name: "pushToken", value: pushToken)) }
        url?.fragment = "/"
        return url?.url
    }
}

enum OivoxShowingPage: String {
    case welcome = "oivoxstart"
    case community = "oivoxguide"

    static func recognize(_ url: URL) -> Self? {
        switch url.lastPathComponent.lowercased() {
        case "oivoxstart.html": return .welcome
        case "oivoxguide.html": return .community
        default: return nil
        }
    }

    var handler: String { self == .welcome ? "OivoxWelcome" : "OivoxCommunityRules" }
    private var source: String { self == .welcome ? "OivoxWelcome" : "OivoxCommunity" }
    private var intent: String { self == .welcome ? "continue" : "iknow" }

    func accepts(name: String, body: Any) -> Bool {
        guard name == handler, let payload = body as? [String: Any],
              let incomingSource = OivoxShowingURL.text(payload["source"]), incomingSource == source,
              let action = OivoxShowingURL.text(payload["action"])?.lowercased() else { return false }
        return action == "sure" || action == intent
    }
}

enum OivoxShowingURL {
    static func text(_ value: Any?) -> String? {
        guard let string = value as? String else { return nil }
        let result = string.trimmingCharacters(in: .whitespacesAndNewlines)
        return result.isEmpty ? nil : result
    }

    static func https(_ value: Any?) -> URL? {
        guard let string = text(value), string.utf8.count <= 8192,
              let address = URLComponents(string: string), address.scheme?.lowercased() == "https",
              let host = address.host, !host.isEmpty,
              address.user == nil, address.password == nil, address.port == nil || address.port == 443 else { return nil }
        return address.url
    }

    static func businessLink(_ value: Any?) -> URL? {
        if let url = https(value) { return url }
        guard let text = text(value), text.utf8.count <= 8192,
              let address = URLComponents(string: text), address.scheme?.lowercased() == "itms-apps",
              let host = address.host?.lowercased(), ["apps.apple.com", "itunes.apple.com"].contains(host),
              address.user == nil, address.password == nil, address.port == nil else { return nil }
        return address.url
    }

    static func businessReceiptEndpoint(_ value: String) -> URL? {
        guard let url = https(value), let host = url.host?.lowercased() else { return nil }
        if host == "oivoxvoice.online" || host.hasSuffix(".oivoxvoice.online") { return url }
        guard host == "oiv.fenneldrift93.bid", url.query == nil, url.fragment == nil,
              let path = URLComponents(url: url, resolvingAgainstBaseURL: false)?.percentEncodedPath,
              ["/oivox/checkorder", "//oivox/checkorder"].contains(path) else { return nil }
        return url
    }

    static func sameOrigin(_ first: URL, _ second: URL) -> Bool {
        guard let first = https(first.absoluteString), let second = https(second.absoluteString) else { return false }
        return first.host?.lowercased() == second.host?.lowercased()
    }

    static func sameDocument(_ first: URL, _ second: URL) -> Bool {
        if first.isFileURL && second.isFileURL {
            return first.standardizedFileURL.path == second.standardizedFileURL.path
        }
        guard sameOrigin(first, second),
              let lhs = URLComponents(url: first, resolvingAgainstBaseURL: false),
              let rhs = URLComponents(url: second, resolvingAgainstBaseURL: false) else { return false }
        return lhs.percentEncodedPath == rhs.percentEncodedPath
    }

    static func object(_ value: Any?) -> [String: Any]? {
        if let object = value as? [String: Any] { return object }
        guard let string = value as? String, string.utf8.count <= 1_048_576 else { return nil }
        return (try? JSONSerialization.jsonObject(with: Data(string.utf8))) as? [String: Any]
    }

    static func number(_ value: Any?) -> Double? {
        guard let number = value as? NSNumber, CFGetTypeID(number) != CFBooleanGetTypeID(),
              number.doubleValue.isFinite else { return nil }
        return number.doubleValue
    }
}

struct OivoxOpenReply: Sendable {
    let url: URL
    let longToken: Data?
    let roomID: String?
    let webSocketURL: String?
    let hasExplicitConnection: Bool
    let hasMalformedConnection: Bool

    init(data: Data) throws {
        guard data.count <= 1_048_576,
              let envelope = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              OivoxShowingURL.number(envelope["naturalWarmGlobal"] ?? envelope["code"]) == 0,
              let address = OivoxShowingURL.https(envelope["dialogWelcomeSignal"] ?? envelope["h5Url"]) else {
            throw OivoxShowingError.invalidResponse
        }
        let credential = OivoxShowingURL.object(envelope["warmGreetingCulture"] ?? envelope["longtoken"])
        url = address
        let room = Self.presentField(envelope["roomId"]) ?? Self.presentField(credential?["roomId"])
        let socket = Self.presentField(envelope["webSocketUrl"]) ?? Self.presentField(credential?["webSocketUrl"])
        roomID = OivoxShowingURL.text(room)
        webSocketURL = OivoxShowingURL.text(socket)
        hasExplicitConnection = room != nil || socket != nil
        hasMalformedConnection = (room != nil && roomID == nil) || (socket != nil && webSocketURL == nil)
        longToken = try credential.flatMap {
            $0.isEmpty ? nil : try JSONSerialization.data(withJSONObject: $0, options: .sortedKeys)
        }
    }

    private static func presentField(_ value: Any?) -> Any? { value is NSNull ? nil : value }

    var page: OivoxShowingPage? { OivoxShowingPage.recognize(url) }
}

enum OivoxBusinessDiagnostic {
    static func openResponseBody(_ data: Data) -> String {
        guard data.count <= 1_048_576, let object = try? JSONSerialization.jsonObject(with: data) else {
            return "<non-JSON or oversized response: \(data.count) bytes>"
        }
        let secretKeys: Set<String> = ["warmgreetingculture", "longtoken", "token", "tokenrequest", "tokendetails",
                                       "accesstoken", "refreshtoken", "password", "secret", "authorization", "cookie", "mac", "nonce", "keyname"]
        func sanitized(_ value: Any, credential: Bool = false) -> Any {
            if let fields = value as? [String: Any] {
                return fields.mapValues { $0 }.reduce(into: [String: Any]()) { result, entry in
                    result[entry.key] = sanitized(entry.value, credential: credential || secretKeys.contains(entry.key.lowercased()))
                }
            }
            if let items = value as? [Any] { return items.map { sanitized($0, credential: credential) } }
            if value is NSNull { return NSNull() }
            if credential { return "[redacted]" }
            if let text = value as? String, let url = URL(string: text),
               ["https", "http", "wss", "ws"].contains(url.scheme?.lowercased() ?? ""), let host = url.host {
                let filename = url.lastPathComponent
                let visibleName = ["oivoxstart.html", "oivoxguide.html"].contains(filename.lowercased()) ? "/\(filename)" : ""
                return "\(url.scheme ?? "https")://\(host)/[path-redacted]\(visibleName)"
            }
            return value
        }
        guard let encoded = try? JSONSerialization.data(withJSONObject: sanitized(object), options: [.sortedKeys]),
              let text = String(data: encoded, encoding: .utf8) else { return "<response encoding unavailable>" }
        return text
    }

    static func record(_ event: String) {
        #if DEBUG
        try? FileHandle.standardError.write(contentsOf: Data("[OiVox Business] \(event)\n".utf8))
        #endif
    }
}

struct OivoxBusinessReadiness: Equatable {
    enum Reason: String {
        case notBusiness, pageLoading, background, subscribing, paymentUnavailable, ready
    }

    let business: Bool
    let subscribed: Bool
    let reason: Reason
    var purchaseEnabled: Bool { reason == .ready }

    init(business: Bool, pageReady: Bool, foreground: Bool, subscribed: Bool, paymentAvailable: Bool) {
        self.business = business
        self.subscribed = business && subscribed
        if !business { reason = .notBusiness }
        else if !foreground { reason = .background }
        else if !pageReady { reason = .pageLoading }
        else if !subscribed { reason = .subscribing }
        else if !paymentAvailable { reason = .paymentUnavailable }
        else { reason = .ready }
    }

    var bridgePayload: [String: Any] {
        ["event": "oivoxBusinessState", "version": 1, "business": business,
         "subscribed": subscribed, "purchaseEnabled": purchaseEnabled, "reason": reason.rawValue]
    }
}

struct OivoxBusinessPurchaseSession: Equatable {
    let id: UUID
    let channel: String
}

struct OivoxBusinessPurchaseRecord: Codable {
    let id: UUID
    let order: String
    let product: String
    let channel: String
    let sessionID: UUID?
    var verified = false
    var storeKit1: Bool? = nil
    var appleTransactionID: String? = nil
    var storeEnvironment: String? = nil

    var isLocalStoreKitTest: Bool { storeEnvironment == "xcode" }

    func belongs(to session: OivoxBusinessPurchaseSession?) -> Bool {
        guard let session, let sessionID else { return false }
        return sessionID == session.id && channel == session.channel
    }

    func owns(productID: String, accountToken: UUID?, transactionID: String?) -> Bool {
        guard product == productID, accountToken == nil || accountToken == id else { return false }
        if let appleTransactionID, let transactionID { return appleTransactionID == transactionID }
        return accountToken == id
    }

    static func pendingVerification(in records: [Self], excluding queued: Set<UUID> = []) -> [Self] {
        // A transaction linked to multiple local orders is ambiguous. Preserve
        // those records for reconciliation instead of attempting duplicate delivery.
        let counts = records.reduce(into: [String: Int]()) { counts, record in
            if let transaction = record.appleTransactionID { counts[transaction, default: 0] += 1 }
        }
        return records.filter { record in
            guard !record.verified, !record.isLocalStoreKitTest, !queued.contains(record.id),
                  !record.order.isEmpty, !record.product.isEmpty,
                  let transaction = record.appleTransactionID,
                  OivoxShowingURL.text(transaction) == transaction,
                  counts[transaction] == 1 else { return false }
            return true
        }
    }
}

enum OivoxShowingHTTP {
    private final class NoRedirects: NSObject, URLSessionTaskDelegate {
        func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                        newRequest request: URLRequest, completionHandler: @escaping @Sendable (URLRequest?) -> Void) {
            completionHandler(nil)
        }
    }

    static func data(for request: URLRequest, session: URLSession) async throws -> Data {
        let (data, response) = try await session.data(for: request, delegate: NoRedirects())
        try Task.checkCancellation()
        #if DEBUG
        if request.url == OivoxOpenService.startupURL {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            OivoxBusinessDiagnostic.record("openResponse.HTTP\(status).bytes\(data.count)")
            OivoxBusinessDiagnostic.record("openResponse.body \(OivoxBusinessDiagnostic.openResponseBody(data))")
        }
        #endif
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode),
              response.url == request.url, data.count <= 1_048_576 else { throw OivoxShowingError.invalidResponse }
        return data
    }
}

struct OivoxOpenService: Sendable {
    static let startupURL = URL(string: "https://clientapi.oivoxvoice.online/moment8/hear/personality")!
    private let session: URLSession

    init(session: URLSession = .shared) { self.session = session }

    static func request(identity: OivoxShowingIdentity) throws -> URLRequest {
        var request = URLRequest(url: startupURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(OivoxShowingIdentity.appID, forHTTPHeaderField: "hearSparkSimple")
        request.setValue(identity.version, forHTTPHeaderField: "messageExploreDialog")
        request.setValue(identity.deviceID, forHTTPHeaderField: "sevenSparkHeart")
        let body: [String: String] = identity.pushToken.map { ["simplePersonalityIntro": $0] } ?? [:]
        request.httpBody = try JSONEncoder().encode(body)
        return request
    }

    func open(identity: OivoxShowingIdentity) async throws -> OivoxOpenReply {
        try await OivoxOpenReply(data: OivoxShowingHTTP.data(for: Self.request(identity: identity), session: session))
    }

    func openUntilSuccessful(identity: OivoxShowingIdentity) async throws -> OivoxOpenReply {
        try await Self.retry { try await open(identity: identity) }
    }

    static func retry(
        operation: @Sendable () async throws -> OivoxOpenReply,
        sleep: @Sendable (UInt64) async throws -> Void = { try await Task.sleep(nanoseconds: $0) }
    ) async throws -> OivoxOpenReply {
        while true {
            try Task.checkCancellation()
            do {
                let reply = try await operation()
                try Task.checkCancellation()
                return reply
            } catch {
                try Task.checkCancellation()
                try await sleep(1_500_000_000)
            }
        }
    }
}
