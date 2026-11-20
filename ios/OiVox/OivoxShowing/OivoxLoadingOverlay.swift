import UIKit

/// Owns the loading and retry presentation above the active page for the life of the scene.
@MainActor
final class OivoxLoadingOverlay: UIView {
    static let background = UIColor(red: 0.98, green: 0.94, blue: 0.97, alpha: 1)

    private enum State { case hidden, loading, failure, revealing }

    private let backdrop = UIView()
    private let launchImage = UIImageView(image: UIImage(named: "oIcoxlaungcjh"))
    private let snapshotHost = UIView()
    private let scrim = UIView()
    private let artwork = OivoxLoadingArtwork()
    private let failureLabel = UILabel()
    private let retryButton = UIButton(type: .system)
    private let failurePanel = UIStackView()
    private var state = State.hidden
    private var artworkIn: UIViewPropertyAnimator?
    private var revealAnimator: UIViewPropertyAnimator?
    private var delayedArtwork: Task<Void, Never>?
    private var retry: (() -> Void)?
    private var launchLayout: [NSLayoutConstraint] = []
    private var pageLayout: [NSLayoutConstraint] = []
    private var usesLaunchLayout = false
    private var motionActive = true

    init() {
        super.init(frame: .zero)
        isHidden = true
        accessibilityViewIsModal = true

        backdrop.backgroundColor = Self.background
        pin(backdrop, to: self)
        launchImage.contentMode = .scaleAspectFill
        launchImage.clipsToBounds = true
        launchImage.accessibilityElementsHidden = true
        snapshotHost.accessibilityElementsHidden = true
        snapshotHost.clipsToBounds = true
        scrim.backgroundColor = UIColor(red: 0.984, green: 0.961, blue: 0.980, alpha: 0.74)
        for layer in [launchImage, snapshotHost, scrim] {
            pin(layer, to: backdrop)
        }

        artwork.isAccessibilityElement = true
        artwork.accessibilityTraits = [.updatesFrequently]

        let safe = safeAreaLayoutGuide
        let launchGuide = UILayoutGuide()
        addLayoutGuide(launchGuide)
        artwork.translatesAutoresizingMaskIntoConstraints = false
        addSubview(artwork)
        let launchWidth = artwork.widthAnchor.constraint(equalTo: safe.widthAnchor, multiplier: 0.31)
        let pageWidth = artwork.widthAnchor.constraint(equalTo: safe.widthAnchor, multiplier: 0.27)
        for width in [launchWidth, pageWidth] { width.priority = .defaultHigh }
        launchLayout = [artwork.centerYAnchor.constraint(equalTo: launchGuide.bottomAnchor), launchWidth]
        pageLayout = [artwork.centerYAnchor.constraint(equalTo: safe.centerYAnchor), pageWidth]
        NSLayoutConstraint.activate([
            launchGuide.topAnchor.constraint(equalTo: safe.topAnchor),
            launchGuide.heightAnchor.constraint(equalTo: safe.heightAnchor, multiplier: 0.615),
            launchGuide.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            launchGuide.widthAnchor.constraint(equalToConstant: 0),
            artwork.centerXAnchor.constraint(equalTo: safe.centerXAnchor),
            artwork.heightAnchor.constraint(equalTo: artwork.widthAnchor, multiplier: 1 / 1.64),
            artwork.widthAnchor.constraint(lessThanOrEqualToConstant: 136),
            artwork.widthAnchor.constraint(lessThanOrEqualTo: safe.heightAnchor, multiplier: 0.43),
        ] + pageLayout)

        failureLabel.font = .preferredFont(forTextStyle: .body)
        failureLabel.adjustsFontForContentSizeCategory = true
        failureLabel.numberOfLines = 0
        failureLabel.textAlignment = .center
        failureLabel.textColor = UIColor(red: 0.17, green: 0.13, blue: 0.22, alpha: 1)
        retryButton.setTitleColor(UIColor(red: 0.33, green: 0.24, blue: 0.58, alpha: 1), for: .normal)
        retryButton.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        retryButton.titleLabel?.adjustsFontForContentSizeCategory = true
        retryButton.addAction(UIAction { [weak self] _ in self?.retry?() }, for: .touchUpInside)

        failurePanel.translatesAutoresizingMaskIntoConstraints = false
        failurePanel.axis = .vertical
        failurePanel.alignment = .center
        failurePanel.spacing = 8
        failurePanel.isLayoutMarginsRelativeArrangement = true
        failurePanel.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 18, leading: 22, bottom: 8, trailing: 22)
        failurePanel.backgroundColor = UIColor(red: 1, green: 0.98, blue: 0.99, alpha: 0.97)
        failurePanel.layer.cornerRadius = 24
        failurePanel.layer.cornerCurve = .continuous
        failurePanel.addArrangedSubview(failureLabel)
        failurePanel.addArrangedSubview(retryButton)
        addSubview(failurePanel)
        let panelWidth = failurePanel.widthAnchor.constraint(equalTo: safe.widthAnchor, constant: -40)
        panelWidth.priority = .defaultHigh
        NSLayoutConstraint.activate([
            failurePanel.centerXAnchor.constraint(equalTo: safe.centerXAnchor),
            failurePanel.centerYAnchor.constraint(equalTo: safe.centerYAnchor),
            failurePanel.widthAnchor.constraint(lessThanOrEqualToConstant: 360),
            failurePanel.widthAnchor.constraint(lessThanOrEqualTo: safe.widthAnchor, constant: -40),
            panelWidth,
            failureLabel.widthAnchor.constraint(equalTo: failurePanel.layoutMarginsGuide.widthAnchor),
            retryButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)
        ])
        NotificationCenter.default.addObserver(self, selector: #selector(reduceMotionChanged),
                                               name: UIAccessibility.reduceMotionStatusDidChangeNotification, object: nil)
    }

    required init?(coder: NSCoder) { nil }

    private func pin(_ view: UIView, to container: UIView) {
        view.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(view)
        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: container.topAnchor),
            view.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            view.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            view.trailingAnchor.constraint(equalTo: container.trailingAnchor)
        ])
    }

    func begin(showLaunch: Bool, over currentView: UIView?, label: String) {
        guard state != .loading else { return }
        let retrying = state == .failure
        revealAnimator?.stopAnimation(true)
        revealAnimator = nil
        endArtworkIn()
        if !retrying {
            snapshotHost.subviews.forEach { $0.removeFromSuperview() }
            if !showLaunch, let currentView, let snapshot = currentView.snapshotView(afterScreenUpdates: false) {
                snapshot.frame = snapshotHost.bounds
                snapshot.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                snapshotHost.addSubview(snapshot)
            }
            launchImage.isHidden = !showLaunch
            scrim.alpha = 0
        }
        state = .loading
        backdrop.alpha = 1
        isHidden = false
        retry = nil
        failurePanel.isHidden = true
        if usesLaunchLayout != showLaunch {
            NSLayoutConstraint.deactivate(usesLaunchLayout ? launchLayout : pageLayout)
            NSLayoutConstraint.activate(showLaunch ? launchLayout : pageLayout)
            usesLaunchLayout = showLaunch
        }
        artwork.accessibilityLabel = label
        artwork.alpha = 0
        artwork.isHidden = true

        // A quick load can go directly from the held frame to the next page, without flashing the artwork.
        delayedArtwork?.cancel()
        delayedArtwork = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 160_000_000)
            guard !Task.isCancelled, let self, self.state == .loading else { return }
            self.showArtwork()
        }
    }

    func fail(message: String, button: String, retry: @escaping () -> Void) {
        state = .failure
        self.retry = retry
        delayedArtwork?.cancel()
        delayedArtwork = nil
        endArtworkIn()
        artwork.setAnimating(false)
        artwork.isHidden = true
        scrim.alpha = launchImage.isHidden ? 1 : 0
        failureLabel.text = message
        retryButton.setTitle(button, for: .normal)
        failurePanel.isHidden = false
        UIAccessibility.post(notification: .layoutChanged, argument: failureLabel)
    }

    func reveal() {
        guard state == .loading else { return }
        delayedArtwork?.cancel()
        delayedArtwork = nil
        endArtworkIn()
        state = .revealing
        // Keep the overlay itself interactive until the backdrop has fully uncovered the next page.
        let duration = UIAccessibility.isReduceMotionEnabled ? 0.12 : (artwork.alpha > 0 ? 0.32 : 0.22)
        let fade = UIViewPropertyAnimator(duration: duration, curve: .easeInOut) { [weak self] in
            self?.backdrop.alpha = 0
            self?.artwork.alpha = 0
        }
        fade.addCompletion { [weak self] _ in
            guard let self, self.state == .revealing else { return }
            self.revealAnimator = nil
            self.clear()
        }
        revealAnimator = fade
        fade.startAnimation()
    }

    func clear() {
        state = .hidden
        revealAnimator?.stopAnimation(true)
        revealAnimator = nil
        endArtworkIn()
        delayedArtwork?.cancel()
        delayedArtwork = nil
        retry = nil
        artwork.setAnimating(false)
        artwork.isHidden = true
        snapshotHost.subviews.forEach { $0.removeFromSuperview() }
        isHidden = true
    }

    func setMotionActive(_ active: Bool) {
        motionActive = active
        reduceMotionChanged()
    }

    private func showArtwork() {
        delayedArtwork = nil
        artwork.isHidden = false
        reduceMotionChanged()
        let appearance = UIViewPropertyAnimator(duration: UIAccessibility.isReduceMotionEnabled ? 0.10 : 0.20,
                                                curve: .easeOut) { [weak self] in
            guard let self else { return }
            self.artwork.alpha = 1
            self.scrim.alpha = self.launchImage.isHidden ? 1 : 0
        }
        appearance.addCompletion { [weak self] _ in self?.artworkIn = nil }
        artworkIn = appearance
        appearance.startAnimation()
    }

    private func endArtworkIn() {
        guard let artworkIn else { return }
        let glyphAlpha = artwork.layer.presentation()?.opacity ?? 0
        let scrimAlpha = scrim.layer.presentation()?.opacity ?? 0
        artworkIn.stopAnimation(true)
        self.artworkIn = nil
        artwork.alpha = CGFloat(glyphAlpha)
        scrim.alpha = CGFloat(scrimAlpha)
    }

    @objc private func reduceMotionChanged() {
        artwork.setAnimating(state == .loading && !artwork.isHidden && motionActive && !UIAccessibility.isReduceMotionEnabled)
    }
}

