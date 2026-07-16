import { Link, useLocation } from 'react-router-dom'

export function Sidebar() {
  const loc = useLocation()
  const isHome = loc.pathname === '/'
  const isStudio = loc.pathname.startsWith('/studio/')

  return (
    <aside className="w-[200px] min-w-[200px] bg-[#1a1a2e] border-r border-[#2e2e50] flex flex-col py-5 flex-shrink-0">
      <div className="px-5 pb-5 border-b border-[#2e2e50]">
        <h1 className="text-lg font-bold bg-gradient-to-r from-[#818cf8] to-[#a78bfa] bg-clip-text text-transparent">
          🎙️ AI Panel Studio
        </h1>
        <p className="text-xs text-[#6b6b85] mt-1">AI 圆桌讨论</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <Link
          to="/"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isHome ? 'bg-[#818cf8] text-white' : 'text-[#a0a0b8] hover:text-white hover:bg-[#2a2a4a]'
          }`}
        >
          <span>🏠</span> 讨论列表
        </Link>
        {isStudio && (
          <Link
            to={loc.pathname}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm bg-[#818cf8] text-white"
          >
            <span>🎬</span> 演播厅
          </Link>
        )}
      </nav>

      <div className="px-5 pt-4 border-t border-[#2e2e50] text-xs text-[#6b6b85] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#34d399] inline-block" />
        已连接
      </div>
    </aside>
  )
}
