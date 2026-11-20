import UIKit

/// A woven market lantern and a loading light rendered in the same perspective.
final class HavraLifeLanternView: UIView {
    private struct Point {
        let x: CGFloat
        let y: CGFloat
        let z: CGFloat

        static func around(_ angle: CGFloat, height: CGFloat, radius: CGFloat) -> Self {
            Self(x: cos(angle) * radius, y: height, z: sin(angle) * radius)
        }
    }

    private struct Projection {
        private let yawCos: CGFloat
        private let yawSin: CGFloat
        private let rollCos: CGFloat
        private let rollSin: CGFloat
        private let lift: CGFloat
        private static let pitchCos = cos(0.32 as CGFloat)
        private static let pitchSin = sin(0.32 as CGFloat)

        init(yaw: CGFloat = 0, roll: CGFloat = 0, lift: CGFloat = 0) {
            yawCos = cos(yaw)
            yawSin = sin(yaw)
            rollCos = cos(roll)
            rollSin = sin(roll)
            self.lift = lift
        }

        func project(_ point: Point) -> (position: CGPoint, depth: CGFloat) {
            let turnedX = point.x * yawCos + point.z * yawSin
            let turnedZ = point.z * yawCos - point.x * yawSin
            let x = turnedX * rollCos - point.y * rollSin
            let y = point.y * rollCos + turnedX * rollSin + lift
            let depth = turnedZ * Self.pitchCos + y * Self.pitchSin
            let scale = 110 / (110 - depth)
            return (CGPoint(x: x * scale, y: -(y * Self.pitchCos - turnedZ * Self.pitchSin) * scale), depth)
        }
    }

    private final class DisplayTarget: NSObject {
        weak var lantern: HavraLifeLanternView?

        @objc func frame(_ link: CADisplayLink) {
            lantern?.advance(to: link.timestamp)
        }
    }

    private static let revolution = 2 * CGFloat.pi
    private static let gold = HavraLifeLoadingView.gold
    private static let shadeGradient = makeGradient([
        UIColor(red: 1, green: 0.76, blue: 0.37, alpha: 1),
        UIColor(red: 0.76, green: 0.35, blue: 0.10, alpha: 1),
        UIColor(red: 0.32, green: 0.11, blue: 0.035, alpha: 1),
        UIColor(red: 0.18, green: 0.061, blue: 0.021, alpha: 1)
    ], at: [0, 0.42, 0.81, 1])
    private static let haloGradient = makeGradient([
        UIColor(red: 0.86, green: 0.31, blue: 0.07, alpha: 0.33),
        UIColor(red: 0.56, green: 0.16, blue: 0.03, alpha: 0.11),
        UIColor(red: 0.56, green: 0.16, blue: 0.03, alpha: 0)
    ], at: [0, 0.50, 1])
    private static let heights = (0...12).map { 18.5 - CGFloat($0) * 37 / 12 }
    private static let outline = heights.map { ring(height: $0, radius: bodyRadius(at: $0), samples: 20) }
    private static let ribs = (0..<14).map { index in
        heights.map { height in
            let angle = revolution * CGFloat(index) / 14 + 0.09 * sin(height / 10)
            return Point.around(angle, height: height, radius: bodyRadius(at: height))
        }
    }
    private static let bands = [-15, -11, -7, -3, 1, 5, 9, 13, 16].enumerated().map { row, base in
        (0...56).map { step in
            let angle = revolution * CGFloat(step) / 56
            let height = CGFloat(base) + 0.36 * cos(angle * 7 + CGFloat(row) * .pi)
            return Point.around(angle, height: height, radius: bodyRadius(at: height))
        }
    }
    private static let collars = [
        ring(height: 18.2, radius: 7.7, samples: 28),
        ring(height: -18.1, radius: 7.8, samples: 28)
    ]
    private static let handle = (0...20).map { step in
        let angle = revolution * CGFloat(step) / 20
        return Point(x: 3.25 * cos(angle), y: 23.8 + 4.6 * sin(angle), z: 0)
    }
    private static let orbitHeight: CGFloat = -21.5
    private static let orbitRadius: CGFloat = 30
    private static let orbitSteps = 72
    private static let orbitProjection = Projection()
    private static let orbit = ring(height: orbitHeight, radius: orbitRadius, samples: orbitSteps)
        .map { orbitProjection.project($0).position }
    private static let frontTrack = track(0...orbitSteps / 2)
    private static let rearTrack = track(orbitSteps / 2...orbitSteps)

