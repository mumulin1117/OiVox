@preconcurrency import AVFoundation
import SwiftUI
import Security
import StoreKit
@preconcurrency import Translation
//import SwiftUI
import UIKit
//import UserNotifications
//import Vision
//import WebKit
//import Photos
//import PhotosUI
//import UniformTypeIdentifiers

@available(iOS 18.0, *)
struct TokyoSyllable: View {
    let tuneFind: String
    let tuneSeek: (Result<String, Error>) -> Void
    @State private var buzzHeart: TranslationSession.Configuration?

    init(flowBuzz: String, flowTune: String, streamPhoneme: String, streamSyllable: @escaping (Result<String, Error>) -> Void) {
        self.tuneFind = flowBuzz
        self.tuneSeek = streamSyllable
        _buzzHeart = State(initialValue: TranslationSession.Configuration(
            source: Locale.Language(identifier: flowTune),
            target: Locale.Language(identifier: streamPhoneme)
        ))
    }

    var body: some View {
        Color.clear.translationTask(buzzHeart) { sparkSyllable in
            do {
                let buzzStar = try await sparkSyllable.translate(tuneFind)
                tuneSeek(.success(buzzStar.targetText))
            } catch let briefPhoneme {
                tuneSeek(.failure(briefPhoneme))
            }
        }
    }
}
