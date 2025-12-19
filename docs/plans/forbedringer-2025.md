# Forbedringer og nye features - Terminliste 2025

## Prioritet 1: Automatisk resultatoppdatering

### 1.1 Smart resultat-script (`updateResults.ts`)

**Mål:** Kun oppdatere kamper som mangler resultat - sekunder i stedet for minutter.

**Implementering:**

1. Opprett `src/scripts/updateResults.ts`:
   - Les eksisterende `data/terminliste.json`
   - Filtrer kamper hvor dato har passert OG `H-B === "-"`
   - For hver kamp: fetch kamp-URL og parse resultatet fra HTML
   - Oppdater kun `H-B`-feltet i JSON
   - Lagre oppdatert fil + metadata

2. Legg til npm script i `package.json`:
   ```json
   "update-results": "npx tsx src/scripts/updateResults.ts"
   ```

3. Lag `src/services/result-scraper.service.ts`:
   - Enkel fetch (ikke Playwright) for å hente kamp-sider
   - Parse resultat fra HTML med regex eller cheerio
   - Håndter feil gracefully (kamp ikke startet, etc.)

**Tekniske detaljer:**
- Resultat finnes i `<strong>31</strong>` tags på kamp-siden
- Trenger kun enkel HTTP fetch, ikke full browser
- Bør ha rate-limiting for å ikke overbelaste handball.no

### 1.2 GitHub Actions cron job

**Mål:** Automatisk oppdatering uten manuell deploy.

**Implementering:**

1. Oppdater `.github/workflows/deploy.yml`:
   ```yaml
   on:
     push:
       branches:
         - main
     schedule:
       # Hver dag kl 22:00 norsk tid (21:00 UTC)
       - cron: '0 21 * * *'
     workflow_dispatch:  # Manuell trigger
   ```

2. Endre build-kommando til å bruke smart update:
   ```yaml
   - name: Update results and build
     run: npm run update-results && npm run build
   ```

3. Behold `npm run build:fresh` for full refresh ved behov

**Valgfritt - ekstra cron-tider:**
- Lørdag/søndag kl 14:00 og 18:00 (kampdager)
- Hverdager kl 21:00 (treningskamper)

---

## Prioritet 2: Kalender-eksport (iCal)

### 2.1 iCal-feed for alle kamper

**Mål:** La brukere abonnere på terminlisten i kalenderen sin.

**Implementering:**

1. Opprett `src/pages/calendar.ics.ts` (Astro endpoint):
   - Generer iCal-format fra terminliste.json
   - Inkluder: dato, tid, sted, lag, kamplenke
   - Sett VTIMEZONE til Europe/Oslo

2. iCal-format eksempel:
   ```
   BEGIN:VCALENDAR
   VERSION:2.0
   PRODID:-//Fjellhammer G2010//Terminliste//NO
   BEGIN:VEVENT
   DTSTART:20251115T142500
   DTEND:20251115T160000
   SUMMARY:Fjellhammer 2 vs Linderud/Linje 5 - 2
   LOCATION:Fjellhamar Arena 2
   URL:https://www.handball.no/system/kamper/kamp/?matchid=8231643
   END:VEVENT
   END:VCALENDAR
   ```

3. Legg til "Abonner på kalender"-knapp i header

### 2.2 Enkelt-kamp til kalender

**Mål:** "Legg til i kalender"-knapp per kamp.

**Implementering:**
- Generer `.ics`-fil on-the-fly eller bruk Google Calendar URL-format
- Knapp ved siden av hver kamp (desktop) eller i kort-footer (mobil)

---

## Prioritet 3: Filtrering og sortering

### 3.1 Filtreringsknapper

**Mål:** La brukere filtrere på lag, hjemme/borte, spilte/kommende.

**Implementering:**

1. Legg til filter-state i frontend (vanilla JS eller Alpine.js)

2. Filter-knapper:
   - Lag: [Alle] [Fjellhammer] [Fjellhammer 2]
   - Type: [Alle] [Hjemme] [Borte]
   - Status: [Alle] [Kommende] [Spilte]

