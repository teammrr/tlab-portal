# TLab Portal

A one-click launcher for the homelab: Proxmox hosts, VMs, LXC containers and apps.
The portal itself can be public. The links point at Tailscale addresses, so a
service only opens on a device that is connected to the tailnet.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Add your services

Edit `public/services.json`. Each entry:

```json
{
  "name": "Proxmox VE",
  "url": "https://100.64.0.2:8006",
  "kind": "host",
  "vmid": "",
  "group": "Proxmox",
  "order": 1,
  "note": "Web UI"
}
```

- `kind`: `host` (Proxmox node), `vm`, `lxc` or `app`
- `group`: tiles are grouped under this heading
- `order`: lower numbers come first
- Prefer MagicDNS names (`https://pve.your-tailnet.ts.net:8006`) over raw IPs so links survive IP changes.

You can also add and edit services in the browser. Those edits are saved in that
browser only (localStorage). Use **Import / export** to copy the JSON back into
`public/services.json` so every device gets them.

`services.json` is loaded at runtime, so after a build you can edit
`dist/services.json` (or the file inside the container) without rebuilding.

Shortcuts: `/` focuses search, `Enter` opens the first match, `Esc` clears.

## Deploy

Static build:

```bash
npm run build      # output in dist/
```

Docker:

```bash
docker build -t tlab-portal .
docker run -d -p 8080:80 --name tlab-portal \
  -v "$PWD/public/services.json:/usr/share/nginx/html/services.json:ro" \
  tlab-portal
```

The volume mount lets you update `services.json` without rebuilding the image.

Because the page is public, anyone with the URL can see your service names and
tailnet addresses (they still cannot reach them without Tailscale). Put it behind
Cloudflare Access or basic auth if you would rather keep the list private.
