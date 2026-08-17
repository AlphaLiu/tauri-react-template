import { TitleBar } from "@/components/titlebar"
import { usePlatform } from "@/hooks/usePlatform"

export function App() {
  const { isMac } = usePlatform()

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* Custom TitleBar — inherits the app theme automatically */}
      <TitleBar isMac={isMac}>
        {/* Add any elements here: app icon, title, toolbar buttons, etc. */}
        <span className="text-sm font-medium select-none">tauri-app</span>
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