3. CSS-klasser for å vise/skjule rader:
   ```css
   .match-row[data-lag="Fjellhammer 2"].hide-lag-2 { display: none; }
   ```

4. Lagre filter-valg i localStorage

---

## Prioritet 4: Statistikk-side

### 4.1 Kampstatistikk

**Mål:** Vise oversikt over vunnet/tapt/uavgjort.

**Implementering:**

1. Opprett `src/pages/statistikk.astro`

2. Beregn fra terminliste.json:
   - Antall seire/tap/uavgjort per lag
   - Totalt scorede/sluppet inn mål
   - Hjemme vs borte-statistikk

3. Visualisering:
   - Enkle tall-bokser
   - Evt. enkel bar-chart med CSS

### 4.2 Poengutvikling (valgfritt)

- Graf som viser poeng over tid
- Krever mer avansert charting (Chart.js eller lignende)

---

## Prioritet 5: PWA-støtte

### 5.1 Service Worker og manifest

**Mål:** Offline-tilgang og "installer app"-funksjonalitet.

**Implementering:**

1. Opprett `public/manifest.json`:
   ```json
   {
     "name": "Fjellhammer G2010 Terminliste",
     "short_name": "G2010",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#020b05",
     "theme_color": "#009B3E",
     "icons": [...]
   }
   ```

2. Opprett `public/sw.js` for offline-caching:
   - Cache HTML, CSS, JSON ved første besøk
   - Serve fra cache når offline

3. Registrer service worker i `index.astro`

---

## Prioritet 6: Tabell-visning (serietabell)

### 6.1 Hent serietabell fra handball.no

**Mål:** Vise serietabellen for turneringene.

**Implementering:**

1. Undersøk om handball.no har API for serietabell
2. Alternativt: scrape tabell fra turnerings-URL
3. Vis i egen seksjon eller som modal

---

## Prioritet 7: Baneveibeskrivelse

### 7.1 Kart-lenker for bortekamper

**Mål:** Gjøre det lett å finne veien til bortekamper.

**Implementering:**

1. Generer Google Maps-lenke fra bane-navn:
   ```
   https://www.google.com/maps/search/?api=1&query=Ski+Alliansehall
   ```

2. Vis kart-ikon ved siden av bane-navn (kun for bortekamper)

---

## Teknisk gjeld

### T1: Splitt opp index.astro

**Mål:** Bedre vedlikeholdbarhet.

**Komponenter å ekstrahere:**
- `src/components/Header.astro`
- `src/components/MatchTable.astro`
- `src/components/MatchCard.astro`
- `src/components/NextMatchButton.astro`
- `src/components/FilterBar.astro`

### T2: Bedre TypeScript-typing

- Fjern `any[]` i `fetchTeamSchedule`
- Lag eksplisitt `RawMatchData` type for API-respons
- Vurder Zod for runtime-validering av config

### T3: Tilgjengelighet (a11y)

- Legg til `aria-label` på interaktive elementer
- Sjekk fargekontrast
- Tastaturnavigasjon for filter-knapper

---

## Implementeringsrekkefølge

```
Fase 1 (ferdig):
  [x] Analyse
  [x] 1.1 updateResults.ts script
  [x] 1.2 GitHub Actions cron

Fase 2 (pågår):
  [x] 2.1 iCal-feed
  [ ] 2.2 Enkelt-kamp kalender
  [ ] T1 Splitt komponenter

Fase 3:
  [ ] 3.1 Filtrering
  [ ] 4.1 Statistikk-side

Fase 4:
  [ ] 5.1 PWA-støtte
  [ ] 6.1 Serietabell
  [ ] 7.1 Baneveibeskrivelse

Løpende:
  [ ] T2 TypeScript-forbedringer
  [ ] T3 Tilgjengelighet
```

---

## Notater

- Push-varsler er parkert som en fremtidig mulighet
- Ingen tidsestimater - prioriter etter behov
- Test grundig før deploy (spesielt cron-jobben)
