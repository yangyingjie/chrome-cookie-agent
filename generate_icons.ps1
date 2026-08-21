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

            float pad = canvas * 0.04f;
            RectangleF inner = new RectangleF(pad, pad, canvas - 2 * pad, canvas - 2 * pad);

            // 1. Squircle 优雅圆角外框与深林黑曜石渐变背景
            using (GraphicsPath path = new GraphicsPath())
            {
                float r = canvas * 0.22f;
                float d = r * 2;
                path.AddArc(inner.X, inner.Y, d, d, 180, 90);
                path.AddArc(inner.Right - d, inner.Y, d, d, 270, 90);
                path.AddArc(inner.Right - d, inner.Bottom - d, d, d, 0, 90);
                path.AddArc(inner.X, inner.Bottom - d, d, d, 90, 90);
                path.CloseFigure();

                using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                    new PointF(inner.X, inner.Y),
                    new PointF(inner.Right, inner.Bottom),
                    Color.FromArgb(255, 16, 42, 32),
                    Color.FromArgb(255, 2, 9, 6)))
                {
                    g.FillPath(bgBrush, path);
                }

                // 外部翡翠流光描边
                using (Pen borderPen = new Pen(Color.FromArgb(220, 52, 211, 153), Math.Max(1.0f, canvas * 0.024f)))
                {
                    g.DrawPath(borderPen, path);
                }
            }

            // 2. 双向科技切换与倍速光环
            if (size >= 32)
            {
                float cxOrb = canvas * 0.5f;
                float cyOrb = canvas * 0.5f;
                float orbR = canvas * 0.38f;
                using (Pen arcPen1 = new Pen(Color.FromArgb(215, 56, 189, 248), Math.Max(1.2f, canvas * 0.028f)))
                using (Pen arcPen2 = new Pen(Color.FromArgb(215, 52, 211, 153), Math.Max(1.2f, canvas * 0.028f)))
                {
                    arcPen1.StartCap = LineCap.Round;
                    arcPen1.EndCap = LineCap.Round;
                    arcPen2.StartCap = LineCap.Round;
                    arcPen2.EndCap = LineCap.Round;
                    g.DrawArc(arcPen1, cxOrb - orbR, cyOrb - orbR, orbR * 2, orbR * 2, 190, 80);
                    g.DrawArc(arcPen2, cxOrb - orbR, cyOrb - orbR, orbR * 2, orbR * 2, 10, 80);
                }
            }

            // 3. 核心晶体安全盾牌 (象征 WebRTC IP 隐私防护与全能基座)
            float cx = canvas * 0.5f;
            float topY = canvas * (size <= 16 ? 0.16f : 0.20f);
            float bottomY = canvas * (size <= 16 ? 0.86f : 0.84f);
            float leftX = canvas * (size <= 16 ? 0.20f : 0.24f);
            float rightX = canvas * (size <= 16 ? 0.80f : 0.76f);
            float shoulderY = topY + (bottomY - topY) * 0.22f;
            float midY = topY + (bottomY - topY) * 0.52f;

            using (GraphicsPath shieldPath = new GraphicsPath())
            {
                shieldPath.AddLine(cx, topY, rightX, shoulderY);
                shieldPath.AddLine(rightX, shoulderY, rightX, midY);
                shieldPath.AddBezier(rightX, midY, rightX, bottomY - canvas * 0.04f, cx + (rightX - cx) * 0.3f, bottomY, cx, bottomY);
                shieldPath.AddBezier(cx, bottomY, cx - (cx - leftX) * 0.3f, bottomY, leftX, bottomY - canvas * 0.04f, leftX, midY);
                shieldPath.AddLine(leftX, midY, leftX, shoulderY);
                shieldPath.CloseFigure();

                using (LinearGradientBrush shieldBrush = new LinearGradientBrush(
                    new PointF(leftX, topY),
                    new PointF(rightX, bottomY),
                    Color.FromArgb(255, 52, 211, 153),
                    Color.FromArgb(255, 4, 120, 87)))
                {
                    g.FillPath(shieldBrush, shieldPath);
                }

                // 盾牌左半侧 3D 水晶高光切面
                using (GraphicsPath facetPath = new GraphicsPath())
                {
                    facetPath.AddLine(cx, topY, leftX, shoulderY);
                    facetPath.AddLine(leftX, shoulderY, leftX, midY);
                    facetPath.AddBezier(leftX, midY, leftX, bottomY - canvas * 0.04f, cx - (cx - leftX) * 0.3f, bottomY, cx, bottomY);
                    facetPath.AddLine(cx, bottomY, cx, topY);
                    facetPath.CloseFigure();

                    using (LinearGradientBrush facetBrush = new LinearGradientBrush(
                        new PointF(leftX, topY),
                        new PointF(cx, bottomY),
                        Color.FromArgb(100, 255, 255, 255),
                        Color.FromArgb(0, 52, 211, 153)))
                    {
                        g.FillPath(facetBrush, facetPath);
                    }
                }

                using (Pen shieldPen = new Pen(Color.FromArgb(240, 167, 243, 208), Math.Max(1.0f, canvas * (size <= 16 ? 0.07f : 0.024f))))
                {
                    g.DrawPath(shieldPen, shieldPath);
                }
            }

            // 4. 盾牌内部：金色高质感科技曲奇饼 (象征 Cookie 导出与身份令牌)
            float cookieR = canvas * (size <= 16 ? 0.20f : 0.17f);
            float cookieCy = topY + (bottomY - topY) * 0.48f;
            RectangleF cookieRect = new RectangleF(cx - cookieR, cookieCy - cookieR, cookieR * 2, cookieR * 2);

            using (LinearGradientBrush cookieBrush = new LinearGradientBrush(
                new PointF(cookieRect.X, cookieRect.Y),
                new PointF(cookieRect.Right, cookieRect.Bottom),
                Color.FromArgb(255, 254, 240, 138),
                Color.FromArgb(255, 180, 83, 9)))
            {
                g.FillEllipse(cookieBrush, cookieRect);
            }

            using (Pen cookieBorder = new Pen(Color.FromArgb(240, 254, 249, 195), Math.Max(1.0f, canvas * (size <= 16 ? 0.06f : 0.022f))))
            {
                g.DrawEllipse(cookieBorder, cookieRect);
            }

            // 巧克力芯片点缀
            using (SolidBrush chipBrush = new SolidBrush(Color.FromArgb(240, 69, 26, 3)))
            {
                float cr = cookieR * 0.22f;
                g.FillEllipse(chipBrush, cx - cookieR * 0.40f, cookieCy - cookieR * 0.40f, cr, cr);
                g.FillEllipse(chipBrush, cx + cookieR * 0.38f, cookieCy - cookieR * 0.25f, cr * 1.1f, cr * 1.1f);
                g.FillEllipse(chipBrush, cx - cookieR * 0.10f, cookieCy + cookieR * 0.10f, cr * 1.15f, cr * 1.15f);
                g.FillEllipse(chipBrush, cx - cookieR * 0.42f, cookieCy + cookieR * 0.38f, cr * 0.9f, cr * 0.9f);
                g.FillEllipse(chipBrush, cx + cookieR * 0.38f, cookieCy + cookieR * 0.35f, cr * 0.95f, cr * 0.95f);
            }

            // 5. 右上角悬浮置顶小窗 / PiP 徽标 (Picture-in-Picture & Always-On-Top)
            float pipW = canvas * (size <= 16 ? 0.38f : (size <= 32 ? 0.32f : 0.26f));
            float pipH = pipW * 0.72f;
            float pipX = canvas * (size <= 16 ? 0.58f : (size <= 32 ? 0.62f : 0.65f));
            float pipY = canvas * (size <= 16 ? 0.10f : (size <= 32 ? 0.14f : 0.16f));
            RectangleF pipRect = new RectangleF(pipX, pipY, pipW, pipH);
            float pipRadius = Math.Max(1.5f, pipW * 0.2f);
            float pipD = pipRadius * 2;

            using (GraphicsPath pipPath = new GraphicsPath())
            {
                pipPath.AddArc(pipRect.X, pipRect.Y, pipD, pipD, 180, 90);
                pipPath.AddArc(pipRect.Right - pipD, pipRect.Y, pipD, pipD, 270, 90);
                pipPath.AddArc(pipRect.Right - pipD, pipRect.Bottom - pipD, pipD, pipD, 0, 90);
                pipPath.AddArc(pipRect.X, pipRect.Bottom - pipD, pipD, pipD, 90, 90);
                pipPath.CloseFigure();

                using (LinearGradientBrush pipBrush = new LinearGradientBrush(
                    new PointF(pipX, pipY),
                    new PointF(pipX + pipW, pipY + pipH),
                    Color.FromArgb(255, 56, 189, 248),
                    Color.FromArgb(255, 2, 132, 199)))
                {
                    g.FillPath(pipBrush, pipPath);
                }

                // 顶栏深色条
                float headerH = pipH * 0.32f;
                using (SolidBrush headerBrush = new SolidBrush(Color.FromArgb(255, 3, 105, 161)))
                {
                    g.FillRectangle(headerBrush, pipX, pipY, pipW, headerH);
                }

                // 浮窗边框
                using (Pen pipPen = new Pen(Color.FromArgb(240, 224, 242, 254), Math.Max(1.0f, canvas * (size <= 16 ? 0.06f : 0.02f))))
                {
                    g.DrawPath(pipPen, pipPath);
                }

                // 浮窗画中画小箭头
                if (size >= 32)
                {
                    using (Pen arrowPen = new Pen(Color.FromArgb(250, 255, 255, 255), Math.Max(1.0f, canvas * 0.02f)))
                    {
                        arrowPen.StartCap = LineCap.Round;
                        arrowPen.EndCap = LineCap.Round;
                        arrowPen.LineJoin = LineJoin.Round;
                        float ax = pipX + pipW * 0.48f;
                        float ay = pipY + headerH + (pipH - headerH) * 0.18f;
                        float aw = pipW * 0.38f;
                        float ah = (pipH - headerH) * 0.65f;
                        PointF[] arrowPts = new PointF[] {
                            new PointF(ax, ay + ah),
                            new PointF(ax + aw, ay + ah),
                            new PointF(ax + aw, ay)
                        };
                        g.DrawLines(arrowPen, arrowPts);
                        g.DrawLine(arrowPen, ax + aw * 0.3f, ay + ah * 0.7f, ax + aw, ay);
                    }
                }
            }

            // 6. 降采样生成目标尺寸
            using (Bitmap finalBmp = new Bitmap(size, size))
            using (Graphics fg = Graphics.FromImage(finalBmp))
            {
                fg.SmoothingMode = SmoothingMode.AntiAlias;
                fg.InterpolationMode = InterpolationMode.HighQualityBicubic;
                fg.PixelOffsetMode = PixelOffsetMode.HighQuality;
                fg.CompositingQuality = CompositingQuality.HighQuality;
                fg.DrawImage(bmp, 0, 0, size, size);

                string dir = Path.GetDirectoryName(outputPath);
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

                finalBmp.Save(outputPath, ImageFormat.Png);
                Console.WriteLine("Successfully created: " + outputPath + " (" + size + "x" + size + ")");
            }
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies System.Drawing

$iconsDir = Join-Path $PSScriptRoot "icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

[IconGenerator]::GenerateIcon(16, (Join-Path $iconsDir "icon16.png"))
[IconGenerator]::GenerateIcon(32, (Join-Path $iconsDir "icon32.png"))
[IconGenerator]::GenerateIcon(48, (Join-Path $iconsDir "icon48.png"))
[IconGenerator]::GenerateIcon(128, (Join-Path $iconsDir "icon128.png"))
