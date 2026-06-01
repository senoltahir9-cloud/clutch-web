param(
    [Parameter(Mandatory = $true)]
    [string]$ImagesDir,

    [Parameter(Mandatory = $true)]
    [string]$OutputJson
)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]

function Await-Operation($operation, $resultType) {
    $method = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
        Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 })[0]
    $task = $method.MakeGenericMethod($resultType).Invoke($null, @($operation))
    $task.Wait()
    return $task.Result
}

function Read-OcrText([string]$path, $engine) {
    $file = Await-Operation ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path)) ([Windows.Storage.StorageFile])
    $stream = Await-Operation ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await-Operation ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await-Operation ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $result = Await-Operation ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    return $result.Text
}

function Get-TextScore([string]$text) {
    if (-not $text) { return 0 }
    $score = 0
    $words = @(
        'basketbol', 'oyuncu', 'oyuncular', 'antren', 'savunma', 'hücum', 'hucum',
        'dribble', 'pas', 'top', 'şut', 'sut', 'duruş', 'durus', 'adım', 'adim',
        'için', 'icin', 'olan', 'gerekir', 'hareket', 'temel', 'çalış', 'calis'
    )
    foreach ($word in $words) {
        $matches = [regex]::Matches($text.ToLowerInvariant(), [regex]::Escape($word))
        $score += $matches.Count
    }
    $score += [regex]::Matches($text, '[a-zA-ZçğıöşüÇĞİÖŞÜ]{4,}').Count * 0.05
    return $score
}

function Save-Rotated180([string]$path, [string]$target) {
    $bitmap = [System.Drawing.Bitmap]::FromFile($path)
    try {
        $bitmap.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone)
        $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    }
    finally {
        $bitmap.Dispose()
    }
}

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('tr'))
if (-not $engine) {
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}
if (-not $engine) {
    throw "Windows OCR motoru bulunamadı."
}

$items = New-Object System.Collections.Generic.List[object]
$files = Get-ChildItem -LiteralPath $ImagesDir -Filter 'page_*.jpg' | Sort-Object Name
$total = $files.Count
$current = 0

foreach ($file in $files) {
    $current++
    $page = [int]([regex]::Match($file.BaseName, '\d+').Value)
    $text = (Read-OcrText $file.FullName $engine) -replace '\s+', ' '
    $text = $text.Trim()

    $score = Get-TextScore $text
    if ($score -lt 8 -and $text.Length -gt 30) {
        $rotatedPath = Join-Path $env:TEMP ("clutch_ocr_rotated_" + $file.Name)
        Save-Rotated180 $file.FullName $rotatedPath
        $rotatedText = (Read-OcrText $rotatedPath $engine) -replace '\s+', ' '
        $rotatedText = $rotatedText.Trim()
        if ((Get-TextScore $rotatedText) -gt $score) {
            $text = $rotatedText
        }
        Remove-Item -LiteralPath $rotatedPath -ErrorAction SilentlyContinue
    }

    if ($text.Length -gt 30) {
        $items.Add([pscustomobject]@{
            page = $page
            text = $text
        })
    }

    if ($current % 25 -eq 0) {
        Write-Host "ocr=$current/$total"
    }
}

$payload = [pscustomobject]@{
    title = 'BASKETBOL ALTYAPI ANTRENOR KITABI'
    source = 'TBF Basketbol Altyapi Antrenor Kitabi'
    generatedAt = (Get-Date).ToString('s')
    pages = $items
}

$json = $payload | ConvertTo-Json -Depth 5 -Compress
Set-Content -LiteralPath $OutputJson -Value $json -Encoding UTF8
Write-Host "written=$OutputJson pagesWithText=$($items.Count)"
