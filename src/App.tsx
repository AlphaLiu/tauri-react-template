import { useEffect, useState } from 'react';
import { SettingsDialog } from '@/components/settings/settings-dialog';
import { useTheme } from '@/components/theme-provider';
import { TitleBar } from '@/components/titlebar';
import { usePlatform } from '@/hooks/usePlatform';

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  function toggle() {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'dark' : 'light');
  }

  const isDark
    = theme === 'dark'
      || (theme === 'system'
        && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        inline-flex h-full w-[46px] cursor-default items-center justify-center rounded-none bg-transparent text-black/90
        hover:bg-black/5
        active:bg-black/3
        dark:text-white
        dark:hover:bg-white/6
        dark:active:bg-white/4
      "
    >
      {isDark
        ? (
          /* Sun icon — same 10×10 viewport convention as window control icons */
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )
        : (
          /* Moon icon */
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
    </button>
  );
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Settings"
      aria-label="Settings"
      className="
        inline-flex h-full w-[46px] cursor-default items-center justify-center rounded-none bg-transparent text-black/90
        hover:bg-black/5
        active:bg-black/3
        dark:text-white
        dark:hover:bg-white/6
        dark:active:bg-white/4
      "
    >
      {/* Gear icon — same 10×10 viewport convention as window control icons */}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}

export function App() {
  const { isMac } = usePlatform();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          <SettingsButton onClick={() => setIsSettingsOpen(true)} />
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

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}

export default App;
