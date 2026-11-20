Add-Type -AssemblyName System.Drawing

if (!(Test-Path -Path 'public\icons')) {
    New-Item -ItemType Directory -Force -Path 'public\icons' | Out-Null
}

function Create-CadenceIcon {
    param (
        [int]$size,
        [string]$filename,
        [float]$radiusRatio
    )

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Background Gradient
    $p1 = New-Object System.Drawing.Point 0, 0
    $p2 = New-Object System.Drawing.Point $size, $size
    $c1 = [System.Drawing.Color]::FromArgb(255, 79, 70, 229)   # Indigo #4f46e5
    $c2 = [System.Drawing.Color]::FromArgb(255, 6, 182, 212)   # Cyan #06b6d4
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $p1, $p2, $c1, $c2

    if ($radiusRatio -gt 0) {
        $r = $size * $radiusRatio
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddArc(0, 0, $r * 2, $r * 2, 180, 90)
        $path.AddArc($size - $r * 2, 0, $r * 2, $r * 2, 270, 90)
        $path.AddArc($size - $r * 2, $size - $r * 2, $r * 2, $r * 2, 0, 90)
        $path.AddArc(0, $size - $r * 2, $r * 2, $r * 2, 90, 90)
        $path.CloseFigure()
        $g.FillPath($brush, $path)
    } else {
        $g.FillRectangle($brush, 0, 0, $size, $size)
    }

    # Inner wallet glyph
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ($size * 0.065)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # Outer wallet body
    $wLeft = $size * 0.22
    $wTop = $size * 0.26
    $wRight = $size * 0.78
    $wBottom = $size * 0.74
    $wCorner = $size * 0.08

    $walletPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $walletPath.AddArc($wLeft, $wTop, $wCorner*2, $wCorner*2, 180, 90)
    $walletPath.AddLine($wLeft + $wCorner, $wTop, $wRight - $wCorner, $wTop)
    $walletPath.AddArc($wRight - $wCorner*2, $wTop, $wCorner*2, $wCorner*2, 270, 90)
    $walletPath.AddLine($wRight, $wTop + $wCorner, $wRight, $wBottom - $wCorner)
    $walletPath.AddArc($wRight - $wCorner*2, $wBottom - $wCorner*2, $wCorner*2, $wCorner*2, 0, 90)
    $walletPath.AddLine($wRight - $wCorner, $wBottom, $wLeft + $wCorner, $wBottom)
    $walletPath.AddArc($wLeft, $wBottom - $wCorner*2, $wCorner*2, $wCorner*2, 90, 90)
    $walletPath.CloseFigure()
    $g.DrawPath($pen, $walletPath)

    # Flap line
    $flapY = $size * 0.40
    $g.DrawLine($pen, ($wLeft + $wCorner*0.5), $flapY, ($wRight - $wCorner*0.5), $flapY)

    # Clasp latch
    $latchBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $latchX = $wRight - $size * 0.16
    $latchY = $size * 0.48
    $latchW = $size * 0.16
    $latchH = $size * 0.12
    $latchR = $size * 0.03
    $latchPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $latchPath.AddArc($latchX, $latchY, $latchR*2, $latchR*2, 180, 90)
    $latchPath.AddArc($latchX + $latchW - $latchR*2, $latchY, $latchR*2, $latchR*2, 270, 90)
    $latchPath.AddArc($latchX + $latchW - $latchR*2, $latchY + $latchH - $latchR*2, $latchR*2, $latchR*2, 0, 90)
    $latchPath.AddArc($latchX, $latchY + $latchH - $latchR*2, $latchR*2, $latchR*2, 90, 90)
    $latchPath.CloseFigure()
    $g.FillPath($latchBrush, $latchPath)

    # Latch cyan dot
    $dotBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 6, 182, 212))
    $dotSize = $size * 0.04
    $g.FillEllipse($dotBrush, ($latchX + $latchW*0.35), ($latchY + $latchH*0.5 - $dotSize*0.5), $dotSize, $dotSize)

    $bmp.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated $filename"
}

Create-CadenceIcon 192 'public\icons\icon-192.png' 0.22
Create-CadenceIcon 512 'public\icons\icon-512.png' 0.22
Create-CadenceIcon 180 'public\icons\apple-touch-icon.png' 0.22
Create-CadenceIcon 512 'public\icons\icon-maskable.png' 0.0
