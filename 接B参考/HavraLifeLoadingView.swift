import UIKit

final class HavraLifeLoadingView: UIView {
    static let gold = UIColor(red: 246 / 255, green: 209 / 255, blue: 138 / 255, alpha: 1)
    private static let dimming = UIColor(white: 0.02, alpha: 0.46)

    enum Style { case lantern, activityIndicator }
    private enum State { case idle, loading, failed }
    private var state = State.idle
    private var style = Style.lantern
    private var presentation: Task<Void, Never>?
    private var presentedAt: CFTimeInterval?
    private var retryAction: (() -> Void)?
    private var blocksInteraction = true
    private var centeredCard: NSLayoutConstraint?
    private var launchCard: NSLayoutConstraint?
    private let card = UIStackView()
    private let indicator = UIActivityIndicatorView(style: .large)
    private let lantern = HavraLifeLanternView()
    private let status = UILabel()
    private let retry = UIButton(type: .system)

    init() {
        super.init(frame: .zero)
        isHidden = true
        alpha = 0
        backgroundColor = Self.dimming

        [lantern, status, retry].forEach(card.addArrangedSubview)
        card.axis = .vertical
        card.alignment = .center
        card.spacing = 9
        card.layoutMargins = UIEdgeInsets(top: 19, left: 22, bottom: 17, right: 22)
        card.isLayoutMarginsRelativeArrangement = true
        card.backgroundColor = UIColor(red: 0.095, green: 0.062, blue: 0.041, alpha: 0.97)
        card.layer.cornerRadius = 24
        card.layer.cornerCurve = .continuous
        card.layer.borderWidth = 1
        card.layer.borderColor = Self.gold.withAlphaComponent(0.26).cgColor
        card.layer.shadowColor = UIColor.black.cgColor
        card.layer.shadowOpacity = 0.35
        card.layer.shadowRadius = 16
        card.layer.shadowOffset = CGSize(width: 0, height: 8)
        card.translatesAutoresizingMaskIntoConstraints = false
        addSubview(card)

        indicator.color = .white
        indicator.hidesWhenStopped = true
        indicator.isAccessibilityElement = true
        indicator.accessibilityLabel = "Loading"
        indicator.translatesAutoresizingMaskIntoConstraints = false
        addSubview(indicator)

        status.textAlignment = .center
        status.textColor = UIColor(red: 1, green: 0.969, blue: 0.922, alpha: 1)
        status.font = .preferredFont(forTextStyle: .footnote)
        status.adjustsFontForContentSizeCategory = true
        status.numberOfLines = 0
        retry.tintColor = Self.gold
        retry.setTitle("Try again", for: .normal)
        retry.addTarget(self, action: #selector(tryAgain), for: .touchUpInside)
        retry.isHidden = true
        let retryHeight = retry.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)
        retryHeight.priority = .defaultHigh

        // Leave the launch artwork’s baked title and tagline above the card.
        let launchPosition = UILayoutGuide()
        addLayoutGuide(launchPosition)
        let center = card.centerYAnchor.constraint(equalTo: safeAreaLayoutGuide.centerYAnchor)
        let launch = card.centerYAnchor.constraint(equalTo: launchPosition.bottomAnchor)
        center.priority = .defaultHigh
        launch.priority = .defaultHigh
        centeredCard = center
        launchCard = launch
        NSLayoutConstraint.activate([
            launchPosition.topAnchor.constraint(equalTo: topAnchor),
            launchPosition.leadingAnchor.constraint(equalTo: leadingAnchor),
            launchPosition.trailingAnchor.constraint(equalTo: trailingAnchor),
            launchPosition.heightAnchor.constraint(equalTo: heightAnchor, multiplier: 0.81),
            card.centerXAnchor.constraint(equalTo: safeAreaLayoutGuide.centerXAnchor),
            center,
            card.topAnchor.constraint(greaterThanOrEqualTo: safeAreaLayoutGuide.topAnchor, constant: 12),
            card.bottomAnchor.constraint(lessThanOrEqualTo: safeAreaLayoutGuide.bottomAnchor, constant: -12),
            card.widthAnchor.constraint(greaterThanOrEqualToConstant: 144),
            card.widthAnchor.constraint(lessThanOrEqualTo: safeAreaLayoutGuide.widthAnchor, constant: -32),
            lantern.widthAnchor.constraint(equalToConstant: 88),
            lantern.heightAnchor.constraint(equalTo: lantern.widthAnchor),
            indicator.centerXAnchor.constraint(equalTo: safeAreaLayoutGuide.centerXAnchor),
            indicator.centerYAnchor.constraint(equalTo: safeAreaLayoutGuide.centerYAnchor),
            retryHeight
        ])
        NotificationCenter.default.addObserver(self, selector: #selector(updateMotion),
            name: UIAccessibility.reduceMotionStatusDidChangeNotification, object: nil)
    }

