import { KINDS, displayAddress } from '../lib/services'

export default function ServiceTile({ service, highlighted, onEdit, onCopy }) {
  const kind = KINDS[service.kind] || KINDS.app

  const stop = (fn) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    fn()
  }

  return (
    <a
      className={`tile kind-${service.kind}${highlighted ? ' hit' : ''}`}
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="tile-top">
        <span className="leds" aria-hidden="true">
          <i />
          <i />
        </span>
        <span className="name">{service.name}</span>
        <span className="chip">{service.vmid ? `${kind.label} ${service.vmid}` : kind.label}</span>
      </div>
      <div className="addr">{displayAddress(service.url)}</div>
      {service.note && <div className="note">{service.note}</div>}
      <div className="tile-actions">
        <button type="button" className="ghost" title="Copy address" onClick={stop(onCopy)}>
          Copy
        </button>
        <button type="button" className="ghost" onClick={stop(onEdit)}>
          Edit
        </button>
      </div>
    </a>
  )
}
