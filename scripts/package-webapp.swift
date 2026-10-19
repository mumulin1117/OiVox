import Foundation
import Compression
import CryptoKit

let source = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let keyPhrase = "vocalAtlasPhrasePairPulseEarthDialectSync"

func appendUInt32(_ value: UInt32, to data: inout Data) {
    var little = value.littleEndian
    data.append(Data(bytes: &little, count: MemoryLayout<UInt32>.size))
}

func compress(_ input: Data) -> Data {
    var capacity = max(input.count + 1024, 4096)
    while true {
        var output = Data(count: capacity)
        let written = output.withUnsafeMutableBytes { destination in
            input.withUnsafeBytes { source in
                compression_encode_buffer(destination.bindMemory(to: UInt8.self).baseAddress!, capacity, source.bindMemory(to: UInt8.self).baseAddress!, input.count, nil, COMPRESSION_LZFSE)
            }
        }
        if written > 0 {
            output.count = written
            var result = Data()
            appendUInt32(UInt32(input.count), to: &result)
            result.append(output)
            return result
        }
        capacity *= 2
    }
}

let files = try FileManager.default
    .subpathsOfDirectory(atPath: source.path)
    .filter { relativePath in
        var isDirectory: ObjCBool = false
        let path = source.appendingPathComponent(relativePath).path
        return FileManager.default.fileExists(atPath: path, isDirectory: &isDirectory) && !isDirectory.boolValue
    }
    .sorted()

var archive = Data("OIVOX-BUNDLE-1".utf8)
appendUInt32(UInt32(files.count), to: &archive)
for relativePath in files {
    let fileURL = source.appendingPathComponent(relativePath)
    let pathData = Data(relativePath.utf8)
    let content = try Data(contentsOf: fileURL)
    appendUInt32(UInt32(pathData.count), to: &archive)
    archive.append(pathData)
    appendUInt32(UInt32(content.count), to: &archive)
    archive.append(content)
}

let packed = compress(compress(archive))
let key = SymmetricKey(data: SHA256.hash(data: Data(keyPhrase.utf8)))
let sealed = try AES.GCM.seal(packed, using: key)
try sealed.combined!.write(to: output, options: .atomic)
