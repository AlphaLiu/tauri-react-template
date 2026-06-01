import { Zap } from 'lucide-react';
import { useState } from 'react';

import { commands } from '@/bindings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WindowTitlebar } from './tauri-controls/window-titlebar';

export function App() {
  const [greetMsg, setGreetMsg] = useState('');

  const handleGetStarted = async () => {
    try {
      const msg = await commands.greet('World');
      setGreetMsg(msg);
    }
    catch (e) {
      setGreetMsg(`Error: ${e}`);
    }
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      <WindowTitlebar className="w-full">
        <span className="
          pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-foreground/60
        "
        >
          tauri-react-vite-template
        </span>
      </WindowTitlebar>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Zap className="size-8 text-primary" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            tauri-react-vite
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            A modern desktop app starter — Tauri 2, React 19, Shadcn UI, and Tailwind CSS 4.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline">Tauri 2</Badge>
          <Badge variant="outline">React 19</Badge>
          <Badge variant="outline">Shadcn UI</Badge>
          <Badge variant="outline">Tailwind 4</Badge>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button onClick={handleGetStarted} size="lg" className="gap-2">
            <Zap className="size-4" />
            Get Started
          </Button>
          {greetMsg && (
            <p className="animate-in text-sm text-muted-foreground fade-in">
              {greetMsg}
            </p>
          )}
        </div>
      </div>

      <div className="pb-4 text-center font-mono text-xs text-muted-foreground/50">
        Press
        {' '}
        <kbd className="rounded-sm border border-border px-1 py-0.5 font-mono text-xs">d</kbd>
        {' '}
        to toggle dark mode
      </div>
    </main>
  );
}

export default App;
