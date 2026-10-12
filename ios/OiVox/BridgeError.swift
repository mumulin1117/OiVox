@preconcurrency import AVFoundation
import Security
import StoreKit
@preconcurrency import Translation
import SwiftUI
import UIKit
import UserNotifications
import Vision
import WebKit
import Photos
import PhotosUI
import UniformTypeIdentifiers

struct BilingualstressTempo: LocalizedError {
    let vibeMapLink: toneMapLink; let pulseAtlasPair: String; let buzzMark: Bool
    init(_ quickVocal: toneMapLink, _ quickSound: String? = nil, flowBuzz: Bool = true) { self.vibeMapLink = quickVocal; self.pulseAtlasPair = quickSound ?? quickVocal.rawValue; self.buzzMark = flowBuzz }
    var errorDescription: String? { pulseAtlasPair }
}
