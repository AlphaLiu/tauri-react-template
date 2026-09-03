import { useEffect, useState } from 'react';
import { SettingsButton } from '@/components/settings/settings-button';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { TitleBar } from '@/components/titlebar';
import { usePlatform } from '@/hooks/usePlatform';

export function App() {
  const { isMac } = usePlatform();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Expose platform to CSS for platform-specific overrides (e.g. titlebar height).
  useEffect(() => {
    if (isMac) {
      document.documentElement.dataset.platform = 'macos';
    }
  }, [isMac]);

  // On macOS: track fullscreen to collapse the traffic-light spacer.
  // In fullscreen the native buttons move to the system toolbar, so the
  // 72px spacer becomes dead space — collapsing it lets the title shift left.
  useEffect(() => {
    if (!isMac)
      return;

    let cancelled = false;
    let unlisten: (() => void) | null = null;

    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      const win = getCurrentWindow();

      const sync = async () => {
        if (cancelled)
          return;
        const fs = await win.isFullscreen();
        if (cancelled)
          return;
        setIsFullscreen(fs);
      };

      sync();
      win.onResized(() => sync()).then((fn) => {
        if (cancelled)
          fn();
        else unlisten = fn;
      });
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [isMac]);

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* Custom TitleBar — inherits the app theme automatically */}
      <TitleBar isMac={isMac}>
        {/* Title hidden when fullscreen on macOS — traffic lights move to system toolbar */}
        {(!isMac || !isFullscreen) && (
          <span className="absolute top-1/2 left-1/2 -translate-1/2 text-sm font-medium select-none">tauri-app</span>
        )}
        <div className="-mr-2 ml-auto flex h-full items-center">
          <SettingsButton />
          <ThemeToggleButton />
        </div>
      </TitleBar>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-auto p-6">
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm/loose">
          <div>
            <h1 className="font-medium">Project ready!</h1>
            <p>You may now add components and start building.</p>
            <p>The custom TitleBar is fully themed and cross-platform.</p>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            (Press
            {' '}
            <kbd>d</kbd>
            {' '}
            to toggle dark mode)
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
