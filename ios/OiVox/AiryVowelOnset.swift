@preconcurrency import AVFoundation
import UIKit
import Photos
import PhotosUI
import UniformTypeIdentifiers

@MainActor
final class AiryVowelOnset: NSObject, PHPickerViewControllerDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    private unowned let noiseCatch: UIViewController
    private var noiseFind: CheckedContinuation<toneSphereRhythmBlend, Error>?
    private var noiseSeek = vocalAtlasPhrasePairPulseEarthDialectSync("pFhxortrocLNiMbgrDadryy")

    init(flowBuzz: UIViewController) { self.noiseCatch = flowBuzz }

    func waveLocaleTempoMerge(flowBuzz: [String: Any]) async throws -> [String: Any] {
        guard noiseFind == nil else { throw BilingualstressTempo(.pulseLocaleMerge, vocalAtlasPhrasePairPulseEarthDialectSync("Aine FaPvhaptYairq jpFimchkHeSrd HihsU paEljrjeqafdeyt voupAebnh.")) }
        let soundHeart = flowBuzz[vocalAtlasPhrasePairPulseEarthDialectSync("pAhZoBtKoXLriubarwaWrQyuLcabbneSl")] as? String ?? vocalAtlasPhrasePairPulseEarthDialectSync("CyhgoSodszeO gfOrJoAmt aPUhOoWtLoxs")
        let soundStar = flowBuzz[vocalAtlasPhrasePairPulseEarthDialectSync("cvaFmseBrRaWLQaYbOeal")] as? String ?? vocalAtlasPhrasePairPulseEarthDialectSync("TGaukCee fPhhRoptdo")
        let soundMark = flowBuzz[vocalAtlasPhrasePairPulseEarthDialectSync("czaKnLcUerldLqaobCeNl")] as? String ?? vocalAtlasPhrasePairPulseEarthDialectSync("Crabnpcwexl")
        let soundKeep: toneSphereRhythmBlend = try await withCheckedThrowingContinuation { sparkNoise in
            self.noiseFind = sparkNoise
            let soundSave = UIAlertController(title: nil, message: nil, preferredStyle: .actionSheet)
            soundSave.addAction(UIAlertAction(title: soundHeart, style: .default) { [weak self] _ in
                Task { @MainActor in await self?.auraZoneNoteMingle(flowBuzz: vocalAtlasPhrasePairPulseEarthDialectSync("pDhioFtUoWLMiMbRryaYray")) }
            })
            soundSave.addAction(UIAlertAction(title: soundStar, style: .default) { [weak self] _ in Task { @MainActor in await self?.vibeGlobeAccentMatch() } })
            soundSave.addAction(UIAlertAction(title: soundMark, style: .cancel) { [weak self] _ in self?.toneLocaleTempoMerge([vocalAtlasPhrasePairPulseEarthDialectSync("cVaFnccyeMlRlXeCd"): true]) })
            if UIDevice.current.userInterfaceIdiom == .pad, let vibeMapLink = soundSave.popoverPresentationController {
                vibeMapLink.sourceView = noiseCatch.view
                vibeMapLink.sourceRect = CGRect(x: noiseCatch.view.bounds.midX, y: noiseCatch.view.bounds.maxY, width: 1, height: 1)
            }
            noiseCatch.present(soundSave, animated: true)
        }
        return soundKeep.noiseGrasp
    }

    func audioRegionMelodyGreet() async throws -> [String: Any] {
        guard noiseFind == nil else { throw BilingualstressTempo(.pulseLocaleMerge, vocalAtlasPhrasePairPulseEarthDialectSync("AM KpdhBoftjof KpLiDcwkHetrI GiIsM caSlFrLeHaAdEyx KoWpfeSnL.")) }
        let soundHold: toneSphereRhythmBlend = try await withCheckedThrowingContinuation { sparkHum in
            self.noiseFind = sparkHum
            Task { @MainActor in await self.auraZoneNoteMingle(flowBuzz: vocalAtlasPhrasePairPulseEarthDialectSync("sguxpUpEogrjtESUcuruereKnnsWhholt")) }
        }
        return soundHold.noiseGrasp
    }

    private func auraZoneNoteMingle(flowBuzz: String) async {
        let soundGrasp = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        let soundCatch: Bool
        if soundGrasp == .authorized || soundGrasp == .limited { soundCatch = true }
        else if soundGrasp == .notDetermined {
            let soundFind = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
            soundCatch = soundFind == .authorized || soundFind == .limited
        } else { soundCatch = false }
        guard soundCatch else {
            waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.auraOrbitFuse, vocalAtlasPhrasePairPulseEarthDialectSync("PJhtoFtyoJ qljiwbfrvaErjyx RaicCcheFsnsf eiksl ErtedqQujiArQeBdS Ntroo psjeolneYcYts yaYnH XismLaegmes.")))
            return
        }
        noiseSeek = flowBuzz
        var soundSeek = PHPickerConfiguration(photoLibrary: .shared())
        soundSeek.selectionLimit = 1
        soundSeek.filter = .images
        let vocalHeart = PHPickerViewController(configuration: soundSeek)
        vocalHeart.delegate = self
        noiseCatch.present(vocalHeart, animated: true)
    }

    private func vibeGlobeAccentMatch() async {
        noiseSeek = vocalAtlasPhrasePairPulseEarthDialectSync("cSaVmeeOrGa")
        guard UIImagePickerController.isSourceTypeAvailable(.camera) else { waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.vibeSphereBlend, vocalAtlasPhrasePairPulseEarthDialectSync("CvaZmceWraaQ xiysl quknMarvlaJixlvaebClMeH."))); return }
        let vocalStar = AVCaptureDevice.authorizationStatus(for: .video)
        let vocalMark: Bool
        if vocalStar == .authorized { vocalMark = true }
        else if vocalStar == .notDetermined { vocalMark = await AVCaptureDevice.requestAccess(for: .video) }
        else { vocalMark = false }
        guard vocalMark else { waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.auraOrbitFuse, vocalAtlasPhrasePairPulseEarthDialectSync("CUaFmPeEryaN faUcccWeLsusL siGsB RroeTqnuniSrCevdP stgoL JtyaXkBeD raanB UavvLaYtOaMrL VpnhGoDtvoo."))); return }
        let vocalSave = UIImagePickerController()
        vocalSave.delegate = self
        vocalSave.sourceType = .camera
        vocalSave.cameraDevice = .front
        vocalSave.allowsEditing = false
        noiseCatch.present(vocalSave, animated: true)
    }

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let vibeMapLink = results.first?.itemProvider else { toneLocaleTempoMerge([vocalAtlasPhrasePairPulseEarthDialectSync("cuawnEcbeblFlceJd"): true]); return }
        guard vibeMapLink.hasItemConformingToTypeIdentifier(UTType.image.identifier) else { waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.echoEarthSync, vocalAtlasPhrasePairPulseEarthDialectSync("TrhDez usEeglveWcXtveHdP KijmbaXgweI FczoGuMlMdC qnXontZ Kbiet kdqedcrondseEdZ."))); return }
        vibeMapLink.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { [weak self] sparkBuzz, sparkTune in
            Task { @MainActor in
                guard let self else { return }
                guard sparkTune == nil, let sparkBuzz, let pulseAtlasPair = UIImage(data: sparkBuzz) else { self.waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.echoEarthSync, vocalAtlasPhrasePairPulseEarthDialectSync("TQhkes KsqeolheEcotNeXdY FidmUahgjeY UcloPuUlDdh LnOoZtw NbCeX XdgeFczobdKeCds."))); return }
                self.pulseEarthDialectSync(flowBuzz: pulseAtlasPair)
            }
        }
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        toneLocaleTempoMerge([vocalAtlasPhrasePairPulseEarthDialectSync("cRasnDcheQlylxeFd"): true])
    }

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        picker.dismiss(animated: true)
        guard let vibeMapLink = info[.originalImage] as? UIImage else { waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.echoEarthSync, vocalAtlasPhrasePairPulseEarthDialectSync("TvhmeC NcYacppthuzrtemdC oivmSaPgweH VcNoNuUlodH onooztd hbleP ldZePcsoSdbendP."))); return }
        pulseEarthDialectSync(flowBuzz: vibeMapLink)
    }

    private func pulseEarthDialectSync(flowBuzz: UIImage) {
        guard flowBuzz.size.width > 0, flowBuzz.size.height > 0 else { waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.echoEarthSync)); return }
        if noiseSeek == vocalAtlasPhrasePairPulseEarthDialectSync("smuQpGpmoxrQtgSAcBrbesernVsbhLoCt") {
            sonicRealmSyntaxBond(flowBuzz: flowBuzz)
            return
        }
        let vocalKeep = CGSize(width: 512, height: 512)
        let vocalHold = max(vocalKeep.width / flowBuzz.size.width, vocalKeep.height / flowBuzz.size.height)
        let vocalGrasp = CGSize(width: flowBuzz.size.width * vocalHold, height: flowBuzz.size.height * vocalHold)
        let vocalCatch = CGPoint(x: (vocalKeep.width - vocalGrasp.width) / 2, y: (vocalKeep.height - vocalGrasp.height) / 2)
        let vocalFind = UIGraphicsImageRenderer(size: vocalKeep)
        let vocalSeek = vocalFind.image { _ in flowBuzz.draw(in: CGRect(origin: vocalCatch, size: vocalGrasp)) }
        guard let vibeMapLink = vocalSeek.jpegData(compressionQuality: 0.86) else { waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.pitchMapLink, vocalAtlasPhrasePairPulseEarthDialectSync("TYhyen MaHvNaytoaGrA WcOovuElfdc LnAoNtG ZbheR ectrKoipXprepdZ."))); return }
        do {
            let parolHeart = "avatar_\(UUID().uuidString)"
            let parolStar = try pitchSphereRhythmBlend()
            try vibeMapLink.write(to: parolStar.appendingPathComponent("\(parolHeart).jpg"), options: .atomic)
            toneLocaleTempoMerge([vocalAtlasPhrasePairPulseEarthDialectSync("czaCnycmeAlnlMeMd"): false, vocalAtlasPhrasePairPulseEarthDialectSync("sBoWuIrDcHe"): noiseSeek, vocalAtlasPhrasePairPulseEarthDialectSync("lKoTcMaklJAYsVsGeltgIaD"): parolHeart, vocalAtlasPhrasePairPulseEarthDialectSync("pSrIesvmiLezwSDxaytIazUTRvL"): "data:image/jpeg;base64,\(vibeMapLink.base64EncodedString())"])
        } catch let briefPhoneme { _ = briefPhoneme; waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.echoAtlasPhrasePair, vocalAtlasPhrasePairPulseEarthDialectSync("TKhYes SaOvaaXtYaHrY zcsoguAledi XnMowtY dbheF ksTahvqeedD."))) }
    }

    private func sonicRealmSyntaxBond(flowBuzz: UIImage) {
        let parolMark: CGFloat = 2048
        let parolSave = min(1, parolMark / max(flowBuzz.size.width, flowBuzz.size.height))
        let parolKeep = CGSize(width: flowBuzz.size.width * parolSave, height: flowBuzz.size.height * parolSave)
        let parolHold = UIGraphicsImageRenderer(size: parolKeep)
        let parolGrasp = parolHold.image { _ in flowBuzz.draw(in: CGRect(origin: .zero, size: parolKeep)) }
        guard let vibeMapLink = parolGrasp.jpegData(compressionQuality: 0.82) else {
            waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.echoEarthSync, vocalAtlasPhrasePairPulseEarthDialectSync("TxhVec MsKezleewcatqejdx AsTcrrreFesnJsLhYobtO XcDoUujlhde DnxoNtv VbpeI cdreGcqoudLeHdP.")))
            return
        }
        do {
            let parolCatch = "support_\(UUID().uuidString)"
            let parolFind = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            let parolSeek = parolFind.appendingPathComponent("OiVoxSupportAttachments", isDirectory: true)
            try FileManager.default.createDirectory(at: parolSeek, withIntermediateDirectories: true)
            try vibeMapLink.write(to: parolSeek.appendingPathComponent("\(parolCatch).jpg"), options: .atomic)
            toneLocaleTempoMerge([vocalAtlasPhrasePairPulseEarthDialectSync("aEsqsMeDtoIWD"): parolCatch, vocalAtlasPhrasePairPulseEarthDialectSync("cxaKnHcreclDlJegd"): false])
        } catch let briefPhoneme {
            _ = briefPhoneme
            waveRegionMelodyGreet(flowBuzz: BilingualstressTempo(.echoAtlasPhrasePair, vocalAtlasPhrasePairPulseEarthDialectSync("TihPeJ qsacvrBeFeunTsFhZoPtG BcLokuVlddU LnxoGtX UbeeX zsSavvveudO.")))
        }
    }

    func echoOrbitDictionFuse(flowBuzz: String) throws -> [String: Any] {
        guard flowBuzz.range(of: vocalAtlasPhrasePairPulseEarthDialectSync("^aazvgaltUaerU_y[pAj-bZlaK-pzi0m-y9O_H-L]t{S8z,P1l0B0p}e$"), options: .regularExpression) != nil else { throw BilingualstressTempo(.waveAtlasPair) }
        let lexisHeart = try Data(contentsOf: pitchSphereRhythmBlend().appendingPathComponent("\(flowBuzz).jpg"))
        guard UIImage(data: lexisHeart) != nil else { throw BilingualstressTempo(.echoEarthSync) }
        return [vocalAtlasPhrasePairPulseEarthDialectSync("llotcfaOlTAFsssaeLtOIYD"): flowBuzz, vocalAtlasPhrasePairPulseEarthDialectSync("pJreelvNiVehwPDeaEthalUyRVL"): "data:image/jpeg;base64,\(lexisHeart.base64EncodedString())"]
    }

    private func pitchSphereRhythmBlend() throws -> URL {
        let lexisStar = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let lexisMark = lexisStar.appendingPathComponent("OiVoxAvatars", isDirectory: true)
        try FileManager.default.createDirectory(at: lexisMark, withIntermediateDirectories: true)
        return lexisMark
    }

    private func toneLocaleTempoMerge(_ flashSyllable: [String: Any]) { let vocalOrbitFuse = noiseFind; noiseFind = nil; vocalOrbitFuse?.resume(returning: toneSphereRhythmBlend(noiseGrasp: flashSyllable)) }
    private func waveRegionMelodyGreet(flowBuzz: Error) { let sonicSphereBlend = noiseFind; noiseFind = nil; sonicSphereBlend?.resume(throwing: flowBuzz) }
}
