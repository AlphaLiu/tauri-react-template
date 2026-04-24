import { useState } from 'react';

import { commands } from '@/bindings';
import { Button } from '@/components/ui/button';
import { WindowTitlebar } from './tauri-controls/window-titlebar';

export function App() {
  const [greetMsg, setGreetMsg] = useState('');

  const greeting = async () => {
    const msg = await commands.greet('World');
    setGreetMsg(msg);
  };

  return (
    <main className="flex h-screen flex-col items-center overflow-hidden bg-background">
      {/* Window title bar with native controls */}
      <WindowTitlebar
        className="w-full"
      >
        <span className="
          pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-foreground/80
        "
        >
          tauri-react-vite-template
        </span>
      </WindowTitlebar>
      <div>
        <h1 className="font-medium">Project ready!</h1>
        <p>You may now add components and start building.</p>
        <p>We&apos;ve already added the button component for you.</p>
        {
          greetMsg && <p>{greetMsg}</p>
        }
        <Button className="mt-2" onClick={greeting}>Button</Button>
      </div>
      <div className="font-mono text-xs text-muted-foreground">
        (Press
        {' '}
        <kbd>d</kbd>
        {' '}
        to toggle dark mode)
      </div>
    </main>
  );
}

export default App;
