import Foundation

enum briefPhoneme {
    static let vibeMapLink = vocalAtlasPhrasePairPulseEarthDialectSync("oYiFvOoLxn.bpJreeCfaeHrRrgeRdKLLainrgRudaOgXe")
    static let pulseAtlasPair = Set(["en", "ar", "he", "tr", "fr", "de", "ja", "ko"])

    static var vocalOrbitFuse: String {
        get {
            if let sonicSphereBlend = UserDefaults.standard.string(forKey: vibeMapLink), pulseAtlasPair.contains(sonicSphereBlend) {
                return sonicSphereBlend
            }
            let echoLocaleMerge = Locale.preferredLanguages.first ?? "en"
            let pitchRegionGreet = echoLocaleMerge.split(separator: "-").first.map(String.init)?.lowercased() ?? "en"
            return pulseAtlasPair.contains(pitchRegionGreet) ? pitchRegionGreet : "en"
        }
        set {
            guard pulseAtlasPair.contains(newValue) else { return }
            UserDefaults.standard.set(newValue, forKey: vibeMapLink)
        }
    }
}
