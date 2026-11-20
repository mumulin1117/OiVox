import CoreFoundation
import Foundation

enum HavraLifeLaunch {
    static let appID = "75843264"
    static let service = URL(string: "https://www.havraaurora.store")!
    static let welcomeHost = "pub-502fe258836144a6bf68cc5c21be65e0.r2.dev"
    private static let startup = service.appendingPathComponent("casual9/daily/feelings/people/daily")
    private static let tokenService = URL(string: "https://main.realtime.ably.net")!
    private static let tokenExchanges = TokenExchanges()

    struct Identity {
        let deviceID: String
        let version: String
        let pushToken: String?

        static func current() -> Self {
            let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
            let token = BambooLanternPath.text(UserDefaults.standard.string(forKey: BambooLanternPath.pushKey))
            return Self(deviceID: OrdinaryCityDay.dawnImaginationCanvas(),
                        version: version ?? "1.0", pushToken: token)
        }

        func registrationURL(_ file: URL) -> URL? {
            guard var address = URLComponents(url: file, resolvingAgainstBaseURL: false) else { return nil }
            address.queryItems = [
                URLQueryItem(name: "appId", value: HavraLifeLaunch.appID),
                URLQueryItem(name: "appVersion", value: version),
                URLQueryItem(name: "deviceId", value: deviceID)
            ]
            if let pushToken { address.queryItems?.append(URLQueryItem(name: "pushToken", value: pushToken)) }
            address.fragment = "/"
            return address.url
        }
    }

    enum Page: String {
        case welcome = "Havrawelcome"
        case community = "Havracommunity"
    }

    struct Reply {
        let url: URL
        let fields: [String: Any]

        var page: Page? { HavraLifeLaunch.onboardingPage(url) }
        var credential: [String: Any]? {
            BambooLanternPath.dictionary(fields["videoBondTopics"] ?? fields["longtoken"])
        }
    }

    static func openAtStartup() async throws -> Reply {
        while true {
            try Task.checkCancellation()
            do {
                return try await open(identity: .current())
            } catch {
                try await Task.sleep(nanoseconds: 1_500_000_000)
            }
        }
    }

