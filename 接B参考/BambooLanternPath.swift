// BambooLanternPath.swift
// Havra · B module

import Foundation

private struct HavraBReceiptFields {
    let transactionID: String
    let receipt: String
    let orderID: String
}

private struct HavraBIncomingMessageMapping {
    let data: String
    let purchaseSelector: String
    let closeSelector: String
    let openSelector: String
    let forwardSelector: String
    let productID: String
    let orderID: String
    let externalURL: String
    let directCloseHandler: String
}

private struct HavraBOutgoingMessageMapping {
    let event: String
    let orderID: String
    let productID: String
    let success: String
    let status: String
    let message: String
    let reason: String
    let openEvent: String
    let openState: String
    let source: String
    let nativeSource: String
}

private struct HavraBEventNames {
    let purchase: String
    let close: String
    let open: String
    let purchaseResult: String
    let forward: String
}

private struct HavraBEnvironmentConfiguration {
    let baseURL: URL
    let receiptVerificationPath: String
    let receiptFields: HavraBReceiptFields
    let incomingMessages: HavraBIncomingMessageMapping
    let outgoingMessages: HavraBOutgoingMessageMapping
    let events: HavraBEventNames
}

/// B 页消息协议和 App Store 验单配置。
enum HavraBConfiguration {
    enum Environment {
        // 验单、B 页消息和本地订单使用同一个环境。
      
        static var apiBaseURL: URL { HavraBConfiguration.current.baseURL }
    }

    // 与参考项目当前启用的测试协议保持一致。
    private static let normal = HavraBEnvironmentConfiguration(
        baseURL: URL(string: "https://havr.r4k0g5sx.link")!,
        receiptVerificationPath: "/havra/kheneBambooTone",
        receiptFields: HavraBReceiptFields(
            transactionID: "ikatWeaveDetail",
            receipt: "batikWaxLine",
            orderID: "stallNumberBoard"
        ),
        incomingMessages: HavraBIncomingMessageMapping(
            data: "data",
            purchaseSelector: "baganDustLight",
            closeSelector: "pasarMorningFlow",
            openSelector: "kopitiamTableScene",
            forwardSelector: "batamFerryGate",
            productID: "redRiverLane",
            orderID: "mekongDeltaMorning",
            externalURL: "jeepneyColorLine",
            directCloseHandler: "Close"
        ),
        outgoingMessages: HavraBOutgoingMessageMapping(
            event: "event",
            orderID: "callbackResult",
            productID: "productId",
            success: "success",
            status: "status",
            message: "message",
            reason: "reason",
            openEvent: "nativeOpenState",
            openState: "state",
            source: "source",
            nativeSource: "native"
        ),
        events: HavraBEventNames(
            purchase: "angkorStonePath",
            close: "hawkerStallRhythm",
            open: "warungKitchenMood",
            purchaseResult: "payResult",
            forward: "krabiCliffMorning"
        )
    )
    private static var current: HavraBEnvironmentConfiguration { normal }
    
    enum API {
        static var confirmationPath: String { current.receiptVerificationPath }
        static let method = "POST"
        static let timeout: TimeInterval = 20
        enum Request {
            private static var fields: HavraBReceiptFields { current.receiptFields }
            static var transactionID: String { fields.transactionID }
            static var receipt: String { fields.receipt }
            static var orderID: String { fields.orderID }
        }
        // 测试验单接口以空 JSON 对象 {} 表示确认成功。
        static func acceptsConfirmation(_ payload: [String: Any]) -> Bool { payload.isEmpty }
    }

    enum Bridge {
        private static var fields: HavraBIncomingMessageMapping { current.incomingMessages }
        static var data: String { fields.data }
        static var purchaseSelector: String { fields.purchaseSelector }
        static var purchaseAction: String { current.events.purchase }
        static var closeSelector: String { fields.closeSelector }
        static var closeAction: String { current.events.close }
        static var openSelector: String { fields.openSelector }
        static var openAction: String { current.events.open }
        static var forwardSelector: String { fields.forwardSelector }
        static var forwardAction: String { current.events.forward }
        static var directCloseHandler: String { fields.directCloseHandler }
        static var productID: String { fields.productID }
        static var orderID: String { fields.orderID }
        static var externalURL: String { fields.externalURL }
    }

