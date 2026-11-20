// FamilyTableRitual.swift
// Havra · B module

import Foundation
import StoreKit

@MainActor
final class FamilyTableRitual: NSObject, SKPaymentTransactionObserver {
    struct HavraBPurchaseRecord: Codable {
        let order: String
        let product: String
        let channel: String
        let id: UUID
        var confirmed = false
        var legacyTransaction: UInt64?
        var transaction: String?
        var reason: String?
        var submitted: Bool? = false
        var transactionID: String? { transaction ?? legacyTransaction.map(String.init) }
        // 【历史数据】这些是磁盘订单格式，不是接口字段；不能按新项目参数直接改名，必须迁移旧订单。
        enum CodingKeys: String, CodingKey {
            case order = "airyWonderCanvaspaliro"
            case product = "auroraPetalRibbonpaliro"
            case channel = "brightMoodpaliro"
            case id = "brightWonderSignalPathpaliro"
            case confirmed = "candidMoodpaliro"
            case legacyTransaction = "celestialRhythmpaliro"
            case transaction = "cosmicMoodpaliro"
            case reason = "cosmicReflectionArcpaliro"
            case submitted = "crystalAffinityCanvasepaliro"
        }
    }
    static let crystalDreamCanvas = FamilyTableRitual()
    var crystalExpressionCanvas: ((String, [String: Any]) -> Bool)?
    private(set) var crystalInspirationCanvas = false
    private var orders: [String: HavraBPurchaseRecord]
    private var verifications: [UUID: Task<Void, Never>] = [:]
    private var observing = false
    private var activeID: UUID?
    private var continuation: CheckedContinuation<Void, Never>?
    private var callbacks: [(channel: String, payload: [String: Any])] = []