enum OivoxPurchasePhase { case submitting, verifying, finished }

enum OivoxPurchaseNotice {
    case loading, verifying, waitingForUpdate
    case confirmed, userCancelled, approvalPending, verificationPending, purchaseInProgress
    case invalidPurchaseRequest, purchaseExpired, purchaseNotReady, orderUnavailable
    case paymentUnavailable, productUnavailable, purchaseFailed, orderStorageUnavailable
    case receiptUnavailable, verificationUnavailable, verificationConnectionFailed, verificationResponseRejected

    static func result(status: String, reason: String?) -> Self? {
        switch status {
        case "verified": return .confirmed
        case "cancelled": return .userCancelled
        case "pending":
            switch reason {
            case "approvalPending": return .approvalPending
            case "purchaseInProgress": return .purchaseInProgress
            default: return .verificationPending
            }
        case "failed":
            switch reason {
            case "invalidPurchaseRequest": return .invalidPurchaseRequest
            case "purchaseExpired": return .purchaseExpired
            case "purchaseNotReady": return .purchaseNotReady
            case "orderUnavailable": return .orderUnavailable
            case "paymentUnavailable": return .paymentUnavailable
            case "productUnavailable": return .productUnavailable
            default: return .purchaseFailed
            }
        default: return nil
        }
    }

