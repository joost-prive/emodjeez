# Emodjeez — Release & Deployment Gids

## Overzicht

| | |
|---|---|
| **Package name** | `net.emodjeez.twa` |
| **Website** | https://emodjeez.net |
| **Play Console** | https://play.google.com/console (ViaAventura account) |
| **GitHub** | https://github.com/joost-prive/emodjeez |
| **Cloudflare Pages** | Auto-deploy vanuit GitHub `main` branch, root dir: `Emodjeez/` |

---

## Web-update deployen (geen app-update nodig)

Wijzigingen aan `Emodjeez/index.html`, CSS, JS of andere webbestanden:

```bash
git add Emodjeez/
git commit -m "Beschrijving van wijziging"
git push origin main
```

Cloudflare deployt automatisch binnen ~1 minuut. De TWA-app laadt de live website, dus de update is meteen actief in de app — **geen nieuwe AAB nodig**.

---

## Nieuwe AAB bouwen voor Play Store

### 1. versionCode ophogen

In `emodjeez-app/app/build.gradle`:

```groovy
versionCode 4   // ← altijd +1 ten opzichte van vorige upload
versionName "1.1.0"  // ← optioneel aanpassen
```

> Huidige versionCode: **3** (geüpload 23 mrt 2026)

### 2. Bouwen

```powershell
cd "C:\Users\joost.vandeven\Documents\23) EmoDjeez\DEV\emodjeez-app"
.\gradlew bundleRelease
```

AAB-locatie na build:
```
emodjeez-app\app\build\outputs\bundle\release\app-release.aab
```

### 3. Uploaden naar Play Console

- Ga naar Play Console → Emodjeez → Testen en releasen → gewenste track
- Klik **Nieuwe release maken** → upload de AAB
- Voeg releasenotes toe → indienen voor beoordeling

---

## Signing / Keystore

| | |
|---|---|
| **Keystore bestand** | `emodjeez-app/android.keystore` |
| **Configuratie** | `emodjeez-app/keystore.properties` (gitignored) |
| **Key alias** | `android` |

`keystore.properties` formaat:
```
storeFile=../android.keystore
storePassword=WACHTWOORD
keyAlias=android
keyPassword=WACHTWOORD
```

### Certificaat-fingerprints

| Type | SHA-256 |
|---|---|
| **Google distributie** (in assetlinks.json) | `A4:FE:36:63:81:75:2E:1C:AC:CD:8D:53:09:56:15:DA:D1:52:31:04:AD:74:49:6A:5C:25:44:02:B8:50:8B:9C` |
| Upload key (android.keystore) | `5D:AE:0A:6A:C9:81:6B:26:65:F1:82:97:D9:52:32:9A:0E:28:60:5C:8F:D6:6F:04:AB:6E:4D:61:49:A8:D0:AC` |

> `assetlinks.json` moet de **Google distributie**-fingerprint bevatten, niet de upload key.
> Locatie: `Emodjeez/.well-known/assetlinks.json`

---

## Play Store — Testproces

### Tracks
| Track | Doel |
|---|---|
| Interne tests | Directe installatie voor eigen apparaten, geen review |
| Gesloten test (Alpha) | Testers via uitnodigingslink, Google review vereist |
| Productie | Publiek zichtbaar in Play Store |

### Tester opt-in link (Alpha)
```
https://play.google.com/apps/testing/net.emodjeez.twa
```

### Van Alpha naar Productie
1. Alpha moet goedgekeurd zijn door Google (1–3 dagen)
2. Minimaal **12 testers** moeten de opt-in link hebben geaccepteerd
3. Gesloten test moet minimaal **14 dagen** hebben gedraaid
4. Dan: Productie → Nieuwe release → indienen voor beoordeling

---

## Bekende technische aandachtspunten

### Duel uitnodigingslink
De link wordt gegenereerd met `window.location.origin + "/?game=" + gameId`.
Gebruik **nooit** `window.location.pathname` — dit kan `/index.html` bevatten wat onbereikbaar is op Cloudflare.

### Service worker caching
Cache versie staat in `Emodjeez/service-worker.js` (`CACHE_NAME`).
Bij grote wijzigingen: versienummer ophogen zodat gebruikers de nieuwe versie krijgen.
Alleen `/` en `/index.html` worden gecached; alle andere paden gaan direct naar het netwerk.

### assetlinks.json
Na een Play App Signing wijziging (bijv. key reset via Google): fingerprint ophalen via
Play Console → App → App-integriteit → App-ondertekening van Play → Instellingen → SHA-256.
Dan `Emodjeez/.well-known/assetlinks.json` bijwerken en pushen.

### Firebase
- Anonymous Auth: gebruikers krijgen automatisch een anonieme UID
- Firestore collecties: `emodjeez_games`, `emodjeez_daily_results`, `emodjeez_daily_winners`, `emodjeez_scores`
- Daily reset: `DAILY_NUMBER_BASE_DATE_KEY` in `index.html` bepaalt dag #1 (huidig: `2026-03-22`)

---

## Veelgebruikte commando's

```powershell
# Web deployen
git add Emodjeez/ && git commit -m "..." && git push origin main

# AAB bouwen
cd "C:\Users\joost.vandeven\Documents\23) EmoDjeez\DEV\emodjeez-app"
.\gradlew bundleRelease

# Keystore info bekijken
C:\Users\joost.vandeven\.bubblewrap\jdk\jdk-17.0.11+9\bin\keytool -list -keystore android.keystore
```
