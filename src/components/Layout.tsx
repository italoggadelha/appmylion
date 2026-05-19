import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import TarefaDetalhe from './TarefaDetalhe'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-[1320px] animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Detalhe de tarefa — global, abre de qualquer tela */}
      <TarefaDetalhe />
    </div>
  )
}