    var text: String {
        let copy: [String: String]
        switch self {
        case .loading:
            copy = [
                "en": "Waiting for the App Store…",
                "ar": "بانتظار App Store…",
                "he": "ממתינים ל‑App Store…",
                "tr": "App Store bekleniyor…",
                "fr": "En attente de l’App Store…",
                "de": "Warten auf den App Store…",
                "ja": "App Store の応答を待っています…",
                "ko": "App Store 응답을 기다리는 중…"
            ]
        case .verifying:
            copy = [
                "en": "Verifying your purchase…",
                "ar": "جارٍ التحقق من عملية الشراء…",
                "he": "מאמתים את הרכישה…",
                "tr": "Satın alma doğrulanıyor…",
                "fr": "Vérification de votre achat…",
                "de": "Dein Kauf wird geprüft…",
                "ja": "購入を確認しています…",
                "ko": "구매를 확인하는 중…"
            ]
        case .waitingForUpdate:
            copy = [
                "en": "Your purchase status hasn’t been confirmed yet.",
                "ar": "لم يتم تأكيد حالة عملية الشراء بعد.",
                "he": "מצב הרכישה עדיין לא אושר.",
                "tr": "Satın alma durumu henüz doğrulanmadı.",
                "fr": "Le statut de votre achat n’est pas encore confirmé.",
                "de": "Der Status deines Kaufs ist noch nicht bestätigt.",
                "ja": "購入状況はまだ確認できていません。",
                "ko": "구매 상태가 아직 확인되지 않았습니다."
            ]
        case .confirmed:
            copy = [
                "en": "Payment successful.",
                "ar": "تم الدفع بنجاح.",
                "he": "התשלום בוצע בהצלחה.",
                "tr": "Ödeme başarılı.",
                "fr": "Paiement réussi.",
                "de": "Zahlung erfolgreich.",
                "ja": "支払いが完了しました。",
                "ko": "결제가 완료되었습니다."
            ]
        case .userCancelled:
            copy = [
                "en": "The purchase was cancelled in the App Store.",
                "ar": "أُلغيت عملية الشراء في App Store.",
                "he": "הרכישה בוטלה ב‑App Store.",
                "tr": "Satın alma App Store’da iptal edildi.",
                "fr": "L’achat a été annulé dans l’App Store.",
                "de": "Der Kauf wurde im App Store abgebrochen.",
                "ja": "App Store で購入がキャンセルされました。",
                "ko": "App Store에서 구매가 취소되었습니다."
            ]
        case .approvalPending:
            copy = [
                "en": "The purchase is waiting for approval through Apple.",
                "ar": "عملية الشراء بانتظار الموافقة لدى Apple.",
                "he": "הרכישה ממתינה לאישור דרך Apple.",
                "tr": "Satın alma, Apple üzerinden onay bekliyor.",
                "fr": "L’achat attend une autorisation auprès d’Apple.",
                "de": "Der Kauf wartet auf eine Genehmigung über Apple.",
                "ja": "購入は Apple 経由の承認待ちです。",
                "ko": "Apple을 통한 구매 승인을 기다리는 중입니다."
            ]
        case .verificationPending:
            copy = [
                "en": "Your purchase is still awaiting confirmation.",
                "ar": "لا تزال عملية الشراء بانتظار التأكيد.",
                "he": "הרכישה עדיין ממתינה לאישור.",
                "tr": "Satın alma hâlâ doğrulama bekliyor.",
                "fr": "Votre achat attend toujours une confirmation.",
                "de": "Die Bestätigung deines Kaufs steht noch aus.",
                "ja": "購入の確認がまだ完了していません。",
                "ko": "아직 구매 확인을 기다리고 있습니다."
            ]
        case .purchaseInProgress:
            copy = [
                "en": "Another purchase is already in progress.",
                "ar": "هناك عملية شراء أخرى قيد التنفيذ.",
                "he": "רכישה אחרת כבר מתבצעת.",
                "tr": "Başka bir satın alma işlemi zaten sürüyor.",
                "fr": "Un autre achat est déjà en cours.",
                "de": "Ein anderer Kauf läuft bereits.",
                "ja": "別の購入手続きが進行中です。",
                "ko": "다른 구매가 이미 진행 중입니다."
            ]
        case .invalidPurchaseRequest:
            copy = [
                "en": "The purchase request is invalid or incomplete.",
                "ar": "طلب الشراء غير صالح أو غير مكتمل.",
                "he": "בקשת הרכישה אינה תקינה או אינה מלאה.",
                "tr": "Satın alma isteği geçersiz veya eksik.",
                "fr": "La demande d’achat est invalide ou incomplète.",
                "de": "Die Kaufanfrage ist ungültig oder unvollständig.",
                "ja": "購入リクエストが無効か不完全です。",
                "ko": "구매 요청이 올바르지 않거나 정보가 누락되었습니다."
            ]
        case .purchaseExpired:
            copy = [
                "en": "This purchase request has expired. Start the purchase again.",
                "ar": "انتهت صلاحية طلب الشراء. ابدأ عملية الشراء مجددًا.",
                "he": "פג תוקף בקשת הרכישה. יש להתחיל את הרכישה מחדש.",
                "tr": "Satın alma isteğinin süresi doldu. Satın almayı yeniden başlat.",
                "fr": "Cette demande d’achat a expiré. Relancez l’achat.",
                "de": "Diese Kaufanfrage ist abgelaufen. Starte den Kauf erneut.",
                "ja": "購入リクエストの有効期限が切れました。購入をやり直してください。",
                "ko": "구매 요청이 만료되었습니다. 구매를 다시 시작하세요."
            ]
        case .purchaseNotReady:
            copy = [
                "en": "The payment connection isn’t ready. Please wait a moment.",
                "ar": "اتصال الدفع غير جاهز. يرجى الانتظار قليلًا.",
                "he": "חיבור התשלום עדיין לא זמין. יש להמתין רגע.",
                "tr": "Ödeme bağlantısı henüz hazır değil. Biraz bekle.",
                "fr": "La connexion de paiement n’est pas prête. Patientez un instant.",
                "de": "Die Zahlungsverbindung ist noch nicht bereit. Bitte warte kurz.",
                "ja": "決済への接続を準備中です。少しお待ちください。",
                "ko": "결제 연결을 준비 중입니다. 잠시 기다려 주세요."
            ]
        case .orderUnavailable:
            copy = [
                "en": "This order is already linked to a different purchase.",
                "ar": "هذا الطلب مرتبط بالفعل بعملية شراء مختلفة.",
                "he": "ההזמנה הזו כבר מקושרת לרכישה אחרת.",
                "tr": "Bu sipariş zaten başka bir satın almayla ilişkili.",
                "fr": "Cette commande est déjà liée à un autre achat.",
                "de": "Diese Bestellung ist bereits mit einem anderen Kauf verknüpft.",
                "ja": "この注文はすでに別の購入に紐付いています。",
                "ko": "이 주문은 이미 다른 구매에 연결되어 있습니다."
            ]
        case .paymentUnavailable:
            copy = [
                "en": "The App Store doesn’t allow purchases on this device right now.",
                "ar": "لا يسمح App Store بإجراء عمليات شراء على هذا الجهاز حاليًا.",
                "he": "ה‑App Store לא מאפשר כרגע רכישות במכשיר זה.",
                "tr": "App Store şu anda bu cihazda satın almaya izin vermiyor.",
                "fr": "L’App Store n’autorise pas les achats sur cet appareil pour le moment.",
                "de": "Der App Store erlaubt auf diesem Gerät derzeit keine Käufe.",
                "ja": "現在、この端末では App Store の購入が許可されていません。",
                "ko": "현재 이 기기에서는 App Store에서 구매할 수 없습니다."
            ]
        case .productUnavailable:
            copy = [
                "en": "This item is currently unavailable in the App Store.",
                "ar": "هذا العنصر غير متاح حاليًا في App Store.",
                "he": "הפריט הזה אינו זמין כרגע ב‑App Store.",
                "tr": "Bu ürün şu anda App Store’da kullanılamıyor.",
                "fr": "Cet article est actuellement indisponible dans l’App Store.",
                "de": "Dieser Artikel ist im App Store derzeit nicht verfügbar.",
                "ja": "この商品は現在 App Store で購入できません。",
                "ko": "현재 App Store에서 이 상품을 구매할 수 없습니다."
            ]
        case .purchaseFailed:
            copy = [
                "en": "The App Store couldn’t complete the purchase.",
                "ar": "تعذّر على App Store إكمال عملية الشراء.",
                "he": "לא ניתן היה להשלים את הרכישה דרך ה‑App Store.",
                "tr": "App Store satın almayı tamamlayamadı.",
                "fr": "L’App Store n’a pas pu finaliser l’achat.",
                "de": "Der App Store konnte den Kauf nicht abschließen.",
                "ja": "App Store で購入を完了できませんでした。",
                "ko": "App Store에서 구매를 완료하지 못했습니다."
            ]
        case .orderStorageUnavailable:
            copy = [
                "en": "The app couldn’t read or save the purchase record.",
                "ar": "تعذّر على التطبيق قراءة سجل الشراء أو حفظه.",
                "he": "האפליקציה לא הצליחה לקרוא או לשמור את פרטי הרכישה.",
                "tr": "Uygulama satın alma kaydını okuyamadı veya kaydedemedi.",
                "fr": "L’application n’a pas pu lire ou enregistrer les données de l’achat.",
                "de": "Die App konnte die Kaufdaten nicht lesen oder speichern.",
                "ja": "購入記録を読み込むか保存することができませんでした。",
                "ko": "앱에서 구매 기록을 읽거나 저장하지 못했습니다."
            ]
        case .receiptUnavailable:
            copy = [
                "en": "The App Store receipt isn’t available yet. Confirmation is pending.",
                "ar": "إيصال App Store غير متاح بعد. عملية الشراء بانتظار التأكيد.",
                "he": "הקבלה מה‑App Store עדיין לא זמינה. הרכישה ממתינה לאישור.",
                "tr": "App Store makbuzu henüz alınamadı. Satın alma doğrulama bekliyor.",
                "fr": "Le reçu de l’App Store n’est pas encore disponible. La confirmation est en attente.",
                "de": "Der Beleg des App Store liegt noch nicht vor. Die Bestätigung steht aus.",
                "ja": "App Store のレシートを取得できていません。購入は確認待ちです。",
                "ko": "App Store 영수증이 아직 준비되지 않았습니다. 구매 확인을 기다리는 중입니다."
            ]
        case .verificationUnavailable:
            copy = [
                "en": "Purchase verification is temporarily unavailable.",
                "ar": "التحقق من عمليات الشراء غير متاح مؤقتًا.",
                "he": "אימות הרכישות אינו זמין כרגע.",
                "tr": "Satın alma doğrulaması geçici olarak kullanılamıyor.",
                "fr": "La vérification des achats est temporairement indisponible.",
                "de": "Die Kaufprüfung ist vorübergehend nicht verfügbar.",
                "ja": "現在、購入を確認できません。",
                "ko": "현재 구매 확인 서비스를 이용할 수 없습니다."
            ]
        case .verificationConnectionFailed:
            copy = [
                "en": "Couldn’t reach the verification server. Confirmation is pending.",
                "ar": "تعذّر الاتصال بخادم التحقق. عملية الشراء بانتظار التأكيد.",
                "he": "לא ניתן להתחבר לשרת האימות. הרכישה ממתינה לאישור.",
                "tr": "Doğrulama sunucusuna ulaşılamadı. Satın alma doğrulama bekliyor.",
                "fr": "Le serveur de vérification est inaccessible. La confirmation est en attente.",
                "de": "Der Prüfserver ist nicht erreichbar. Die Bestätigung steht aus.",
                "ja": "確認サーバーに接続できませんでした。購入は確認待ちです。",
                "ko": "확인 서버에 연결하지 못했습니다. 구매 확인을 기다리는 중입니다."
            ]
        case .verificationResponseRejected:
            copy = [
                "en": "The server did not confirm this purchase. Verification is pending.",
                "ar": "لم يؤكد الخادم عملية الشراء. التحقق قيد الانتظار.",
                "he": "השרת לא אישר את הרכישה. האימות עדיין ממתין.",
                "tr": "Sunucu bu satın almayı doğrulamadı. Doğrulama bekleniyor.",
                "fr": "Le serveur n’a pas confirmé cet achat. La vérification est en attente.",
                "de": "Der Server hat diesen Kauf nicht bestätigt. Die Prüfung steht noch aus.",
                "ja": "サーバーから購入の確認が得られませんでした。確認待ちです。",
                "ko": "서버에서 구매를 확인하지 못했습니다. 구매 확인을 기다리는 중입니다."
            ]
        }
        return copy[briefPhoneme.vocalOrbitFuse] ?? copy["en"]!
    }
}

