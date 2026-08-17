import { useEffect, useState } from "react"
import { TitleBar } from "@/components/titlebar"
import { useTheme } from "@/components/theme-provider"
import { usePlatform } from "@/hooks/usePlatform"

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()

  function toggle() {
    setTheme(theme === "dark" ? "light" : theme === "light" ? "dark" : "light")
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-full w-[46px] cursor-default items-center justify-center rounded-none bg-transparent text-black/90 hover:bg-black/[.05] active:bg-black/[.03] dark:text-white dark:hover:bg-white/[.06] dark:active:bg-white/[.04]"
    >
      {isDark ? (
        /* Sun icon — same 10×10 viewport convention as window control icons */
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        /* Moon icon */
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export function App() {
  const { isMac } = usePlatform()
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Expose platform to CSS for platform-specific overrides (e.g. titlebar height).
  useEffect(() => {
    if (isMac) {
      document.documentElement.dataset.platform = "macos"
    }
  }, [isMac])

  // On macOS: track fullscreen to collapse the traffic-light spacer.
  // In fullscreen the native buttons move to the system toolbar, so the
  // 72px spacer becomes dead space — collapsing it lets the title shift left.
  useEffect(() => {
    if (!isMac) return

    let cancelled = false
    let unlisten: (() => void) | null = null

    import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      const win = getCurrentWindow()

      const sync = async () => {
        if (cancelled) return
        const fs = await win.isFullscreen()
        if (cancelled) return
        setIsFullscreen(fs)
      }

      sync()
      win.onResized(() => sync()).then((fn) => {
        if (cancelled) fn()
        else unlisten = fn
      })
    })

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [isMac])

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* Custom TitleBar — inherits the app theme automatically */}
      <TitleBar isMac={isMac}>
        {/* Title hidden when fullscreen on macOS — traffic lights move to system toolbar */}
        {(!isMac || !isFullscreen) && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-medium select-none">tauri-app</span>
        )}
        <div className="ml-auto flex h-full items-center -mr-2">
          <ThemeToggleButton />
        </div>
      </TitleBar>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 overflow-auto">
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
          <div>
            <h1 className="font-medium">Project ready!</h1>
            <p>You may now add components and start building.</p>
            <p>The custom TitleBar is fully themed and cross-platform.</p>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            (Press <kbd>d</kbd> to toggle dark mode)
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
