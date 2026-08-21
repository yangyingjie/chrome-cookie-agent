import AppKit
import Foundation

let fileManager = FileManager.default
let currentDir = fileManager.currentDirectoryPath
let iconsDir = URL(fileURLWithPath: currentDir).appendingPathComponent("icons")

// Color helper
func color(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1.0) -> CGColor {
    return CGColor(red: r/255.0, green: g/255.0, blue: b/255.0, alpha: a)
}

func createLinearGradient(colors: [CGColor], locations: [CGFloat]) -> CGGradient {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    return CGGradient(colorsSpace: colorSpace, colors: colors as CFArray, locations: locations)!
}

func drawSquircle(rect: CGRect, radius: CGFloat) -> CGPath {
    let path = CGMutablePath()
    let x = rect.origin.x
    let y = rect.origin.y
    let w = rect.size.width
    let h = rect.size.height
    let r = min(radius, min(w, h) / 2.0)
    
    path.move(to: CGPoint(x: x + r, y: y))
    path.addLine(to: CGPoint(x: x + w - r, y: y))
    path.addArc(tangent1End: CGPoint(x: x + w, y: y), tangent2End: CGPoint(x: x + w, y: y + r), radius: r)
    path.addLine(to: CGPoint(x: x + w, y: y + h - r))
    path.addArc(tangent1End: CGPoint(x: x + w, y: y + h), tangent2End: CGPoint(x: x + w - r, y: y + h), radius: r)
    path.addLine(to: CGPoint(x: x + r, y: y + h))
    path.addArc(tangent1End: CGPoint(x: x, y: y + h), tangent2End: CGPoint(x: x, y: y + h - r), radius: r)
    path.addLine(to: CGPoint(x: x, y: y + r))
    path.addArc(tangent1End: CGPoint(x: x, y: y), tangent2End: CGPoint(x: x + r, y: y), radius: r)
    path.closeSubpath()
    return path
}

func createCookiePath(cx: CGFloat, cy: CGFloat, r: CGFloat) -> CGPath {
    let path = CGMutablePath()
    
    // Top-down coordinates:
    // Start at top: (cx, cy - r)
    let pTop = CGPoint(x: cx, y: cy - r)
    
    // Arc around left and bottom: from top (1.5 pi) -> left (1.0 pi) -> bottom (0.5 pi) -> right (0 pi)
    path.addArc(center: CGPoint(x: cx, y: cy), radius: r, startAngle: CGFloat.pi * 1.5, endAngle: 0, clockwise: true)
    
    // Dual bite inward curve from right (cx+r, cy) back to top (cx, cy-r)
    let bite1Inner = CGPoint(x: cx + r * 0.58, y: cy - r * 0.45)
    let ctrl1 = CGPoint(x: cx + r * 0.78, y: cy - r * 0.02)
    path.addQuadCurve(to: bite1Inner, control: ctrl1)
    
    let ctrl2 = CGPoint(x: cx + r * 0.28, y: cy - r * 0.95)
    path.addQuadCurve(to: pTop, control: ctrl2)
    
    path.closeSubpath()
    return path
}

