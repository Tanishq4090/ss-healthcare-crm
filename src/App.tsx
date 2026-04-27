import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AICRM from './pages/AICRM'
import Clients from './pages/Clients'
import AIHR from './pages/AIHR'
import Finance from './pages/Finance'
import AccessControl from './pages/AccessControl'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai-crm" element={<AICRM />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/ai-hr" element={<AIHR />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/access-control" element={<AccessControl />} />
      </Route>
    </Routes>
  )
}
