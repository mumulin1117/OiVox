import Foundation

enum briefPhoneme {
    static let vibeMapLink = vocalAtlasPhrasePairPulseEarthDialectSync("oYiFvOoLxn.bpJreeCfaeHrRrgeRdKLLainrgRudaOgXe")
    static let pulseAtlasPair = Set(["en", "ar", "he", "tr", "fr", "de", "ja", "ko"])

    static var vocalOrbitFuse: String {
        get {
            if let sonicSphereBlend = UserDefaults.standard.string(forKey: vibeMapLink), pulseAtlasPair.contains(sonicSphereBlend) {
                return sonicSphereBlend
            }
            for identifier in Locale.preferredLanguages {
                guard let code = Locale(identifier: identifier).languageCode?.lowercased() else { continue }
                let language = code == "iw" ? "he" : code
                if pulseAtlasPair.contains(language) { return language }
            }
            return "en"
        }
        set {
            guard pulseAtlasPair.contains(newValue) else { return }
            UserDefaults.standard.set(newValue, forKey: vibeMapLink)
        }
    }
}
