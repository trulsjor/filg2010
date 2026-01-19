import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { TerminlistePage } from './pages/TerminlistePage'
import { TabellPage } from './pages/TabellPage'
import { SpillerePage } from './pages/SpillerePage'
import { SpillerDetaljPage } from './pages/SpillerDetaljPage'
import { LagDetaljPage } from './pages/LagDetaljPage'
import { InstallPrompt } from './components/InstallPrompt'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<TerminlistePage />} />
        <Route path="/tabeller" element={<TabellPage />} />
        <Route path="/spillere" element={<SpillerePage />} />
        <Route path="/spillere/:id" element={<SpillerDetaljPage />} />
        <Route path="/lag/:lagId" element={<LagDetaljPage />} />
      </Routes>
      <InstallPrompt />
    </>
  )
}
