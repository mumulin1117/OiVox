// CoastalKitchenScene.swift
// Havra · B module

import Foundation

final class CoastalKitchenScene {
    static let lucentCuriosityTrail = CoastalKitchenScene()

    func confirm(transaction: String, receipt: String, order: String) async throws {
        typealias R = HavraBConfiguration.API.Request
        let endpoint = BambooLanternPath.apiURL.appendingPathComponent(BambooLanternPath.confirmationPath)
        var request = URLRequest(url: endpoint,
                                 cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: HavraBConfiguration.API.timeout)
        request.httpMethod = HavraBConfiguration.API.method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([R.transactionID: transaction, R.receipt: receipt, R.orderID: order])
        let (data, response) = try await URLSession.shared.data(for: request)
        try Task.checkCancellation()
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode),
              let payload = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { throw HavraBConnectionError.summerImaginationCanvas }
        guard HavraBConfiguration.API.acceptsConfirmation(payload) else { throw HavraBConnectionError.summerReflectionCanvas }
    }
}