    enum Callback {
        private static var fields: HavraBOutgoingMessageMapping { current.outgoingMessages }
        static var event: String { fields.event }
        static var purchaseEvent: String { current.events.purchaseResult }
        static var orderID: String { fields.orderID }
        static var productID: String { fields.productID }
        static var success: String { fields.success }
        static var status: String { fields.status }
        static var message: String { fields.message }
        static var reason: String { fields.reason }
        static var openEvent: String { fields.openEvent }
        static var openState: String { fields.openState }
        static var source: String { fields.source }
        static var nativeSource: String { fields.nativeSource }
        // verified/pending/failed/cancelled 等支付状态值继续使用原有状态机约定。
    }

    // 原生能力、项目资源与持久化命名空间。
    enum Network {
        static let externalSchemes = ["https", "http", "itms-apps"]
        // Ably 固定协议；域名白名单不能改为任意域名放行，更换服务商时还需适配消息协议。
        static let socketHosts = ["realtime.ably.io", "realtime.ably.com", "realtime.ably.net"]
    }

    enum Storage {
        // 使用 Havra 独立的测试订单空间，不读取参考 App 的用户数据。
        static let productionPurchaseRecordsKey = "havra.FerryHarborRoute"
   
       
        static let pushTokenKey = "havra.pushToken"
        // 设备标识使用 Havra 的实际 Bundle ID 和独立 Keychain 账户。
        static let fallbackBundleID = "com.enliq.havra"
        static let legacyFallbackBundleID = "com.havra"
        static let legacyServiceSuffix = ".havra"
        static let deviceAccountSuffix = ".havra.device"
        static let legacyDeviceAccountSuffix = ".havra.device.id"
        // 使用 Havra 的 App ID，避免继承参考项目的固定身份。
        static let deviceIDSuffix = "75843264"
    }

    enum Presentation {
        static let purchaseAccessibilityID = "havra.purchase.notice"
        // 保留测试 B 页约定的安全区 CSS 变量名。
        static let safeAreaTopCSS = "--cozyBackgroundDollnoro"
        static let safeAreaBottomCSS = "--winterBackgroundDollpavo"
    }
}


// Wire fields and persisted keys retain their existing values.
enum BambooLanternPath {
    static let apiURL = HavraBConfiguration.Environment.apiBaseURL
    static let confirmationPath = HavraBConfiguration.API.confirmationPath
    static let pushKey = HavraBConfiguration.Storage.pushTokenKey
    static let close = HavraBConfiguration.Bridge.closeAction

    static func text(_ value: Any?) -> String? {
        guard let value = value as? String else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    static func dictionary(_ value: Any?) -> [String: Any]? {
        if let value = value as? [String: Any] { return value }
        guard let value = value as? String, let data = value.data(using: .utf8) else { return nil }
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
    }

    static func sameOrigin(_ lhs: URL, _ rhs: URL) -> Bool {
        func port(_ url: URL) -> Int { url.port ?? (url.scheme == "https" ? 443 : 80) }
        return lhs.scheme?.lowercased() == rhs.scheme?.lowercased()
            && lhs.host?.lowercased() == rhs.host?.lowercased() && port(lhs) == port(rhs)
    }

    static func action(_ payload: [String: Any]) -> String? {
        typealias B = HavraBConfiguration.Bridge
        let fields = [(B.purchaseSelector, B.purchaseAction), (B.closeSelector, close),
                      (B.openSelector, B.openAction), (B.forwardSelector, B.forwardAction)]
        let matches = fields.filter { text(payload[$0.0]) == $0.1 }
        return matches.count == 1 ? matches.first?.1 : nil
    }

    static func externalURL(_ value: Any?) -> URL? {
        guard var value = text(value) else { return nil }
        if value.hasPrefix("["), value.hasSuffix(")"), let range = value.range(of: "](", options: .backwards) {
            value = String(value[range.upperBound...].dropLast())
        }
        return text(value).flatMap(URL.init(string:))
    }

    static func purchaseResult(order: String, product: String, status: String, message: String,
                               reason: String? = nil) -> [String: Any] {
        typealias C = HavraBConfiguration.Callback
        var payload: [String: Any] = [C.event: C.purchaseEvent, C.orderID: order, C.productID: product,
                                    C.success: status == "verified", C.status: status, C.message: message]
        if let reason { payload[C.reason] = reason }
        return payload
    }
}

struct HavraBEntryConfiguration {
    let pageURL: URL
    let channel: String
    let socketURL: URL

}

enum HavraBConnectionError: LocalizedError {
    case summerImaginationCanvas, summerInspirationCanvas, summerReflectionCanvas
    var errorDescription: String? {
        switch self {
        case .summerImaginationCanvas: return "Unable to connect. Please try again."
        case .summerInspirationCanvas: return "The connection details are incomplete. Please try again later."
        case .summerReflectionCanvas: return "Your purchase is awaiting confirmation. Please try again later."
        }
    }
}
