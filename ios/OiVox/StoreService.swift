import StoreKit

@MainActor
final class StoreService {
    private let allowedProductIDs = Set([
        "mwxeencdjybvgjcs", "onlalqehwglvxxap", "siudvsdvobihufhn", "ajegsghcdaipmmyu",
        "ksajndfouauhfeiold", "uwnvihqdincfbzai", "oewifhuhwbbbcs", "ospifrcuvdmxofos",
        "hsvnuavckiaolvbu", "uuerzkaujlakezbw",
    ])

    func products(productIDs: [String]) async throws -> [String: Any] {
        let requested = productIDs.filter { allowedProductIDs.contains($0) }
        let products = try await Product.products(for: requested)
        return ["products": products.map { product in
            ["productID": product.id, "displayName": product.displayName, "displayPrice": product.displayPrice]
        }]
    }

    func purchase(productID: String) async throws -> [String: Any] {
        guard allowedProductIDs.contains(productID) else { throw StoreServiceError.unknownProduct }
        guard let product = try await Product.products(for: [productID]).first else { throw StoreServiceError.unavailable }

        switch try await product.purchase() {
        case .success(let verification):
            let transaction = try verified(verification)
            await transaction.finish()
            return ["purchased": true, "productID": productID, "transactionID": String(transaction.id)]
        case .pending:
            return ["purchased": false, "pending": true]
        case .userCancelled:
            return ["purchased": false, "cancelled": true]
        @unknown default:
            throw StoreServiceError.unavailable
        }
    }

    private func verified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let value): return value
        case .unverified: throw StoreServiceError.failedVerification
        }
    }
}

enum StoreServiceError: LocalizedError {
    case unknownProduct
    case unavailable
    case failedVerification

    var errorDescription: String? {
        switch self {
        case .unknownProduct: return "This product is not allowed."
        case .unavailable: return "The product is currently unavailable."
        case .failedVerification: return "The App Store transaction could not be verified."
        }
    }
}
