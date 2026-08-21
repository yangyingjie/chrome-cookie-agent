$csharpCode = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public class IconGenerator
{
    public static void GenerateIcon(int size, string outputPath)
    {
        int scale = size <= 32 ? 4 : 2;
        int canvas = size * scale;
        using (Bitmap bmp = new Bitmap(canvas, canvas))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.Clear(Color.Transparent);

            float pad = canvas * 0.05f;
            RectangleF inner = new RectangleF(pad, pad, canvas - 2 * pad, canvas - 2 * pad);
            float cx = canvas * 0.5f;
            float cy = canvas * 0.5f;

            // 1. Squircle 优雅圆角外框与深曜翡翠微光背景
            using (GraphicsPath bgPath = new GraphicsPath())
            {
                float r = canvas * 0.23f;
                float d = r * 2;
                bgPath.AddArc(inner.X, inner.Y, d, d, 180, 90);
                bgPath.AddArc(inner.Right - d, inner.Y, d, d, 270, 90);
                bgPath.AddArc(inner.Right - d, inner.Bottom - d, d, d, 0, 90);
                bgPath.AddArc(inner.X, inner.Bottom - d, d, d, 90, 90);
                bgPath.CloseFigure();

                using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                    new PointF(inner.X, inner.Y),
                    new PointF(inner.Right, inner.Bottom),
                    Color.FromArgb(255, 6, 78, 59),
                    Color.FromArgb(255, 1, 20, 14)))
                {
                    g.FillPath(bgBrush, bgPath);
                }

                // 外部翡翠微光描边
                using (Pen borderPen = new Pen(Color.FromArgb(220, 52, 211, 153), Math.Max(1.0f, canvas * (size <= 16 ? 0.06f : 0.024f))))
                {
                    g.DrawPath(borderPen, bgPath);
                }
            }

            // 2. 核心极简琥珀金曲奇 (带右上角标志性咬口切角)
            float cookieR = canvas * (size <= 16 ? 0.33f : (size <= 32 ? 0.31f : 0.30f));
            float cookieCy = cy + canvas * 0.015f;

            using (GraphicsPath cookiePath = new GraphicsPath())
            {
                // 主圆大弧 (从正上方 270 度经左、下、到右侧 0 度)
                cookiePath.AddArc(cx - cookieR, cookieCy - cookieR, cookieR * 2, cookieR * 2, 270, 270);

                // 右上咬口内凹贝塞尔曲线返回正上方
                PointF pRight = new PointF(cx + cookieR, cookieCy);
                PointF pBiteInner = new PointF(cx + cookieR * 0.58f, cookieCy - cookieR * 0.45f);
                PointF pTop = new PointF(cx, cookieCy - cookieR);

                cookiePath.AddBezier(pRight, new PointF(cx + cookieR * 0.78f, cookieCy - cookieR * 0.02f),
                                     new PointF(cx + cookieR * 0.68f, cookieCy - cookieR * 0.30f), pBiteInner);
                cookiePath.AddBezier(pBiteInner, new PointF(cx + cookieR * 0.48f, cookieCy - cookieR * 0.65f),
                                     new PointF(cx + cookieR * 0.28f, cookieCy - cookieR * 0.95f), pTop);
                cookiePath.CloseFigure();

                using (LinearGradientBrush cookieBrush = new LinearGradientBrush(
                    new PointF(cx - cookieR * 0.6f, cookieCy - cookieR * 0.6f),
                    new PointF(cx + cookieR * 0.8f, cookieCy + cookieR * 0.8f),
                    Color.FromArgb(255, 254, 240, 138),
                    Color.FromArgb(255, 180, 83, 9)))
                {
                    g.FillPath(cookieBrush, cookiePath);
                }

                // 曲奇高光描边
                using (Pen cookieBorder = new Pen(Color.FromArgb(240, 254, 249, 195), Math.Max(1.0f, canvas * (size <= 16 ? 0.06f : 0.022f))))
                {
                    g.DrawPath(cookieBorder, cookiePath);
                }

                // 曲奇左上方柔和高光弧
                if (size >= 32)
                {
                    using (Pen hlPen = new Pen(Color.FromArgb(160, 255, 255, 255), Math.Max(1.0f, canvas * 0.02f)))
                    {
                        hlPen.StartCap = LineCap.Round;
                        hlPen.EndCap = LineCap.Round;
                        float hlr = cookieR * 0.82f;
                        g.DrawArc(hlPen, cx - hlr, cookieCy - hlr, hlr * 2, hlr * 2, 205, 55);
                    }
                }
            }

            // 3. 规整黄金比例巧克力芯片 (3 颗极简芯片)
            using (SolidBrush chipBrush = new SolidBrush(Color.FromArgb(245, 59, 18, 4)))
            using (SolidBrush chipHlBrush = new SolidBrush(Color.FromArgb(220, 253, 230, 138)))
            {
                var chips = size <= 16 ? new[] {
                    Tuple.Create(-0.35f, -0.25f, 0.22f),
                    Tuple.Create(0.18f, 0.32f, 0.22f),
                    Tuple.Create(-0.25f, 0.35f, 0.20f)
                } : new[] {
                    Tuple.Create(-0.34f, -0.28f, 0.19f),
                    Tuple.Create(0.18f, 0.32f, 0.19f),
                    Tuple.Create(-0.28f, 0.35f, 0.17f)
                };

                foreach (var chip in chips)
                {
                    float chx = cx + chip.Item1 * cookieR;
                    float chy = cookieCy + chip.Item2 * cookieR;
                    float chr = chip.Item3 * cookieR;
                    g.FillEllipse(chipBrush, chx - chr, chy - chr, chr * 2, chr * 2);

                    if (size >= 32)
                    {
                        float hlr = chr * 0.35f;
                        g.FillEllipse(chipHlBrush, chx - chr * 0.35f - hlr, chy - chr * 0.35f - hlr, hlr * 2, hlr * 2);
                    }
                }
            }

            // 4. 高保真降采样生成目标尺寸 PNG
            using (Bitmap finalBmp = new Bitmap(size, size))
            using (Graphics fg = Graphics.FromImage(finalBmp))
            {
                fg.SmoothingMode = SmoothingMode.AntiAlias;
                fg.InterpolationMode = InterpolationMode.HighQualityBicubic;
                fg.PixelOffsetMode = PixelOffsetMode.HighQuality;
                fg.CompositingQuality = CompositingQuality.HighQuality;
                fg.DrawImage(bmp, new Rectangle(0, 0, size, size), 0, 0, canvas, canvas, GraphicsUnit.Pixel);

                finalBmp.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies "System.Drawing"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$iconsDir = Join-Path $scriptDir "icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

$sizes = @(16, 32, 48, 128)
foreach ($size in $sizes) {
    $outFile = Join-Path $iconsDir "icon$size.png"
    [IconGenerator]::GenerateIcon($size, $outFile)
    Write-Host "Generated: $outFile" -ForegroundColor Green
}

Write-Host "All minimalist icons generated successfully!" -ForegroundColor Cyan
