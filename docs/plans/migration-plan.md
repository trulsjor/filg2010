# Migrasjonsplan: Terminliste Astro → React + Vite + fsotech Design System

## Oversikt

Migrere terminliste fra Astro til React + Vite med fullt fsotech design system og Fjellhammer-temaer.

**Mål:**
- React 19 + Vite 7 + TypeScript
- Tailwind CSS v4 med fsotech tokens
- Fjellhammer dark/light temaer
- API for dynamisk oppdatering fra UI
- Behold eksisterende datalogikk

---

## Fase 1: Prosjektoppsett

### 1.1 Opprett React + Vite prosjekt
- Opprett `terminliste-react/` mappe (ny mappe, gradvis migrering)
- `package.json` med React 19, Vite 7, Tailwind v4, react-router-dom
- `vite.config.ts` med React og Tailwind plugins
- `tsconfig.json` med streng TypeScript

### 1.2 Kopier gjenbrukbar kode
- `src/types/index.ts` → direkte kopi
- `src/services/` → alle service-filer
- `src/utils/date.utils.ts`
- `src/scripts/` → alle data-scripts
- `config.json`
- `public/fjellhammer-logo.svg`

---

## Fase 2: Design System

### 2.1 Port token-system fra fsotech
**Kopier:**
- `src/styles/tokens/primitives.css`
- `src/styles/tokens/semantic.css`

**Legg til Fjellhammer-farger i primitives.css:**
```css
--ds-color-fjellhammer-500: #009B3E;  /* hovedfarge */
--ds-color-fjellhammer-600: #00C46A;  /* lys */
--ds-color-fjellhammer-700: #00652B;  /* mørk */
--ds-color-fjellhammer-900: #031a10;  /* bakgrunn */
```

### 2.2 Port tema-infrastruktur
**Kopier fra fsotech:**
- `src/themes/ThemeDefinitions.ts`
- `src/themes/ThemeRegistry.ts`
- `src/themes/presets/` (typography, borders, shadows, spacing)
- `src/context/ThemeContext.tsx`

### 2.3 Opprett Fjellhammer-temaer
**Opprett `src/themes/themes/fjellhammer/fjellhammer.ts`:**
- `fjellhammerDarkTheme` - dagens mørke utseende
- `fjellhammerLightTheme` - lys variant

**Fargeskjema (dark):**
- Background: #020b05 → #031a10
- Text: #f6fff8 (lys), #a7c0b3 (dempet)
- Accent: #009B3E (basis), #00C46A (lys), #00652B (mørk)
- Status: grønn seier, gul uavgjort, rød tap

### 2.4 Port komponent-CSS
**Kopier fra fsotech `src/index.css`:**
- `.ds-button` klasser
- `.ds-card` klasser
- `.ds-input` klasser
- Animasjoner

**Legg til terminliste-spesifikke:**
- `.match-card`
- `.match-table`
- `.filter-bar`
- `.page-header`

---

## Fase 3: React-komponenter

### 3.1 Layout og navigasjon
- `src/components/layout/AppLayout.tsx` - root layout med ThemeProvider
- `src/components/Header.tsx` - logo, tittel, handlingsknapper
- `src/components/FilterBar.tsx` - filtere med localStorage

### 3.2 Kampvisning
- `src/components/MatchTable.tsx` - desktop tabell
- `src/components/MatchCard.tsx` - mobil kort med seier-indikator
- `src/components/MatchRow.tsx` - tabell-rad (gjenbrukbar)

### 3.3 Statistikk
- `src/components/stats/StatsGrid.tsx` - overordnet statistikk
- `src/components/stats/TeamStats.tsx` - per-lag statistikk
- `src/components/stats/LeagueTable.tsx` - tabellvisning

