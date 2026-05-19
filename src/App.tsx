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
import Automacoes from './pages/Automacoes'
import Configuracoes from './pages/Configuracoes'
import Relatorios from './pages/Relatorios'
import Portal from './pages/Portal'
import RelatorioPublico from './pages/RelatorioPublico'

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/aprovar/:token" element={<Aprovar />} />
      <Route path="/relatorio/:token" element={<RelatorioPublico />} />

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
        <Route path="automacoes" element={<Automacoes />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="portal" element={<Portal />} />
        <Route path="relatorios" element={<Relatorios />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