    required init?(coder: NSCoder) { nil }
    deinit { presentation?.cancel() }

    func setLoading(_ loading: Bool, immediately: Bool = false, blocksInteraction: Bool = true,
                    overLaunchArtwork: Bool = false, style: Style = .lantern) {
        self.blocksInteraction = blocksInteraction
        if loading, isHidden || self.style != style {
            configure(style, overLaunchArtwork: overLaunchArtwork)
        }
        let next: State = loading ? .loading : .idle
        guard state != next else {
            if loading {
                if immediately, isHidden {
                    presentation?.cancel()
                    show()
                } else if !isHidden {
                    setInteraction(blocksInteraction)
                    updateMotion()
                }
            }
            return
        }
        state = next
        presentation?.cancel()
        retryAction = nil
        if loading {
            status.text = "Loading…"
            status.accessibilityLabel = "Loading Havra"
            retry.isHidden = true
            if immediately || !isHidden {
                show()
            } else {
                presentation = Task { [weak self] in
                    try? await Task.sleep(nanoseconds: 140_000_000)
                    guard !Task.isCancelled else { return }
                    self?.show()
                }
            }
        } else if let presentedAt {
            setInteraction(false)
            let remaining = max(0, 0.32 - (CACurrentMediaTime() - presentedAt))
            presentation = Task { [weak self] in
                try? await Task.sleep(nanoseconds: UInt64(remaining * 1_000_000_000))
                guard !Task.isCancelled else { return }
                self?.hide()
            }
        }
    }

    func showFailure(retry action: @escaping () -> Void) {
        if isHidden || style != .lantern { configure(.lantern, overLaunchArtwork: false) }
        presentation?.cancel()
        state = .failed
        status.text = "Couldn’t open Havra."
        status.accessibilityLabel = nil
        retryAction = action
        retry.isHidden = false
        show()
    }

    private func show() {
        if isHidden { presentedAt = CACurrentMediaTime() }
        isHidden = false
        setInteraction(state == .failed || blocksInteraction)
        updateMotion()
        UIView.animate(withDuration: 0.18, delay: 0, options: [.beginFromCurrentState, .allowUserInteraction]) {
            self.alpha = 1
        }
    }

    private func configure(_ style: Style, overLaunchArtwork: Bool) {
        self.style = style
        card.isHidden = style == .activityIndicator
        if overLaunchArtwork {
            centeredCard?.isActive = false
            launchCard?.isActive = true
        } else {
            launchCard?.isActive = false
            centeredCard?.isActive = true
        }
        backgroundColor = style == .activityIndicator || overLaunchArtwork ? .clear : Self.dimming
    }

    private func setInteraction(_ blocking: Bool) {
        isUserInteractionEnabled = blocking
        accessibilityViewIsModal = blocking
    }

    private func hide() {
        UIView.animate(withDuration: 0.18, delay: 0, options: [.beginFromCurrentState, .allowUserInteraction]) {
            self.alpha = 0
        } completion: { [weak self] finished in
            guard finished, let self, self.state == .idle else { return }
            self.isHidden = true
            self.presentedAt = nil
            self.updateMotion()
        }
    }

    @objc private func updateMotion() {
        let loading = !isHidden && state == .loading
        lantern.setAnimating(loading && style == .lantern && !UIAccessibility.isReduceMotionEnabled)
        if loading, style == .activityIndicator {
            indicator.startAnimating()
        } else {
            indicator.stopAnimating()
        }
    }

    @objc private func tryAgain() { retryAction?() }
}
