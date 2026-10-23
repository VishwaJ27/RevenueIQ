import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './components/layout/AppLayout'
import OverviewPage from './pages/OverviewPage'
import InboxPage from './pages/InboxPage'
import IntelligencePage from './pages/IntelligencePage'
import ImportsPage from './pages/ImportsPage'
import ExportsPage from './pages/ExportsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="intelligence" element={<IntelligencePage />} />
        <Route path="imports" element={<ImportsPage />} />
        <Route path="exports" element={<ExportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
