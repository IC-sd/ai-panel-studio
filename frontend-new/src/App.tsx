import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { HomePage } from './components/HomePage'
import { StudioPage } from './components/StudioPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#0f0f1a] text-[#e8e8f0] overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/studio/:id" element={<StudioPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