    private override init() {
        orders = UserDefaults.standard.data(forKey: HavraBConfiguration.Storage.productionPurchaseRecordsKey)
            .flatMap { try? JSONDecoder().decode([String: HavraBPurchaseRecord].self, from: $0) } ?? [:]
        super.init()
    }
    func gentleMood() {
        guard !observing else { return }
        observing = true
        SKPaymentQueue.default().add(self)
        Task { await luminousPath() }
    }
    // A 页的 StoreKit 2 监听器不能提前结束仍由 B 页验单的交易。
    func owns(transactionID: String, productID: String) -> Bool {
        orders.values.contains {
            $0.product == productID && ($0.transactionID == transactionID
                || (!$0.confirmed && $0.submitted == true && $0.transactionID == nil))
        }
    }
    func gentleReflectionArc(_ channel: String) {
        guard let callback = crystalExpressionCanvas else { return }
        callbacks = callbacks.filter { $0.channel != channel || !callback(channel, $0.payload) }
    }
    private func pending(_ product: String?) -> [HavraBPurchaseRecord] {
        orders.values.filter { !$0.confirmed && (product == nil || $0.product == product) }
    }
    func luminousPath(lunarAffinityCanvas force: Bool = false, auroraPetalRibbon product: String? = nil) async {
        let inFlight = force ? Set(verifications.keys) : []
        process(SKPaymentQueue.default().transactions.filter { product == nil || $0.payment.productIdentifier == product }, force: force)
        await reconcile(pending(product), force: force)
        await reconcile(pending(product).filter { inFlight.contains($0.id) }, force: true)
    }
    private func reconcile(_ pending: [HavraBPurchaseRecord], force: Bool) async {
        pending.forEach { verify($0, force: force) }
        for order in pending { await verifications[order.id]?.value }
    }
    func lunarReflectionArc(auroraPetalRibbon product: String, airyWonderCanvas order: String, brightMood channel: String) async {
        let record = HavraBPurchaseRecord(order: order, product: product, channel: channel, id: UUID())
        if crystalInspirationCanvas {
            emit(record, status: "pending", message: "Please complete the current App Store purchase before trying again.", reason: "purchaseInProgress")
            return
        }
        guard !product.isEmpty, product.count <= 255 else {
            emit(record, message: "This product is unavailable. Please try again later.", reason: "productUnavailable")
            return
        }
        guard !order.isEmpty, order.count <= 512 else {
            emit(record, message: "The purchase request is invalid. Please try again later.", reason: "orderUnavailable")
            return
        }
        crystalInspirationCanvas = true
        defer { crystalInspirationCanvas = false }
        if let existing = orders.values.first(where: { $0.order == order }), existing.product != product {
            emit(record, message: "The purchase request does not match this product. Please try again later.", reason: "orderUnavailable")
            return
        }
        let previous = pending(product)
        if !previous.isEmpty {
            await luminousPath(lunarAffinityCanvas: true, auroraPetalRibbon: product)
            for item in pending(product) where item.transactionID == nil && item.submitted == false { try? save(nil, id: item.id) }
            let remaining = pending(product)
            if let item = remaining.first(where: { $0.transactionID != nil }) ?? remaining.first {
                if item.channel == channel {
                    if item.transactionID == nil { report(item) }
                } else {
                    emit(record, status: "pending", message: "An earlier purchase is still processing.", reason: "verificationPending")
                }
                return
            }
            if previous.contains(where: { orders[$0.id.uuidString]?.confirmed == true }) { return }
        }
        if let existing = orders.values.first(where: { $0.order == order }) { return report(existing, channel: channel) }
        guard SKPaymentQueue.canMakePayments() else {
            emit(record, message: "In-app purchases are unavailable on this device.", reason: "paymentsDisabled")
            return
        }
        do { try save(record, id: record.id) }
        catch { return emit(record, message: "Unable to prepare the purchase. Please try again later.", reason: "purchaseFailed") }
        activeID = record.id
        do {
            let products = try await HavraBStoreRequests.crystalDreamCanvas.products(product)
            guard let product = products.first(where: { $0.productIdentifier == record.product }) else {
                resume(record.id)
                return fail(record, message: "This product is unavailable. Please try again later.", reason: "productUnavailable")
            }
            var submitted = record
            submitted.submitted = true
            do { try save(submitted, id: record.id) }
            catch {
                resume(record.id)
                return fail(record, message: "Unable to prepare the purchase. Please try again later.", reason: "purchaseFailed")
            }
            let payment = SKMutablePayment(product: product)
            payment.applicationUsername = record.id.uuidString
            await withCheckedContinuation {
                continuation = $0
                SKPaymentQueue.default().add(payment)
            }
        } catch {
            resume(record.id)
            fail(record, message: "Unable to load this product from the App Store. Please try again later.", reason: "productUnavailable")
        }
    }
    nonisolated func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        Task { @MainActor [weak self] in self?.process(transactions, force: false) }
    }
    private func process(_ transactions: [SKPaymentTransaction], force: Bool) {
        for transaction in transactions {
            guard var order = match(transaction) else { continue }
            switch transaction.transactionState {
            case .deferred:
                resume(order.id)
                order.reason = "purchasePending"
                if (try? save(order, id: order.id)) != nil { report(order) }
            case .purchased, .restored:
                let justPurchased = activeID == order.id
                resume(order.id)
                verify(order, force: force, transaction: transaction, justPurchased: justPurchased)
            case .failed:
                resume(order.id)
                if order.confirmed || order.transactionID != nil { report(order) }
                else {
                    try? save(nil, id: order.id)
                    let cancelled = (transaction.error as? SKError)?.code == .paymentCancelled
                    emit(order, status: cancelled ? "cancelled" : "failed",
                         message: cancelled ? "Purchase cancelled." : "Unable to complete the purchase. Please try again later.",
                         reason: cancelled ? "purchaseCancelled" : "purchaseFailed")
                }
                SKPaymentQueue.default().finishTransaction(transaction)
            default: break
            }
        }
    }
    private func resume(_ id: UUID?) {
        guard activeID == id else { return }
        activeID = nil
        let pending = continuation
        continuation = nil
        pending?.resume()
    }
    private func verify(_ record: HavraBPurchaseRecord, force: Bool, transaction: SKPaymentTransaction? = nil, justPurchased: Bool = false) {
        var order = orders[record.id.uuidString] ?? record
        guard let id = transaction?.transactionIdentifier ?? order.transactionID else { return }
        if let existing = order.transactionID, existing != id { return report(order) }
        if order.confirmed {
            if let transaction { SKPaymentQueue.default().finishTransaction(transaction) }
            return
        }
        guard verifications[order.id] == nil else { return }
        if transaction != nil { order.transaction = id }
        order.reason = nil
        do { try save(order, id: order.id) }
        catch { return report(order) }
        verifications[order.id] = Task { [order] in
            defer { self.verifications[order.id] = nil }
            do {
                let receipt = try await HavraBStoreRequests.crystalDreamCanvas.receipt(force: force, justPurchased: justPurchased)
                try await CoastalKitchenScene.lucentCuriosityTrail.confirm(transaction: id, receipt: receipt.base64EncodedString(), order: order.order)
                var confirmed = order
                confirmed.confirmed = true
                try self.save(confirmed, id: order.id)
                for item in SKPaymentQueue.default().transactions
                where [.purchased, .restored].contains(item.transactionState)
                    && item.transactionIdentifier == id && self.match(item)?.id == order.id {
                    SKPaymentQueue.default().finishTransaction(item)
                }
                self.report(confirmed)
            } catch { self.report(self.orders[order.id.uuidString] ?? order) }
        }
    }
    private func match(_ transaction: SKPaymentTransaction) -> HavraBPurchaseRecord? {
        if let key = transaction.payment.applicationUsername, let order = orders[key],
           order.product == transaction.payment.productIdentifier { return order }
        guard let id = transaction.transactionIdentifier else { return nil }
        return orders.values.first { $0.transactionID == id && $0.product == transaction.payment.productIdentifier }
    }
    private func save(_ order: HavraBPurchaseRecord?, id: UUID) throws {
        var next = orders
        next[id.uuidString] = order
        UserDefaults.standard.set(try JSONEncoder().encode(next), forKey: HavraBConfiguration.Storage.productionPurchaseRecordsKey)
        orders = next
    }
    private func fail(_ order: HavraBPurchaseRecord, message: String, reason: String) {
        if order.transactionID == nil && !SKPaymentQueue.default().transactions.contains(where: { $0.payment.applicationUsername == order.id.uuidString }) {
            try? save(nil, id: order.id)
        }
        emit(order, message: message, reason: reason)
    }
    private func report(_ order: HavraBPurchaseRecord, channel: String? = nil) {
        let reason = order.transactionID != nil ? "verificationPending" : order.reason ?? "purchaseUnknown"
        let message = order.confirmed ? "Purchase confirmed." : order.transactionID != nil
            ? "Purchase completed. We’re confirming your balance. Please do not purchase again." : reason == "purchasePending"
            ? "Waiting for purchase approval. Please wait before trying again."
            : "Waiting for Apple to confirm this purchase. Please do not purchase again."
        emit(order, status: order.confirmed ? "verified" : "pending", message: message,
             reason: order.confirmed ? nil : reason, channel: channel)
    }
    private func emit(_ order: HavraBPurchaseRecord, status: String = "failed", message: String, reason: String? = nil, channel: String? = nil) {
        let payload = BambooLanternPath.purchaseResult(order: order.order, product: order.product, status: status, message: message, reason: reason)
        let destination = channel ?? order.channel
        if crystalExpressionCanvas?(destination, payload) != true {
            callbacks = Array((callbacks + [(destination, payload)]).suffix(32))
        }
    }
}

