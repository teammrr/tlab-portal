import { useEffect, useRef, useState } from 'react'
import { KINDS, normalizeUrl } from '../lib/services'

const EMPTY = { name: '', url: '', kind: 'app', vmid: '', group: '', order: '', note: '' }

export default function ServiceDialog({ service, groups, onSave, onDelete, onClose }) {
  const ref = useRef(null)
  // The parent mounts a fresh dialog per open, so initial state is enough.
  const [form, setForm] = useState(() => (service ? { ...EMPTY, ...service, order: service.order ?? '' } : EMPTY))
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isEdit = Boolean(service?.id)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const url = normalizeUrl(form.url)
    try {
      if (!/^https?:$/.test(new URL(url).protocol)) throw new Error()
    } catch {
      setError('Enter a web address, such as http://100.64.0.10:8006')
      return
    }
    if (!form.name.trim()) {
      setError('Give the service a name.')
      return
    }
    onSave({ ...form, url })
  }

  function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete(service.id)
  }

  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose}>
      <form className="edit" onSubmit={submit}>
        <h3>{isEdit ? 'Edit service' : 'Add service'}</h3>
        <label>
          Name
          <input id="f-name" required maxLength={60} placeholder="Jellyfin" value={form.name} onChange={set('name')} autoFocus />
        </label>
        <label>
          URL
          <input
            id="f-url"
            className="mono"
            required
            placeholder="http://100.101.102.103:8096"
            value={form.url}
            onChange={set('url')}
          />
          <span className="hint">MagicDNS names (pve.your-tailnet.ts.net) keep working if an IP changes.</span>
        </label>
        <div className="row">
          <label>
            Kind
            <select id="f-kind" value={form.kind} onChange={set('kind')}>
              {Object.entries(KINDS).map(([value, k]) => (
                <option key={value} value={value}>
                  {k.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            VMID / CTID
            <input id="f-vmid" className="mono" inputMode="numeric" maxLength={8} placeholder="101" value={form.vmid} onChange={set('vmid')} />
          </label>
        </div>
        <div className="row">
          <label>
            Group
            <input id="f-group" list="groups" maxLength={40} placeholder="Media" value={form.group} onChange={set('group')} />
          </label>
          <label>
            Order
            <input id="f-order" className="mono" inputMode="numeric" placeholder="10" value={form.order} onChange={set('order')} />
          </label>
        </div>
        <datalist id="groups">
          {groups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <label>
          Note
          <input id="f-note" maxLength={120} placeholder="Runs on pve-01" value={form.note} onChange={set('note')} />
        </label>
        <div className="err">{error}</div>
        <div className="form-actions">
          {isEdit && (
            <button type="button" className="danger" onClick={remove}>
              {confirmDelete ? 'Click again to delete' : 'Delete'}
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Save
          </button>
        </div>
      </form>
    </dialog>
  )
}
