import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { TerminlistePage } from './pages/TerminlistePage'
import { TabellPage } from './pages/TabellPage'
import { SpillerePage } from './pages/SpillerePage'
import { SpillerDetaljPage } from './pages/SpillerDetaljPage'
import { LagDetaljPage } from './pages/LagDetaljPage'
import { InstallPrompt } from './components/InstallPrompt'
import { PullToRefresh } from './components/PullToRefresh'
import { SeasonProvider } from './squads/SeasonProvider'
import { recallSquad } from './squads/SeasonAccess'
import { defaultSquadId, isKnownSquad } from './squads/SeasonDataLoader'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function rememberedSquadId(): string {
  const remembered = recallSquad()
  return remembered !== null && isKnownSquad(remembered) ? remembered : defaultSquadId
}

function StartPage() {
  return <Navigate to={`/${rememberedSquadId()}`} replace />
}

function LegacyRoute() {
  const location = useLocation()
  return <Navigate to={`/${rememberedSquadId()}${location.pathname}${location.search}`} replace />
}

function SeasonChrome() {
  return (
    <PullToRefresh>
      <Outlet />
    </PullToRefresh>
  )
}

function seasonPages() {
  return (
    <Route element={<SeasonChrome />}>
      <Route index element={<TerminlistePage />} />
      <Route path="tabeller" element={<TabellPage />} />
      <Route path="spillere" element={<SpillerePage />} />
      <Route path="spillere/:id" element={<SpillerDetaljPage />} />
      <Route path="lag/:lagId" element={<LagDetaljPage />} />
    </Route>
  )
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<StartPage />} />

        <Route path="/:squadId">
          <Route element={<SeasonProvider />}>{seasonPages()}</Route>
          <Route path=":season" element={<SeasonProvider />}>
            {seasonPages()}
          </Route>
        </Route>

        <Route path="/tabeller" element={<LegacyRoute />} />
        <Route path="/spillere" element={<LegacyRoute />} />
        <Route path="/spillere/:id" element={<LegacyRoute />} />
        <Route path="/lag/:lagId" element={<LegacyRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallPrompt />
    </>
  )
}
