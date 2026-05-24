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

type Preset = { label: string; pattern: string; flags: string; sample: string; tag: 'BR' | 'COMUM' }

const PRESETS: Preset[] = [
  {
    label: 'Email',
    pattern: '\\b[\\w.+-]+@[\\w-]+\\.[\\w.-]+\\b',
    flags: 'gi',
    sample: 'Contato: david@winddigital.com.br ou suporte@univali.br - invalido @ nao.casa',
    tag: 'COMUM',
  },
  {
    label: 'CPF',
    pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}',
    flags: 'g',
    sample: 'CPF do cliente: 123.456.789-00\nOutro: 987.654.321-11\nInvalido: 12345678900',
    tag: 'BR',
  },
  {
    label: 'CNPJ',
    pattern: '\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}',
    flags: 'g',
    sample: 'CNPJ da empresa: 12.345.678/0001-90\nFilial: 98.765.432/0001-55',
    tag: 'BR',
  },
  {
    label: 'CEP',
    pattern: '\\d{5}-?\\d{3}',
    flags: 'g',
    sample: 'Endereco: Rua X, CEP 88010-000\nOutro CEP sem traco: 01310100',
    tag: 'BR',
  },
  {
    label: 'Telefone BR',
    pattern: '\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4}',
    flags: 'g',
    sample: 'Celular (47) 99999-0000\nFixo: 47 3333-4444\nOutro: (11)912345678',
    tag: 'BR',
  },
  {
    label: 'Data BR',
    pattern: '\\d{2}/\\d{2}/\\d{4}',
    flags: 'g',
    sample: 'Hoje eh 24/05/2026, ontem foi 23/05/2026 e amanha 25/05/2026.',
    tag: 'BR',
  },
  {
    label: 'Placa Mercosul',
    pattern: '\\b[A-Z]{3}\\d[A-Z]\\d{2}\\b',
    flags: 'g',
    sample: 'Placas Mercosul vistas: ABC1D23 e XYZ9P88\nAntiga (nao casa): ABC-1234',
    tag: 'BR',
  },
  {
    label: 'URL',
    pattern: 'https?://[\\w.-]+(?:/[\\w./?=&%-]*)?',
    flags: 'gi',
    sample: 'Veja https://github.com/DavidWillianz/regex-tester-visual e http://exemplo.com.br/path?id=42',
    tag: 'COMUM',
  },
  {
    label: 'IPv4',
    pattern: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b',
    flags: 'g',
    sample: 'Server: 192.168.0.1, gateway 10.0.0.1, dns 8.8.8.8',
    tag: 'COMUM',
  },
  {
    label: 'Cor Hex',
    pattern: '#[0-9a-f]{3,8}\\b',
    flags: 'gi',
    sample: 'Paleta dark: #0b1020, #7c9cff, #f6c177 e #fff',
    tag: 'COMUM',
  },
]

type LangGen = (pattern: string, flags: string) => string

