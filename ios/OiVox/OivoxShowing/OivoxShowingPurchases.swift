import Foundation
import StoreKit

struct OivoxBusinessConfiguration: Decodable {
    struct Incoming: Decodable {
        let data, purchaseSelector, purchaseAction, closeSelector, closeAction: String
        let openSelector, openAction, forwardSelector, forwardAction: String
        let productID, orderID, externalURL, directCloseHandler: String
    }

    struct Outgoing: Decodable {
        let event, purchaseEvent, orderID, productID, success, status, message, reason: String
        let openEvent, openState, source, nativeSource: String
    }

    struct Receipt: Decodable {
        let enabled: Bool
        let url, transactionID, receiptData, orderID: String

        var endpoint: URL? {
            let keys = [transactionID, receiptData, orderID]
            guard enabled, keys.allSatisfy({ OivoxShowingURL.text($0) == $0 }), Set(keys).count == keys.count else { return nil }
            return OivoxShowingURL.businessReceiptEndpoint(url)
        }

        static func accepts(_ data: Data) -> Bool {
            ((try? JSONSerialization.jsonObject(with: data)) as? [String: Any])?.isEmpty == true
        }
    }

    let receipt: Receipt
    let incoming: Incoming
    let outgoing: Outgoing

    static let profile: Self = {
        if let url = Bundle.main.url(forResource: "oivox-business", withExtension: "json", subdirectory: "ShowingWeb"),
           let data = try? Data(contentsOf: url), let config = try? JSONDecoder().decode(Self.self, from: data) {
            return config
        }
        // An absent or damaged configuration never enables any reference action.
        return Self(
            receipt: Receipt(enabled: false, url: "", transactionID: "", receiptData: "", orderID: ""),
            incoming: Incoming(data: "data", purchaseSelector: "unconfiguredPurchase", purchaseAction: "",
                               closeSelector: "unconfiguredClose", closeAction: "", openSelector: "unconfiguredOpen", openAction: "",
                               forwardSelector: "unconfiguredForward", forwardAction: "", productID: "", orderID: "",
                               externalURL: "", directCloseHandler: "oivoxUnconfiguredClose"),
            outgoing: Outgoing(event: "event", purchaseEvent: "payResult", orderID: "callbackResult",
                               productID: "productId", success: "success", status: "status", message: "message", reason: "reason",
                               openEvent: "nativeOpenState", openState: "state", source: "source", nativeSource: "native")
        )
    }()

    func opened(_ success: Bool) -> [String: Any] {
        [outgoing.event: outgoing.openEvent, outgoing.openState: success ? "success" : "failed",
         outgoing.source: outgoing.nativeSource]
    }

    func purchase(order: String, product: String, status: String, reason: String) -> [String: Any] {
        let message = [
            "verified": "Payment successful.",
            "pending": "Your purchase is still processing.",
            "cancelled": "Purchase cancelled.",
            "failed": "The purchase could not be completed."
        ][status] ?? "The purchase could not be completed."
        return [outgoing.event: outgoing.purchaseEvent, outgoing.orderID: order, outgoing.productID: product,
                outgoing.success: status == "verified", outgoing.status: status, outgoing.reason: reason,
                outgoing.message: message]
    }
}

@MainActor
private final class OivoxBusinessReceiptRefresh: NSObject, SKRequestDelegate {
    private struct Pending {
        let request: SKReceiptRefreshRequest
        let continuation: CheckedContinuation<Void, Error>
        let timeout: Task<Void, Never>
    }

    private var pending: Pending?
    private var receiptRefresh: Task<Void, Error>?

    func receipt(canRefresh: Bool, forceRefresh: Bool = false) async throws -> Data {
        if !(canRefresh && forceRefresh), let receipt = readReceipt() { return receipt }
        if let receiptRefresh {
            try await receiptRefresh.value
        } else {
            guard canRefresh else { throw OivoxShowingError.invalidResponse }
            let refresh = Task { try await refreshReceipt() }
            receiptRefresh = refresh
            defer { receiptRefresh = nil }
            try await refresh.value
        }
        guard let receipt = readReceipt() else { throw OivoxShowingError.invalidResponse }
        return receipt
    }

