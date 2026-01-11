import { Routes, Route } from 'react-router-dom'
import { TerminlistePage } from './pages/TerminlistePage'
import { TabellPage } from './pages/TabellPage'
import { InstallPrompt } from './components/InstallPrompt'

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<TerminlistePage />} />
        <Route path="/tabeller" element={<TabellPage />} />
      </Routes>
      <InstallPrompt />
    </>
  )
}