const LANGUAGES: { id: string; label: string; gen: LangGen }[] = [
  {
    id: 'js',
    label: 'JavaScript',
    gen: (p, f) => `const text = "...";
const regex = /${p}/${f};
const matches = [...text.matchAll(regex)];
for (const m of matches) {
  console.log(m.index, m[0], m.groups);
}`,
  },
  {
    id: 'ts',
    label: 'TypeScript',
    gen: (p, f) => `const text = "...";
const regex = /${p}/${f};
const matches: RegExpMatchArray[] = [...text.matchAll(regex)];
matches.forEach((m) => console.log(m.index, m[0]));`,
  },
  {
    id: 'py',
    label: 'Python',
    gen: (p, f) => {
      const map: Record<string, string> = {
        i: 're.IGNORECASE',
        m: 're.MULTILINE',
        s: 're.DOTALL',
        u: 're.UNICODE',
      }
      const opts = [...f].map((c) => map[c]).filter(Boolean).join(' | ') || '0'
      const isGlobal = f.includes('g')
      const call = isGlobal ? 're.findall(pattern, text, flags)' : 're.search(pattern, text, flags)'
      return `import re

text = "..."
pattern = r"${p.replace(/"/g, '\\"')}"
flags = ${opts}
matches = ${call}
print(matches)`
    },
  },
  {
    id: 'cs',
    label: 'C# / .NET',
    gen: (p, f) => {
      const map: Record<string, string> = {
        i: 'RegexOptions.IgnoreCase',
        m: 'RegexOptions.Multiline',
        s: 'RegexOptions.Singleline',
      }
      const opts = [...f].map((c) => map[c]).filter(Boolean).join(' | ') || 'RegexOptions.None'
      return `using System.Text.RegularExpressions;

string text = "...";
var regex = new Regex(@"${p.replace(/"/g, '""')}", ${opts});
foreach (Match m in regex.Matches(text))
{
    Console.WriteLine($"{m.Index}: {m.Value}");
}`
    },
  },
  {
    id: 'php',
    label: 'PHP',
    gen: (p, f) => `$text = "...";
preg_match_all('/${p.replace(/'/g, "\\'")}/${f}', $text, $matches, PREG_OFFSET_CAPTURE);
print_r($matches);`,
  },
  {
    id: 'java',
    label: 'Java',
    gen: (p, f) => {
      const map: Record<string, string> = {
        i: 'Pattern.CASE_INSENSITIVE',
        m: 'Pattern.MULTILINE',
        s: 'Pattern.DOTALL',
        u: 'Pattern.UNICODE_CASE',
      }
      const opts = [...f].map((c) => map[c]).filter(Boolean).join(' | ') || '0'
      const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      return `import java.util.regex.*;

String text = "...";
Pattern p = Pattern.compile("${escaped}", ${opts});
Matcher m = p.matcher(text);
while (m.find()) {
    System.out.println(m.start() + ": " + m.group());
}`
    },
  },
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
      if (m.index === re.lastIndex) re.lastIndex++
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
  const [showHelp, setShowHelp] = useState(false)
  const [selectedLang, setSelectedLang] = useState<string>('js')
  const [copiedLang, setCopiedLang] = useState(false)

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

  function loadPreset(p: Preset) {
    setPattern(p.pattern)
    setFlagSet(new Set(p.flags.split('') as FlagKey[]))
    setSample(p.sample)
  }

  const currentSnippet = useMemo(() => {
    const lang = LANGUAGES.find((l) => l.id === selectedLang) ?? LANGUAGES[0]
    return lang.gen(pattern, flags)
  }, [selectedLang, pattern, flags])

  function copySnippet() {
    navigator.clipboard?.writeText(currentSnippet).then(() => {
      setCopiedLang(true)
      setTimeout(() => setCopiedLang(false), 1500)
    }).catch(() => {})
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
            <p className="subtitle">Teste · Visualize · Copie o codigo na sua linguagem</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="help-btn" onClick={() => setShowHelp((s) => !s)} type="button">
            {showHelp ? '✕ fechar' : '? como usar'}
          </button>
          <button className="theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Alternar tema">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {showHelp && (
        <section className="help-card">
          <h2>Como usar esta pagina</h2>
          <div className="help-grid">
            <div>
              <strong>1. Padrao</strong>
              <p>Digite sua regex no campo entre as <code>/ /</code>. As flags ativas aparecem no canto direito. Clique nos botoes <code>g i m s u y</code> para ligar/desligar. Erro de sintaxe deixa a borda vermelha.</p>
            </div>
            <div>
              <strong>2. Texto de teste</strong>
              <p>Cole aqui o texto onde quer aplicar a regex (log, JSON, lista). Atualiza em tempo real — sem botao.</p>
            </div>
            <div>
              <strong>3. Resultado</strong>
              <p>Mostra o texto com os matches destacados em amarelo. Passe o mouse no destaque para ver o intervalo de caracteres.</p>
            </div>
            <div>
              <strong>4. Grupos capturados</strong>
              <p>Cada parenteses <code>(...)</code> na sua regex vira uma coluna <code>g1</code>, <code>g2</code>. Grupos nomeados <code>(?&lt;nome&gt;...)</code> aparecem como <code>?&lt;nome&gt;</code>.</p>
            </div>
            <div>
              <strong>5. Padroes prontos</strong>
              <p>Clique em um chip (CPF, CNPJ, CEP, Email...) para carregar regex e amostra com 1 clique. Diferencial BR ao lado.</p>
            </div>
            <div>
              <strong>6. Snippet de codigo</strong>
              <p>Diferencial: troca a aba de linguagem e gera o codigo pronto pra colar (JS, TS, Python, C#, PHP, Java) com as flags ja mapeadas corretamente.</p>
            </div>
            <div>
              <strong>7. Historico</strong>
              <p>Clique em <b>salvar</b> para guardar o padrao. Lista persiste no <code>localStorage</code> do navegador, ate 12 itens. Clique para restaurar.</p>
            </div>
            <div>
              <strong>Dica</strong>
              <p>Use a flag <code>g</code> pra ver <em>todas</em> as ocorrencias. Sem ela, so a primeira aparece. Tema dark/light no canto superior direito.</p>
            </div>
          </div>
        </section>
      )}

      <section className="presets-bar">
        <span className="presets-label">Padroes prontos:</span>
        <div className="presets-list">
          {PRESETS.map((p) => (
            <button key={p.label} className={`preset ${p.tag === 'BR' ? 'br' : ''}`} onClick={() => loadPreset(p)} type="button" title={`/${p.pattern}/${p.flags}`}>
              {p.tag === 'BR' && <span className="flag-br">🇧🇷</span>}
              {p.label}
            </button>
          ))}
        </div>
      </section>

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
          <h2>
            Snippet de codigo
            <span className="badge gold">★ diferencial</span>
          </h2>
          <p className="muted snippet-help">Copie o codigo pronto na sua linguagem. Flags ja mapeadas (ex: <code>i</code> vira <code>re.IGNORECASE</code> em Python).</p>
          <div className="lang-tabs">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                className={`lang-tab ${selectedLang === l.id ? 'active' : ''}`}
                onClick={() => setSelectedLang(l.id)}
                type="button"
              >
                {l.label}
              </button>
            ))}
            <button className="ghost copy-code" onClick={copySnippet} type="button">
              {copiedLang ? '✓ copiado' : 'copiar codigo'}
            </button>
          </div>
          <pre className="code-block">{currentSnippet}</pre>
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
          <a href="https://github.com/DavidWillianz/regex-tester-visual" target="_blank" rel="noreferrer"> ver repo</a>
        </p>
      </footer>
    </div>
  )
}
