# MeetingLens — Stap-voor-stap live zetten

Volg deze stappen en je website is binnen 15 minuten live, zonder technische kennis.

---

## Wat je nodig hebt (allemaal gratis)

| Account | Waarvoor | Link |
|---|---|---|
| **GitHub** | Code opslaan | github.com |
| **Groq** | Transcriptie én samenvatting | console.groq.com |
| **Vercel** | Website hosten | vercel.com |

---

## Stap 1 — Groq API key aanmaken (gratis, geen creditcard)

1. Ga naar **console.groq.com** en maak een gratis account aan
2. Klik linksboven op **"API Keys"**
3. Klik op **"Create API Key"**
4. Kopieer de key (begint met `gsk_...`) en bewaar hem even

---

## Stap 2 — Code op GitHub zetten

1. Ga naar **github.com** en log in (of maak een account aan)
2. Klik rechtsboven op **"+"** → **"New repository"**
3. Geef het een naam, bijv. `meetinglens`
4. Klik op **"Create repository"**
5. Klik op **"uploading an existing file"**
6. Sleep de map `meetinglens` met alle bestanden erin naar het uploadvenster
7. Klik op **"Commit changes"**

---

## Stap 3 — Live zetten op Vercel

1. Ga naar **vercel.com** en log in met je GitHub-account
2. Klik op **"Add New Project"**
3. Kies je `meetinglens` repository en klik op **"Import"**
4. Voordat je deploys, klik op **"Environment Variables"** en voeg toe:

   | Name | Value |
   |---|---|
   | `GROQ_API_KEY` | jouw Groq key (`gsk_...`) |

5. Klik op **"Deploy"**
6. Na ~1 minuut krijg je een live URL zoals `meetinglens.vercel.app` 🎉

---

## Klaar!

Je website is nu live. Bezoekers kunnen:
- Een audio- of videobestand uploaden (MP3, WAV, M4A, MP4)
- Automatisch een transcript krijgen via Groq Whisper
- Een samenvatting, onderwerpen en actiepunten ontvangen via Claude

De API keys staan veilig op Vercel — bezoekers zien ze nooit.

---

## Problemen?

- **"Transcriptie mislukt"** → Controleer of je GROQ_API_KEY correct is ingevoerd in Vercel
- **"Samenvatting mislukt"** → Controleer of je ANTHROPIC_API_KEY correct is en of je tegoed hebt
- **Bestand te groot** → Maximale bestandsgrootte is 25MB. Comprimeer het bestand eerst.
- Wijzigingen doorvoeren → pas de code aan op GitHub, Vercel herdeployt automatisch
