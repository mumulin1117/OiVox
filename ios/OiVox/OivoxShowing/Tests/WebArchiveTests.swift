import Foundation
import Compression
import CryptoKit

@main
enum WebArchiveTests {
    static func main() throws {
        let manager = FileManager.default
        let project = URL(fileURLWithPath: manager.currentDirectoryPath)
        let source = project.appendingPathComponent("ios/OiVox/VivoxsoundKeep")
        let package = project.appendingPathComponent("ios/OiVox/OivoxShowing/meadow-resources.bundle")
        let workspace = manager.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try manager.createDirectory(at: workspace, withIntermediateDirectories: true)
        defer { try? manager.removeItem(at: workspace) }
        let data = try Data(contentsOf: package)
        let phrase = echoOrbitDictionFuse.humFind
        check(phrase.count > 30)
        let entries = try echoMapIdiomLink.noiseStar(data, noiseSave: phrase)
        let files = try manager.subpathsOfDirectory(atPath: source.path).filter {
            (try? source.appendingPathComponent($0).resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true
        }
        check(Set(entries.map(\.noiseKeep)) == Set(files))
        for entry in entries { check(try Data(contentsOf: source.appendingPathComponent(entry.noiseKeep)) == entry.flashNoise) }

        func rejected(_ action: () throws -> Void) {
            do { try action(); preconditionFailure("Invalid archive was accepted") } catch { }
        }
        rejected { _ = try echoMapIdiomLink.noiseStar(data, noiseSave: "wrong-key") }
        var damaged = data
        damaged[damaged.count / 2] ^= 1
        rejected { _ = try echoMapIdiomLink.noiseStar(damaged, noiseSave: phrase) }
        rejected { _ = try echoMapIdiomLink.noiseStar(Data(data.prefix(20)), noiseSave: phrase) }
        let key = SymmetricKey(data: SHA256.hash(data: Data(phrase.utf8)))
        let excessive = try AES.GCM.seal(Data([255, 255, 255, 127, 0]), using: key).combined!
        rejected { _ = try echoMapIdiomLink.noiseStar(excessive, noiseSave: phrase) }

        let copy = workspace.appendingPathComponent("copy.bundle")
        try echoMapIdiomLink.pulseGlobeAccentMatch(pitchRegionGreet: source, humStar: copy, noiseSave: phrase)
        check(try echoMapIdiomLink.noiseStar(Data(contentsOf: copy), noiseSave: phrase) == entries)
        let previous = try Data(contentsOf: copy)
        try echoMapIdiomLink.pulseGlobeAccentMatch(pitchRegionGreet: source, humStar: copy, noiseSave: phrase)
        check(try Data(contentsOf: copy) == previous, "An unchanged build should keep its cached package")

        let cache = workspace.appendingPathComponent("cache")
        func prepare() throws -> URL {
            try echoMapIdiomLink.noiseSeek(noiseFind: package, flashBuzz: cache, noiseSave: phrase, pitchAtlasPhrasePair: echoOrbitDictionFuse.pitchAtlasPhrasePair)
        }
        let root = try prepare()
        let first = root.appendingPathComponent("Registration/index.html")
        let modification = try first.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate
        check(try prepare() == root)
        check(try first.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate == modification)
        try Data("damaged cache".utf8).write(to: first)
        _ = try prepare()
        check(try Data(contentsOf: first) == Data(contentsOf: source.appendingPathComponent("Registration/index.html")))
        try manager.removeItem(at: first)
        _ = try prepare()
        check(manager.fileExists(atPath: first.path))

        let outside = workspace.appendingPathComponent("outside")
        try Data("untouched".utf8).write(to: outside)
        try manager.removeItem(at: first)
        try manager.createSymbolicLink(at: first, withDestinationURL: outside)
        _ = try prepare()
        check(try String(contentsOf: outside, encoding: .utf8) == "untouched")
        check(try first.resourceValues(forKeys: [.isSymbolicLinkKey]).isSymbolicLink == false)
        rejected { _ = try echoMapIdiomLink.noiseSeek(noiseFind: package, flashBuzz: cache, noiseSave: phrase, pitchAtlasPhrasePair: ["missing.html"]) }

        let linkedCache = workspace.appendingPathComponent("linked-cache")
        try manager.createSymbolicLink(at: linkedCache, withDestinationURL: cache)
        rejected { _ = try echoMapIdiomLink.noiseSeek(noiseFind: package, flashBuzz: linkedCache, noiseSave: phrase, pitchAtlasPhrasePair: echoOrbitDictionFuse.pitchAtlasPhrasePair) }

        let fixture = workspace.appendingPathComponent("fixture")
        try manager.createDirectory(at: fixture, withIntermediateDirectories: true)
        try manager.createSymbolicLink(at: fixture.appendingPathComponent("escape"), withDestinationURL: outside)
        rejected { try echoMapIdiomLink.pulseGlobeAccentMatch(pitchRegionGreet: fixture, humStar: copy, noiseSave: phrase) }
        try manager.removeItem(at: fixture.appendingPathComponent("escape"))
        let page = fixture.appendingPathComponent("index.html")
        try Data("version one".utf8).write(to: page)
        try echoMapIdiomLink.pulseGlobeAccentMatch(pitchRegionGreet: fixture, humStar: copy, noiseSave: phrase)
        let old = try echoMapIdiomLink.noiseSeek(noiseFind: copy, flashBuzz: cache, noiseSave: phrase, pitchAtlasPhrasePair: ["index.html"])
        try Data("version two".utf8).write(to: page)
        try echoMapIdiomLink.pulseGlobeAccentMatch(pitchRegionGreet: fixture, humStar: copy, noiseSave: phrase)
        let updated = try echoMapIdiomLink.noiseSeek(noiseFind: copy, flashBuzz: cache, noiseSave: phrase, pitchAtlasPhrasePair: ["index.html"])
        check(old != updated)
        check(try String(contentsOf: updated.appendingPathComponent("index.html"), encoding: .utf8) == "version two")
        check(try String(contentsOf: old.appendingPathComponent("index.html"), encoding: .utf8) == "version one")

        for path in ["../escape", "/absolute", "x/../escape", "x//y", "%2e%2e/escape", "x\\y"] {
            let crafted = try seal(raw(paths: [path]), phrase: phrase)
            rejected { _ = try echoMapIdiomLink.noiseStar(crafted, noiseSave: phrase) }
        }
        rejected { _ = try echoMapIdiomLink.noiseStar(seal(raw(paths: ["same", "same"]), phrase: phrase), noiseSave: phrase) }
        var trailing = raw(paths: ["file"])
        trailing.append(0)
        rejected { _ = try echoMapIdiomLink.noiseStar(seal(trailing, phrase: phrase), noiseSave: phrase) }
        let main = try Data(contentsOf: project.appendingPathComponent("ios/OiVox/vocalAtlasPhrasePairPulseEarthDialectSync.bundle"))
        check(try !echoMapIdiomLink.noiseStar(main, noiseSave: "vocalAtlasPhrasePairPulseEarthDialectSync").isEmpty)
    }

    private static func check(_ value: Bool, _ message: String = "Archive assertion failed") {
        precondition(value, message)
    }

    private static func append(_ value: Int, to data: inout Data) {
        var integer = UInt32(value).littleEndian
        withUnsafeBytes(of: &integer) { data.append(contentsOf: $0) }
    }

    private static func raw(paths: [String]) -> Data {
        var data = Data("OIVOX-BUNDLE-1".utf8)
        append(paths.count, to: &data)
        for path in paths {
            append(path.utf8.count, to: &data)
            data.append(Data(path.utf8))
            append(1, to: &data)
            data.append(1)
        }
        return data
    }

    private static func seal(_ data: Data, phrase: String) throws -> Data {
        func compressed(_ data: Data) -> Data {
            var buffer = Data(count: data.count + 4096)
            let count = buffer.withUnsafeMutableBytes { destination in
                data.withUnsafeBytes { source in
                    compression_encode_buffer(destination.bindMemory(to: UInt8.self).baseAddress!, destination.count,
                                              source.bindMemory(to: UInt8.self).baseAddress!, source.count, nil, COMPRESSION_LZFSE)
                }
            }
            check(count > 0)
            buffer.count = count
            var result = Data()
            append(data.count, to: &result)
            result.append(buffer)
            return result
        }
        let key = SymmetricKey(data: SHA256.hash(data: Data(phrase.utf8)))
        return try AES.GCM.seal(compressed(compressed(data)), using: key).combined!
    }
}
