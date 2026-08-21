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

func drawSquircle(ctx: CGContext, rect: CGRect, radius: CGFloat) -> CGPath {
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
    
    // Scale coordinate system to virtual size (size x size) with flipped Y for natural top-down coordinates
    ctx.scaleBy(x: scale, y: -scale)
    ctx.translateBy(x: 0, y: -CGFloat(size))
    
    let S = CGFloat(size)
    
    // --- 1. Base Squircle & Background ---
    let pad = S * 0.04
    let baseRect = CGRect(x: pad, y: pad, width: S - 2 * pad, height: S - 2 * pad)
    let cornerRadius = S * 0.22
    let baseSquircle = drawSquircle(ctx: ctx, rect: baseRect, radius: cornerRadius)
    
    ctx.saveGState()
    if size >= 48 {
        ctx.setShadow(offset: CGSize(width: 0, height: S * 0.03), blur: S * 0.04, color: color(0, 0, 0, 0.45))
    }
    
    ctx.addPath(baseSquircle)
    ctx.clip()
    
    // Background gradient: Obsidian emerald dark
    let bgGrad = createLinearGradient(
        colors: [color(16, 42, 32), color(8, 24, 18), color(2, 9, 6)],
        locations: [0.0, 0.55, 1.0]
    )
    ctx.drawLinearGradient(bgGrad, start: CGPoint(x: pad, y: pad), end: CGPoint(x: S - pad, y: S - pad), options: [])
    ctx.restoreGState()
    
    // Base outer border glow
    ctx.saveGState()
    ctx.addPath(baseSquircle)
    let borderGrad = createLinearGradient(
        colors: [color(110, 231, 183, 0.95), color(52, 211, 153, 0.8), color(5, 150, 105, 0.5)],
        locations: [0.0, 0.45, 1.0]
    )
    ctx.setLineWidth(max(1.0, S * 0.025))
    ctx.replacePathWithStrokedPath()
    ctx.clip()
    ctx.drawLinearGradient(borderGrad, start: CGPoint(x: pad, y: pad), end: CGPoint(x: S - pad, y: S - pad), options: [])
    ctx.restoreGState()
    
    // --- 2. Dual Speed / UA / Switching Orbital Arcs (for size >= 32) ---
    if size >= 32 {
        ctx.saveGState()
        let arcLineWidth = max(1.2, S * 0.028)
        ctx.setLineWidth(arcLineWidth)
        ctx.setLineCap(.round)
        
        let cx = S * 0.5
        let cy = S * 0.5
        let orbitR = S * 0.38
        
        // Top-left arc
        let arc1 = CGMutablePath()
        arc1.addArc(center: CGPoint(x: cx, y: cy), radius: orbitR, startAngle: CGFloat.pi * 1.05, endAngle: CGFloat.pi * 1.55, clockwise: false)
        ctx.addPath(arc1)
        ctx.setStrokeColor(color(56, 189, 248, 0.85))
        ctx.strokePath()
        
        // Bottom-right arc
        let arc2 = CGMutablePath()
        arc2.addArc(center: CGPoint(x: cx, y: cy), radius: orbitR, startAngle: CGFloat.pi * 0.05, endAngle: CGFloat.pi * 0.55, clockwise: false)
        ctx.addPath(arc2)
        ctx.setStrokeColor(color(52, 211, 153, 0.85))
        ctx.strokePath()
        ctx.restoreGState()
    }
    
    // --- 3. Emerald Crystal Shield ---
    ctx.saveGState()
    let cx = S * 0.5
    let shieldTop = S * (size <= 16 ? 0.16 : 0.20)
    let shieldBottom = S * (size <= 16 ? 0.86 : 0.84)
    let shieldLeft = S * (size <= 16 ? 0.20 : 0.24)
    let shieldRight = S * (size <= 16 ? 0.80 : 0.76)
    let shieldShoulderY = shieldTop + (shieldBottom - shieldTop) * 0.22
    
    let shieldPath = CGMutablePath()
    shieldPath.move(to: CGPoint(x: cx, y: shieldTop))
    shieldPath.addLine(to: CGPoint(x: shieldRight, y: shieldShoulderY))
    shieldPath.addLine(to: CGPoint(x: shieldRight, y: shieldTop + (shieldBottom - shieldTop) * 0.52))
    shieldPath.addQuadCurve(to: CGPoint(x: cx, y: shieldBottom), control: CGPoint(x: shieldRight, y: shieldBottom - S * 0.04))
    shieldPath.addQuadCurve(to: CGPoint(x: shieldLeft, y: shieldTop + (shieldBottom - shieldTop) * 0.52), control: CGPoint(x: shieldLeft, y: shieldBottom - S * 0.04))
    shieldPath.addLine(to: CGPoint(x: shieldLeft, y: shieldShoulderY))
    shieldPath.closeSubpath()
    
    if size >= 48 {
        ctx.setShadow(offset: CGSize(width: 0, height: S * 0.02), blur: S * 0.03, color: color(0, 0, 0, 0.4))
    }
    
    ctx.addPath(shieldPath)
    ctx.clip()
    
    // Shield emerald gradient
    let shieldGrad = createLinearGradient(
        colors: [color(52, 211, 153), color(16, 185, 129), color(5, 150, 105), color(4, 120, 87)],
        locations: [0.0, 0.35, 0.85, 1.0]
    )
    ctx.drawLinearGradient(shieldGrad, start: CGPoint(x: cx, y: shieldTop), end: CGPoint(x: cx, y: shieldBottom), options: [])
    
    // Shield facet highlight (left 3D facet)
    let facetPath = CGMutablePath()
    facetPath.move(to: CGPoint(x: cx, y: shieldTop))
    facetPath.addLine(to: CGPoint(x: shieldLeft, y: shieldShoulderY))
    facetPath.addLine(to: CGPoint(x: shieldLeft, y: shieldTop + (shieldBottom - shieldTop) * 0.52))
    facetPath.addQuadCurve(to: CGPoint(x: cx, y: shieldBottom), control: CGPoint(x: shieldLeft, y: shieldBottom - S * 0.04))
    facetPath.closeSubpath()
    
    let facetGrad = createLinearGradient(
        colors: [color(255, 255, 255, 0.38), color(167, 243, 208, 0.12), color(52, 211, 153, 0.0)],
        locations: [0.0, 0.5, 1.0]
    )
    ctx.addPath(facetPath)
    ctx.clip()
    ctx.drawLinearGradient(facetGrad, start: CGPoint(x: shieldLeft, y: shieldTop), end: CGPoint(x: cx, y: shieldBottom), options: [])
    ctx.restoreGState()
    
    // Shield stroke outline
    ctx.saveGState()
    ctx.addPath(shieldPath)
    ctx.setStrokeColor(color(167, 243, 208, 0.95))
    ctx.setLineWidth(max(1.0, S * (size <= 16 ? 0.07 : 0.024)))
    ctx.strokePath()
    ctx.restoreGState()
    
    // --- 4. Golden Amber Cyber Cookie (Token Core) ---
    ctx.saveGState()
    let cookieCy = shieldTop + (shieldBottom - shieldTop) * 0.48
    let cookieR = S * (size <= 16 ? 0.20 : 0.17)
    let cookieRect = CGRect(x: cx - cookieR, y: cookieCy - cookieR, width: cookieR * 2, height: cookieR * 2)
    
    if size >= 48 {
        ctx.setShadow(offset: CGSize(width: 0, height: S * 0.02), blur: S * 0.025, color: color(0, 0, 0, 0.35))
    }
    
    let cookieGrad = createLinearGradient(
        colors: [color(254, 240, 138), color(251, 191, 36), color(217, 119, 6), color(180, 83, 9)],
        locations: [0.0, 0.25, 0.75, 1.0]
    )
    ctx.addEllipse(in: cookieRect)
    ctx.clip()
    ctx.drawLinearGradient(cookieGrad, start: CGPoint(x: cookieRect.minX + cookieR * 0.3, y: cookieRect.minY + cookieR * 0.3), end: CGPoint(x: cookieRect.maxX, y: cookieRect.maxY), options: [])
    ctx.restoreGState()
    
    // Cookie rim stroke
    ctx.saveGState()
    ctx.addEllipse(in: cookieRect)
    ctx.setStrokeColor(color(254, 249, 195, 0.95))
    ctx.setLineWidth(max(1.0, S * (size <= 16 ? 0.06 : 0.022)))
    ctx.strokePath()
    ctx.restoreGState()
    
    // Chocolate / Semiconductor Chips
    ctx.saveGState()
    let chipColor = color(69, 26, 3, 0.95)
    let chipHighlight = color(253, 230, 138, 0.8)
    
    let chipOffsets: [(dx: CGFloat, dy: CGFloat, r: CGFloat)]
    if size <= 16 {
        chipOffsets = [
            (-0.35, -0.3, 0.22),
            (0.35, -0.2, 0.22),
            (0.0, 0.25, 0.24)
        ]
    } else if size <= 32 {
        chipOffsets = [
            (-0.38, -0.35, 0.18),
            (0.38, -0.22, 0.20),
            (-0.1, 0.1, 0.22),
            (-0.4, 0.38, 0.16),
            (0.38, 0.35, 0.18)
        ]
    } else {
        chipOffsets = [
            (-0.40, -0.42, 0.16),
            (0.42, -0.28, 0.17),
            (-0.12, 0.12, 0.18),
            (-0.45, 0.40, 0.15),
            (0.42, 0.38, 0.16)
        ]
    }
    
    for chip in chipOffsets {
        let chx = cx + chip.dx * cookieR
        let chy = cookieCy + chip.dy * cookieR
        let chr = chip.r * cookieR
        let chipRect = CGRect(x: chx - chr, y: chy - chr, width: chr * 2, height: chr * 2)
        ctx.setFillColor(chipColor)
        ctx.fillEllipse(in: chipRect)
        
        if size >= 32 {
            let hlr = chr * 0.35
            let hlRect = CGRect(x: chx - chr * 0.4, y: chy - chr * 0.4, width: hlr * 2, height: hlr * 2)
            ctx.setFillColor(chipHighlight)
            ctx.fillEllipse(in: hlRect)
        }
    }
    ctx.restoreGState()
    
    // --- 5. Picture-in-Picture / Always-On-Top Mini Window Badge (in upper right) ---
    ctx.saveGState()
    let pipW = S * (size <= 16 ? 0.38 : (size <= 32 ? 0.32 : 0.26))
    let pipH = pipW * 0.72
    let pipX = S * (size <= 16 ? 0.58 : (size <= 32 ? 0.62 : 0.65))
    let pipY = S * (size <= 16 ? 0.10 : (size <= 32 ? 0.14 : 0.16))
    let pipRect = CGRect(x: pipX, y: pipY, width: pipW, height: pipH)
    let pipRadius = max(1.5, pipW * 0.2)
    let pipPath = drawSquircle(ctx: ctx, rect: pipRect, radius: pipRadius)
    
    if size >= 48 {
        ctx.setShadow(offset: CGSize(width: 0, height: S * 0.02), blur: S * 0.03, color: color(0, 0, 0, 0.45))
    }
    
    // PiP body gradient: Cyan tech
    let pipGrad = createLinearGradient(
        colors: [color(56, 189, 248), color(2, 132, 199)],
        locations: [0.0, 1.0]
    )
    ctx.addPath(pipPath)
    ctx.clip()
    ctx.drawLinearGradient(pipGrad, start: CGPoint(x: pipX, y: pipY), end: CGPoint(x: pipX + pipW, y: pipY + pipH), options: [])
    
    // PiP top bar
    let headerH = pipH * 0.32
    ctx.setFillColor(color(3, 105, 161))
    ctx.fill(CGRect(x: pipX, y: pipY, width: pipW, height: headerH))
    
    if size >= 48 {
        // Dot lights
        ctx.setFillColor(color(56, 189, 248))
        ctx.fillEllipse(in: CGRect(x: pipX + pipW * 0.15, y: pipY + headerH * 0.3, width: headerH * 0.4, height: headerH * 0.4))
        ctx.setFillColor(color(167, 243, 208))
        ctx.fillEllipse(in: CGRect(x: pipX + pipW * 0.32, y: pipY + headerH * 0.3, width: headerH * 0.4, height: headerH * 0.4))
    }
    ctx.restoreGState()
    
    // PiP outline stroke
    ctx.saveGState()
    ctx.addPath(pipPath)
    ctx.setStrokeColor(color(224, 242, 254, 0.95))
    ctx.setLineWidth(max(1.0, S * (size <= 16 ? 0.06 : 0.02)))
    ctx.strokePath()
    
    // PiP arrow symbol
    if size >= 32 {
        let arrowPath = CGMutablePath()
        let ax = pipX + pipW * 0.48
        let ay = pipY + headerH + (pipH - headerH) * 0.18
        let aw = pipW * 0.38
        let ah = (pipH - headerH) * 0.65
        
        arrowPath.move(to: CGPoint(x: ax, y: ay + ah))
        arrowPath.addLine(to: CGPoint(x: ax + aw, y: ay + ah))
        arrowPath.addLine(to: CGPoint(x: ax + aw, y: ay))
        arrowPath.move(to: CGPoint(x: ax + aw, y: ay))
        arrowPath.addLine(to: CGPoint(x: ax + aw * 0.3, y: ay + ah * 0.7))
        
        ctx.addPath(arrowPath)
        ctx.setStrokeColor(color(255, 255, 255, 0.95))
        ctx.setLineWidth(max(1.0, S * 0.02))
        ctx.setLineCap(.round)
        ctx.setLineJoin(.round)
        ctx.strokePath()
    }
    ctx.restoreGState()
    
    // --- 6. Export to PNG ---
    guard let image = ctx.makeImage() else {
        print("Failed to make CGImage for size \(size)")
        return
    }
    
    // Create final scaled image representation
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
        print("Successfully created pixel-optimized \(size)x\(size) PNG (\(pngData.count) bytes) -> \(outputPath.lastPathComponent)")
    } catch {
        print("Failed to write to \(outputPath.path): \(error)")
    }
}

let sizes = [16, 32, 48, 128]
for s in sizes {
    let outUrl = iconsDir.appendingPathComponent("icon\(s).png")
    renderIcon(size: s, outputPath: outUrl)
}

print("All pixel-optimized icons generated successfully!")
