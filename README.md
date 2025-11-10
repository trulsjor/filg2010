# Terminliste - Fjellhammer Håndball

En moderne nettside for å vise kampterminlisten for Fjellhammer håndballag (både lag 1 og lag 2). Dataene hentes automatisk fra handball.no API og vises i en responsiv tabell med klikkbare lenker.

## ✨ Hovedfunksjoner

- 📊 **Multi-lag støtte** - Vis flere lag i samme oversikt
- 🔗 **Klikkbare lenker** - Lenker til kamper, lag og turneringer
- 🎨 **Visuell lagindikator** - Fargekodet per lag
- ⏰ **Timestamp** - Se når data sist ble oppdatert
- 🔄 **Automatisk oppdatering** - Data hentes automatisk ved build
- 📱 **Responsivt design** - Tabell på desktop, kort-layout på mobil
- 📅 **Smart sortering** - Kamper sortert etter dato og klokkeslett
- ✅ **Testet** - 8 Playwright E2E-tester

## Teknologier

- **Astro** - Moderne web framework
- **TypeScript** - Type-sikkerhet
- **xlsx** - Excel-parsing
- **Playwright** - E2E testing og web scraping
- **config.json** - Enkel lag-konfigurasjon

## Kom i gang

### Installasjon

```bash
npm install
```

### Konfigurasjon

Lag-konfigurasjonen ligger i `config.json`:

```json
{
  "teams": [
    {
      "name": "Fjellhammer",
      "lagid": "531500",
      "seasonId": "201060",
      "color": "#667eea"
    },
    {
      "name": "Fjellhammer 2",
      "lagid": "812498",
      "seasonId": "201060",
      "color": "#f59e0b"
    }
  ]
}
```

### Hent terminliste-data

**Anbefalt: Hent data for alle lag**
```bash
npm run refresh
```

Dette henter data for alle lag definert i `config.json`, inkludert lenker til kamper, lag og turneringer.

### Kjør utviklingsserver

```bash
npm run dev
```

Nettsiden er nå tilgjengelig på `http://localhost:4321`

### Bygg for produksjon

```bash
npm run build
```

**Viktig**: `npm run build` henter automatisk ferske data før bygget starter! Hvis du vil bygge uten å hente nye data:

```bash
npm run build:no-refresh
```

### Forhåndsvisning av produksjonsbygg

```bash
npm run preview
```

## Testing

Prosjektet bruker TDD (Test-Driven Development) med Playwright.

### Kjør alle tester

```bash
npm test
```

### Kjør kun data-tester

```bash
npm test -- --project=data-tests
```

### Kjør kun UI-tester

```bash
npm test -- --project=ui-tests
```

### Åpne Playwright UI

```bash
npm run test:ui
```

## Prosjektstruktur

```
terminliste/
├── config.json                       # ⚙️  Lag-konfigurasjon
├── prebuild.js                       # 🔄 Prebuild script (data-refresh)
├── src/
│   ├── pages/
│   │   └── index.astro               # 🏠 Hovedside med terminliste
│   └── scripts/
│       ├── fetchAllTeamsData.ts      # ⭐ Hent data for alle lag (NYTT!)
│       ├── fetchDataWithLinks.ts     # 📊 Hent data med lenker (enkelt lag)
│       ├── scrapeLinks.ts            # 🔗 Scrape kamp- og lag-lenker
│       ├── scrapeTournamentLinks.ts  # 🏆 Scrape turnering-lenker
│       └── ...debug scripts...       # 🐛 Debug-verktøy
├── tests/
│   ├── fetchData.spec.ts             # ✅ Tester for data-henting
│   └── homepage.spec.ts              # ✅ Tester for UI og lenker
├── data/
│   ├── terminliste-alle-lag.csv      # 📄 Kombinert data for alle lag
│   ├── metadata.json                 # ⏰ Timestamp og metadata
│   ├── turneringlenker.json          # 🏆 Cachet turnering-lenker
│   └── kamplenker.json               # 🔗 Scrapede kamp-lenker
├── plan.md                           # 📋 Implementeringsplan
└── README.md                         # 📖 Denne filen
```

## Datakilder

Terminlisten hentes fra:
- **API**: https://www.handball.no/AjaxData/TerminlisteLag?id=531500&seasonId=201060
- **Format**: Excel (.xlsx)
- **Lagring**: CSV

## Design

### Desktop (tabell-visning)
- Oversiktlig tabell med alle kampdetaljer
- Fargekodet lagindikator
- Klikkbare lenker til kamper, lag og turneringer
- Moderne gradient-bakgrunn

### Mobil (kort-visning)
- **Kort-layout optimalisert for små skjermer** (under 768px)
- Hver kamp vises som et selvstendig kort
- Tydelig dato, tid og lagindikator øverst
- Score fremhevet for spilte kamper
- Kompakt informasjon om bane og tilskuere
- Én stor knapp per kamp for kampdetaljer

## Tekniske funksjoner

- Viser all terminlistedata sortert etter dato og klokkeslett
- **Klikkbare lenker til kamper, lag og turneringer**
- **Responsivt design**: Bytter automatisk mellom tabell (desktop) og kort (mobil)
- Moderne, fargerikt design med gradient-bakgrunn
- Hover-effekter for bedre brukeropplevelse
- Automatisk testing med Playwright (8 tester)
- Type-sikkerhet med TypeScript
- Web scraping av lenker med Playwright

## Utvikling

Prosjektet følger TDD-prinsipper. Alle endringer bør:
1. Starte med å skrive tester
2. Implementere funksjonalitet
3. Kjøre tester for å verifisere
4. Committe med beskrivende melding

Se `plan.md` for fullstendig implementeringsplan.
