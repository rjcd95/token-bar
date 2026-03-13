import { TrayIcon } from '@tauri-apps/api/tray'
import { defaultWindowIcon } from '@tauri-apps/api/app'
import { getCurrentWindow } from '@tauri-apps/api/window'

let tray: TrayIcon | null = null
let isVisible = false

function colorForPercent(percent: number): string {
  if (percent >= 85) return '🔴'
  if (percent >= 60) return '🟡'
  return '🟢'
}

export async function initTray(): Promise<void> {
  if (tray) return

  const appWindow = getCurrentWindow()
  const icon = await defaultWindowIcon()

  tray = await TrayIcon.new({
    icon,
    title: 'Claude Monitor',
    tooltip: 'Claude Monitor',
    menuOnLeftClick: false,
    action: async (event) => {
      if (event.type === 'Click') {
        isVisible = !isVisible
        if (isVisible) {
          await appWindow.show()
          await appWindow.setFocus()
        } else {
          await appWindow.hide()
        }
      }
    },
  })

  await appWindow.hide()
}

export async function updateTrayUsage(percent: number): Promise<void> {
  if (!tray) return
  const clamped = Math.max(0, Math.min(100, percent))
  const color = colorForPercent(clamped)
  const label = `${color} ${Math.round(clamped)}%`
  await tray.setTitle(label)
}

