import { useEffect, useMemo, useRef, useState } from 'react'
import ServiceTile from './components/ServiceTile'
import ServiceDialog from './components/ServiceDialog'
import ImportExportDialog from './components/ImportExportDialog'
import {
  clearLocal,
  loadConfig,
  loadLocal,
  matches,
  newId,
  normalize,
  saveLocal,
  sortServices,
  toExport,
} from './lib/services'

export default function App() {
  const [initialLocal] = useState(loadLocal)
  const [services, setServices] = useState(() => (initialLocal ? initialLocal.map(normalize) : []))
  const [source, setSource] = useState(initialLocal ? 'local' : 'loading')
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, service = edit
  const [showIO, setShowIO] = useState(false)
  const [toast, setToast] = useState('')
  const searchRef = useRef(null)

  async function loadFromConfig() {
    try {
      setServices(await loadConfig())
      setSource('config')
      setLoadError('')
    } catch (err) {
      setServices([])
      setSource('config')
      setLoadError(err.message)
    }
  }

  useEffect(() => {
    if (!initialLocal) loadFromConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !/INPUT|TEXTAREA|SELECT/.test(tag) && !document.querySelector('dialog[open]')) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  function commit(next, message) {
    setServices(next)
    saveLocal(next)
    setSource('local')
    if (message) setToast(message)
  }

  const visible = useMemo(() => sortServices(services.filter((s) => matches(s, query.trim()))), [services, query])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const s of visible) {
      const g = s.group || 'Other'
      if (!map.has(g)) map.set(g, [])
      map.get(g).push(s)
    }
    return [...map.entries()]
  }, [visible])

  const groupNames = useMemo(() => [...new Set(services.map((s) => s.group).filter(Boolean))], [services])

  function handleSave(form) {
    const row = normalize({ ...form, id: form.id || newId() })
    const exists = services.some((s) => s.id === row.id)
    commit(exists ? services.map((s) => (s.id === row.id ? row : s)) : [...services, row], exists ? 'Saved' : `Added ${row.name}`)
    setEditing(null)
  }

  function handleDelete(id) {
    commit(services.filter((s) => s.id !== id), 'Deleted')
    setEditing(null)
  }

  async function handleCopy(url) {
    try {
      await navigator.clipboard.writeText(url)
      setToast(`Copied ${url}`)
    } catch {
      setToast(`Copy blocked. Address: ${url}`)
    }
  }

  function handleImport(list) {
    const rows = list.filter((r) => r && r.name && r.url).map(normalize)
    commit(rows, `Imported ${rows.length} services`)
    setShowIO(false)
  }

  async function handleReset() {
    clearLocal()
    await loadFromConfig()
    setShowIO(false)
    setToast('Reloaded services.json')
  }

  function onSearchKey(e) {
    if (e.key === 'Enter' && visible[0]) window.open(visible[0].url, '_blank', 'noopener,noreferrer')
    if (e.key === 'Escape') {
      setQuery('')
      e.currentTarget.blur()
    }
  }

  const firstId = query.trim() ? visible[0]?.id : null
  const status =
    source === 'loading' ? 'Loading…' : source === 'local' ? `${services.length} services · edited in this browser` : `${services.length} services · from services.json`

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>
            TLab <span>Portal</span>
          </h1>
          <p className="sub">Every Proxmox node, VM, container and app in one place. Click a tile to open it.</p>
        </div>
        <div className="tools">
          <button type="button" onClick={() => setShowIO(true)}>
            Import / export
          </button>
          <button type="button" className="primary" onClick={() => setEditing({})}>
            Add service
          </button>
        </div>
      </header>

      <div className="bar">
        <div className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="q"
            ref={searchRef}
            type="search"
            placeholder="Find a service, IP or VMID… Enter opens the first match"
            autoComplete="off"
            aria-label="Search services"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
          />
          <kbd>/</kbd>
        </div>
        <span className="status">{status}</span>
      </div>

      <div className="notice">
        <span className="dot" />
        <div>
          <b>Connect to Tailscale first.</b> This page is only a list of links. The addresses point inside your
          tailnet, so they open only on a device that is signed in to Tailscale.
        </div>
      </div>

      <main>
        {loadError && <div className="empty">Could not load services.json: {loadError}</div>}
        {!loadError && source !== 'loading' && services.length === 0 && (
          <div className="empty">
            <h2>No services yet</h2>
            <div>Add your Proxmox host first (usually port 8006), then each VM or container you open often.</div>
            <button type="button" className="primary" onClick={() => setEditing({})}>
              Add service
            </button>
          </div>
        )}
        {services.length > 0 && visible.length === 0 && <div className="empty">Nothing matches “{query}”.</div>}
        {grouped.map(([group, items]) => (
          <section className="group" key={group}>
            <div className="group-head">
              <h2>{group}</h2>
              <span className="rule" />
              <span className="count">{items.length}</span>
            </div>
            <div className="grid">
              {items.map((s) => (
                <ServiceTile
                  key={s.id}
                  service={s}
                  highlighted={s.id === firstId}
                  onEdit={() => setEditing(s)}
                  onCopy={() => handleCopy(s.url)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {editing && (
        <ServiceDialog
          service={editing.id ? editing : null}
          groups={groupNames}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
        />
      )}
      {showIO && (
        <ImportExportDialog
          json={toExport(services)}
          hasLocalEdits={source === 'local'}
          onImport={handleImport}
          onReset={handleReset}
          onClose={() => setShowIO(false)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