@MainActor
final class OivoxPurchaseFeedbackView: UIView {
    private let spinner = UIActivityIndicatorView(style: .medium)
    private let label = UILabel()

    init() {
        super.init(frame: .zero)
        translatesAutoresizingMaskIntoConstraints = false
        accessibilityViewIsModal = true
        backgroundColor = UIColor(red: 0.17, green: 0.13, blue: 0.22, alpha: 0.24)

        spinner.hidesWhenStopped = true
        spinner.color = .label
        spinner.isAccessibilityElement = false
        label.font = .preferredFont(forTextStyle: .subheadline)
        label.adjustsFontForContentSizeCategory = true
        label.textColor = .label
        label.textAlignment = .center
        label.numberOfLines = 0
        label.setContentCompressionResistancePriority(UILayoutPriority(751), for: .vertical)

        let panel = UIStackView(arrangedSubviews: [spinner, label])
        panel.translatesAutoresizingMaskIntoConstraints = false
        panel.axis = .vertical
        panel.alignment = .center
        panel.spacing = 10
        panel.isLayoutMarginsRelativeArrangement = true
        panel.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16)
        panel.backgroundColor = .secondarySystemBackground
        panel.layer.cornerRadius = 24
        panel.layer.cornerCurve = .continuous
        addSubview(panel)

