import { Routes, Route } from 'react-router-dom'
import { TerminlistePage } from './pages/TerminlistePage'
import { TabellPage } from './pages/TabellPage'
import { SpillerePage } from './pages/SpillerePage'
import { SpillerDetaljPage } from './pages/SpillerDetaljPage'
import { LagPage } from './pages/LagPage'
import { LagDetaljPage } from './pages/LagDetaljPage'
import { InstallPrompt } from './components/InstallPrompt'

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<TerminlistePage />} />
        <Route path="/tabeller" element={<TabellPage />} />
        <Route path="/spillere" element={<SpillerePage />} />
        <Route path="/spillere/:id" element={<SpillerDetaljPage />} />
        <Route path="/lag" element={<LagPage />} />
        <Route path="/lag/:lagId" element={<LagDetaljPage />} />
      </Routes>
      <InstallPrompt />
    </>
  )
}
