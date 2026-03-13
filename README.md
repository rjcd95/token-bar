# Claude Monitor

Aplicación de **barra de menú de macOS** que muestra el uso de tokens de Claude (Anthropic). Construida con **Tauri 2**, **React**, **TypeScript** y **Vite**.

- Icono en la barra de menú (sin icono en el Dock).
- Al hacer clic se abre un panel tipo popover con uso actual, historial y acciones.
- Los datos se actualizan según la configuración (por defecto cada 1 hora, entre 6:00 y 18:00, más “Actualizar ahora” manual).

---

## Requisitos

- **Node.js** 18+ y **npm**
- **Rust** (para compilar Tauri): [rustup](https://rustup.rs/)
- **macOS** (la app está pensada para la barra de menú de macOS)

---

## Instalación y ejecución

```bash
# Clonar e instalar dependencias
git clone <url-del-repo>
cd ClaudeMonitor
npm install

# Desarrollo (icono en la barra de menú + ventana de desarrollo)
npm run tauri dev

# Build para macOS (.dmg)
npm run tauri build
```

El instalador se genera en `src-tauri/target/release/bundle/dmg/`.

---

## Configuración

La app usa un archivo **`config.json`**. Si no existe, se crea uno por defecto la primera vez.

### Dónde se busca `config.json`

- **Desarrollo** (`npm run tauri dev`): en la **raíz del proyecto** (donde está `package.json`).
- **App empaquetada**: en el **directorio de trabajo actual** al abrir la app (suele ser tu carpeta de usuario si la abres desde Finder).

Para desarrollo, conviene tener `config.json` en la raíz del proyecto (y no subirlo al repo).

### Plantilla: `config.example.json`

Copia la plantilla y edita con tus datos:

```bash
cp config.example.json config.json
# Edita config.json y añade tu API key de Anthropic
```

### Opciones de `config.json`

| Campo | Descripción | Por defecto |
|-------|-------------|-------------|
| `provider` | Proveedor (p. ej. `"claude"`). | `"claude"` |
| `apiKey` | API key de Anthropic. Sin key válida se usa **datos de prueba (mock)**. | `"YOUR_API_KEY"` |
| `endpoint` | URL base de la API. | `"https://api.anthropic.com"` |
| `tokenLimit` | Límite de tokens que se usa para calcular porcentajes. | `200000` |
| `refreshInterval` | Intervalo de actualización automática en **minutos** (mín. 5). | `20` en ejemplo; en código 60 entre 6:00–18:00 |
| `menuBarIcon` | Tipo de icono en la barra (p. ej. `"brain"`). | `"brain"` |
| `showPercentages` | Mostrar porcentajes en el panel. | `true` |
| `showModel` | Mostrar nombre del modelo. | `true` |

### Cómo obtener la API key de Claude

1. Entra en [Console de Anthropic](https://console.anthropic.com/).
2. Ve a **API Keys** y crea una clave.
3. Pégala en `config.json` en el campo `apiKey`.

**Importante:** No subas `config.json` al repositorio (está en `.gitignore`). Usa `config.example.json` como referencia sin datos sensibles.

---

## Comportamiento del uso de tokens

- **Actualización automática:** Solo entre **6:00 y 18:00** (hora local). Cada **1 hora** (o el valor de `refreshInterval` si se usa en ese flujo) se hace una petición a la API de uso.
- **Actualización manual:** Botón **“Actualizar ahora”** en el panel.
- **Fuente de datos:**  
  - Si `apiKey` es válida → se usa la **API de uso de Anthropic**.  
  - Si no hay key o es `"YOUR_API_KEY"` → se usan **datos mock** (estables por hora, no cambian cada segundo).
- Los **tokens mostrados** solo cambian cuando hay una nueva actualización (automática o manual), no en tiempo real segundo a segundo.

---

## Estructura del proyecto

```
ClaudeMonitor/
├── config.example.json   # Plantilla de configuración (sin secretos)
├── config.json           # Tu configuración (no se commitea)
├── package.json
├── src/
│   ├── App.tsx           # Lógica principal y programación de refrescos
│   ├── components/       # UsagePanel, UsageHistoryChart
│   ├── services/         # config, usage (API/mock), history
│   └── tray.ts           # Actualización del título del icono del tray
└── src-tauri/            # Backend Tauri (Rust)
    ├── src/main.rs       # Tray, ventana, carga de config
    ├── tauri.conf.json
    ├── capabilities/     # Permisos (tray, positioner, fs, shell)
    └── icons/
```

---

## Scripts útiles

| Comando | Uso |
|---------|-----|
| `npm run dev` | Solo frontend (Vite) en el navegador. |
| `npm run tauri dev` | App completa en modo desarrollo (tray + ventana). |
| `npm run tauri build` | Build de la app y generación del .dmg. |
| `npm run lint` | Linter (ESLint). |

---

## Licencia

Ajusta según tu proyecto (MIT, privado, etc.).
