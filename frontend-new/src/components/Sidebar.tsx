import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../lib/api'

const PROVIDERS: Record<string, { model: string; base: string }> = {
  deepseek: { model: 'deepseek-chat', base: 'https://api.deepseek.com/v1' },
  openai: { model: 'gpt-4o-mini', base: 'https://api.openai.com/v1' },
}

type ProviderKey = keyof typeof PROVIDERS | 'custom'

export function Sidebar() {
  const loc = useLocation()
  const isHome = loc.pathname === '/'
  const isStudio = loc.pathname.startsWith('/studio/')
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Config fields
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('deepseek-chat')
  const [provider, setProvider] = useState<ProviderKey>('deepseek')
  const [apiBase, setApiBase] = useState('https://api.deepseek.com/v1')

  // Track what's configured
  const [configuredKeys, setConfiguredKeys] = useState<string[]>([])

  useEffect(() => {
    api.getConfig().then(r => setConfiguredKeys(r.configured_keys)).catch(() => {})
  }, [])

  const hasKey = configuredKeys.includes('deepseek_api_key')
  const hasModel = configuredKeys.includes('deepseek_model')
  const hasBase = configuredKeys.includes('deepseek_api_base')

  const handleProviderChange = (val: string) => {
    const p = val as ProviderKey
    setProvider(p)
    if (p !== 'custom') {
      const preset = PROVIDERS[p]
      setModel(preset.model)
      setApiBase(preset.base)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const tasks: Promise<any>[] = [
        api.setConfig('deepseek_api_key', apiKey.trim()),
        api.setConfig('deepseek_model', model.trim()),
        api.setConfig('deepseek_api_base', apiBase.trim()),
      ]
      await Promise.all(tasks)
      const r = await api.getConfig()
      setConfiguredKeys(r.configured_keys)
      setMessage('✅ 已保存')
      setTimeout(() => setShowSettings(false), 1200)
    } catch (e: any) {
      setMessage('❌ ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
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

        <div className="px-3">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#a0a0b8] hover:text-white hover:bg-[#2a2a4a] transition-colors cursor-pointer"
          >
            <span>⚙️</span>
            <span className="flex-1 text-left">设置</span>
            {hasKey && <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />}
          </button>
        </div>

        <div className="px-5 pt-4 border-t border-[#2e2e50] text-xs text-[#6b6b85] flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full inline-block ${hasKey ? 'bg-[#34d399]' : 'bg-[#f87171]'}`} />
          {hasKey ? 'API 已配置' : '未配置 API'}
        </div>
      </aside>

      {/* Settings Dialog */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[460px] max-w-[90vw] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                ⚙️ 设置
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* API Key */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="输入 API Key 并点击保存"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] transition-colors"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">模型</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] transition-colors"
                />
              </div>

              {/* Provider */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">AI 提供商</label>
                <select
                  value={provider}
                  onChange={e => handleProviderChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#818cf8] bg-white text-sm text-gray-900 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="deepseek">Deepseek</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              {/* API Address */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">API 地址</label>
                <input
                  type="text"
                  value={apiBase}
                  onChange={e => setApiBase(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] transition-colors"
                />
              </div>

              {message && (
                <div className="text-sm text-gray-600">{message}</div>
              )}

              <p className="text-xs text-gray-400 leading-relaxed">
                AI 分析需要 API Key。密钥仅在本地使用。
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-[#007AFF] text-white text-sm font-medium hover:bg-[#0066CC] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
