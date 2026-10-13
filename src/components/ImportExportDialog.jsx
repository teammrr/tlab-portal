import { useEffect, useRef, useState } from 'react'

export default function ImportExportDialog({ json, hasLocalEdits, onImport, onReset, onClose }) {
  const ref = useRef(null)
  const [text, setText] = useState(json)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setError('Copy was blocked. Select the text and copy it yourself.')
    }
  }

  function importText() {
    try {
      const list = JSON.parse(text)
      if (!Array.isArray(list)) throw new Error()
      onImport(list)
    } catch {
      setError('Paste a JSON list like [{"name":"Proxmox","url":"https://100.64.0.2:8006"}].')
    }
  }

  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose}>
      <div className="edit">
        <h3>Import / export</h3>
        <p className="hint">
          To keep your edits for good, copy this JSON into <code>public/services.json</code>. Import replaces the
          list in this browser with whatever you paste.
        </p>
        <textarea id="io-text" className="mono" rows={12} spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="err">{error}</div>
        <div className="form-actions">
          <button type="button" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          {hasLocalEdits && (
            <button type="button" className="danger" onClick={onReset} title="Discard browser edits and reload services.json">
              Reset to services.json
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={() => ref.current?.close()}>
            Close
          </button>
          <button type="button" className="primary" onClick={importText}>
            Import
          </button>
        </div>
      </div>
    </dialog>
  )
}
