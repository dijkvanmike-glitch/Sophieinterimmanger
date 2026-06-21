# =============================================
# Maak_Demo.ps1 — Gepersonaliseerde demo-website aanmaken
# Gebruik: klik rechts op dit bestand → "Run with PowerShell"
# =============================================

$root = $PSScriptRoot

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "  Vindbaar — Demo website maken" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Welk type bedrijf?" -ForegroundColor Yellow
Write-Host "  1. Rijschool"
Write-Host "  2. Schildersbedrijf"
Write-Host ""
$type = Read-Host "Kies 1 of 2"

if ($type -eq "1") {
    $template = "$root\Website\Autorijschool\template.html"
    $typeNaam = "Rijschool"
} else {
    $template = "$root\Website\Schildersbedrijf\template.html"
    $typeNaam = "Schildersbedrijf"
}

Write-Host ""
Write-Host "Vul de gegevens in van het bedrijf:" -ForegroundColor Yellow
Write-Host ""

$deel1    = Read-Host "Naam deel 1 (bijv. 'Autorijschool' of 'Schildersbedrijf')"
$deel2    = Read-Host "Naam deel 2 — het unieke deel (bijv. 'Jara' of 'Heerschop')"
$telefoon = Read-Host "Telefoonnummer (bijv. '+31 6 18248577')"
$stad     = Read-Host "Stad (bijv. 'Blaricum')"
$email    = Read-Host "E-mailadres — laat leeg als onbekend"
$kvk      = Read-Host "KvK-nummer — laat leeg als onbekend"

# Bereken afgeleide waarden
$naamVolledig = "$deel1 $deel2"
$telefoonLink = "+" + ($telefoon -replace '[\s\+]', '')
$telefoonWA   = $telefoon -replace '[\s\+]', ''
if ($email -eq "") { $email = "info@$($deel2.ToLower()).nl" }
if ($kvk -eq "")   { $kvk   = "00000000" }

# Map aanmaken
$mapNaam = "$($deel1)_$($deel2)_$($stad)" -replace '\s+', '_'
$uitvoer = "$root\Klanten\Per_Klant\$mapNaam\website"
New-Item -ItemType Directory -Force $uitvoer | Out-Null

# Template inlezen en plaatshouders vervangen
$html = Get-Content $template -Raw -Encoding utf8
$html = $html -replace [regex]::Escape("{{NAAM_VOLLEDIG}}"),  $naamVolledig
$html = $html -replace [regex]::Escape("{{NAAM_DEEL1}}"),     $deel1
$html = $html -replace [regex]::Escape("{{NAAM_DEEL2}}"),     $deel2
$html = $html -replace [regex]::Escape("{{TELEFOON}}"),       $telefoon
$html = $html -replace [regex]::Escape("{{TELEFOON_LINK}}"),  $telefoonLink
$html = $html -replace [regex]::Escape("{{TELEFOON_WA}}"),    $telefoonWA
$html = $html -replace [regex]::Escape("{{EMAIL}}"),          $email
$html = $html -replace [regex]::Escape("{{STAD}}"),           $stad
$html = $html -replace [regex]::Escape("{{KVK}}"),            $kvk

$uitvoerBestand = "$uitvoer\index.html"
Set-Content $uitvoerBestand -Value $html -Encoding utf8

Write-Host ""
Write-Host "Klaar!" -ForegroundColor Green
Write-Host "Website: $uitvoer" -ForegroundColor White
Write-Host ""
Write-Host "Volgende stap — op Netlify zetten:" -ForegroundColor Yellow
Write-Host "  1. Ga naar netlify.com en log in"
Write-Host "  2. Sleep de map '$uitvoer' naar het Netlify-dashboard"
Write-Host "  3. Verander de sitenaam naar: demo-$($deel2.ToLower())-$($stad.ToLower())"
Write-Host "  4. Kopieer de link en stuur via WhatsApp"
Write-Host ""

Start-Process $uitvoerBestand