    private let displayTarget = DisplayTarget()
    private var displayLink: CADisplayLink?
    private var wantsAnimation = false
    private var startedAt: CFTimeInterval?
    private var elapsed: CGFloat = 0

    init() {
        super.init(frame: .zero)
        isOpaque = false
        isUserInteractionEnabled = false
        isAccessibilityElement = false
        contentMode = .redraw
        displayTarget.lantern = self
    }

    required init?(coder: NSCoder) { nil }
    deinit { displayLink?.invalidate() }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        updateDisplayLink()
    }

    func setAnimating(_ animating: Bool) {
        wantsAnimation = animating
        updateDisplayLink()
    }

    private func updateDisplayLink() {
        if wantsAnimation, window != nil {
            guard displayLink == nil else { return }
            let link = CADisplayLink(target: displayTarget, selector: #selector(DisplayTarget.frame(_:)))
            link.preferredFramesPerSecond = 30
            link.add(to: .main, forMode: .common)
            displayLink = link
        } else {
            guard let displayLink else { return }
            displayLink.invalidate()
            self.displayLink = nil
            startedAt = nil
            elapsed = 0
            setNeedsDisplay()
        }
    }

    private func advance(to timestamp: CFTimeInterval) {
        if startedAt == nil { startedAt = timestamp }
        elapsed = CGFloat(timestamp - (startedAt ?? timestamp))
        setNeedsDisplay()
    }

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext() else { return }
        let fit = min(bounds.width, bounds.height) / 88
        let scale = fit * 1.13
        context.translateBy(x: bounds.midX, y: bounds.midY - 3 * fit)
        context.scaleBy(x: scale, y: scale)
        context.setLineCap(.round)
        context.setLineJoin(.round)

        let turn = Self.revolution * elapsed / 5.7
        let sway = sin(turn * 2)
        let light = 0.91 + sin(turn * 2 - 0.28) * 0.09
        let lantern = Projection(yaw: 0.55 + turn, roll: -0.07 + sway * 0.11, lift: sway * 1.55)
        context.saveGState()
        context.setAlpha(light)
        let glow = CGPoint(x: -2, y: 9)
        context.drawRadialGradient(Self.haloGradient, startCenter: glow, startRadius: 0,
                                   endCenter: glow, endRadius: 36, options: [])
        context.restoreGState()

        let orbitLight = (0.7 + turn * 3).truncatingRemainder(dividingBy: Self.revolution)
        drawOrbit(in: context, head: orbitLight, front: false)
        drawLantern(in: context, projection: lantern, light: light)
        drawOrbit(in: context, head: orbitLight, front: true)
    }

    private func drawLantern(in context: CGContext, projection: Projection, light: CGFloat) {
        let edges = Self.outline.map { section -> (left: CGPoint, right: CGPoint) in
            let points = section.map { projection.project($0).position }
            return (points.min { $0.x < $1.x } ?? .zero, points.max { $0.x < $1.x } ?? .zero)
        }
        let shape = CGMutablePath()
        shape.addLines(between: edges.map(\.left) + edges.reversed().map(\.right))
        shape.closeSubpath()

        context.saveGState()
        context.addPath(shape)
        context.clip()
        let ember = projection.project(Point(x: -3.2, y: -0.8, z: 7)).position
        context.setAlpha(light)
        context.drawRadialGradient(Self.shadeGradient, startCenter: ember, startRadius: 1,
                                   endCenter: ember, endRadius: 22, options: .drawsAfterEndLocation)
        context.setAlpha(1)

        let ribs = frontWeave(Self.ribs, in: projection)
        let bands = frontWeave(Self.bands, in: projection)
        stroke(ribs, in: context, color: UIColor(red: 0.23, green: 0.074, blue: 0.027, alpha: 0.95), width: 1.75)
        stroke(bands, in: context, color: UIColor(red: 0.24, green: 0.085, blue: 0.027, alpha: 0.85), width: 1.30)
        stroke(ribs, in: context, color: UIColor(red: 0.96, green: 0.62, blue: 0.25, alpha: 0.78), width: 0.70)
        stroke(bands, in: context, color: UIColor(red: 1, green: 0.67, blue: 0.28, alpha: 0.64), width: 0.55)
        context.restoreGState()

        let hardware = CGMutablePath()
        hardware.addLines(between: Self.handle.map { projection.project($0).position })
        hardware.move(to: projection.project(Point(x: 0, y: 19.6, z: 0)).position)
        hardware.addLine(to: projection.project(Point(x: 0, y: 17.5, z: 0)).position)
        hardware.move(to: projection.project(Point(x: 0, y: -18.5, z: 0)).position)
        hardware.addLine(to: projection.project(Point(x: 0.4, y: -24.2, z: 0)).position)
        stroke(hardware, in: context, color: Self.gold.withAlphaComponent(0.76), width: 1.25)

        for collar in Self.collars {
            let rim = CGMutablePath()
            rim.addLines(between: collar.map { projection.project($0).position })
            stroke(rim, in: context, color: UIColor(red: 0.31, green: 0.12, blue: 0.042, alpha: 1), width: 2.7)
            stroke(rim, in: context, color: Self.gold.withAlphaComponent(0.78), width: 1.1)
        }
    }

    private func frontWeave(_ strands: [[Point]], in projection: Projection) -> CGPath {
        let path = CGMutablePath()
        for strand in strands {
            var drawing = false
            for point in strand {
                let next = projection.project(point)
                let center = projection.project(Point(x: 0, y: point.y, z: 0))
                let visible = next.depth >= center.depth - 1
                if visible {
                    if drawing { path.addLine(to: next.position) }
                    else { path.move(to: next.position) }
                }
                drawing = visible
            }
        }
        return path
    }

    private func drawOrbit(in context: CGContext, head: CGFloat, front: Bool) {
        let middle = Self.orbitSteps / 2
        let indices = front ? 0..<middle : middle..<Self.orbitSteps
        stroke(front ? Self.frontTrack : Self.rearTrack, in: context, color: Self.gold.withAlphaComponent(0.12), width: 0.75)
        for index in indices {
            let midAngle = (CGFloat(index) + 0.5) * Self.revolution / CGFloat(Self.orbitSteps)
            let age = (head - midAngle + Self.revolution).truncatingRemainder(dividingBy: Self.revolution)
            guard age < 1.28 else { continue }
            let brightness = 1 - age / 1.28
            let segment = CGMutablePath()
            segment.move(to: Self.orbit[index])
            segment.addLine(to: Self.orbit[index + 1])
            stroke(segment, in: context, color: Self.gold.withAlphaComponent(0.77 * brightness),
                   width: 0.75 + 0.92 * brightness)
        }
        guard (sin(head) >= 0) == front else { return }
        let light = Self.orbitProjection.project(Point.around(head, height: Self.orbitHeight, radius: Self.orbitRadius)).position
        context.saveGState()
        context.setShadow(offset: .zero, blur: 5, color: Self.gold.cgColor)
        context.setFillColor(UIColor(red: 1, green: 0.88, blue: 0.62, alpha: 1).cgColor)
        let radius: CGFloat = front ? 2.2 : 1.65
        context.fillEllipse(in: CGRect(x: light.x - radius, y: light.y - radius, width: radius * 2, height: radius * 2))
        context.restoreGState()
    }

    private func stroke(_ path: CGPath, in context: CGContext, color: UIColor, width: CGFloat) {
        context.addPath(path)
        context.setStrokeColor(color.cgColor)
        context.setLineWidth(width)
        context.strokePath()
    }

    private static func bodyRadius(at height: CGFloat) -> CGFloat {
        6.6 + 11 * pow(max(0, cos(height * .pi / 38)), 0.77)
    }

    private static func ring(height: CGFloat, radius: CGFloat, samples: Int) -> [Point] {
        (0...samples).map { Point.around(CGFloat($0) * revolution / CGFloat(samples), height: height, radius: radius) }
    }

    private static func track(_ indices: ClosedRange<Int>) -> CGPath {
        let path = CGMutablePath()
        path.addLines(between: Array(orbit[indices]))
        return path
    }

    private static func makeGradient(_ colors: [UIColor], at locations: [CGFloat]) -> CGGradient {
        CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors.map(\.cgColor) as CFArray, locations: locations)!
    }
}
