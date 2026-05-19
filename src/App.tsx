import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import { DataProvider } from './lib/data'
import Layout from './components/Layout'
import Login from './pages/Login'
import Aprovar from './pages/Aprovar'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import ClienteDetalhe from './pages/ClienteDetalhe'
import Kanban from './pages/Kanban'
import Aprovacoes from './pages/Aprovacoes'
import AgentesIA from './pages/AgentesIA'
import Equipe from './pages/Equipe'
import EmBreve from './pages/EmBreve'

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/aprovar/:token" element={<Aprovar />} />

      {/* Protegidas */}
      <Route
        element={
          <RequireAuth>
            <DataProvider>
              <Layout />
            </DataProvider>
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<ClienteDetalhe />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="aprovacoes" element={<Aprovacoes />} />
        <Route path="agentes" element={<AgentesIA />} />
        <Route path="equipe" element={<Equipe />} />
        <Route
          path="automacoes"
          element={<EmBreve titulo="Automações" fase="Fase 3" />}
        />
        <Route
          path="relatorios"
          element={<EmBreve titulo="Relatórios & Inteligência" fase="Fase 3" />}
        />
        <Route
          path="portal"
          element={<EmBreve titulo="Portal do Cliente" fase="Fase 3" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
