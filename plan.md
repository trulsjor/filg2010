# Implementeringsplan - Terminliste-nettside

## Mål
Lage en Astro-nettside som viser terminlisten for et håndballag ved å hente data fra handball.no API.

## Steg-for-steg implementering med TDD

### Steg 1: Oppsett ✓
- [x] Sett opp Astro-prosjekt med TypeScript
- [x] Installer `xlsx` for Excel-parsing
- [x] Installer Playwright for E2E testing
- [x] Sett opp Playwright-konfigurasjon

### Steg 2: Data-henting og konvertering ✓
- [x] Lag script som henter Excel-fil fra handball.no API
- [x] Skriv test for at Excel-fil kan lastes ned
- [x] Implementer konvertering fra Excel til CSV
- [x] Skriv test for at CSV-fil inneholder forventet data
- [x] Lagre CSV-fil lokalt i `data/` mappe

### Steg 3: Data-visning ✓
- [x] Les CSV-data i Astro-komponenten
- [x] Skriv Playwright-test for at siden viser terminliste
- [x] Implementer visning av terminliste i tabell
- [x] Test at alle kamper vises på siden

### Steg 4: Styling ✓
- [x] Style tabellen med CSS
- [x] Gjør design responsivt
- [x] Test at siden ser bra ut i forskjellige størrelser

### Steg 5: Verifisering ✓
- [x] Kjør alle Playwright-tester
- [x] Verifiser at data oppdateres korrekt
- [x] Sjekk at alt fungerer end-to-end

### Steg 6: Lenker til kamper og lag ✓
- [x] Lag Playwright-script for å scrape lenker fra handball.no
- [x] Håndter cookie-banner og navigasjon
- [x] Kombiner Excel-data med scrapede lenker
- [x] Oppdater Astro-side for å vise klikkbare lenker
- [x] Skriv tester for lenke-funksjonalitet
- [x] Verifiser at alle lenker fungerer

### Steg 7: Dynamisk konfigurasjon og multi-lag støtte ✓
- [x] Lag config.json for lag-konfigurasjon
  - Lag 1: Fjellhammer (lagid=531500, seasonId=201060)
  - Lag 2: Fjellhammer 2 (lagid=812498)
- [x] Refaktorer scripts til å bruke config i stedet for hardkodede verdier
- [x] Oppdater fetchDataWithLinks til å håndtere flere lag
- [x] Kombiner data fra begge lag i én CSV/visning
- [x] Legg til visuell indikator for hvilket lag hver kamp tilhører

### Steg 8: Automatisk data-oppdatering ✓
- [x] Implementer build-time fetching (kjør fetchDataWithLinks ved build)
- [x] Legg til timestamp for når data sist ble hentet
- [x] Vis "Sist oppdatert" på nettsiden
- [x] Oppdater package.json scripts for automatisk refresh

### Steg 9: Testing og verifisering av ny funksjonalitet ✓
- [x] Skriv tester for multi-lag støtte
- [x] Test at begge lag vises korrekt
- [x] Verifiser at timestamps vises
- [x] Test build-time fetching
- [x] Oppdater dokumentasjon (README)

### Steg 10: Sortering og responsivt design ✓
- [x] Sorter kamper etter dato og klokkeslett
- [x] Design kort-layout for mobile enheter
- [x] Implementer responsivt design som bytter mellom tabell og kort
- [x] Test på ulike skjermstørrelser med Playwright
- [x] Oppdater dokumentasjon

### Steg 11: Robust data-pipeline (TDD)
- [x] Refaktorer `fetchAllTeamsData` til modulære funksjoner med enhetstester som dekker kontrollflyten før implementasjon.
- [x] Innfør parallellisering med begrenset concurrency og delvis feilhandtering for scraping/API-kall, verifisert gjennom nye tester.
- [x] Legg til tidsavbrudd og retry/backoff-logikk i `HandballApiService` og dekk det med tester som simulerer mislykkede kall.

### Steg 12: Typing og validering (TDD)
- [ ] Definer `RawMatchRow`-type og normaliseringsfunksjoner testet med fixtures før bruk i pipeline.
- [ ] Valider `config.json` og `metadata.json` via skjema (f.eks. Zod) med tester som viser at ugyldige filer avvises.
- [ ] Implementer atomiske skrivinger i `FileService` (midlertidig fil + rename) og skriv tester som bekrefter at delvise writes ikke korrupt data.

### Steg 13: Scraper-optimalisering (TDD)
- [ ] Gjenbruk Playwright-browser og -context på tvers av scraping-funksjoner; skriv tester/mocks som verifiserer at ressursene lukkes trygt selv ved feil.
- [ ] Legg inn throttling/backoff når `page.goto` feiler og bekreft med tester som simulerer nettfeil.

### Steg 14: Teststrategi
- [ ] Flytt rene hjelpefunksjonstester (dato/sortering m.m.) fra Playwright til en lettvekts testrunner (Vitest/Jest) og oppdater scripts.
- [ ] Behold Playwright kun for ende-til-ende og scraping, oppdater dokumentasjon og sørg for at begge testløpene kjøres i CI.

## Teknologier
- **Frontend**: Astro + TypeScript
- **Data**: handball.no API (Excel-format)
- **Parsing**: xlsx npm-pakke
- **Testing**: Playwright
- **Lagring**: CSV-fil
- **Web scraping**: Playwright (for lenker)
