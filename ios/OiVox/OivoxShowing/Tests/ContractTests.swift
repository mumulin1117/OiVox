import Foundation

private enum FixtureFailure: Error { case offline, expectedFailure, badExchange }

private final class FixtureProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var answer: ((URLRequest) throws -> Data)?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        do {
            guard let data = try Self.answer?(request) else { throw FixtureFailure.offline }
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil,
                                           headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }
    override func stopLoading() {}
}

private actor RetryTrace {
    var attempts = 0
    var delays: [UInt64] = []
    func attempt() -> Int {
        attempts += 1
        return attempts
    }
    func record(_ delay: UInt64) { delays.append(delay) }
}

@main
struct OivoxShowingContractTests {
    static func main() async throws {
        let diagnosticInput = Data(#"{"naturalWarmGlobal":0,"dialogWelcomeSignal":"https://example.invalid/private/account/oivoxguide.html?token=destination-secret","warmGreetingCulture":{"token":"credential-secret","nested":[{"mac":"signature-secret"}]},"message":"ok"}"#.utf8)
        let diagnostic = OivoxBusinessDiagnostic.openResponseBody(diagnosticInput)
        precondition(!diagnostic.contains("destination-secret") && !diagnostic.contains("credential-secret"))
        precondition(!diagnostic.contains("signature-secret") && !diagnostic.contains("private/account"))
        let safeObject = try JSONSerialization.jsonObject(with: Data(diagnostic.utf8)) as! [String: Any]
        precondition(safeObject["naturalWarmGlobal"] as? Int == 0 && safeObject["message"] as? String == "ok")
        precondition(OivoxBusinessDiagnostic.openResponseBody(Data("not JSON".utf8)).contains("non-JSON"))
        let identity = OivoxShowingIdentity(deviceID: "fixture-device", version: "1.3", pushToken: nil)
        let request = try OivoxOpenService.request(identity: identity)
        precondition(request.httpMethod == "POST")
        precondition(request.url?.path == "/moment8/hear/personality")
        precondition(request.value(forHTTPHeaderField: "hearSparkSimple") == "42618403")
        precondition(request.value(forHTTPHeaderField: "messageExploreDialog") == "1.3")
        precondition(request.value(forHTTPHeaderField: "sevenSparkHeart") == "fixture-device")
        precondition(request.httpBody == Data("{}".utf8))
        let registration = identity.registrationURL(URL(fileURLWithPath: "/Registration/index.html"), language: "he")!
        let registrationQuery = URLComponents(url: registration, resolvingAgainstBaseURL: false)?.queryItems
        precondition(registration.isFileURL && registration.fragment == "/")
        precondition(registrationQuery?.first(where: { $0.name == "lang" })?.value == "he")
        precondition(registrationQuery?.first(where: { $0.name == "deviceId" })?.value == "fixture-device")

        let welcome = try OivoxOpenReply(data: Data(#"{"naturalWarmGlobal":0,"dialogWelcomeSignal":"https://example.invalid/path/oivoxstart.html","warmGreetingCulture":{"keyName":"ignored"}} "#.utf8))
        precondition(welcome.page == .welcome)
        precondition(OivoxShowingPage.welcome.accepts(name: "OivoxWelcome", body: ["action": "Sure", "source": " OivoxWelcome"]))
        precondition(OivoxShowingPage.community.accepts(name: "OivoxCommunityRules", body: ["action": "Iknow", "source": "OivoxCommunity"]))
        precondition(!OivoxShowingPage.community.accepts(name: "OivoxWelcome", body: ["action": "Sure", "source": "OivoxCommunity"]))
        for body in [
            #"{"naturalWarmGlobal":true,"dialogWelcomeSignal":"https://example.invalid/oivoxstart.html"}"#,
            #"{"code":0}"#,
            #"{"code":503,"h5Url":"https://example.invalid/oivoxstart.html"}"#,
            #"{"code":0,"h5Url":"http://example.invalid/oivoxstart.html"}"#
        ] {
            precondition((try? OivoxOpenReply(data: Data(body.utf8))) == nil)
        }

        let trace = RetryTrace()
        let picked = try await OivoxOpenService.retry(operation: {
            let attempts = await trace.attempt()
            if attempts == 1 { throw FixtureFailure.offline }
            if attempts == 2 { return try OivoxOpenReply(data: Data(#"{"code":0}"#.utf8)) }
            return welcome
        }, sleep: { await trace.record($0) })
        let (attempts, delays) = await (trace.attempts, trace.delays)
        precondition(attempts == 3 && delays == [1_500_000_000, 1_500_000_000] && picked.page == .welcome)
        do {
            _ = try await OivoxOpenService.retry(operation: { throw FixtureFailure.offline },
                                                sleep: { _ in throw CancellationError() })
            throw FixtureFailure.expectedFailure
        } catch is CancellationError {}

        precondition(OivoxAblyResolver.soleChannel(["app:*": ["subscribe"]]) == nil)
        precondition(OivoxAblyResolver.soleChannel(["first": ["subscribe"], "second": ["subscribe"]]) == nil)
        precondition(OivoxAblyResolver.soleChannel(["[queue]events": ["subscribe"], "a:one": ["subscribe"],
                                                  "a:*": ["*"], "b": ["publish"]]) == "a:one")
        precondition((try? OivoxAblyResolver.socketURL("wss://ably.net.example.invalid/", token: "fake")) == nil)
        precondition(OivoxAblyResolver.canSubscribe("private:account:pay", with: ["private:*:pay": ["subscribe"]]))
        precondition(!OivoxAblyResolver.canSubscribe("private:account:pay", with: ["private:account:pay": ["publish"]]))
        precondition(!OivoxAblyResolver.canSubscribe("private", with: ["private:*": ["subscribe"]]))

        let sessionConfig = URLSessionConfiguration.ephemeral
        sessionConfig.protocolClasses = [FixtureProtocol.self]
        let resolver = OivoxAblyResolver(session: URLSession(configuration: sessionConfig))
        let skip = try await resolver.connection(for: welcome)
        precondition(skip == nil)
        let signed = try OivoxOpenReply(data: Data(#"{"code":0,"h5Url":"https://example.invalid/business","longtoken":{"keyName":"fixture.public","mac":"fixture","nonce":"fixture-nonce","timestamp":1,"capability":"{\"requested\":[\"subscribe\"]}"}}"#.utf8))
        FixtureProtocol.answer = { request in
            guard request.url?.host == "main.realtime.ably.net",
                  request.url?.path == "/keys/fixture.public/requestToken" else { throw FixtureFailure.badExchange }
            return Data(#"{"token":"fixture-only","expires":4102444800000,"capability":"{\"granted\":[\"subscribe\"],\"other\":[\"publish\"]}"}"#.utf8)
        }
        let grant = try await resolver.connection(for: signed)
        precondition(grant?.channel == "granted")
        precondition(grant?.socket.host == "main.realtime.ably.net")
        precondition(grant?.socket.scheme == "wss")

        let explicit = try OivoxOpenReply(data: Data(#"{"code":0,"h5Url":"https://example.invalid/business","roomId":"selected","webSocketUrl":"wss://a.realtime.ably.net/?accessToken=discard&v=1","longtoken":{"token":"fixture-direct","expires":4102444800000,"capability":{"other":["subscribe"],"selected":["*"]}}}"#.utf8))
        let direct = try await resolver.connection(for: explicit)
        precondition(direct?.channel == "selected" && direct?.socket.host == "a.realtime.ably.net")
        let query = direct?.socket.absoluteString
        precondition(query?.contains("accessToken=fixture-direct&format=json&v=2") == true && query?.contains("discard") == false)
        for invalidReply in [
            #"{"code":0,"h5Url":"https://example.invalid/business","roomId":"other","longtoken":{"token":"fixture-direct","capability":{"selected":["subscribe"]}}}"#,
            #"{"code":0,"h5Url":"https://example.invalid/business","roomId":123,"longtoken":{"token":"fixture-direct","expires":4102444800000,"capability":{"selected":["subscribe"]}}}"#
        ] {
            do {
                _ = try await resolver.connection(for: OivoxOpenReply(data: Data(invalidReply.utf8)))
                throw FixtureFailure.expectedFailure
            } catch OivoxShowingError.invalidConnection {}
        }

        checkSubscriptionAndReadiness()
        try checkPurchaseOwnership()
        checkBusinessURLs()
        print("Open retry and page routing, Ably grants and handshake, WebView readiness, and purchase ownership passed")
    }

    private static func checkSubscriptionAndReadiness() {
        var subscription = OivoxBusinessSubscription(channel: "fixture")
        precondition(subscription.receive(action: 11, channel: "fixture") == nil)
        precondition(subscription.receive(action: 4, channel: nil) == .attach)
        precondition(subscription.receive(action: 4, channel: nil) == nil)
        precondition(subscription.receive(action: 11, channel: "other") == nil)
        precondition(subscription.receive(action: 15, channel: "fixture") == nil)
        precondition(subscription.receive(action: 11, channel: "fixture") == .attached)
        precondition(subscription.receive(action: 11, channel: "fixture") == nil)
        precondition(subscription.receive(action: 15, channel: "other") == nil)
        precondition(subscription.receive(action: 15, channel: "fixture") == .messages)
        var reconnected = OivoxBusinessSubscription(channel: "fixture")
        precondition(reconnected.receive(action: 15, channel: "fixture") == nil)

        let states: [(Bool, Bool, Bool, Bool, Bool, OivoxBusinessReadiness.Reason)] = [
            (false, true, true, true, true, .notBusiness), (true, false, true, true, true, .pageLoading),
            (true, true, false, true, true, .background), (true, true, true, false, true, .subscribing),
            (true, true, true, true, false, .paymentUnavailable), (true, true, true, true, true, .ready)
        ]
        for (business, page, foreground, subscribed, available, expected) in states {
            let state = OivoxBusinessReadiness(business: business, pageReady: page, foreground: foreground,
                                               subscribed: subscribed, paymentAvailable: available)
            precondition(state.reason == expected && state.purchaseEnabled == (expected == .ready))
            precondition(state.bridgePayload["event"] as? String == "oivoxBusinessState")
            precondition(state.bridgePayload["version"] as? Int == 1)
            precondition(state.bridgePayload["purchaseEnabled"] as? Bool == state.purchaseEnabled)
            precondition(state.bridgePayload["subscribed"] as? Bool == (business && subscribed))
        }
    }

    private static func checkPurchaseOwnership() throws {
        let first = OivoxBusinessPurchaseSession(id: UUID(), channel: "fixture")
        let reloaded = OivoxBusinessPurchaseSession(id: UUID(), channel: "fixture")
        let other = OivoxBusinessPurchaseSession(id: first.id, channel: "other")
        let record = OivoxBusinessPurchaseRecord(id: UUID(), order: "order", product: "product",
                                                 channel: first.channel, sessionID: first.id)
        let stored = try JSONEncoder().encode(record)
        let decoded = try JSONDecoder().decode(OivoxBusinessPurchaseRecord.self, from: stored)
        precondition(decoded.belongs(to: first) && !decoded.belongs(to: reloaded) && !decoded.belongs(to: other))
        precondition(decoded.owns(productID: "product", accountToken: record.id, transactionID: "123"))
        precondition(!decoded.owns(productID: "product", accountToken: nil, transactionID: "123"))
        precondition(!decoded.owns(productID: "other", accountToken: record.id, transactionID: "123"))
        var submitted = decoded
        submitted.storeKit1 = true
        submitted.appleTransactionID = "123"
        precondition(submitted.owns(productID: "product", accountToken: nil, transactionID: "123"))
        precondition(!submitted.owns(productID: "product", accountToken: UUID(), transactionID: "123"))
        precondition(!submitted.owns(productID: "product", accountToken: record.id, transactionID: "456"))
        let restarted = try JSONDecoder().decode(OivoxBusinessPurchaseRecord.self, from: JSONEncoder().encode(submitted))
        precondition(restarted.storeKit1 == true && restarted.appleTransactionID == "123")
        let legacy = try JSONDecoder().decode(OivoxBusinessPurchaseRecord.self, from: Data(
            #"{"id":"b6ba447f-aeec-4807-91af-44c355d83ed8","order":"old","product":"product","channel":"fixture","verified":false}"#.utf8
        ))
        precondition(!legacy.belongs(to: first) && legacy.sessionID == nil && legacy.order == "old")
        precondition(legacy.storeKit1 == nil && legacy.appleTransactionID == nil)
        precondition(legacy.storeEnvironment == nil && !legacy.isLocalStoreKitTest)

        // An empty StoreKit queue must not strand a durable, unverified order.
        precondition(OivoxBusinessPurchaseRecord.pendingVerification(in: [restarted, legacy]).map(\.id) == [restarted.id])
        precondition(OivoxBusinessPurchaseRecord.pendingVerification(in: [restarted], excluding: [restarted.id]).isEmpty)
        var confirmed = restarted
        confirmed.verified = true
        precondition(OivoxBusinessPurchaseRecord.pendingVerification(in: [confirmed]).isEmpty)
        var duplicate = OivoxBusinessPurchaseRecord(id: UUID(), order: "other-order", product: "product",
                                                  channel: "fixture", sessionID: nil)
        duplicate.appleTransactionID = restarted.appleTransactionID
        precondition(OivoxBusinessPurchaseRecord.pendingVerification(in: [restarted, duplicate]).isEmpty)
        precondition(OivoxBusinessPurchaseRecord.pendingVerification(in: [confirmed, duplicate]).isEmpty)
        duplicate.appleTransactionID = "   "
        precondition(OivoxBusinessPurchaseRecord.pendingVerification(in: [duplicate]).isEmpty)
        duplicate.appleTransactionID = "456"
        let retried = OivoxBusinessPurchaseRecord.pendingVerification(in: [restarted, duplicate])
        precondition(retried.map(\.order) == ["order", "other-order"])
        precondition(!retried[0].belongs(to: reloaded) && !retried[1].belongs(to: reloaded))
        duplicate.storeEnvironment = "xcode"
        let localTest = try JSONDecoder().decode(OivoxBusinessPurchaseRecord.self, from: JSONEncoder().encode(duplicate))
        precondition(localTest.isLocalStoreKitTest && !localTest.verified)
        precondition(OivoxBusinessPurchaseRecord.pendingVerification(in: [restarted, localTest]).map(\.id) == [restarted.id])
    }

    private static func checkBusinessURLs() {
        let receipt = "https://oiv.fenneldrift93.bid//oivox/checkorder"
        precondition(OivoxShowingURL.businessReceiptEndpoint(receipt)?.absoluteString == receipt)
        let configured = "https://oiv.fenneldrift93.bid/oivox/checkorder"
        precondition(OivoxShowingURL.businessReceiptEndpoint(configured)?.absoluteString == configured)
        for invalid in [receipt + "?order=fixture", receipt + "#fragment", configured + "?order=fixture",
                        "https://oiv.fenneldrift93.bid///oivox/checkorder", configured + "/other",
                        "https://other.oiv.fenneldrift93.bid//oivox/checkorder", "http://oiv.fenneldrift93.bid//oivox/checkorder"] {
            precondition(OivoxShowingURL.businessReceiptEndpoint(invalid) == nil)
        }
        precondition(OivoxShowingURL.businessLink("https://example.invalid/help") != nil)
        precondition(OivoxShowingURL.businessLink("itms-apps://apps.apple.com/app/id123") != nil)
        precondition(OivoxShowingURL.businessLink("itms-apps://example.invalid/app/id123") == nil)
        precondition(OivoxShowingURL.businessLink("http://example.invalid/help") == nil)
    }
}