func renderIcon(size: Int, outputPath: URL) {
    let scale: CGFloat = size <= 32 ? 4.0 : 2.0
    let pixelSize = CGFloat(size) * scale
    
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
    guard let ctx = CGContext(
        data: nil,
        width: Int(pixelSize),
        height: Int(pixelSize),
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: bitmapInfo.rawValue
    ) else {
        print("Failed to create context for size \(size)")
        return
    }
    
    ctx.setShouldAntialias(true)
    ctx.setAllowsAntialiasing(true)
    ctx.interpolationQuality = .high
    
    // Top-down coordinates
    ctx.scaleBy(x: scale, y: -scale)
    ctx.translateBy(x: 0, y: -CGFloat(size))
    
    let S = CGFloat(size)
    let cx = S * 0.5
    let cy = S * 0.5
    
    // --- 1. Base Squircle & Background ---
    let pad = S * 0.05
    let baseRect = CGRect(x: pad, y: pad, width: S - 2 * pad, height: S - 2 * pad)
    let cornerRadius = S * 0.23
    let baseSquircle = drawSquircle(rect: baseRect, radius: cornerRadius)
    
    ctx.saveGState()
    if size >= 48 {
        ctx.setShadow(offset: CGSize(width: 0, height: S * 0.03), blur: S * 0.04, color: color(0, 0, 0, 0.45))
    }
    ctx.addPath(baseSquircle)
    ctx.clip()
    
    // Background: Deep Obsidian Emerald (#064e3b -> #022c22 -> #01140e)
    let bgGrad = createLinearGradient(
        colors: [color(6, 78, 59), color(2, 44, 34), color(1, 20, 14)],
        locations: [0.0, 0.55, 1.0]
    )
    ctx.drawLinearGradient(bgGrad, start: CGPoint(x: pad, y: pad), end: CGPoint(x: S - pad, y: S - pad), options: [])
    ctx.restoreGState()
    
    // Squircle Outer Subtle Emerald Border
    ctx.saveGState()
    ctx.addPath(baseSquircle)
    let borderGrad = createLinearGradient(
        colors: [color(52, 211, 153, 0.9), color(16, 185, 129, 0.7), color(5, 150, 105, 0.35)],
        locations: [0.0, 0.5, 1.0]
    )
    ctx.setLineWidth(max(1.0, S * (size <= 16 ? 0.06 : 0.024)))
    ctx.replacePathWithStrokedPath()
    ctx.clip()
    ctx.drawLinearGradient(borderGrad, start: CGPoint(x: pad, y: pad), end: CGPoint(x: S - pad, y: S - pad), options: [])
    ctx.restoreGState()
    
    // --- 2. Minimalist Golden Amber Cookie ---
    let cookieR = S * (size <= 16 ? 0.33 : (size <= 32 ? 0.31 : 0.30))
    let cookieShiftY = S * 0.015 // slight visual center balance
    let cookiePath = createCookiePath(cx: cx, cy: cy + cookieShiftY, r: cookieR)
    
    ctx.saveGState()
    if size >= 48 {
        ctx.setShadow(offset: CGSize(width: 0, height: S * 0.025), blur: S * 0.035, color: color(0, 0, 0, 0.4))
    }
    ctx.addPath(cookiePath)
    ctx.clip()
    
    // Cookie Amber Gold Gradient
    let cookieGrad = createLinearGradient(
        colors: [color(254, 240, 138), color(251, 191, 36), color(217, 119, 6), color(180, 83, 9)],
        locations: [0.0, 0.25, 0.75, 1.0]
    )
    ctx.drawLinearGradient(
        cookieGrad,
        start: CGPoint(x: cx - cookieR * 0.6, y: cy - cookieR * 0.6 + cookieShiftY),
        end: CGPoint(x: cx + cookieR * 0.8, y: cy + cookieR * 0.8 + cookieShiftY),
        options: []
    )
    ctx.restoreGState()
    
    // Cookie Highlight Arc (size >= 32)
    if size >= 32 {
        ctx.saveGState()
        let hlPath = CGMutablePath()
        hlPath.addArc(center: CGPoint(x: cx, y: cy + cookieShiftY), radius: cookieR * 0.82, startAngle: CGFloat.pi * 1.15, endAngle: CGFloat.pi * 1.45, clockwise: false)
        ctx.addPath(hlPath)
        ctx.setStrokeColor(color(255, 255, 255, 0.65))
        ctx.setLineWidth(max(1.0, S * 0.02))
        ctx.setLineCap(.round)
        ctx.strokePath()
        ctx.restoreGState()
    }
    
    // Cookie Outline / Highlight Stroke
    ctx.saveGState()
    ctx.addPath(cookiePath)
    ctx.setStrokeColor(color(254, 249, 195, 0.95))
    ctx.setLineWidth(max(1.0, S * (size <= 16 ? 0.06 : 0.022)))
    ctx.strokePath()
    ctx.restoreGState()
    
    // --- 3. Clean Chocolate Chips (3 balanced chips) ---
    ctx.saveGState()
    let chipColor = color(59, 18, 4, 0.95)
    let chipHighlight = color(253, 230, 138, 0.85)
    
    let chips: [(dx: CGFloat, dy: CGFloat, r: CGFloat)]
    if size <= 16 {
        chips = [
            (-0.35, -0.25, 0.22),
            (0.18, 0.32, 0.22),
            (-0.25, 0.35, 0.20)
        ]
    } else {
        chips = [
            (-0.34, -0.28, 0.19),
            (0.18, 0.32, 0.19),
            (-0.28, 0.35, 0.17)
        ]
    }
    
    for chip in chips {
        let chx = cx + chip.dx * cookieR
        let chy = cy + cookieShiftY + chip.dy * cookieR
        let chr = chip.r * cookieR
        let chipRect = CGRect(x: chx - chr, y: chy - chr, width: chr * 2, height: chr * 2)
        
        ctx.setFillColor(chipColor)
        ctx.fillEllipse(in: chipRect)
        
        if size >= 32 {
            let hlr = chr * 0.35
            let hlRect = CGRect(x: chx - chr * 0.35, y: chy - chr * 0.35, width: hlr * 2, height: hlr * 2)
            ctx.setFillColor(chipHighlight)
            ctx.fillEllipse(in: hlRect)
        }
    }
    ctx.restoreGState()
    
    // --- 4. Export to PNG ---
    guard let image = ctx.makeImage() else {
        print("Failed to make CGImage for size \(size)")
        return
    }
    
    let finalRep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
    
    NSGraphicsContext.saveGraphicsState()
    let finalCtx = NSGraphicsContext(bitmapImageRep: finalRep)
    NSGraphicsContext.current = finalCtx
    finalCtx?.cgContext.interpolationQuality = .high
    finalCtx?.cgContext.draw(image, in: CGRect(x: 0, y: 0, width: size, height: size))
    NSGraphicsContext.restoreGraphicsState()
    
    guard let pngData = finalRep.representation(using: .png, properties: [:]) else {
        print("Failed to encode PNG for size \(size)")
        return
    }
    
    do {
        try pngData.write(to: outputPath)
        print("Successfully created minimalist \(size)x\(size) PNG (\(pngData.count) bytes) -> \(outputPath.lastPathComponent)")
    } catch {
        print("Failed to write to \(outputPath.path): \(error)")
    }
}

let sizes = [16, 32, 48, 128]
for s in sizes {
    let outUrl = iconsDir.appendingPathComponent("icon\(s).png")
    renderIcon(size: s, outputPath: outUrl)
}

print("All minimalist icons generated successfully!")
