import { useState } from 'react';

import { commands } from '@/bindings';
import { Button } from '@/components/ui/button';

export function App() {
  const [greetMsg, setGreetMsg] = useState('');

  const greeting = async () => {
    const msg = await commands.greet('World');
    setGreetMsg(msg);
  };

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm/loose">
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
      </div>
    </div>
  );
}

export default App;
