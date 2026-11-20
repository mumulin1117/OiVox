// MonsoonStreetWalk.swift
// Havra · B module

import Foundation

@MainActor
final class MonsoonStreetWalk {
    var onMessage: (([String: Any], TimeInterval?) -> Void)?
    var onUnavailable: (() -> Void)?
    var onChanged: (() -> Void)?
    private var configuration: HavraBEntryConfiguration
    private let refresh: () async throws -> HavraBEntryConfiguration?
    private var connection: Task<Void, Never>?
    private var heartbeat: Task<Void, Never>?
    private var socket: URLSessionWebSocketTask?
    private var receivedIDs: [String] = []
    private var reconnect = false
    private var failures = 0

    init(configuration: HavraBEntryConfiguration, refresh: @escaping () async throws -> HavraBEntryConfiguration?) {
        self.configuration = configuration
        self.refresh = refresh
    }

    func start() {
        guard connection == nil else { return }
        connection = Task { [weak self] in
            while !Task.isCancelled {
                guard let self else { return }
                do {
                    if self.reconnect {
                        guard let next = try await self.refresh()
                        else {
                            self.onUnavailable?()
                            return
                        }
                        guard next.channel == self.configuration.channel,
                              HavraLifeLaunch.sameDocument(next.pageURL, self.configuration.pageURL)
                        else {
                            self.onChanged?()
                            return
                        }
                        self.configuration = next
                    }
                    self.reconnect = true
                    try Task.checkCancellation()
                    try await self.receive()
                } catch {
                    guard !Task.isCancelled else { return }
                    self.disconnect(code: .goingAway)
                    let delay = min(pow(2, Double(self.failures)), 30)
                    self.failures = min(self.failures + 1, 5)
                    try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                }
            }
        }
    }

    func stop() {
        reconnect = false
        connection?.cancel()
        connection = nil
        disconnect()
    }

    private func disconnect(code: URLSessionWebSocketTask.CloseCode = .normalClosure) {
        heartbeat?.cancel()
        heartbeat = nil
        socket?.cancel(with: code, reason: nil)
        socket = nil
    }

    private func receive() async throws {
        // 以下 action/channel/messages/encoding 为 Ably 固定协议；项目业务字段在 HavraBConfiguration.Bridge 中配置。
        let socket = URLSession.shared.webSocketTask(with: configuration.socketURL)
        self.socket = socket
        socket.resume()
        heartbeat = Task { [weak socket] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 25_000_000_000)
                guard !Task.isCancelled, let socket else { return }
                socket.sendPing { if $0 != nil { socket.cancel(with: .goingAway, reason: nil) } }
            }
        }
        while !Task.isCancelled {
            let message = try await socket.receive()
            try Task.checkCancellation()
            let data: Data
            switch message {
            case .data(let value): data = value
            case .string(let value): data = Data(value.utf8)
            @unknown default: continue
            }
            guard data.count <= 1_048_576,
                  let payload = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { continue }
            switch payload["action"] as? Int {
            case 4:
                let data = try JSONSerialization.data(withJSONObject: ["action": 10, "channel": configuration.channel])
                try await socket.send(.string(String(decoding: data, as: UTF8.self)))
            case 11:
                guard self.socket === socket, payload["channel"] as? String == configuration.channel else { continue }
                failures = 0
            case 15:
                guard payload["channel"] as? String == configuration.channel,
                      let messages = payload["messages"] as? [[String: Any]] else { continue }
                for (index, message) in messages.enumerated() {
                    let id = message["id"] as? String ?? (payload["id"] as? String).map { "\($0):\(index)" }
                    if let id {
                        if receivedIDs.contains(id) { continue }
                        receivedIDs = Array((receivedIDs + [id]).suffix(256))
                    }
                    if let value = Self.decode(message) { onMessage?(value, (message["timestamp"] ?? payload["timestamp"]) as? Double) }
                }
            case 5, 6, 8, 9, 13, 17: throw HavraBConnectionError.summerImaginationCanvas
            default: break
            }
        }
    }

    static func decode(_ message: [String: Any]) -> [String: Any]? {
        var value: Any = message["data"] ?? [:]
        for encoding in (message["encoding"] as? String ?? "").split(separator: "/").reversed() {
            if encoding == "base64", let string = value as? String, let data = Data(base64Encoded: string) {
                value = String(data: data, encoding: .utf8) ?? ""
            } else if encoding == "json" {
                guard let dictionary = BambooLanternPath.dictionary(value) else { return nil }
                value = dictionary
            } else if encoding != "utf-8" { return nil }
        }
        return BambooLanternPath.dictionary(value)
    }
}
