# omarchy-network-plugin

Stock Omarchy `omarchy.network` panel plugin (Wi-Fi list and connection state).

Contents: `Panel.qml`, `Model.js`, `manifest.json` — copied from
`/usr/share/omarchy/shell/plugins/panels/network/`.

## Requirements

- Omarchy (Quickshell shell)
- GitHub access to this repo (it's private — run `gh auth login` first)

## Install (recommended)

```bash
omarchy plugin add https://github.com/elliotalien/omarchy-network-plugin.git --enable
```

Validate and reload:

```bash
omarchy plugin validate ~/.config/omarchy/plugins/omarchy.network
omarchy restart shell
```

## Install (manual)

```bash
git clone https://github.com/elliotalien/omarchy-network-plugin.git ~/.config/omarchy/plugins/omarchy.network
omarchy plugin enable omarchy.network
omarchy restart shell
```

Via SSH (if you use SSH keys):

```bash
git clone git@github.com:elliotalien/omarchy-network-plugin.git ~/.config/omarchy/plugins/omarchy.network
```

## Notes

- The manifest id is `omarchy.network`, the same as the built-in plugin —
  enabling this replaces the built-in panel. To keep both side by side,
  copy the folder to a new id (e.g. `my.network`) and update `id` in
  `manifest.json`.
- User plugin code hot-reloads on save; if a change doesn't apply, run
  `omarchy restart shell`.