        let safe = safeAreaLayoutGuide
        let visible = UILayoutGuide()
        addLayoutGuide(visible)
        let preferredBottom = visible.bottomAnchor.constraint(equalTo: safe.bottomAnchor)
        let aboveKeyboard = visible.bottomAnchor.constraint(lessThanOrEqualTo: keyboardLayoutGuide.topAnchor)
        let preferredWidth = panel.widthAnchor.constraint(equalToConstant: 264)
        aboveKeyboard.priority = UILayoutPriority(999)
        preferredBottom.priority = .defaultHigh
        preferredWidth.priority = .defaultHigh
        NSLayoutConstraint.activate([
            visible.topAnchor.constraint(equalTo: safe.topAnchor),
            visible.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            visible.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            visible.bottomAnchor.constraint(lessThanOrEqualTo: safe.bottomAnchor),
            aboveKeyboard,
            preferredBottom,
            panel.centerXAnchor.constraint(equalTo: visible.centerXAnchor),
            panel.centerYAnchor.constraint(equalTo: visible.centerYAnchor),
            panel.widthAnchor.constraint(lessThanOrEqualTo: visible.widthAnchor, constant: -32),
            panel.widthAnchor.constraint(lessThanOrEqualToConstant: 320),
            panel.topAnchor.constraint(greaterThanOrEqualTo: visible.topAnchor, constant: 8),
            panel.bottomAnchor.constraint(lessThanOrEqualTo: visible.bottomAnchor, constant: -8),
            preferredWidth,
            label.widthAnchor.constraint(equalTo: panel.layoutMarginsGuide.widthAnchor)
        ])
    }

    required init?(coder: NSCoder) { nil }

    func present(over host: UIView) {
        host.addSubview(self)
        NSLayoutConstraint.activate([
            topAnchor.constraint(equalTo: host.topAnchor), bottomAnchor.constraint(equalTo: host.bottomAnchor),
            leadingAnchor.constraint(equalTo: host.leadingAnchor), trailingAnchor.constraint(equalTo: host.trailingAnchor)
        ])
    }

    func show(_ text: String, spinning: Bool) {
        guard label.text != text || spinner.isAnimating != spinning else { return }
        label.text = text
        if spinning { spinner.startAnimating() }
        else { spinner.stopAnimating() }
        UIAccessibility.post(notification: .screenChanged, argument: label)
    }
}

