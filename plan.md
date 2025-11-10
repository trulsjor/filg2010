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

### Steg 7: Dynamisk konfigurasjon og multi-lag støtte
- [ ] Lag config.json for lag-konfigurasjon
  - Lag 1: Fjellhammer (lagid=531500, seasonId=201060)
  - Lag 2: Nytt lag (lagid=812498)
- [ ] Refaktorer scripts til å bruke config i stedet for hardkodede verdier
- [ ] Oppdater fetchDataWithLinks til å håndtere flere lag
- [ ] Kombiner data fra begge lag i én CSV/visning
- [ ] Legg til visuell indikator for hvilket lag hver kamp tilhører

### Steg 8: Automatisk data-oppdatering
- [ ] Implementer build-time fetching (kjør fetchDataWithLinks ved build)
- [ ] Legg til timestamp for når data sist ble hentet
- [ ] Vis "Sist oppdatert" på nettsiden
- [ ] Oppdater package.json scripts for automatisk refresh

### Steg 9: Testing og verifisering av ny funksjonalitet
- [ ] Skriv tester for multi-lag støtte
- [ ] Test at begge lag vises korrekt
- [ ] Verifiser at timestamps vises
- [ ] Test build-time fetching
- [ ] Oppdater dokumentasjon (README)

## Teknologier
- **Frontend**: Astro + TypeScript
- **Data**: handball.no API (Excel-format)
- **Parsing**: xlsx npm-pakke
- **Testing**: Playwright
- **Lagring**: CSV-fil
- **Web scraping**: Playwright (for lenker)
