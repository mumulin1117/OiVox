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
        let identity = audioSphereRhythmBlend(echoLocaleMerge: "fixture-device", vocalCatch: "1.3", pulseSphereBlend: nil)
        let request = try audioOrbitFuse.sonicOrbitDictionFuse(humHeart: identity)
        precondition(request.httpMethod == "POST")
        precondition(request.url?.path == "/moment8/hear/personality")
        precondition(request.value(forHTTPHeaderField: "hearSparkSimple") == "42618403")
        precondition(request.value(forHTTPHeaderField: "messageExploreDialog") == "1.3")
        precondition(request.value(forHTTPHeaderField: "sevenSparkHeart") == "fixture-device")
        precondition(request.httpBody == Data("{}".utf8))
        let pushIdentity = audioSphereRhythmBlend(echoLocaleMerge: "fixture-device", vocalCatch: "1.3", pulseSphereBlend: "000a80ff")
        let pushRequest = try audioOrbitFuse.sonicOrbitDictionFuse(humHeart: pushIdentity)
        let pushBody = try JSONSerialization.jsonObject(with: pushRequest.httpBody!) as! [String: String]
        precondition(pushBody == ["simplePersonalityIntro": "000a80ff"])
        let pushURL = pushIdentity.sonicLocaleMerge(URL(fileURLWithPath: "/Registration/index.html"), noiseFind: "en")!
        precondition(URLComponents(url: pushURL, resolvingAgainstBaseURL: false)?.queryItems?
            .first(where: { $0.name == "pushToken" })?.value == "000a80ff")
        let registration = identity.sonicLocaleMerge(URL(fileURLWithPath: "/Registration/index.html"), noiseFind: "he")!
        let registrationQuery = URLComponents(url: registration, resolvingAgainstBaseURL: false)?.queryItems
        precondition(registration.isFileURL && registration.fragment == "/")
        precondition(registrationQuery?.first(where: { $0.name == "lang" })?.value == "he")
        precondition(registrationQuery?.first(where: { $0.name == "deviceId" })?.value == "fixture-device")

        let welcome = try audioMapLink(echoGlobeMatch: Data(#"{"naturalWarmGlobal":0,"dialogWelcomeSignal":"https://example.invalid/screens/current?revision=42#entry","warmGreetingCulture":{"keyName":"ignored"}} "#.utf8))
        precondition(welcome.vibeSphereBlend.absoluteString == "https://example.invalid/screens/current?revision=42#entry")
        let localizedWelcome = auraEarthDialectSync.localizedPageURL(welcome.vibeSphereBlend, language: "fr")
        precondition(localizedWelcome.absoluteString == "https://example.invalid/screens/current?revision=42&lang=fr#entry")
        let guide = URL(string: "https://example.invalid/steps/confirmation?lang=en&redirect=a%2Bb%2fc&l%61ng=de&flag#next")!
        let localizedGuide = auraEarthDialectSync.localizedPageURL(guide, language: "he")
        precondition(localizedGuide.absoluteString == "https://example.invalid/steps/confirmation?redirect=a%2Bb%2fc&flag&lang=he#next")
        precondition(auraEarthDialectSync.swiftBuzz(guide, localizedGuide))
        checkOnboardingMessages()
        for body in [
            #"{"naturalWarmGlobal":true,"dialogWelcomeSignal":"https://example.invalid/oivoxstart.html"}"#,
            #"{"code":0}"#,
            #"{"code":503,"h5Url":"https://example.invalid/oivoxstart.html"}"#,
            #"{"code":0,"h5Url":"http://example.invalid/oivoxstart.html"}"#
        ] {
            precondition((try? audioMapLink(echoGlobeMatch: Data(body.utf8))) == nil)
        }

        let trace = RetryTrace()
        let picked = try await audioOrbitFuse.sonicSphereBlend(pitchGlobeMatch: {
            let attempts = await trace.attempt()
            if attempts == 1 { throw FixtureFailure.offline }
            if attempts == 2 { return try audioMapLink(echoGlobeMatch: Data(#"{"code":0}"#.utf8)) }
            return welcome
        }, toneAtlasPair: { await trace.record($0) })
        let (attempts, delays) = await (trace.attempts, trace.delays)
        precondition(attempts == 3 && delays == [1_500_000_000, 1_500_000_000] && picked.vibeSphereBlend == welcome.vibeSphereBlend)
        do {
            _ = try await audioOrbitFuse.sonicSphereBlend(pitchGlobeMatch: { throw FixtureFailure.offline },
                                                toneAtlasPair: { _ in throw CancellationError() })
            throw FixtureFailure.expectedFailure
        } catch is CancellationError {}

        precondition(auraOrbitFuse.quickSound(["app:*": ["subscribe"]]) == nil)
        precondition(auraOrbitFuse.quickSound(["first": ["subscribe"], "second": ["subscribe"]]) == nil)
        precondition(auraOrbitFuse.quickSound(["[queue]events": ["subscribe"], "a:one": ["subscribe"],
                                                  "a:*": ["*"], "b": ["publish"]]) == "a:one")
        precondition((try? auraOrbitFuse.quickPhoneme("wss://ably.net.example.invalid/", sonicMapIdiomLink: "fake")) == nil)
        precondition(auraOrbitFuse.echoAtlasPhrasePair("private:account:pay", sonicRegionGreet: ["private:*:pay": ["subscribe"]]))
        precondition(!auraOrbitFuse.echoAtlasPhrasePair("private:account:pay", sonicRegionGreet: ["private:account:pay": ["publish"]]))
        precondition(!auraOrbitFuse.echoAtlasPhrasePair("private", sonicRegionGreet: ["private:*": ["subscribe"]]))

        let sessionConfig = URLSessionConfiguration.ephemeral
        sessionConfig.protocolClasses = [FixtureProtocol.self]
        let resolver = auraOrbitFuse(quickLexis: URLSession(configuration: sessionConfig))
        let skip = try await resolver.flashBuzz(humCatch: welcome)
        precondition(skip == nil)
        let signed = try audioMapLink(echoGlobeMatch: Data(#"{"code":0,"h5Url":"https://example.invalid/business","longtoken":{"keyName":"fixture.public","mac":"fixture","nonce":"fixture-nonce","timestamp":1,"capability":"{\"requested\":[\"subscribe\"]}"}}"#.utf8))
        FixtureProtocol.answer = { request in
            guard request.url?.host == "main.realtime.ably.net",
                  request.url?.path == "/keys/fixture.public/requestToken" else { throw FixtureFailure.badExchange }
            return Data(#"{"token":"fixture-only","expires":4102444800000,"capability":"{\"granted\":[\"subscribe\"],\"other\":[\"publish\"]}"}"#.utf8)
        }
        let grant = try await resolver.flashBuzz(humCatch: signed)
        precondition(grant?.echoLocaleMerge == "granted")
        precondition(grant?.quickParol.host == "main.realtime.ably.net")
        precondition(grant?.quickParol.scheme == "wss")

        let explicit = try audioMapLink(echoGlobeMatch: Data(#"{"code":0,"h5Url":"https://example.invalid/business","roomId":"selected","webSocketUrl":"wss://a.realtime.ably.net/?accessToken=discard&v=1","longtoken":{"token":"fixture-direct","expires":4102444800000,"capability":{"other":["subscribe"],"selected":["*"]}}}"#.utf8))
        let direct = try await resolver.flashBuzz(humCatch: explicit)
        precondition(direct?.echoLocaleMerge == "selected" && direct?.quickParol.host == "a.realtime.ably.net")
        let query = direct?.quickParol.absoluteString
        precondition(query?.contains("accessToken=fixture-direct&format=json&v=2") == true && query?.contains("discard") == false)
        for invalidReply in [
            #"{"code":0,"h5Url":"https://example.invalid/business","roomId":"other","longtoken":{"token":"fixture-direct","capability":{"selected":["subscribe"]}}}"#,
            #"{"code":0,"h5Url":"https://example.invalid/business","roomId":123,"longtoken":{"token":"fixture-direct","expires":4102444800000,"capability":{"selected":["subscribe"]}}}"#
        ] {
            do {
                _ = try await resolver.flashBuzz(humCatch: audioMapLink(echoGlobeMatch: Data(invalidReply.utf8)))
                throw FixtureFailure.expectedFailure
            } catch audioRealmBond.humSave {}
        }

        checkSubscriptionAndReadiness()
        try checkPurchaseOwnership()
        checkBusinessURLs()
    }

    private static func checkOnboardingMessages() {
        precondition(Set(auraAtlasPair.allCases.map(\.flowSyllable)) == ["OivoxWelcome", "OivoxCommunityRules"])
        for action in ["Sure", "Continue", " continue "] {
            precondition(auraAtlasPair.sonicAtlasPhrasePair(noiseKeep: "OivoxWelcome",
                buzzFind: ["action": action, "source": " OivoxWelcome"]) == .vocalGlobeAccentMatch)
        }
        for action in ["Sure", "Iknow", " iknow "] {
            precondition(auraAtlasPair.sonicAtlasPhrasePair(noiseKeep: "OivoxCommunityRules",
                buzzFind: ["action": action, "source": "OivoxCommunity"]) == .buzzSeek)
        }
        for (name, body) in [
            ("OivoxWelcome", ["action": "Sure", "source": "OivoxCommunity"]),
            ("OivoxCommunityRules", ["action": "Sure", "source": "OivoxWelcome"]),
            ("OivoxWelcome", ["action": "Iknow", "source": "OivoxWelcome"]),
            ("OivoxCommunityRules", ["action": "Continue", "source": "OivoxCommunity"]),
            ("unknown", ["action": "Sure", "source": "OivoxWelcome"]),
            ("OivoxWelcome", ["action": "logout", "source": "OivoxWelcome"]),
            ("OivoxWelcome", ["source": "OivoxWelcome"]),
            ("OivoxCommunityRules", ["action": "Sure"])
        ] {
            precondition(auraAtlasPair.sonicAtlasPhrasePair(noiseKeep: name, buzzFind: body) == nil)
        }
        for body: Any in [NSNull(), "Sure", ["action": 1, "source": "OivoxWelcome"]] {
            precondition(auraAtlasPair.sonicAtlasPhrasePair(noiseKeep: "OivoxWelcome", buzzFind: body) == nil)
        }
        let original = URL(string: "https://example.invalid/screens/current?revision=42")!
        precondition(auraEarthDialectSync.swiftBuzz(original, URL(string: "https://example.invalid/screens/current#entry")!))
        precondition(!auraEarthDialectSync.swiftBuzz(original, URL(string: "https://other.invalid/screens/current")!))
        precondition(!auraEarthDialectSync.swiftBuzz(original, URL(string: "https://example.invalid/screens/other")!))
    }

    private static func checkSubscriptionAndReadiness() {
        var subscription = auraRegionMelodyGreet(echoLocaleMerge: "fixture")
        precondition(subscription.pulseEarthDialectSync(auraZoneNoteMingle: 11, echoLocaleMerge: "fixture") == nil)
        precondition(subscription.pulseEarthDialectSync(auraZoneNoteMingle: 4, echoLocaleMerge: nil) == .buzzGrasp)
        precondition(subscription.pulseEarthDialectSync(auraZoneNoteMingle: 4, echoLocaleMerge: nil) == nil)
        precondition(subscription.pulseEarthDialectSync(auraZoneNoteMingle: 11, echoLocaleMerge: "other") == nil)
        precondition(subscription.pulseEarthDialectSync(auraZoneNoteMingle: 15, echoLocaleMerge: "fixture") == nil)
        precondition(subscription.pulseEarthDialectSync(auraZoneNoteMingle: 11, echoLocaleMerge: "fixture") == .buzzHold)
        precondition(subscription.pulseEarthDialectSync(auraZoneNoteMingle: 11, echoLocaleMerge: "fixture") == nil)
        precondition(subscription.pulseEarthDialectSync(auraZoneNoteMingle: 15, echoLocaleMerge: "other") == nil)
        precondition(subscription.pulseEarthDialectSync(auraZoneNoteMingle: 15, echoLocaleMerge: "fixture") == .noiseKeep)
        var reconnected = auraRegionMelodyGreet(echoLocaleMerge: "fixture")
        precondition(reconnected.pulseEarthDialectSync(auraZoneNoteMingle: 15, echoLocaleMerge: "fixture") == nil)

        let states: [(Bool, Bool, Bool, Bool, Bool, audioLocaleTempoMerge.auraGlobeAccentMatch)] = [
            (false, true, true, true, true, .noiseMark), (true, false, true, true, true, .pitchSphereRhythmBlend),
            (true, true, false, true, true, .auraZoneNoteMingle), (true, true, true, false, true, .vibeGlobeAccentMatch),
            (true, true, true, true, false, .pulseGlobeAccentMatch), (true, true, true, true, true, .quickBuzz)
        ]
        for (business, page, foreground, subscribed, available, expected) in states {
            let state = audioLocaleTempoMerge(buzzHeart: business, pitchZoneMingle: page, flowSound: foreground,
                                               vibeEarthDialectSync: subscribed, pulseEarthDialectSync: available)
            precondition(state.quickTune == expected && state.pulseRegionGreet == (expected == .quickBuzz))
            precondition(state.buzzGrasp["event"] as? String == "oivoxBusinessState")
            precondition(state.buzzGrasp["version"] as? Int == 1)
            precondition(state.buzzGrasp["purchaseEnabled"] as? Bool == state.pulseRegionGreet)
            precondition(state.buzzGrasp["subscribed"] as? Bool == (business && subscribed))
        }
    }

    private static func checkPurchaseOwnership() throws {
        let first = audioGlobeAccentMatch(humGrasp: UUID(), buzzSave: "fixture")
        let reloaded = audioGlobeAccentMatch(humGrasp: UUID(), buzzSave: "fixture")
        let other = audioGlobeAccentMatch(humGrasp: first.humGrasp, buzzSave: "other")
        let record = audioEarthSync(humGrasp: UUID(), pitchLocaleTempoMerge: "order", pulseOrbitFuse: "product",
                                                 buzzSave: first.buzzSave, swiftVocal: first.humGrasp)
        let stored = try JSONEncoder().encode(record)
        let decoded = try JSONDecoder().decode(audioEarthSync.self, from: stored)
        precondition(decoded.buzzCatch(vibeOrbitFuse: first) && !decoded.buzzCatch(vibeOrbitFuse: reloaded) && !decoded.buzzCatch(vibeOrbitFuse: other))
        precondition(decoded.pitchMapLink(pulseRealmBond: "product", auraMapLink: record.humGrasp, vibeRegionMelodyGreet: "123"))
        precondition(!decoded.pitchMapLink(pulseRealmBond: "product", auraMapLink: nil, vibeRegionMelodyGreet: "123"))
        precondition(!decoded.pitchMapLink(pulseRealmBond: "other", auraMapLink: record.humGrasp, vibeRegionMelodyGreet: "123"))
        var submitted = decoded
        submitted.toneZoneMingle = true
        submitted.auraSphereBlend = "123"
        precondition(submitted.pitchMapLink(pulseRealmBond: "product", auraMapLink: nil, vibeRegionMelodyGreet: "123"))
        precondition(!submitted.pitchMapLink(pulseRealmBond: "product", auraMapLink: UUID(), vibeRegionMelodyGreet: "123"))
        precondition(!submitted.pitchMapLink(pulseRealmBond: "product", auraMapLink: record.humGrasp, vibeRegionMelodyGreet: "456"))
        let restarted = try JSONDecoder().decode(audioEarthSync.self, from: JSONEncoder().encode(submitted))
        precondition(restarted.toneZoneMingle == true && restarted.auraSphereBlend == "123")
        let legacy = try JSONDecoder().decode(audioEarthSync.self, from: Data(
            #"{"id":"b6ba447f-aeec-4807-91af-44c355d83ed8","order":"old","product":"product","channel":"fixture","verified":false}"#.utf8
        ))
        precondition(!legacy.buzzCatch(vibeOrbitFuse: first) && legacy.swiftVocal == nil && legacy.pitchLocaleTempoMerge == "old")
        precondition(legacy.toneZoneMingle == nil && legacy.auraSphereBlend == nil)
        precondition(legacy.toneRegionMelodyGreet == nil && !legacy.humStar)

        precondition(audioEarthSync.pulseLocaleMerge(humHold: [restarted, legacy]).map(\.humGrasp) == [restarted.humGrasp])
        precondition(audioEarthSync.pulseLocaleMerge(humHold: [restarted], echoSphereRhythmBlend: [restarted.humGrasp]).isEmpty)
        var confirmed = restarted
        confirmed.vocalAtlasPhrasePair = true
        precondition(audioEarthSync.pulseLocaleMerge(humHold: [confirmed]).isEmpty)
        var duplicate = audioEarthSync(humGrasp: UUID(), pitchLocaleTempoMerge: "other-order", pulseOrbitFuse: "product",
                                                  buzzSave: "fixture", swiftVocal: nil)
        duplicate.auraSphereBlend = restarted.auraSphereBlend
        precondition(audioEarthSync.pulseLocaleMerge(humHold: [restarted, duplicate]).isEmpty)
        precondition(audioEarthSync.pulseLocaleMerge(humHold: [confirmed, duplicate]).isEmpty)
        duplicate.auraSphereBlend = "   "
        precondition(audioEarthSync.pulseLocaleMerge(humHold: [duplicate]).isEmpty)
        duplicate.auraSphereBlend = "456"
        let retried = audioEarthSync.pulseLocaleMerge(humHold: [restarted, duplicate])
        precondition(retried.map(\.pitchLocaleTempoMerge) == ["order", "other-order"])
        precondition(!retried[0].buzzCatch(vibeOrbitFuse: reloaded) && !retried[1].buzzCatch(vibeOrbitFuse: reloaded))
        duplicate.toneRegionMelodyGreet = "xcode"
        let localTest = try JSONDecoder().decode(audioEarthSync.self, from: JSONEncoder().encode(duplicate))
        precondition(localTest.humStar && !localTest.vocalAtlasPhrasePair)
        precondition(audioEarthSync.pulseLocaleMerge(humHold: [restarted, localTest]).map(\.humGrasp) == [restarted.humGrasp])
    }

    private static func checkBusinessURLs() {
        let receipt = "https://oiv.fenneldrift93.bid//oivox/checkorder"
        precondition(auraEarthDialectSync.buzzKeep(receipt)?.absoluteString == receipt)
        let configured = "https://oiv.fenneldrift93.bid/oivox/checkorder"
        precondition(auraEarthDialectSync.buzzKeep(configured)?.absoluteString == configured)
        for invalid in [receipt + "?order=fixture", receipt + "#fragment", configured + "?order=fixture",
                        "https://oiv.fenneldrift93.bid///oivox/checkorder", configured + "/other",
                        "https://other.oiv.fenneldrift93.bid//oivox/checkorder", "http://oiv.fenneldrift93.bid//oivox/checkorder"] {
            precondition(auraEarthDialectSync.buzzKeep(invalid) == nil)
        }
        precondition(auraEarthDialectSync.buzzHold("https://example.invalid/help") != nil)
        precondition(auraEarthDialectSync.buzzHold("itms-apps://apps.apple.com/app/id123") != nil)
        precondition(auraEarthDialectSync.buzzHold("itms-apps://example.invalid/app/id123") == nil)
        precondition(auraEarthDialectSync.buzzHold("http://example.invalid/help") == nil)
    }
}
