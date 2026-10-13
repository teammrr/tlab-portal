export const KINDS = {
  host: { label: 'PVE', name: 'Proxmox host' },
  vm: { label: 'VM', name: 'VM' },
  lxc: { label: 'LXC', name: 'LXC' },
  app: { label: 'APP', name: 'App' },
}

const STORAGE_KEY = 'tlab-portal-services'

// Edits made in the browser are kept in localStorage and win over public/services.json.
export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveLocal(services) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
  } catch {
    // Storage blocked (private window). Edits last for this visit only.
  }
}

export function clearLocal() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export async function loadConfig() {
  const res = await fetch(`${import.meta.env.BASE_URL}services.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`services.json returned ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('services.json must be a JSON list')
  return data.map(normalize)
}

export function newId() {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function normalizeUrl(url) {
  const u = String(url || '').trim()
  return u && !/^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? `http://${u}` : u
}

export function normalize(s) {
  return {
    id: s.id || newId(),
    name: String(s.name || '').trim(),
    url: normalizeUrl(s.url),
    kind: KINDS[s.kind] ? s.kind : 'app',
    vmid: String(s.vmid ?? '').trim(),
    group: String(s.group || '').trim(),
    order: s.order === '' || s.order == null ? null : Number(s.order) || 0,
    note: String(s.note || '').trim(),
  }
}

// Strip the runtime id so exported JSON can go straight back into services.json.
export function toExport(services) {
  return JSON.stringify(sortServices(services).map(({ id: _id, ...rest }) => rest), null, 2)
}

export function sortServices(list) {
  return [...list].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name),
  )
}

export function matches(s, query) {
  if (!query) return true
  const hay = [s.name, s.url, s.group, s.note, s.vmid, KINDS[s.kind]?.label].join(' ').toLowerCase()
  return query.toLowerCase().split(/\s+/).every((w) => hay.includes(w))
}

export function displayAddress(url) {
  try {
    const u = new URL(url)
    return u.host + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}