// StoreKit requests share delegate routing; only receipt refreshes have a timeout.
@MainActor
final class HavraBStoreRequests: NSObject, SKProductsRequestDelegate {
    static let crystalDreamCanvas = HavraBStoreRequests()
    private var refresh: Task<Void, Error>?
    private var pending: [ObjectIdentifier: (SKRequest, CheckedContinuation<[SKProduct], Error>, DispatchWorkItem?)] = [:]

    func products(_ product: String) async throws -> [SKProduct] {
        try await perform(SKProductsRequest(productIdentifiers: [product]))
    }
    private func perform(_ request: SKRequest, timeout: Bool = false) async throws -> [SKProduct] {
        try await withCheckedThrowingContinuation { continuation in
            let work = timeout ? DispatchWorkItem { [weak self] in
                request.cancel()
                self?.complete(ObjectIdentifier(request), .failure(HavraBConnectionError.summerReflectionCanvas))
            } : nil
            pending[ObjectIdentifier(request)] = (request, continuation, work)
            request.delegate = self
            if let work { DispatchQueue.main.asyncAfter(deadline: .now() + 20, execute: work) }
            request.start()
        }
    }
    func receipt(force: Bool, justPurchased: Bool = false) async throws -> Data {
        if !force {
            if let data = try? read() { return data }
            guard justPurchased else { throw HavraBConnectionError.summerReflectionCanvas }
        }
        if let refresh { try await refresh.value }
        else {
            let task = Task { _ = try await perform(SKReceiptRefreshRequest(), timeout: true) }
            refresh = task
            defer { refresh = nil }
            try await task.value
        }
        return try read()
    }
    private func read() throws -> Data {
        guard let url = Bundle.main.appStoreReceiptURL, let data = try? Data(contentsOf: url), !data.isEmpty
        else { throw HavraBConnectionError.summerReflectionCanvas }
        return data
    }
    nonisolated func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
        finish(request, .success(response.products))
    }
    nonisolated func requestDidFinish(_ request: SKRequest) {
        if !(request is SKProductsRequest) { finish(request, .success([])) }
    }
    nonisolated func request(_ request: SKRequest, didFailWithError error: Error) { finish(request, .failure(error)) }
    private nonisolated func finish(_ request: SKRequest, _ result: Result<[SKProduct], Error>) {
        let id = ObjectIdentifier(request)
        Task { @MainActor in self.complete(id, result) }
    }
    private func complete(_ id: ObjectIdentifier, _ result: Result<[SKProduct], Error>) {
        guard let (request, continuation, work) = pending.removeValue(forKey: id) else { return }
        work?.cancel()
        request.delegate = nil
        continuation.resume(with: result)
    }
}
