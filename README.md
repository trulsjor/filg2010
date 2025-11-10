# Terminliste - Fjellhammer Håndball

En moderne nettside for å vise kampterminlisten for Fjellhammer håndballag. Dataene hentes fra handball.no API og vises i en responsiv tabell.

## Teknologier

- **Astro** - Moderne web framework
- **TypeScript** - Type-sikkerhet
- **xlsx** - Excel-parsing
- **Playwright** - E2E testing

## Kom i gang

### Installasjon

```bash
npm install
```

### Hent terminliste-data

Før du kan kjøre nettsiden, må du hente dataene fra handball.no:

**Alternativ 1: Kun Excel-data (uten lenker)**
```bash
node --loader tsx src/scripts/fetchData.ts
```

**Alternativ 2: Med lenker til kamper og lag (anbefalt)**
```bash
npx tsx src/scripts/fetchDataWithLinks.ts
```

Dette laster ned Excel-filen fra handball.no API, scraper lenker fra handball.no-nettsiden, og kombinerer alt i CSV-format. Med lenker får du klikkbare lag- og kamp-lenker i terminlisten.

### Kjør utviklingsserver

```bash
npm run dev
```

Nettsiden er nå tilgjengelig på `http://localhost:4321`

### Bygg for produksjon

```bash
npm run build
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
├── src/
│   ├── pages/
│   │   └── index.astro               # Hovedside med terminliste
│   └── scripts/
│       ├── fetchData.ts              # Script for å hente Excel-data
│       ├── fetchDataWithLinks.ts     # Script for å hente data med lenker
│       ├── scrapeLinks.ts            # Script for å scrape lenker
│       └── inspectPage.ts            # Debug-verktøy
├── tests/
│   ├── fetchData.spec.ts             # Tester for data-henting
│   └── homepage.spec.ts              # Tester for UI og lenker
├── data/
│   ├── terminliste.csv               # Lagret terminliste-data
│   ├── terminliste-med-lenker.csv    # Data med lenker
│   └── kamplenker.json               # Scrapede lenker
├── plan.md                           # Implementeringsplan
└── README.md                         # Denne filen
```

## Datakilder

Terminlisten hentes fra:
- **API**: https://www.handball.no/AjaxData/TerminlisteLag?id=531500&seasonId=201060
- **Format**: Excel (.xlsx)
- **Lagring**: CSV

## Funksjoner

- Viser all terminlistedata i en oversiktlig tabell
- **Klikkbare lenker til kamper og lag** (når du bruker fetchDataWithLinks)
- Responsive design som fungerer på alle enheter
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
