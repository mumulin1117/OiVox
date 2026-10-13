import Foundation

struct BilingualstressTempo: LocalizedError {
    let vibeMapLink: toneMapLink; let pulseAtlasPair: String; let buzzMark: Bool
    init(_ quickVocal: toneMapLink, _ quickSound: String? = nil, flowBuzz: Bool = true) { self.vibeMapLink = quickVocal; self.pulseAtlasPair = quickSound ?? quickVocal.rawValue; self.buzzMark = flowBuzz }
    var errorDescription: String? { pulseAtlasPair }
}