@MainActor
private final class OivoxLoadingArtwork: UIView {
    private let orbit = CAShapeLayer()
    private let highlight = CALayer()
    private let shadow = CAShapeLayer()
    private let sender = CAGradientLayer()
    private let listener = CAGradientLayer()
    private let note = CATransformLayer()
    private let rim = CAGradientLayer()
    private let face = CAGradientLayer()
    private let sheen = CAGradientLayer()
    private let duration = CATextLayer()
    private let bars = (0..<7).map { _ in CAGradientLayer() }
    private let cycle: CFTimeInterval = 2.65
    private var laidOutSize: CGSize = .zero
    private var travelPoints: [CGPoint] = []
    private var animationEnabled = false

    init() {
        super.init(frame: .zero)
        isUserInteractionEnabled = false

        orbit.fillColor = UIColor.clear.cgColor
        orbit.strokeColor = Self.color(0x9a4a84).withAlphaComponent(0.24).cgColor
        orbit.lineWidth = 0.8
        shadow.fillColor = Self.color(0x9d3e6d).withAlphaComponent(0.14).cgColor
        shadow.shadowColor = Self.color(0x9d3e6d).cgColor
        shadow.shadowRadius = 3
        shadow.shadowOpacity = 0.25
        shadow.shadowOffset = .zero

        configureBead(sender, light: 0xffb0cb, dark: 0xdf5190, edge: 0xb3397d)
        configureBead(listener, light: 0xe8d2fa, dark: 0xa987cf, edge: 0x845cac)
        highlight.backgroundColor = Self.color(0xf35d99).cgColor
        highlight.shadowColor = Self.color(0xdc73a6).cgColor
        highlight.shadowRadius = 3
        highlight.shadowOpacity = 0.6
        highlight.shadowOffset = .zero

        rim.colors = [0xe778a1, 0xac3f7d, 0xce70ab].map { Self.color($0).cgColor }
        rim.startPoint = CGPoint(x: 0, y: 0.15)
        rim.endPoint = CGPoint(x: 1, y: 0.85)
        rim.cornerCurve = .continuous
        rim.shadowColor = Self.color(0x972d75).cgColor
        rim.shadowRadius = 3.5
        rim.shadowOpacity = 0.28
        rim.shadowOffset = CGSize(width: 0, height: 2)
        face.colors = [0xfff2f9, 0xfbc4df, 0xdfb9f5].map { Self.color($0).cgColor }
        face.startPoint = CGPoint(x: 0, y: 0)
        face.endPoint = CGPoint(x: 1, y: 1)
        face.cornerCurve = .continuous
        face.borderWidth = 0.55
        face.borderColor = UIColor.white.withAlphaComponent(0.85).cgColor
        face.masksToBounds = true
        sheen.type = .radial
        sheen.colors = [UIColor.white.withAlphaComponent(0.86).cgColor, UIColor.white.withAlphaComponent(0).cgColor]
        sheen.startPoint = CGPoint(x: 0.15, y: 0)
        sheen.endPoint = CGPoint(x: 0.9, y: 0.95)
        face.addSublayer(sheen)

        for bar in bars {
            bar.colors = [Self.color(0xce427f).cgColor, Self.color(0x9f3379).cgColor]
            face.addSublayer(bar)
        }
        duration.alignmentMode = .center
        face.addSublayer(duration)
        note.addSublayer(rim)
        note.addSublayer(face)
        [shadow, orbit, highlight, sender, listener, note].forEach(layer.addSublayer)
    }

