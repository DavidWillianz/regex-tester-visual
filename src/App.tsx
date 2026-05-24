import { useEffect, useMemo, useState } from 'react'
import './App.css'

type FlagKey = 'g' | 'i' | 'm' | 's' | 'u' | 'y'

const FLAGS: { key: FlagKey; label: string; help: string }[] = [
  { key: 'g', label: 'g', help: 'global - encontra todas as ocorrencias' },
  { key: 'i', label: 'i', help: 'case-insensitive - ignora maiusculas' },
  { key: 'm', label: 'm', help: 'multiline - ^ e $ casam por linha' },
  { key: 's', label: 's', help: 'dotAll - . casa quebra de linha' },
  { key: 'u', label: 'u', help: 'unicode - suporte completo unicode' },
  { key: 'y', label: 'y', help: 'sticky - casa a partir do lastIndex' },
]

type HistoryItem = {
  id: string
  pattern: string
  flags: string
  sample: string
  createdAt: number
}

const STORAGE_KEY = 'regex-tester-history-v1'
const MAX_HISTORY = 12

type MatchInfo = {
  start: number
  end: number
  text: string
  groups: string[]
  named: Record<string, string>
}

function safeBuildRegex(pattern: string, flags: string): { regex: RegExp | null; error: string | null } {
  if (!pattern) return { regex: null, error: null }
  try {
    return { regex: new RegExp(pattern, flags), error: null }
  } catch (e) {
    return { regex: null, error: e instanceof Error ? e.message : String(e) }
  }
}

function runMatches(regex: RegExp, sample: string): MatchInfo[] {
  const matches: MatchInfo[] = []
  if (!sample) return matches
  const isGlobal = regex.flags.includes('g') || regex.flags.includes('y')
  if (isGlobal) {
    let m: RegExpExecArray | null
    let guard = 0
    const re = new RegExp(regex.source, regex.flags)
    while ((m = re.exec(sample)) !== null) {
      if (m.index === re.lastIndex) re.lastIndex++ // zero-width safety
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        groups: m.slice(1).map((g) => g ?? ''),
        named: { ...(m.groups ?? {}) } as Record<string, string>,
      })
      if (++guard > 10000) break
    }
  } else {
    const m = regex.exec(sample)
    if (m) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        groups: m.slice(1).map((g) => g ?? ''),
        named: { ...(m.groups ?? {}) } as Record<string, string>,
      })
    }
  }
  return matches
}

