# Terminliste - Fjellhammer Håndball

En nettside som viser terminliste, tabeller og spillerstatistikk for Fjellhammer-kullene G2010 og J2010. Data hentes automatisk fra handball.no og lagres per kull og sesong, slik at tidligere sesonger kan leses i arkivet.

## ✨ Hovedfunksjoner

- 👥 **Flere kull** - G2010 og J2010 med hver sine ruter og data
- 🗄️ **Sesongarkiv** - Tidligere sesonger er bevart og kan velges
- 📊 **Statistikk for alle lag** - Også motstandernes spillere
- 🔗 **Klikkbare lenker** - Til kamper, lag og turneringer
- ⏰ **Timestamp** - Se når data sist ble oppdatert
- 🔄 **Inkrementell oppdatering** - Kun nye kamper hentes
- 📱 **Responsivt design** - Tabell på desktop, kort-layout på mobil

## Teknologier

- **React + Vite** - Nettsiden
- **TypeScript** - Type-sikkerhet
- **Vitest** - Enhetstester
- **Playwright** - E2E-tester og cup-scraping
- **config.json** - Kull- og sesongkonfigurasjon

## Kom i gang

### Installasjon

```bash
npm install
```

### Konfigurasjon

`config.json` har gjeldende sesong på toppnivå og ett innslag per kull:

```json
{
  "currentSeason": {
    "id": "201068",
    "name": "Håndballsesongen 2026/2027",
    "slug": "2026-2027"
  },
  "squads": [
    {
      "id": "g2010",
      "name": "Fjellhammer G2010",
      "teams": [{ "name": "Fjellhammer G16 1", "lagid": "558767", "color": "#fbbf24" }],
      "cups": []
    },
    {
      "id": "j2010",
      "name": "Fjellhammer J2010",
      "teams": [{ "name": "Fjellhammer J16 1", "lagid": "443496", "color": "#e11d48" }],
      "cups": []
    }
  ]
}
```

Sesongen ligger på toppnivå fordi den gjelder alle lag. Nye lag legges til under
riktig kull uten kodeendring.

### Hent data

```bash
npm run update-all          # alle kull: terminliste, tabeller, spillerstatistikk
npm run update-squad j2010  # bare ett kull
npm run update-schedule     # hopp over spillerstatistikk, for en rask sjekk
```

Data lagres under `data/<kull>/<sesong>/`, og `data/index.json` lister hvilke
kull og sesonger nettsiden kan vise. Statistikk hentes inkrementelt: kamper som
allerede er hentet, hentes ikke på nytt.

### Kjør utviklingsserver

```bash
npm run dev
```

Nettsiden er nå tilgjengelig på `http://localhost:4321`

### Bygg for produksjon

**Standard bygg (bruker eksisterende data)**
```bash
npm run build
```

**Bygg med ferske data**
```bash
npm run build:fresh
```

**Når trenger du å hente ny data?**
- ✅ **Nye kamper** - Når det har kommet nye kamper i terminlisten
- ✅ **Oppdaterte resultater** - Når kamper er spilt og resultatene er klare
- ✅ **Endringer i kampdetaljer** - Tid, bane eller andre kampinfo endret

**Når trenger du IKKE å hente ny data?**
- ❌ **CSS/design-endringer** - Kun kosmetiske endringer
- ❌ **Fargeendringer** - Lagfarger leses dynamisk fra `config.json`
- ❌ **Kode-refaktorering** - Intern kodestruktur
- ❌ **Nye tester** - Testing påvirker ikke dataene

### Forhåndsvisning av produksjonsbygg

```bash
npm run preview
```

## Testing

Prosjektet bruker TDD (Test-Driven Development) med en todelt teststrategi: Vitest for rene hjelpefunksjoner og Playwright for ende-til-ende og scraping.

### Kjør alle tester

```bash
npm test
```

### Kjør kun enhetstester (Vitest)

```bash
npm run test:unit
```

### Kjør kun e2e-tester (Playwright)

```bash
npm run test:e2e
```

## Prosjektstruktur

```
terminliste/
├── config.json                  ⚙️  Gjeldende sesong og kull
├── src/
│   ├── pages/                   🏠 Terminliste, tabeller, spillere
│   ├── components/              🧩 Header, kampkort, kullbytter
│   ├── handball/                🏐 Henting og parsing fra handball.no
│   ├── squads/                  👥 Kull, sesong og datalasting
│   ├── profixio/                🏆 Cup-scraping
│   └── scripts/                 🤖 updateSeason, updatePWCup
├── tests/                       ✅ Playwright e2e
├── tests-unit/                  ✅ Vitest
└── data/
    ├── index.json               📇 Hvilke kull og sesonger finnes
    ├── g2010/2026-2027/         📄 Terminliste, tabeller, statistikk
    ├── g2010/2025-2026/         🗄️  Arkivert sesong
    └── j2010/2026-2027/
```

For bidragsrutiner og agentinstruksjoner, se `AGENTS.md`.

## Datakilder

Data hentes fra handball.no:
- **Terminliste og turneringer**: `/api/AjaxData/TerminListeForTeam` og
  `/api/AjaxData/TournamentsForTeam`, som krever headeren
  `x-requested-with: XMLHttpRequest`
- **Tabeller og spillerstatistikk**: JSON i Vue-komponentenes props i
  server-HTML-en (`<table-main>` og `<match-info>`)
- **Lagring**: JSON under `data/<kull>/<sesong>/`

Ingen nettleser er involvert i datahentingen. Playwright brukes bare til
e2e-tester og til cup-scraping fra Profixio.

## Ruter

```
/                       sist valgte kull
/g2010                  terminliste for guttelaget
/g2010/tabeller         tabeller
/g2010/spillere         spillerstatistikk
/j2010                  tilsvarende for jentelaget
?sesong=2025-2026        arkivvisning, virker på alle sider
```

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

- Kamper sortert etter dato og klokkeslett, med nedtelling til neste kamp
- Klikkbare lenker til kamper, lag og turneringer
- Responsivt design: tabell på desktop, kort på mobil
- Data lastes ved behov, så arkivsesonger ikke tynger førstegangslasting
- Type-sikkerhet med TypeScript, og datafiler valideres ved innlasting

## Utvikling

Prosjektet følger TDD-prinsipper. Alle endringer bør:
1. Starte med å skrive tester
2. Implementere funksjonalitet
3. Kjøre tester for å verifisere
4. Committe med beskrivende melding
