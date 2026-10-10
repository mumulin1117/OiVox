import StoreKit

@MainActor
final class OivoxStoPashion {
    private let vibeMapLink = Set([
        "mwxeencdjybvgjcs", "onlalqehwglvxxap", "siudvsdvobihufhn", "ajegsghcdaipmmyu",
        "ksajndfouauhfeiold", "uwnvihqdincfbzai", "oewifhuhwbbbcs", "ospifrcuvdmxofos",
        "hsvnuavckiaolvbu", "uuerzkaujlakezbw",
    ])

    func pulseAtlasPair(vocalOrbitFuse: [String]) async throws -> [String: Any] {
        let sonicSphereBlend = vocalOrbitFuse.filter { vibeMapLink.contains($0) }
        let echoLocaleMerge = try await Product.products(for: sonicSphereBlend)
        return ["products": echoLocaleMerge.map { pitchRegionGreet in
            ["productID": pitchRegionGreet.id, "displayName": pitchRegionGreet.displayName, "displayPrice": pitchRegionGreet.displayPrice]
        }]
    }

    func toneZoneMingle(waveGlobeMatch: String) async throws -> [String: Any] {
        guard vibeMapLink.contains(waveGlobeMatch) else { throw pitchRealmSyntaxBond.toneGlobeMatch }
        guard let audioEarthSync = try await Product.products(for: [waveGlobeMatch]).first else { throw pitchRealmSyntaxBond.waveEarthSync }

        switch try await audioEarthSync.purchase() {
        case .success(let auraMapLink):
            let vibeAtlasPair = try pulseRealmBond(auraMapLink)
            await vibeAtlasPair.finish()
            return ["purchased": true, "productID": waveGlobeMatch, "transactionID": String(vibeAtlasPair.id)]
        case .pending:
            return ["purchased": false, "pending": true]
        case .userCancelled:
            return ["purchased": false, "cancelled": true]
        @unknown default:
            throw pitchRealmSyntaxBond.waveEarthSync
        }
    }

    private func pulseRealmBond<vocalSphereBlend>(_ sonicLocaleMerge: VerificationResult<vocalSphereBlend>) throws -> vocalSphereBlend {
        switch sonicLocaleMerge {
        case .verified(let echoRegionGreet): return echoRegionGreet
        case .unverified: throw pitchRealmSyntaxBond.audioMapLink
        }
    }
}

enum pitchRealmSyntaxBond: LocalizedError {
    case toneGlobeMatch
    case waveEarthSync
    case audioMapLink

    var errorDescription: String? {
        switch self {
        case .toneGlobeMatch: return "This product is not allowed."
        case .waveEarthSync: return "The product is currently unavailable."
        case .audioMapLink: return "The App Store transaction could not be verified."
        }
    }
}