function renderHighlighted(sample: string, matches: MatchInfo[]) {
  if (matches.length === 0) return <span className="plain">{sample || ' '}</span>
  const parts: React.ReactNode[] = []
  let cursor = 0
  matches.forEach((m, i) => {
    if (m.start > cursor) parts.push(<span key={`p-${i}`} className="plain">{sample.slice(cursor, m.start)}</span>)
    parts.push(
      <mark key={`m-${i}`} className="match" title={`match #${i + 1}: ${m.start}-${m.end}`}>
        {sample.slice(m.start, m.end) || '​'}
      </mark>,
    )
    cursor = m.end
  })
  if (cursor < sample.length) parts.push(<span key="tail" className="plain">{sample.slice(cursor)}</span>)
  return <>{parts}</>
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

const DEFAULT_PATTERN = '\\b(\\w+)@(\\w+\\.\\w+)\\b'
const DEFAULT_SAMPLE = `Contatos:
- david@winddigital.com.br
- suporte@univali.br
- invalido @ nao.casa
Telefone: (47) 99999-0000`

export default function App() {
  const [pattern, setPattern] = useState(DEFAULT_PATTERN)
  const [flagSet, setFlagSet] = useState<Set<FlagKey>>(new Set<FlagKey>(['g', 'i']))
  const [sample, setSample] = useState(DEFAULT_SAMPLE)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('regex-theme') as 'dark' | 'light') || 'dark')

  useEffect(() => setHistory(loadHistory()), [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('regex-theme', theme)
  }, [theme])

  const flags = useMemo(() => Array.from(flagSet).join(''), [flagSet])
  const { regex, error } = useMemo(() => safeBuildRegex(pattern, flags), [pattern, flags])
  const matches = useMemo(() => (regex ? runMatches(regex, sample) : []), [regex, sample])

  function toggleFlag(f: FlagKey) {
    setFlagSet((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  function snapshot() {
    if (!pattern.trim()) return
    const item: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pattern,
      flags,
      sample,
      createdAt: Date.now(),
    }
    const next = [item, ...history.filter((h) => !(h.pattern === pattern && h.flags === flags))].slice(0, MAX_HISTORY)
    setHistory(next)
    saveHistory(next)
  }

  function restore(item: HistoryItem) {
    setPattern(item.pattern)
    setFlagSet(new Set(item.flags.split('') as FlagKey[]))
    setSample(item.sample)
  }

  function removeFromHistory(id: string) {
    const next = history.filter((h) => h.id !== id)
    setHistory(next)
    saveHistory(next)
  }

  function clearHistory() {
    setHistory([])
    saveHistory([])
  }

  function copyPattern() {
    navigator.clipboard?.writeText(`/${pattern}/${flags}`).catch(() => {})
  }

  const namedGroupNames = useMemo(() => {
    const names = new Set<string>()
    matches.forEach((m) => Object.keys(m.named).forEach((n) => names.add(n)))
    return Array.from(names)
  }, [matches])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">/.*/</span>
          <div>
            <h1>Regex Tester Visual</h1>
            <p className="subtitle">Teste expressoes regulares com highlight em tempo real</p>
          </div>
        </div>
        <button className="theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Alternar tema">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Padrao</h2>
          <div className="pattern-row">
            <span className="slash">/</span>
            <input
              className={`pattern-input ${error ? 'has-error' : ''}`}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="ex.: \\b\\w+@\\w+\\b"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
            <span className="slash">/</span>
            <span className="flags-display">{flags || '—'}</span>
          </div>

          <div className="flags-row">
            {FLAGS.map((f) => (
              <button
                key={f.key}
                className={`flag ${flagSet.has(f.key) ? 'on' : ''}`}
                onClick={() => toggleFlag(f.key)}
                title={f.help}
                type="button"
              >
                {f.label}
              </button>
            ))}
            <button className="ghost" onClick={copyPattern} type="button" title="Copiar /padrao/flags">
              copiar
            </button>
            <button className="primary" onClick={snapshot} type="button" title="Salvar no historico">
              salvar
            </button>
          </div>

          {error && <p className="error">⚠ {error}</p>}
        </section>

        <section className="card">
          <h2>Texto de teste</h2>
          <textarea
            className="sample"
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            rows={9}
            spellCheck={false}
          />
        </section>

        <section className="card span-2">
          <h2>
            Resultado <span className="badge">{matches.length} match{matches.length === 1 ? '' : 'es'}</span>
          </h2>
          <pre className="highlight" aria-live="polite">
            {renderHighlighted(sample, matches)}
          </pre>
        </section>

        <section className="card span-2">
          <h2>Grupos capturados</h2>
          {matches.length === 0 ? (
            <p className="muted">Nenhum match para inspecionar.</p>
          ) : (
            <div className="groups-wrap">
              <table className="groups">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>match</th>
                    <th>range</th>
                    {matches[0].groups.map((_, i) => (
                      <th key={i}>g{i + 1}</th>
                    ))}
                    {namedGroupNames.map((n) => (
                      <th key={n}>?&lt;{n}&gt;</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><code>{m.text}</code></td>
                      <td className="muted">{m.start}-{m.end}</td>
                      {m.groups.map((g, j) => (
                        <td key={j}><code>{g || '∅'}</code></td>
                      ))}
                      {namedGroupNames.map((n) => (
                        <td key={n}><code>{m.named[n] ?? '∅'}</code></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card span-2">
          <div className="history-head">
            <h2>Historico <span className="badge">{history.length}</span></h2>
            {history.length > 0 && (
              <button className="ghost danger" onClick={clearHistory} type="button">
                limpar tudo
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="muted">Clique em <b>salvar</b> para guardar o padrao atual. Persiste no localStorage.</p>
          ) : (
            <ul className="history">
              {history.map((h) => (
                <li key={h.id}>
                  <button className="restore" onClick={() => restore(h)} title="Restaurar este padrao">
                    <code>/{h.pattern}/{h.flags}</code>
                    <span className="muted">{new Date(h.createdAt).toLocaleString('pt-BR')}</span>
                  </button>
                  <button className="ghost danger small" onClick={() => removeFromHistory(h.id)} aria-label="Remover">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>
          Construido com AIOX workflow · sem backend · dados em <code>localStorage</code> ·
          <a href="https://github.com" target="_blank" rel="noreferrer"> ver repo</a>
        </p>
      </footer>
    </div>
  )
}