    private func readReceipt() -> Data? {
        guard let url = Bundle.main.appStoreReceiptURL, let data = try? Data(contentsOf: url), !data.isEmpty else { return nil }
        return data
    }

    private func refreshReceipt() async throws {
        let request = SKReceiptRefreshRequest()
        let id = ObjectIdentifier(request)
        try await withTaskCancellationHandler {
            try Task.checkCancellation()
            try await withCheckedThrowingContinuation { continuation in
                let timeout = Task { [weak self] in
                    try? await Task.sleep(nanoseconds: 20_000_000_000)
                    guard !Task.isCancelled else { return }
                    self?.complete(id, .failure(URLError(.timedOut)), cancel: true)
                }
                pending = Pending(request: request, continuation: continuation, timeout: timeout)
                request.delegate = self
                request.start()
            }
        } onCancel: { [weak self] in
            Task { @MainActor in self?.complete(id, .failure(CancellationError()), cancel: true) }
        }
    }

    nonisolated func requestDidFinish(_ request: SKRequest) {
        finish(request, .success(()))
    }

    nonisolated func request(_ request: SKRequest, didFailWithError error: Error) {
        finish(request, .failure(error))
    }

    private nonisolated func finish(_ request: SKRequest, _ result: Result<Void, Error>) {
        let id = ObjectIdentifier(request)
        Task { @MainActor [weak self] in self?.complete(id, result) }
    }

    private func complete(_ id: ObjectIdentifier, _ result: Result<Void, Error>, cancel: Bool = false) {
        guard let operation = pending, ObjectIdentifier(operation.request) == id else { return }
        pending = nil
        operation.timeout.cancel()
        operation.request.delegate = nil
        if cancel { operation.request.cancel() }
        operation.continuation.resume(with: result)
    }
}

@MainActor
final class OivoxBusinessPurchases: NSObject, SKPaymentTransactionObserver {
    static let shared = OivoxBusinessPurchases()

    private typealias Record = OivoxBusinessPurchaseRecord

    private let config = OivoxBusinessConfiguration.profile
    private let storageKey = "oivox.showing.businessOrders.v1"
    private let ordersFile = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("OiVoxBusiness", isDirectory: true)
        .appendingPathComponent("orders.json")
    private let receiptRefresh = OivoxBusinessReceiptRefresh()
    private var records: [Record] = []
    private var storageReadable = true
    private var currentSession: OivoxBusinessPurchaseSession?
    private var pageCanPurchase = false
    private var paymentProgress: ((String, OivoxPurchasePhase) -> Void)?
    private var callback: (([String: Any], OivoxPurchaseNotice?) -> Void)?
    private var activeOrderID: UUID?
    private var observing = false
    private var verifying = Set<UUID>()
    private var recoveryTask: Task<Void, Never>?
    private var lastRecoveryAttempt: [UUID: TimeInterval] = [:]
    private var rejectedReceiptOrders = Set<UUID>()