    required init?(coder: NSCoder) { nil }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard !bounds.isEmpty, bounds.size != laidOutSize else { return }
        laidOutSize = bounds.size

        let width = bounds.width
        let height = bounds.height
        let center = CGPoint(x: width * 0.5, y: height * 0.69)
        let radiusX = width * 0.45
        let radiusY = height * 0.2
        let angle = -CGFloat.pi * 11 / 180
        var rotation = CGAffineTransform(translationX: center.x, y: center.y)
            .rotated(by: angle).translatedBy(x: -center.x, y: -center.y)
        let ellipse = CGRect(x: center.x - radiusX, y: center.y - radiusY,
                             width: 2 * radiusX, height: 2 * radiusY)
        travelPoints = (0...12).map { index in
            let phase = CGFloat.pi * (1 - CGFloat(index) / 12)
            return CGPoint(x: center.x + radiusX * cos(phase),
                           y: center.y + radiusY * sin(phase)).applying(rotation)
        }

        CATransaction.begin()
        CATransaction.setDisableActions(true)
        orbit.frame = bounds
        orbit.path = UIBezierPath(ovalIn: ellipse).cgPath.copy(using: &rotation)
        shadow.frame = bounds
        shadow.path = UIBezierPath(ovalIn: CGRect(x: width * 0.27, y: height * 0.79,
                                                width: width * 0.46, height: height * 0.07)).cgPath
        shadow.shadowPath = shadow.path
        if let start = travelPoints.first, let end = travelPoints.last {
            placeDot(sender, at: start, diameter: width * 0.08)
            placeDot(listener, at: end, diameter: width * 0.08)
        }
        placeDot(highlight, at: travelPoints[9], diameter: width * 0.044)
        layoutNote(width: width, height: height)
        CATransaction.commit()
        applyAnimations()
    }

    func setAnimating(_ enabled: Bool) {
        guard enabled != animationEnabled else { return }
        animationEnabled = enabled
        applyAnimations()
    }

    private func layoutNote(width: CGFloat, height: CGFloat) {
        let noteWidth = width * 0.626
        let noteHeight = height * 0.62
        note.bounds = CGRect(x: 0, y: 0, width: noteWidth, height: noteHeight)
        note.position = CGPoint(x: width * 0.5, y: height * 0.42)
        note.transform = pose(scale: 1, elevation: 0, pitch: 11, yaw: -8, roll: -7)
        let corner = noteHeight * 0.4
        rim.bounds = note.bounds
        rim.position = CGPoint(x: noteWidth * 0.5, y: noteHeight * 0.5 + width * 0.034)
        rim.zPosition = -width * 0.039
        rim.cornerRadius = corner
        rim.shadowPath = UIBezierPath(roundedRect: rim.bounds, cornerRadius: corner).cgPath
        face.frame = note.bounds
        face.zPosition = width * 0.014
        face.cornerRadius = corner
        sheen.frame = face.bounds

        let barWidth = width * 0.022
        let barSpacing = width * 0.017
        let waveWidth = 7 * barWidth + 6 * barSpacing
        let labelWidth = width * 0.19
        let gap = width * 0.033
        let start = (noteWidth - waveWidth - labelWidth - gap) * 0.5
        let middle = noteHeight * 0.5
        let heights: [CGFloat] = [0.29, 0.55, 0.81, 1, 0.67, 0.53, 0.28]
        for (index, bar) in bars.enumerated() {
            let barHeight = noteHeight * 0.5 * heights[index]
            bar.frame = CGRect(x: start + CGFloat(index) * (barWidth + barSpacing),
                               y: middle - barHeight * 0.5, width: barWidth, height: barHeight)
            bar.cornerRadius = barWidth * 0.5
        }
        let font = UIFont.monospacedDigitSystemFont(ofSize: width * 0.077, weight: .heavy)
        duration.contentsScale = window?.screen.scale ?? traitCollection.displayScale
        duration.string = NSAttributedString(string: "0:07", attributes: [
            .font: font, .foregroundColor: Self.color(0x852751), .kern: -0.25
        ])
        duration.frame = CGRect(x: start + waveWidth + gap, y: middle - font.lineHeight * 0.5,
                                width: labelWidth, height: ceil(font.lineHeight) + 1)
    }

    private func placeDot(_ dot: CALayer, at point: CGPoint, diameter: CGFloat) {
        dot.bounds = CGRect(x: 0, y: 0, width: diameter, height: diameter)
        dot.position = point
        dot.cornerRadius = diameter * 0.5
    }

    private func configureBead(_ bead: CAGradientLayer, light: UInt32, dark: UInt32, edge: UInt32) {
        bead.type = .radial
        bead.startPoint = CGPoint(x: 0.28, y: 0.22)
        bead.endPoint = CGPoint(x: 0.88, y: 0.92)
        bead.colors = [UIColor.white.cgColor, Self.color(light).cgColor, Self.color(dark).cgColor, Self.color(edge).cgColor]
        bead.locations = [0, 0.32, 0.72, 1]
        bead.shadowColor = Self.color(edge).cgColor
        bead.shadowRadius = 1.5
        bead.shadowOpacity = 0.32
        bead.shadowOffset = CGSize(width: 0, height: 1.5)
    }

    private func applyAnimations() {
        [note, shadow, sender, listener, highlight].forEach { $0.removeAllAnimations() }
        bars.forEach { $0.removeAllAnimations() }
        guard animationEnabled, let start = travelPoints.first, let end = travelPoints.last else { return }

        let resting = pose(scale: 0.98, elevation: 0, pitch: 12, yaw: -11, roll: -8)
        let raised = pose(scale: 1.035, elevation: -bounds.width * 0.045, pitch: 6, yaw: 7, roll: -6)
        animate(note, "transform", values: [NSValue(caTransform3D: resting),
                                          NSValue(caTransform3D: raised),
                                          NSValue(caTransform3D: resting)], times: [0, 0.48, 1])
        animate(shadow, "opacity", values: [0.7, 0.37, 0.7], times: [0, 0.48, 1])
        animate(shadow, "transform.scale.x", values: [1, 0.81, 1], times: [0, 0.48, 1])

        for (index, bar) in bars.enumerated() {
            animate(bar, "transform.scale.y", values: [0.68, 1.14, 0.65, 0.93, 0.68, 0.68],
                    times: [0, 0.18, 0.31, 0.42, 0.64, 1], phase: Double(index) * 0.07)
        }
        animate(sender, "transform.scale", values: [1, 1.22, 1, 1], times: [0, 0.08, 0.18, 1])
        animate(listener, "transform.scale", values: [1, 1, 1.22, 1, 1], times: [0, 0.55, 0.65, 0.74, 1])

        let samples = travelPoints.indices.map { NSNumber(value: 0.13 + 0.51 * Double($0) / 12) }
        animate(highlight, "position", values: ([start] + travelPoints + [end]).map { NSValue(cgPoint: $0) },
                times: [0] + samples + [1], timing: .linear)
        animate(highlight, "opacity", values: [0, 0, 0.95, 0.92, 0, 0], times: [0, 0.13, 0.19, 0.64, 0.73, 1])
    }

    private func animate(_ layer: CALayer, _ key: String, values: [Any], times: [NSNumber],
                         phase: CFTimeInterval = 0, timing: CAMediaTimingFunctionName = .easeInEaseOut) {
        let animation = CAKeyframeAnimation(keyPath: key)
        animation.values = values
        animation.keyTimes = times
        animation.timingFunctions = Array(repeating: CAMediaTimingFunction(name: timing), count: times.count - 1)
        animation.duration = cycle
        animation.timeOffset = (cycle - phase).truncatingRemainder(dividingBy: cycle)
        animation.repeatCount = .infinity
        layer.add(animation, forKey: key)
    }

    private func pose(scale: CGFloat, elevation: CGFloat, pitch: CGFloat, yaw: CGFloat, roll: CGFloat) -> CATransform3D {
        var perspective = CATransform3DIdentity
        perspective.m34 = -1 / 400
        let radians = CGFloat.pi / 180
        let floating = CATransform3DTranslate(perspective, 0, elevation, 0)
        let pitched = CATransform3DRotate(floating, pitch * radians, 1, 0, 0)
        let turned = CATransform3DRotate(pitched, yaw * radians, 0, 1, 0)
        let tilted = CATransform3DRotate(turned, roll * radians, 0, 0, 1)
        return CATransform3DScale(tilted, scale, scale, 1)
    }

    private static func color(_ hex: UInt32) -> UIColor {
        UIColor(red: CGFloat((hex >> 16) & 0xff) / 255,
                green: CGFloat((hex >> 8) & 0xff) / 255,
                blue: CGFloat(hex & 0xff) / 255, alpha: 1)
    }
}