### 3.4 UI-komponenter
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`

---

## Fase 4: Hooks og state

### 4.1 Data hooks
```typescript
// src/hooks/useMatches.ts
interface UseMatchesReturn {
  matches: Match[];
  filteredMatches: Match[];
  nextMatch: Match | null;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

// src/hooks/useTeams.ts - team config og farger
// src/hooks/useMetadata.ts - sist oppdatert
// src/hooks/useLeagueTables.ts - seriestilling
// src/hooks/usePersistedFilters.ts - localStorage filter-state
```

---

## Fase 5: Routing

### 5.1 Router oppsett
**`src/main.tsx`:**
```typescript
<ThemeProvider>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</ThemeProvider>
```

**`src/App.tsx`:**
```typescript
<Routes>
  <Route path="/" element={<TerminlistePage />} />
  <Route path="/statistikk" element={<StatistikkPage />} />
</Routes>
```

### 5.2 Sider
- `src/pages/TerminlistePage.tsx` - hovedside
- `src/pages/StatistikkPage.tsx` - statistikk

---

## Fase 6: API for dynamisk oppdatering

### 6.1 Express API server
**`api/server.ts`:**
```typescript
app.post('/api/refresh', async () => {
  // Kjør fetchAllTeamsData + updateResults
});

app.post('/api/update-results', async () => {
  // Bare oppdater resultater
});

app.get('/api/matches', () => {
  // Return terminliste.json
});
```

### 6.2 Vite proxy (dev)
```typescript
server: {
  proxy: { '/api': 'http://localhost:3001' }
}
```

### 6.3 RefreshButton komponent
- Trigger `/api/refresh`
- Vis loading-state
- Oppdater data etter fullføring

---

## Fase 7: PWA og kalender

### 7.1 Service Worker
- Behold `public/sw.js` med network-first
- Oppdater cache-navn

### 7.2 Kalender
- `api/calendar.ts` - generer ICS runtime
- Eller bygg statisk ved `npm run build`

---

## Fase 8: Testing og build

### 8.1 Test-oppsett
- Vitest for unit tests
- Playwright for E2E
- Port eksisterende Playwright-tester

### 8.2 Scripts
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "api:dev": "tsx watch api/server.ts",
  "refresh": "npx tsx src/scripts/fetchAllTeamsData.ts",
  "test": "vitest run",
  "test:e2e": "playwright test"
}
```

---

## Fase 9: Cutover

### 9.1 Parallell kjøring
- Kjør begge versjonene under overgang
- `/data` deles mellom begge

### 9.2 Endelig bytte
- Fjern Astro-avhengigheter
- Oppdater deployment
- Arkiver Astro-kode

---

## Filstruktur (endelig)

```
terminliste-react/
  api/
    server.ts
    calendar.ts
  public/
    fjellhammer-logo.svg
    manifest.json
    sw.js
  src/
    components/
      layout/AppLayout.tsx
      ui/Button.tsx, Card.tsx
      Header.tsx
      FilterBar.tsx
      MatchTable.tsx
      MatchCard.tsx
      RefreshButton.tsx
      stats/StatsGrid.tsx, TeamStats.tsx, LeagueTable.tsx
    context/ThemeContext.tsx
    hooks/useMatches.ts, useTeams.ts, ...
    pages/TerminlistePage.tsx, StatistikkPage.tsx
    services/(kopiert fra Astro)
    scripts/(kopiert fra Astro)
    styles/tokens/primitives.css, semantic.css
    themes/ThemeDefinitions.ts, ThemeRegistry.ts, presets/, themes/fjellhammer/
    types/index.ts
    utils/date.utils.ts
    App.tsx, main.tsx, index.css
  config.json
  package.json
  vite.config.ts
```

---

## Kritiske filer

| Fil | Formål |
|-----|--------|
| `/terminliste/src/pages/index.astro` | Hovedlogikk å konvertere |
| `/fsotech/frontend/src/themes/ThemeDefinitions.ts` | Tema-interface å porte |
| `/fsotech/frontend/src/index.css` | Design system klasser |
| `/terminliste/src/components/MatchCard.astro` | Kompleks komponent å migrere |
| `/terminliste/src/scripts/fetchAllTeamsData.ts` | API endpoint å eksponere |

---

## Avhengigheter

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.6",
    "xlsx": "^0.18.5",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.17",
    "@vitejs/plugin-react": "^5.1.0",
    "tailwindcss": "^4.1.17",
    "typescript": "^5.7.2",
    "vite": "^7.2.2",
    "vitest": "^3.2.4",
    "@playwright/test": "^1.48.2"
  }
}
```
