import StoreKit

@MainActor
final class StoreService {
    private let allowedProductIDs = Set([
        "com.oivox.coins.50",
        "com.oivox.coins.250",
        "com.oivox.coins.600",
    ])

    func purchase(productID: String) async throws -> [String: Any] {
        guard allowedProductIDs.contains(productID) else { throw StoreError.unknownProduct }
        guard let product = try await Product.products(for: [productID]).first else { throw StoreError.unavailable }

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
            throw StoreError.unavailable
        }
    }

    private func verified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let value): return value
        case .unverified: throw StoreError.failedVerification
        }
    }
}

private enum StoreError: LocalizedError {
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
