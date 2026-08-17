/**
 * @fileoverview Platform-aware window control buttons.
 *
 * On macOS, native traffic lights are provided by the OS via
 * `titleBarStyle: "Overlay"` in tauri.macos.conf.json — this component
 * renders nothing.
 *
 * On Windows/Linux, renders caption-style buttons matching the Windows 11
 * Fluent Design specification: 46×32px borderless rectangles with inline
 * SVG symbols, transparent by default, with hover/unfocused states.
 * The close button uses the official Windows 11 red (#C42B1C) on hover.
 *
 * Colors use --titlebar-fg (defaults to currentColor) so they automatically
 * adapt to the active theme without hardcoding.
 */

import { useEffect, useRef, useState, type ReactNode } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { listen, type UnlistenFn } from "@tauri-apps/api/event"

export interface WindowControlsProps {
  /** Whether the window is currently maximized */
  isMaximized: boolean
  /** Called when maximize/restore is toggled */
  onMaximizeToggle?: () => void
  /** Called when close button is clicked */
  onClose?: () => void
}

export function WindowControls({ isMaximized, onMaximizeToggle, onClose }: WindowControlsProps) {
  const [isFocused, setIsFocused] = useState(true)
  const [isMaxOver, setIsMaxOver] = useState(false)
  const unlistenRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const appWindow = getCurrentWindow()
    let cancelled = false

    appWindow.onFocusChanged(({ payload }) => {
      if (!cancelled) setIsFocused(payload)
    }).then((unlisten) => {
      if (cancelled) {
        unlisten()
      } else {
        unlistenRef.current = unlisten
      }
    })

    return () => {
      cancelled = true
      unlistenRef.current?.()
      unlistenRef.current = null
    }
  }, [])

  // The native snap overlay (Windows 11) owns the mouse over the maximize
  // button, so the webview never receives onclick or :hover there. The
  // plugin emits these events instead — the click handler is only reached
  // on Windows; on other platforms the button's plain onClick below keeps
  // working.
  useEffect(() => {
    let cancelled = false
    const unlisteners: UnlistenFn[] = []

    const wire = async () => {
      unlisteners.push(
        await listen("tauri-frame://snap/click", () => {
          if (!cancelled) {
            getCurrentWindow().toggleMaximize()
            onMaximizeToggle?.()
          }
        }),
        await listen("tauri-frame://snap/mouseenter", () => {
          if (!cancelled) setIsMaxOver(true)
        }),
        await listen("tauri-frame://snap/mouseleave", () => {
          if (!cancelled) setIsMaxOver(false)
        }),
        await listen("tauri-frame://snap/mousedown", () => {
          if (!cancelled) setIsMaxOver(true)
        }),
      )
    }

    wire()

    return () => {
      cancelled = true
      unlisteners.forEach((unlisten) => unlisten())
    }
  }, [onMaximizeToggle])

  function handleMinimize() {
    getCurrentWindow().minimize()
  }

  function handleToggleMaximize() {
    getCurrentWindow().toggleMaximize()
    onMaximizeToggle?.()
  }

  function handleClose() {
    if (onClose) {
      onClose()
    } else {
      getCurrentWindow().close()
    }
  }

  return (
    <div
      className="titlebar-caption-bar"
      data-focused={isFocused ? "true" : "false"}
    >
      {/* Minimize */}
      <button
        className="titlebar-caption-btn"
        aria-label="Minimize"
        title="Minimize"
        onClick={handleMinimize}
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="none" aria-hidden="true">
          <path d="M0 .5h10" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>

      {/* Maximize / Restore */}
      <button
        className={`titlebar-caption-btn${isMaxOver ? " titlebar-caption-over" : ""}`}
        aria-label={isMaximized ? "Restore" : "Maximize"}
        title={isMaximized ? "Restore" : "Maximize"}
        onClick={handleToggleMaximize}
      >
        {isMaximized ? (
          /* Restore: two overlapping rectangles */
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M3.5 0.5h6v6M0.5 3.5h6v6h-6z" stroke="currentColor" strokeWidth="1" />
          </svg>
        ) : (
          /* Maximize: single rectangle */
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
      </button>

      {/* Close */}
      <button
        className="titlebar-caption-btn titlebar-caption-close"
        aria-label="Close"
        title="Close"
        onClick={handleClose}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TitleBar
// ─────────────────────────────────────────────────────────────────────────────

export interface TitleBarProps {
  /**
   * Whether the current platform is macOS.
   * On macOS, WindowControls is hidden (native traffic lights handle it)
   * and a left-padding is added to avoid overlapping the traffic light area.
   */
  isMac: boolean
  /**
   * Custom content to render inside the titlebar (e.g. app title, toolbar items).
   * Receives the full available width between the drag region and window controls.
   */
  children?: ReactNode
  /**
   * Called when close button is clicked (Windows/Linux).
   * If not provided, closes the window directly.
   */
  onClose?: () => void
}

/**
 * Cross-platform custom TitleBar component.
 *
 * - **macOS**: Uses native traffic lights (Overlay style). The titlebar
 *   renders a drag region with left-padding so content doesn't overlap
 *   the traffic lights.
 * - **Windows / Linux**: Renders a fully custom titlebar with a drag region
 *   and Windows 11 Fluent-style caption buttons (minimize / maximize / close).
 *
 * @example
 * ```tsx
 * <TitleBar isMac={isMac}>
 *   <span>My App</span>
 * </TitleBar>
 * ```
 */
export function TitleBar({ isMac, children, onClose }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const unlistenResizeRef = useRef<(() => void) | null>(null)

  // Track maximize state for the WindowControls icon toggle.
  // macOS: skipped — native traffic lights handle maximize; calling isMaximized()
  // inside onResized triggers an infinite loop on macOS (tauri-apps/tauri#5812).
  useEffect(() => {
    if (isMac) return

    const appWindow = getCurrentWindow()
    let cancelled = false

    // Read initial state
    appWindow.isMaximized().then((v) => {
      if (!cancelled) setIsMaximized(v)
    })

    // Subscribe to resize events to update maximize state
    appWindow.onResized(async () => {
      if (!cancelled) {
        const maximized = await appWindow.isMaximized()
        setIsMaximized(maximized)
      }
    }).then((unlisten) => {
      if (cancelled) {
        unlisten()
      } else {
        unlistenResizeRef.current = unlisten
      }
    })

    return () => {
      cancelled = true
      unlistenResizeRef.current?.()
      unlistenResizeRef.current = null
    }
  }, [isMac])

  function handleMaximizeToggle() {
    // Query state after a short delay to let the native animation settle
    setTimeout(async () => {
      const appWindow = getCurrentWindow()
      setIsMaximized(await appWindow.isMaximized())
    }, 300)
  }

  return (
    <header className="titlebar" data-tauri-drag-region>
      {/* macOS traffic-light safe area: 72px to clear the native buttons */}
      {isMac && <div className="titlebar-macos-spacer" data-tauri-drag-region />}

      {/* Custom content slot */}
      <div className="titlebar-content" data-tauri-drag-region>
        {children}
      </div>

      {/* Windows / Linux custom window controls */}
      {!isMac && (
        <WindowControls
          isMaximized={isMaximized}
          onMaximizeToggle={handleMaximizeToggle}
          onClose={onClose}
        />
      )}
    </header>
  )
}
