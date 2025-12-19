import { Routes, Route } from 'react-router-dom'
import { TerminlistePage } from './pages/TerminlistePage'
import { StatistikkPage } from './pages/StatistikkPage'
import { TabellPage } from './pages/TabellPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<TerminlistePage />} />
      <Route path="/statistikk" element={<StatistikkPage />} />
      <Route path="/tabeller" element={<TabellPage />} />
    </Routes>
  )
}
