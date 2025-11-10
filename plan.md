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

## Teknologier
- **Frontend**: Astro + TypeScript
- **Data**: handball.no API (Excel-format)
- **Parsing**: xlsx npm-pakke
- **Testing**: Playwright
- **Lagring**: CSV-fil
