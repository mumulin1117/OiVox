import CryptoKit
import Foundation

struct OivoxShowingAccount: Codable, Sendable {
    private static let activeKey = "oivox.showing.activeAccount"
    private static let reviewAddress = "oivox@gmail.com"
    private static let reviewID = "42618403-0000-4000-8000-000000000001"

    let identifier: String
    let nickname: String?

    init?(login: String?, nickname: String?) {
        guard let submitted = OivoxShowingURL.text(login ?? nickname), submitted.utf8.count <= 254,
              submitted.rangeOfCharacter(from: .controlCharacters) == nil else { return nil }
        identifier = submitted.precomposedStringWithCanonicalMapping.lowercased()
        self.nickname = OivoxShowingURL.text(nickname).map { String($0.prefix(32)) }
    }

    var entryFields: [String: Any] {
        let review = identifier == Self.reviewAddress
        let hex = SHA256.hash(data: Data(identifier.utf8)).map { String(format: "%02x", $0) }.joined()
        var fields: [String: Any] = [
            "identifier": identifier, "scopedID": review ? Self.reviewID : "oivox-member-\(hex)",
            "isTestAccount": review
        ]
        if let nickname { fields["nickname"] = nickname }
        return fields
    }

    static func read() -> Self? {
        guard let serialized = SmoothLightForestRaster.swiftSyllable(activeKey),
              let value = try? JSONDecoder().decode(Self.self, from: Data(serialized.utf8)) else { return nil }
        return value
    }

    func save() throws {
        let JSON = String(decoding: try JSONEncoder().encode(self), as: UTF8.self)
        try SmoothLightForestRaster.swiftLexis(JSON, flowBuzz: Self.activeKey)
    }

    static func signOut() {
        SmoothLightForestRaster.swiftParol(activeKey)
        SmoothLightForestRaster.swiftParol("oivox.serverAccessToken")
        SmoothLightForestRaster.swiftParol("oivox.accountTransport")
    }

    // This runs in a separate WebKit content world on the bundled registration document.
    // It correlates the accepted openUrl callback with the form that submitted it.
    static let observingSubmittedIdentity = """
    (() => {
      let login, nickname;
      const route = () => location.hash.slice(1).split("?")[0];
      const remember = (form, autocomplete) => {
        const submit = document.querySelector('button[type="submit"][form="' + form.id + '"]');
        if (!submit || submit.disabled) return;
        const value = form.querySelector('input[autocomplete="' + autocomplete + '"]')?.value.trim();
        if (autocomplete === 'username') login = value;
        else nickname = value;
      };
      document.addEventListener('submit', event => {
        if (route() === '/login' && event.target.id === 'login-form') remember(event.target, 'username');
        if (route() === '/register/nickname' && event.target.id === 'register-form') remember(event.target, 'nickname');
      }, true);
      document.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.repeat && !event.isComposing && event.keyCode !== 229 &&
            route() === '/login' && event.target.matches?.('#login-form input[autocomplete="current-password"]')) {
          remember(event.target.form, 'username');
        }
      }, true);
      window.addEventListener('hashchange', () => {
        if (route() !== '/login') login = undefined;
        if (!route().startsWith('/register/')) nickname = undefined;
      });
      window.oivoxSubmittedIdentity = () => {
        if (route() === '/login' && login) return { login };
        if (route().startsWith('/register/') && nickname) return { nickname };
        return null;
      };
    })();
    """
}
