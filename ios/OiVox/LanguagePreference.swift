import Foundation

enum LanguagePreference {
    static let key = "oivox.preferredLanguage"
    static let supported = Set(["en", "ar", "he", "tr", "fr", "de", "ja", "ko"])

    static var current: String {
        get {
            if let stored = UserDefaults.standard.string(forKey: key), supported.contains(stored) {
                return stored
            }
            let preferred = Locale.preferredLanguages.first ?? "en"
            let system = preferred.split(separator: "-").first.map(String.init)?.lowercased() ?? "en"
            return supported.contains(system) ? system : "en"
        }
        set {
            guard supported.contains(newValue) else { return }
            UserDefaults.standard.set(newValue, forKey: key)
        }
    }
}
