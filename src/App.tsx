import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate, Outlet, useParams } from 'react-router-dom'
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

function SquadRoutes() {
  const { squadId } = useParams<{ squadId: string }>()

  if (squadId === undefined || !isKnownSquad(squadId)) {
    return <Navigate to={`/${defaultSquadId}`} replace />
  }

  return (
    <SeasonProvider>
      <PullToRefresh>
        <Outlet />
      </PullToRefresh>
    </SeasonProvider>
  )
}

function StartPage() {
  const remembered = recallSquad()
  const squadId = remembered !== null && isKnownSquad(remembered) ? remembered : defaultSquadId
  return <Navigate to={`/${squadId}`} replace />
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<StartPage />} />

        <Route path="/:squadId" element={<SquadRoutes />}>
          <Route index element={<TerminlistePage />} />
          <Route path="tabeller" element={<TabellPage />} />
          <Route path="spillere" element={<SpillerePage />} />
          <Route path="spillere/:id" element={<SpillerDetaljPage />} />
          <Route path="lag/:lagId" element={<LagDetaljPage />} />
        </Route>

        <Route path="/tabeller" element={<Navigate to={`/${defaultSquadId}/tabeller`} replace />} />
        <Route path="/spillere" element={<Navigate to={`/${defaultSquadId}/spillere`} replace />} />
        <Route
          path="/spillere/:id"
          element={<Navigate to={`/${defaultSquadId}/spillere`} replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallPrompt />
    </>
  )
}