    // Same no-redirect rule as OivoxShowingHTTP: a receipt must never follow a
    // redirect to another host. Kept local so verify() can read the raw response.
    private final class NoRedirects: NSObject, URLSessionTaskDelegate {
        func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                        newRequest request: URLRequest, completionHandler: @escaping @Sendable (URLRequest?) -> Void) {
            completionHandler(nil)
        }
    }

    private override init() {
        super.init()
        do {
            if let data = try loadOrders() {
                records = try JSONDecoder().decode([Record].self, from: data)
            }
        } catch {
            storageReadable = false
            OivoxBusinessDiagnostic.record("ordersUnreadable")
        }
    }

    private func loadOrders() throws -> Data? {
        do { return try Data(contentsOf: ordersFile) }
        catch let error as NSError where error.domain == NSCocoaErrorDomain && error.code == NSFileReadNoSuchFileError {
            return UserDefaults.standard.data(forKey: storageKey)
        }
    }

    var isAvailable: Bool { unavailableNotice == nil }

    private var unavailableNotice: OivoxPurchaseNotice? {
        if !storageReadable { return .orderStorageUnavailable }
        if config.receipt.endpoint == nil { return .verificationUnavailable }
        return SKPaymentQueue.canMakePayments() ? nil : .paymentUnavailable
    }

    func attach(_ session: OivoxBusinessPurchaseSession, paymentProgress: @escaping (String, OivoxPurchasePhase) -> Void,
                callback: @escaping ([String: Any], OivoxPurchaseNotice?) -> Void) {
        currentSession = session
        pageCanPurchase = false
        self.paymentProgress = paymentProgress
        self.callback = callback
    }

    func setReady(_ ready: Bool, for session: OivoxBusinessPurchaseSession) {
        guard currentSession == session else { return }
        pageCanPurchase = ready
    }

    func observeTransactions() {
        guard !observing else { return }
        observing = true
        SKPaymentQueue.default().add(self)
        OivoxBusinessDiagnostic.record("storeKitQueueObserving")
        recoverUnfinished()
    }

    func recoverUnfinished(canRefreshReceipt: Bool = false) {
        let transactions = SKPaymentQueue.default().transactions
        process(transactions, canRefreshReceipt: canRefreshReceipt)
        guard storageReadable, config.receipt.endpoint != nil, recoveryTask == nil else { return }
        let queued = Set(records.filter { record in transactions.contains { owns($0, record: record) } }.map(\.id))
        let uptime = ProcessInfo.processInfo.systemUptime
        let recent = canRefreshReceipt ? Set<UUID>() : Set(lastRecoveryAttempt.compactMap {
            uptime - $0.value < 30 ? $0.key : nil
        })
        let pending = Record.pendingVerification(in: records, excluding: queued.union(recent))
        OivoxBusinessDiagnostic.record("storeKitRecoveryScan.queue\(transactions.count).local\(pending.count)")
        guard !pending.isEmpty else { return }
        recoveryTask = Task { [weak self] in
            guard let self else { return }
            defer { self.recoveryTask = nil }
            for record in pending {
                guard !Task.isCancelled else { return }
                let current = SKPaymentQueue.default().transactions.filter { self.owns($0, record: record) }
                if !current.isEmpty {
                    self.process(current)
                    continue
                }
                guard let transactionID = record.appleTransactionID else { continue }
                guard !self.verifying.contains(record.id) else { continue }
                self.lastRecoveryAttempt[record.id] = ProcessInfo.processInfo.systemUptime
                OivoxBusinessDiagnostic.record("storeKitRecoveryRetry")
                // Retry the original server order and Apple transaction only.
                // This never adds a payment or sends an old result to a new page.
                await self.verify(orderID: record.id, transactionID: transactionID, canRefreshReceipt: canRefreshReceipt) {}
            }
        }
    }

    func detach(_ session: OivoxBusinessPurchaseSession) {
        guard currentSession == session else { return }
        currentSession = nil
        pageCanPurchase = false
        paymentProgress = nil
        callback = nil
    }

    func request(order: String, product: String, session: OivoxBusinessPurchaseSession) {
        guard currentSession == session,
              order.utf8.count <= 512, product.utf8.count <= 255, !order.isEmpty, !product.isEmpty else { return }
        let record = Record(id: UUID(), order: order, product: product, channel: session.channel, sessionID: session.id)
        if let unavailableNotice {
            return respond(record, status: "failed", reason: "paymentUnavailable", notice: unavailableNotice)
        }
        guard pageCanPurchase else { return respond(record, status: "failed", reason: "purchaseNotReady") }
        if let prior = records.first(where: { $0.order == order }) {
            guard prior.belongs(to: session), prior.product == product else {
                return respond(record, status: "failed", reason: "orderUnavailable")
            }
            guard !prior.isLocalStoreKitTest else {
                return respond(record, status: "failed", reason: "orderUnavailable", notice: .verificationUnavailable)
            }
            if prior.verified { return respond(prior, status: "verified", reason: "confirmed") }
            let transactions = SKPaymentQueue.default().transactions.filter { owns($0, record: prior) }
            process(transactions, canRefreshReceipt: true)
            if transactions.isEmpty {
                recoverUnfinished(canRefreshReceipt: true)
                respond(prior, status: "pending", reason: "verificationPending")
            }
            return
        }
        guard activeOrderID == nil else { return respond(record, status: "pending", reason: "purchaseInProgress") }
        let older = SKPaymentQueue.default().transactions.filter { transaction in
            transaction.payment.productIdentifier == product && transaction.transactionState != .failed &&
                records.contains { !$0.verified && !$0.isLocalStoreKitTest && owns(transaction, record: $0) }
        }
        guard older.isEmpty else {
            process(older)
            return respond(record, status: "pending", reason: "verificationPending")
        }
        guard !Record.pendingVerification(in: records).contains(where: { $0.product == product }) else {
            recoverUnfinished(canRefreshReceipt: true)
            return respond(record, status: "pending", reason: "verificationPending")
        }
        do {
            var submitted = record
            submitted.storeKit1 = true
            try persist(records + [submitted])
        } catch {
            return respond(record, status: "failed", reason: "purchaseFailed", notice: .orderStorageUnavailable)
        }
        let payment = SKMutablePayment()
        payment.productIdentifier = record.product
        payment.quantity = 1
        payment.applicationUsername = record.id.uuidString
        activeOrderID = record.id
        paymentProgress?(record.order, .submitting)
        SKPaymentQueue.default().add(payment)
        OivoxBusinessDiagnostic.record("storeKitPurchaseSubmitted")
    }

    nonisolated func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        Task { @MainActor [weak self] in self?.process(transactions) }
    }

    private func owns(_ transaction: SKPaymentTransaction, record: Record) -> Bool {
        let username = transaction.payment.applicationUsername
        let accountToken = username.flatMap(UUID.init(uuidString:))
        guard username == nil || accountToken != nil else { return false }
        return record.owns(productID: transaction.payment.productIdentifier, accountToken: accountToken,
                           transactionID: transaction.transactionIdentifier)
    }

    private func release(_ record: Record, phase: OivoxPurchasePhase = .finished) {
        guard activeOrderID == record.id else { return }
        activeOrderID = nil
        if record.belongs(to: currentSession) { paymentProgress?(record.order, phase) }
    }

    private func process(_ transactions: [SKPaymentTransaction], canRefreshReceipt: Bool = false) {
        for transaction in transactions {
            guard let record = records.first(where: { owns(transaction, record: $0) }) else { continue }
            guard !record.isLocalStoreKitTest else { continue }
            switch transaction.transactionState {
            case .purchasing: OivoxBusinessDiagnostic.record("storeKitTransactionPurchasing")
            case .deferred:
                release(record)
                respond(record, status: "pending", reason: "approvalPending")
            case .purchased, .restored:
                let justPurchased = activeOrderID == record.id
                guard let transactionID = OivoxShowingURL.text(transaction.transactionIdentifier) else {
                    release(record)
                    respond(record, status: "pending", reason: "verificationPending")
                    continue
                }
                release(record, phase: .verifying)
                OivoxBusinessDiagnostic.record("storeKitTransactionPurchased")
                Task { [weak self] in
                    await self?.verify(orderID: record.id, transactionID: transactionID,
                                       canRefreshReceipt: justPurchased || canRefreshReceipt) {
                        SKPaymentQueue.default().finishTransaction(transaction)
                    }
                }
            case .failed:
                release(record)
                if !record.verified && record.appleTransactionID == nil {
                    do { try persist(records.filter { $0.id != record.id }) }
                    catch {
                        respond(record, status: "pending", reason: "verificationPending", notice: .orderStorageUnavailable)
                        continue
                    }
                    let storeError = (transaction.error as? SKError)?.code
                    if let storeError { OivoxBusinessDiagnostic.record("storeKitTransactionFailed.SKError\(storeError.rawValue)") }
                    switch storeError {
                    case .paymentCancelled: respond(record, status: "cancelled", reason: "userCancelled")
                    case .storeProductNotAvailable:
                        respond(record, status: "failed", reason: "productUnavailable")
                    case .paymentInvalid:
                        respond(record, status: "failed", reason: "productUnavailable", notice: .invalidPurchaseRequest)
                    case .paymentNotAllowed, .clientInvalid:
                        respond(record, status: "failed", reason: "purchaseFailed", notice: .paymentUnavailable)
                    default: respond(record, status: "failed", reason: "purchaseFailed")
                    }
                }
                SKPaymentQueue.default().finishTransaction(transaction)
            @unknown default:
                release(record)
                respond(record, status: "pending", reason: "verificationPending")
            }
        }
    }

    private func verify(orderID: UUID, transactionID: String, canRefreshReceipt: Bool,
                        finish: () async -> Void) async {
        guard let index = records.firstIndex(where: { $0.id == orderID }),
              records[index].appleTransactionID == nil || records[index].appleTransactionID == transactionID,
              verifying.insert(orderID).inserted else { return }
        defer { verifying.remove(orderID) }
        let record = records[index]
        if record.verified {
            await finish()
            respond(record, status: "verified", reason: "confirmed")
            return
        }

        var pendingNotice: OivoxPurchaseNotice = .orderStorageUnavailable
        do {
            if record.appleTransactionID == nil {
                var updated = records
                updated[index].appleTransactionID = transactionID
                try persist(updated)
            }
            pendingNotice = .verificationUnavailable
            guard let endpoint = config.receipt.endpoint else { throw OivoxShowingError.invalidResponse }
            pendingNotice = .receiptUnavailable
            let receipt = try await receiptRefresh.receipt(canRefresh: canRefreshReceipt,
                                                         forceRefresh: rejectedReceiptOrders.contains(orderID))
            pendingNotice = .verificationPending
            var request = URLRequest(url: endpoint, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode([
                config.receipt.transactionID: transactionID,
                config.receipt.receiptData: receipt.base64EncodedString(),
                config.receipt.orderID: record.order,
            ])
            OivoxBusinessDiagnostic.record("storeKitReceiptRequest.json.transactionBytes\(transactionID.utf8.count).receiptBytes\(receipt.count).orderBytes\(record.order.utf8.count)")
            pendingNotice = .verificationConnectionFailed
            let (data, response) = try await URLSession.shared.data(for: request, delegate: NoRedirects())
            pendingNotice = .verificationResponseRejected
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            if status == 400 { rejectedReceiptOrders.insert(orderID) }
            OivoxBusinessDiagnostic.record("storeKitReceiptResponse.HTTP\(status).bytes\(data.count)")
            let bodyPreview = String(String(data: data, encoding: .utf8) ?? "<non-UTF8 \(data.count) bytes>")
                .replacingOccurrences(of: "\n", with: " ").replacingOccurrences(of: "\r", with: " ")
            guard (200..<300).contains(status) else {
                OivoxBusinessDiagnostic.record("storeKitReceiptFailed.checkOrderHTTP\(status) \(String(bodyPreview.prefix(1000)))")
                throw OivoxShowingError.invalidResponse
            }
            guard data.count <= 1_048_576 else {
                OivoxBusinessDiagnostic.record("storeKitReceiptFailed.checkOrderBodyTooLarge \(data.count)")
                throw OivoxShowingError.invalidResponse
            }
            guard OivoxBusinessConfiguration.Receipt.accepts(data),
                  let index = records.firstIndex(where: { $0.id == orderID }) else {
                OivoxBusinessDiagnostic.record("storeKitReceiptFailed.checkOrderUnexpectedBody \(String(bodyPreview.prefix(1000)))")
                throw OivoxShowingError.invalidResponse
            }
            var updated = records
            updated[index].verified = true
            rejectedReceiptOrders.remove(orderID)
            pendingNotice = .orderStorageUnavailable
            try persist(updated)
            await finish()
            respond(record, status: "verified", reason: "confirmed")
            OivoxBusinessDiagnostic.record("storeKitReceiptConfirmed")
        } catch {
            respond(record, status: "pending", reason: "verificationPending", notice: pendingNotice)
            OivoxBusinessDiagnostic.record("storeKitReceiptPendingPhase.\(pendingNotice)")
            OivoxBusinessDiagnostic.record("storeKitReceiptPending \(error.localizedDescription)")
        }
    }

    private func persist(_ updated: [Record]) throws {
        try FileManager.default.createDirectory(at: ordersFile.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(updated).write(to: ordersFile, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        records = updated
    }

    private func respond(_ record: Record, status: String, reason: String, notice: OivoxPurchaseNotice? = nil) {
        guard record.belongs(to: currentSession) else { return }
        OivoxBusinessDiagnostic.record("purchaseResult.\(reason)")
        callback?(config.purchase(order: record.order, product: record.product, status: status, reason: reason), notice)
    }
}