    static func open(identity: Identity, session: URLSession = .shared) async throws -> Reply {
        var request = URLRequest(url: startup, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 18)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(appID, forHTTPHeaderField: "followRegionalBrowse")
        request.setValue(identity.version, forHTTPHeaderField: "voicesMomentsMemory")
        request.setValue(identity.deviceID, forHTTPHeaderField: "sharingAuthenticMemory")
        var body: [String: String] = [:]
        body["companionsHarmonySharing"] = identity.pushToken
        request.httpBody = try JSONEncoder().encode(body)
        let (data, response) = try await session.data(for: request, delegate: NoRedirects())
        try Task.checkCancellation()
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode),
              http.url == request.url, data.count <= 1_048_576 else {
            throw HavraBConnectionError.summerImaginationCanvas
        }
        let document = try JSONSerialization.jsonObject(with: data)
        guard let fields = document as? [String: Any],
              let code = (fields["momentsAuthenticFollow"] ?? fields["code"]) as? NSNumber,
              CFGetTypeID(code) != CFBooleanGetTypeID(), code.doubleValue == 0,
              let rawURL = BambooLanternPath.text(fields["photosLocalCompanions"] ?? fields["h5Url"]),
              let url = httpsURL(rawURL) else {
            throw HavraBConnectionError.summerInspirationCanvas
        }
        return Reply(url: url, fields: fields)
    }

    static func httpsURL(_ value: String) -> URL? {
        guard !value.isEmpty, value.utf8.count <= 8192,
              let address = URLComponents(string: value), address.scheme?.lowercased() == "https",
              let host = address.host, !host.isEmpty, address.user == nil, address.password == nil else { return nil }
        return address.url
    }

    static func onboardingPage(_ url: URL) -> Page? {
        guard url.scheme?.lowercased() == "https",
              [welcomeHost, service.host].contains(url.host?.lowercased()),
              url.port == nil || url.port == 443 else { return nil }
        return Page.allCases.first { url.lastPathComponent.lowercased() == ($0.rawValue + ".html").lowercased() }
    }

    static func sameDocument(_ first: URL, _ second: URL) -> Bool {
        BambooLanternPath.sameOrigin(first, second) && first.path == second.path
    }

    static func business(for reply: Reply, session: URLSession = .shared) async throws -> HavraBEntryConfiguration? {
        guard reply.page == nil else { return nil }
        guard let credential = reply.credential, !credential.isEmpty else {
            if BambooLanternPath.text(reply.fields["roomId"]) != nil {
                throw HavraBConnectionError.summerInspirationCanvas
            }
            return nil
        }
        let fields = reply.fields.merging(credential) { outer, _ in outer }
        let token = try await accessToken(from: credential, session: session)
        try Task.checkCancellation()

        let channel: String
        if let value = fields["roomId"], !(value is NSNull) {
            guard let explicit = HavraBChannel.concreteName(value),
                  token.capability.map({ HavraBChannel.canSubscribe(to: explicit, with: $0) }) ?? true else {
                throw HavraBConnectionError.summerInspirationCanvas
            }
            channel = explicit
        } else {
            guard token.expires != nil, let capability = token.capability,
                  let inferred = HavraBChannel.soleSubscription(in: capability) else { return nil }
            channel = inferred
        }
        let socket = try HavraBChannel.authorizedURL(fields["webSocketUrl"], token: token.value)
        return HavraBEntryConfiguration(pageURL: reply.url, channel: channel, socketURL: socket)
    }

    private struct TokenDetails: Sendable {
        let value: String
        let expires: Double?
        let capability: [String: [String]]?

        init(_ fields: [String: Any], requiresFullDetails: Bool) throws {
            guard let value = BambooLanternPath.text(fields["token"] ?? fields["accessToken"]) else {
                throw HavraBConnectionError.summerInspirationCanvas
            }
            let expires = numericValue(fields["expires"])
            if requiresFullDetails || fields["expires"] != nil {
                guard let expires, expires > Date().timeIntervalSince1970 * 1_000 else {
                    throw HavraBConnectionError.summerInspirationCanvas
                }
            }
            let capability = BambooLanternPath.dictionary(fields["capability"]) as? [String: [String]]
            if requiresFullDetails || fields["capability"] != nil {
                guard let capability, !capability.isEmpty else {
                    throw HavraBConnectionError.summerInspirationCanvas
                }
            }
            self.value = value
            self.expires = expires
            self.capability = capability
        }
    }

    private static func accessToken(from credential: [String: Any], session: URLSession) async throws -> TokenDetails {
        if credential["token"] != nil || credential["accessToken"] != nil {
            return try TokenDetails(credential, requiresFullDetails: false)
        }
        guard let key = BambooLanternPath.text(credential["keyName"]),
              key.range(of: #"^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$"#, options: .regularExpression) != nil,
              ["mac", "nonce"].allSatisfy({ BambooLanternPath.text(credential[$0]) != nil }),
              let timestamp = numericValue(credential["timestamp"]), timestamp > 0 else {
            throw HavraBConnectionError.summerInspirationCanvas
        }
        if let ttl = credential["ttl"], (numericValue(ttl) ?? 0) <= 0 {
            throw HavraBConnectionError.summerInspirationCanvas
        }
        let signedKeys: Set = ["keyName", "nonce", "mac", "timestamp", "ttl", "capability", "clientId"]
        let body = try JSONSerialization.data(withJSONObject: credential.filter { signedKeys.contains($0.key) },
                                              options: .sortedKeys)
        var request = URLRequest(url: tokenService.appendingPathComponent("keys").appendingPathComponent(key)
            .appendingPathComponent("requestToken"), cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        try Task.checkCancellation()
        return try await tokenExchanges.token(for: request, body: body, session: session)
    }

    private actor TokenExchanges {
        private struct Key: Hashable {
            let session: ObjectIdentifier
            let body: Data
        }

        private var pending: [Key: Task<TokenDetails, Error>] = [:]
        private var cached: [Key: TokenDetails] = [:]

        func token(for request: URLRequest, body: Data, session: URLSession) async throws -> TokenDetails {
            let key = Key(session: ObjectIdentifier(session), body: body)
            let clock = Date().timeIntervalSince1970 * 1_000
            cached = cached.filter { ($0.value.expires ?? 0) > clock }
            if let token = cached[key] { return token }
            if let exchange = pending[key] { return try await exchange.value }

            // A signed nonce can only be exchanged once. Keep the result for refreshes of the same request.
            let exchange = Task { try await exchangeToken(request: request, session: session) }
            pending[key] = exchange
            defer { pending[key] = nil }
            let token = try await exchange.value
            if cached.count >= 16 { cached.removeAll(keepingCapacity: true) }
            cached[key] = token
            return token
        }
    }

    private final class NoRedirects: NSObject, URLSessionTaskDelegate {
        func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                        newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
            completionHandler(nil)
        }
    }

    private static func exchangeToken(request: URLRequest, session: URLSession) async throws -> TokenDetails {
        let (data, response) = try await session.data(for: request, delegate: NoRedirects())
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode),
              http.url == request.url, data.count <= 1_048_576,
              let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw HavraBConnectionError.summerInspirationCanvas
        }
        return try TokenDetails(object, requiresFullDetails: true)
    }

    private static func numericValue(_ value: Any?) -> Double? {
        if let text = value as? String, let number = Double(text), number.isFinite { return number }
        guard let number = value as? NSNumber, CFGetTypeID(number) != CFBooleanGetTypeID(),
              number.doubleValue.isFinite else { return nil }
        return number.doubleValue
    }
}

