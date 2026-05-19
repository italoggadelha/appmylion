import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import { DataProvider } from './lib/data'
import Layout from './components/Layout'
import Login from './pages/Login'

// Páginas carregadas sob demanda (code-splitting → app mais rápido)
const Aprovar = lazy(() => import('./pages/Aprovar'))
const RelatorioPublico = lazy(() => import('./pages/RelatorioPublico'))
const FormularioPublico = lazy(() => import('./pages/FormularioPublico'))
const Formularios = lazy(() => import('./pages/Formularios'))
const PreviewAnexo = lazy(() => import('./pages/PreviewAnexo'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clientes = lazy(() => import('./pages/Clientes'))
const ClienteDetalhe = lazy(() => import('./pages/ClienteDetalhe'))
const Kanban = lazy(() => import('./pages/Kanban'))
const Aprovacoes = lazy(() => import('./pages/Aprovacoes'))
const AgentesIA = lazy(() => import('./pages/AgentesIA'))
const Equipe = lazy(() => import('./pages/Equipe'))
const Automacoes = lazy(() => import('./pages/Automacoes'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))
const Portal = lazy(() => import('./pages/Portal'))

function Carregando() {
  return (
    <div className="grid h-[60vh] place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Carregando />}>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/aprovar/:token" element={<Aprovar />} />
        <Route path="/relatorio/:token" element={<RelatorioPublico />} />
        <Route path="/formulario/:token" element={<FormularioPublico />} />

        {/* Protegida, tela cheia (visualizador de entrega) */}
        <Route
          path="/preview/:id"
          element={
            <RequireAuth>
              <PreviewAnexo />
            </RequireAuth>
          }
        />

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
          <Route path="formularios" element={<Formularios />} />
          <Route path="equipe" element={<Equipe />} />
          <Route path="automacoes" element={<Automacoes />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="portal" element={<Portal />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
