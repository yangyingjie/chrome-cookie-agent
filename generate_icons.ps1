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
        int scale = 4;
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
                    Color.FromArgb(255, 16, 48, 36),
                    Color.FromArgb(255, 6, 22, 16)))
                {
                    g.FillPath(bgBrush, path);
                }

                // 外部翡翠流光描边
                using (Pen borderPen = new Pen(Color.FromArgb(190, 52, 211, 153), canvas * 0.022f))
                {
                    g.DrawPath(borderPen, path);
                }
            }

            // 2. 核心晶体安全盾牌 (象征 WebRTC IP 隐私防护)
            float cx = canvas * 0.5f;
            float cy = canvas * 0.52f;
            float sw = canvas * 0.58f;
            float sh = canvas * 0.62f;

            float topY = cy - sh * 0.48f;
            float bottomY = cy + sh * 0.48f;
            float leftX = cx - sw * 0.46f;
            float rightX = cx + sw * 0.46f;
            float midY = cy - sh * 0.08f;

            using (GraphicsPath shieldPath = new GraphicsPath())
            {
                shieldPath.AddLine(cx, topY, rightX, topY + sh * 0.14f);
                shieldPath.AddLine(rightX, midY, cx, bottomY);
                shieldPath.AddLine(cx, bottomY, leftX, midY);
                shieldPath.AddLine(leftX, topY + sh * 0.14f, cx, topY);
                shieldPath.CloseFigure();

                using (LinearGradientBrush shieldBrush = new LinearGradientBrush(
                    new PointF(leftX, topY),
                    new PointF(rightX, bottomY),
                    Color.FromArgb(235, 16, 185, 129),
                    Color.FromArgb(210, 4, 120, 87)))
                {
                    g.FillPath(shieldBrush, shieldPath);
                }

                using (Pen shieldPen = new Pen(Color.FromArgb(255, 167, 243, 208), canvas * 0.024f))
                {
                    g.DrawPath(shieldPen, shieldPath);
                }
            }

            // 3. 盾牌内部：金色高质感科技曲奇饼 (象征 Cookie 导出与身份令牌)
            float cookieR = canvas * 0.18f;
            RectangleF cookieRect = new RectangleF(cx - cookieR, cy - cookieR * 1.15f, cookieR * 2, cookieR * 2);

            using (LinearGradientBrush cookieBrush = new LinearGradientBrush(
                new PointF(cookieRect.X, cookieRect.Y),
                new PointF(cookieRect.Right, cookieRect.Bottom),
                Color.FromArgb(255, 252, 211, 77),
                Color.FromArgb(255, 217, 119, 6)))
            {
                g.FillEllipse(cookieBrush, cookieRect);
            }

            using (Pen cookieBorder = new Pen(Color.FromArgb(255, 254, 243, 199), canvas * 0.02f))
            {
                g.DrawEllipse(cookieBorder, cookieRect);
            }

            // 巧克力芯片点缀
            using (SolidBrush chipBrush = new SolidBrush(Color.FromArgb(255, 120, 53, 15)))
            {
                float cr = canvas * 0.035f;
                g.FillEllipse(chipBrush, cx - cookieR * 0.45f, cy - cookieR * 0.7f, cr, cr);
                g.FillEllipse(chipBrush, cx + cookieR * 0.25f, cy - cookieR * 0.5f, cr * 1.1f, cr * 1.1f);
                g.FillEllipse(chipBrush, cx - cookieR * 0.1f, cy - cookieR * 0.15f, cr * 1.2f, cr * 1.2f);
                g.FillEllipse(chipBrush, cx - cookieR * 0.5f, cy + cookieR * 0.15f, cr, cr);
                g.FillEllipse(chipBrush, cx + cookieR * 0.3f, cy + cookieR * 0.25f, cr, cr);
            }

            // 4. 双向科技切换光环 (象征 User-Agent 自由切换)
            using (Pen arcPen = new Pen(Color.FromArgb(230, 255, 255, 255), canvas * 0.032f))
            {
                arcPen.StartCap = LineCap.Round;
                arcPen.EndCap = LineCap.Round;
                g.DrawArc(arcPen, cx - canvas * 0.38f, cy - canvas * 0.38f, canvas * 0.76f, canvas * 0.76f, 135, 70);
                g.DrawArc(arcPen, cx - canvas * 0.38f, cy - canvas * 0.38f, canvas * 0.76f, canvas * 0.76f, 315, 70);
            }

            // 5. 降采样生成目标尺寸
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
