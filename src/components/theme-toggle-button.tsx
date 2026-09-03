import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  function toggle() {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'dark' : 'light');
  }

  const isDark
    = theme === 'dark'
      || (theme === 'system'
        && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <Button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        max-h-8 w-11.5 cursor-default rounded-none bg-transparent text-black/90
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
            <SunIcon width="10" height="10" />
          )
        : (
          /* Moon icon */
            <MoonIcon width="10" height="10" />
          )}
    </Button>
  );
}
