# Stap 1 — Klanten vinden met Apify

Doel: bedrijven vinden (schilders, electriciens) die nog geen website hebben.

---

## 1. Account aanmaken
- Ga naar https://apify.com
- Klik op "Sign up" — gratis account is voldoende om te starten

---

## 2. Google Maps Scraper openen
- Zoek in de Apify Store naar: **Google Maps Scraper**
- Klik op de actor van Apify (de officiële versie)

---

## 3. Instellingen invullen
Vul het volgende in:
- **Search queries**: bijvoorbeeld:
  - `schilder Hoorn`
  - `schilder Enkhuizen`
  - `electricien Hoorn`
  - `electricien Medemblik`
- **Max results**: begin met 50 per zoekopdracht
- **Language**: nl
- **Country**: NL

---

## 4. Starten en wachten
- Klik op "Start" — de scraper draait in de cloud
- Na een paar minuten zijn de resultaten klaar

---

## 5. Resultaten downloaden
- Klik op "Export" → kies **Excel** of **CSV**
- Sla het bestand op in: `Desktop\Mikebedrijf\Klanten\`

---

## 6. Filteren op bedrijven zonder website
Open het Excel bestand en filter de kolom **website**:
- Leeg = geen website → dit zijn jouw potentiële klanten!
- Noteer: naam, telefoonnummer, adres

---

## 7. Wat heb je dan?
Een lijst met bedrijven in jouw regio die je kunt benaderen met het aanbod van Mikebedrijf.

---

## Volgende stap
Zie: `Stap2_Klanten_Benaderen.md` (nog aan te maken)
