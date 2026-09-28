# elliot-network-plugin

Custom Omarchy network panel plugin (Wi-Fi list and connection state),
cloned from stock `omarchy.network`.

## Differences from stock omarchy.network

### Multi-adapter support
- Wi-Fi adapter switcher dropdown under the header (shows only with 2+
  radios). Labels come from interface names: PCI radios → "Wi-Fi",
  USB-path names (`wlp0s20f0u1`) → "Wi-Fi 2"; colliding labels fall back
  to numbering ("Wi-Fi 1", "Wi-Fi 2", …) so every radio stays selectable.
- Header and bar icon reflect the live connection on **any** radio, not
  just the adapter being viewed.
- Connection stats are gated to the selected adapter — the idle radio
  reads `--` instead of showing the other adapter's numbers. Ethernet
  and VPN routes stay global.

### Single-adapter policy
- Connecting on one adapter disconnects the other live radios, so only
  the newly selected adapter stays connected. Idle radios are left
  alone — `nmcli device disconnect` only fires on radios that are
  actually connected, so it never marks an idle radio
  manually-disconnected (which would block its autoconnect until a
  manual reconnect).
- In-flight connect / disconnect / forget actions are bound to the
  adapter that started them: a same-named network on the adapter being
  viewed can't complete or fail another radio's action, and switching
  the dropdown mid-connect doesn't lose the action's completion or
  failure signals.

### Row UI
- No "Connect" label on idle rows — click the row to connect.
- Connected / busy / failed state shows as right-edge status text
  (`Connected` · `Connecting…` · `Disconnecting…` · `Working…` ·
  `Retry`) instead of button chrome or a second status line.
- The lock glyph opens the passphrase prompt for secured networks with
  no saved credentials; the same glyph reveals Forget for known
  networks.

### VPN
- VPN default routes (tun/tap/wg*/wireguard/mullvad/proton/pvpn/nord/
  tailscale/ppp/ipsec/vpn/utun/zt) are detected by interface name and
  shown as "SSID (VPN)" — real Ethernet, bridges, bonds and VLANs are
  never mislabeled VPN.
- The speed test payload reports "VPN" for tunnel routes.

### Robustness
- Passphrase prompt cancels when its adapter leaves view; busy state
  releases immediately if the action's radio is unplugged.
- Bar icon falls back to cached signal strength while the panel is
  closed and the scan list is empty.

Everything else — keyboard navigation, band selection, DNS provider
pills, QR share, speed test, IPC target `omarchy.network` — is stock.

Contents: `Panel.qml`, `Model.js`, `manifest.json` — originally copied
from `/usr/share/omarchy/shell/plugins/panels/network/`. `test.js`
holds the `Model.js` unit tests — run `node test.js`.

## Requirements

- Omarchy (Quickshell shell)

## Install (recommended)

```bash
omarchy plugin add https://github.com/elliotalien/elliot-network-plugin.git --enable
```

Validate and reload:

```bash
omarchy plugin validate ~/.config/omarchy/plugins/elliot.network
omarchy restart shell
```

## Install (manual)

```bash
git clone https://github.com/elliotalien/elliot-network-plugin.git ~/.config/omarchy/plugins/elliot.network
omarchy plugin enable elliot.network
omarchy restart shell
```

Via SSH (if you use SSH keys):

```bash
git clone git@github.com:elliotalien/elliot-network-plugin.git ~/.config/omarchy/plugins/elliot.network
```

## Notes

- The manifest id is `elliot.network` (cloned from built-in
  `omarchy.network`) — enabling this replaces the built-in panel. The
  adapter dropdown appears under the header only when 2+ Wi-Fi radios
  are present.
- User plugin code hot-reloads on save; if a change doesn't apply, run
  `omarchy restart shell`.
