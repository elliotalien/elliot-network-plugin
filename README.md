# elliot-network-plugin

Custom Omarchy network panel plugin (Wi-Fi list and connection state),
cloned from stock `omarchy.network` with:

- Themed Wi-Fi adapter switcher (Wi-Fi = internal, Wi-Fi 2 = external USB)
  under the header (shows only with 2+ radios)
- Explicit Connect / Disconnect buttons on each network row
- Connection stats gated to the selected adapter (`--` when it isn't active)

Contents: `Panel.qml`, `Model.js`, `manifest.json` — copied from
`/usr/share/omarchy/shell/plugins/panels/network/`.

## Requirements

- Omarchy (Quickshell shell)
- GitHub access to this repo (it's private — run `gh auth login` first)

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

- The manifest id is `elliot.network` (cloned from built-in `omarchy.network`) —
  enabling this replaces the built-in panel. The adapter dropdown appears
  under the header only when 2+ Wi-Fi radios are present.
- User plugin code hot-reloads on save; if a change doesn't apply, run
  `omarchy restart shell`.
