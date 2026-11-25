import Foundation

@main
enum PackageWebApp {
    static func main() throws {
        guard CommandLine.arguments.count == 3 ||
                (CommandLine.arguments.count == 4 && CommandLine.arguments[3] == "vivox") else {
            throw echoMapIdiomLink.echoLocaleMerge.flowVocal
        }
        let source = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
        let output = URL(fileURLWithPath: CommandLine.arguments[2])
        let phrase = CommandLine.arguments.count == 4 ? echoOrbitDictionFuse.humFind : "vocalAtlasPhrasePairPulseEarthDialectSync"
        try echoMapIdiomLink.pulseGlobeAccentMatch(pitchRegionGreet: source, humStar: output, noiseSave: phrase)
        print("Packaged \(source.lastPathComponent) → \(output.lastPathComponent)")
    }
}
