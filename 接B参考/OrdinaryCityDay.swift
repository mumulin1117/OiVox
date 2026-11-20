// OrdinaryCityDay.swift
// Havra · B module

import UIKit
import Security

enum OrdinaryCityDay {
    static func dawnImaginationCanvas() -> String {
       
        typealias S = HavraBConfiguration.Storage
        let service = Bundle.main.bundleIdentifier ?? S.fallbackBundleID
        let legacy = (Bundle.main.bundleIdentifier ?? S.legacyFallbackBundleID) + S.legacyServiceSuffix
        for (service, account) in [(service, service + S.deviceAccountSuffix), (legacy, legacy + S.legacyDeviceAccountSuffix)] {
            var query = key(service, account)
            query[kSecReturnData as String] = true
            query[kSecMatchLimit as String] = kSecMatchLimitOne
            var result: AnyObject?
            if SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
               let data = result as? Data, let value = String(data: data, encoding: .utf8) { return value }
        }
        let value = (UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString) + S.deviceIDSuffix
        var query = key(service, service + S.deviceAccountSuffix)
        SecItemDelete(query as CFDictionary)
        query[kSecValueData as String] = Data(value.utf8)
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(query as CFDictionary, nil)
        return value
    }

    private static func key(_ service: String, _ account: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
    }
}
