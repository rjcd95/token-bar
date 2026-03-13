# Token Monitor

A **macOS menu bar** app that displays token usage for configured providers (e.g. Claude / Anthropic). Built with **Tauri 2**, **React**, **TypeScript**, and **Vite**.

- Icon in the menu bar (no Dock icon).
- Clicking the icon opens a popover panel with current usage and actions.
- Data refreshes according to config (default: every 1 hour between 6:00 and 18:00, plus a manual “Refresh now” button).

---

## Requirements

- **Node.js** 18+ and **npm**
- **Rust** (to build Tauri): [rustup](https://rustup.rs/)
- **macOS** (the app is designed for the macOS menu bar)

---

## Installation and running

```bash
# Clone and install dependencies
git clone <repo-url>
cd ClaudeMonitor
npm install

# Development (menu bar icon + dev window)
npm run tauri dev

# Build for macOS (.dmg)
npm run tauri build
```

The installer is generated under `src-tauri/target/release/bundle/dmg/`.

---

## Configuration

The app uses a **`config.json`** file. If it does not exist, a default one is created on first run.

### Where `config.json` is looked up

- **Development** (`npm run tauri dev`): in the **project root** (where `package.json` is).
- **Packaged app**: in the **current working directory** when the app is launched (often your user folder if opened from Finder).

For development, keep `config.json` in the project root and do not commit it.

### Template: `config.example.json`

Copy the template and edit with your values:

```bash
cp config.example.json config.json
# Edit config.json and add your Anthropic API key
```

### `config.json` options

| Field | Description | Default |
|-------|-------------|---------|
| `provider` | Provider name (e.g. `"claude"`). | `"claude"` |
| `apiKey` | Anthropic API key. Without a valid key, **mock data** is used. | `"YOUR_API_KEY"` |
| `endpoint` | API base URL. | `"https://api.anthropic.com"` |
| `tokenLimit` | Token limit used to compute percentages. | `200000` |
| `refreshInterval` | Auto-refresh interval in **minutes** (min 5). | `20` in example; in code, 60 between 6:00–18:00 |
| `menuBarIcon` | Menu bar icon type (e.g. `"brain"`). | `"brain"` |
| `showPercentages` | Show percentages in the panel. | `true` |
| `showModel` | Show model name. | `true` |

### How to get a Claude API key

1. Go to [Anthropic Console](https://console.anthropic.com/).
2. Open **API Keys** and create a key.
3. Paste it in `config.json` in the `apiKey` field.

**Important:** Do not commit `config.json` (it is in `.gitignore`). Use `config.example.json` as a reference without sensitive data.

---

## Token usage behavior

- **Automatic refresh:** Only between **6:00 and 18:00** (local time). Every **1 hour** (or the `refreshInterval` value when used in that flow) a request is made to the usage API.
- **Manual refresh:** **“Refresh now”** button in the panel.
- **Data source:**  
  - If `apiKey` is valid → the **Anthropic usage API** is used.  
  - If there is no key or it is `"YOUR_API_KEY"` → **mock data** is used (stable per hour, no per-second changes).
- **Displayed tokens** only change when a new refresh runs (automatic or manual), not in real time every second.

---

## Project structure

```
ClaudeMonitor/
├── config.example.json   # Config template (no secrets)
├── config.json           # Your config (not committed)
├── package.json
├── src/
│   ├── App.tsx           # Main logic and refresh scheduling
│   ├── components/       # UsagePanel, UsageHistoryChart
│   ├── services/         # config, usage (API/mock), history
│   └── tray.ts           # Tray icon title updates
└── src-tauri/            # Tauri backend (Rust)
    ├── src/main.rs       # Tray, window, config loading
    ├── tauri.conf.json
    ├── capabilities/     # Permissions (tray, positioner, fs, shell)
    └── icons/
```

---

## Useful scripts

| Command | Use |
|---------|-----|
| `npm run dev` | Frontend only (Vite) in the browser. |
| `npm run tauri dev` | Full app in development mode (tray + window). |
| `npm run tauri build` | Build the app and generate the .dmg. |
| `npm run lint` | Run ESLint. |

---

## License

Adjust to your project (MIT, private, etc.).