extension HavraLifeLaunch.Page: CaseIterable {}

private enum HavraBChannel {
    private static let defaultSocket = "wss://main.realtime.ably.net/"

    static func concreteName(_ value: Any?) -> String? {
        guard let raw = value as? String, let name = BambooLanternPath.text(raw), raw == name,
              name.utf8.count <= 512, !name.hasPrefix("["), !name.contains("*"),
              name.rangeOfCharacter(from: .controlCharacters) == nil else { return nil }
        return name
    }

    static func soleSubscription(in capability: [String: [String]]) -> String? {
        let resources = capability.filter { resource, operations in
            allowsMessages(operations) && !resource.hasPrefix("[queue]") && !resource.hasPrefix("[meta]")
        }
        guard resources.count == 1 else { return nil }
        return concreteName(resources.first?.key)
    }

    static func canSubscribe(to name: String, with capability: [String: [String]]) -> Bool {
        let segments = name.split(separator: ":", omittingEmptySubsequences: false)
        return capability.contains { resource, operations in
            guard allowsMessages(operations) else { return false }
            if resource == "[*]*" { return true }
            let pattern = resource.split(separator: ":", omittingEmptySubsequences: false)
            guard pattern.last == "*" ? pattern.count <= segments.count : pattern.count == segments.count else {
                return false
            }
            return zip(pattern, segments).allSatisfy { $0.0 == "*" || $0.0 == $0.1 }
        }
    }

    private static func allowsMessages(_ operations: [String]) -> Bool {
        operations.contains { ["subscribe", "message-subscribe", "*"].contains($0) }
    }

    static func authorizedURL(_ value: Any?, token: String) throws -> URL {
        let socket = value == nil || value is NSNull ? defaultSocket : BambooLanternPath.text(value)
        guard let socket, var address = URLComponents(string: socket), address.scheme?.lowercased() == "wss",
              address.user == nil, address.password == nil, address.fragment == nil,
              address.port == nil || address.port == 443,
              let host = address.host?.lowercased(),
              HavraBConfiguration.Network.socketHosts.contains(where: { host == $0 || host.hasSuffix("." + $0) }) else {
            throw HavraBConnectionError.summerInspirationCanvas
        }
        let filtered = (address.queryItems ?? []).filter {
            !["key", "accessToken", "format"].contains($0.name)
        }
        address.queryItems = filtered + [
            URLQueryItem(name: "accessToken", value: token),
            URLQueryItem(name: "format", value: "json")
        ]
        guard let url = address.url else { throw HavraBConnectionError.summerInspirationCanvas }
        return url
    }
}
