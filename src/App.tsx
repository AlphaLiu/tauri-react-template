import '@/assets/index.css';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WindowTitlebar } from './components/controls';
import { commands, events } from './bindings';

function App() {
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const listenLogEntryEvent = events.logEvent.listen(event => {
      console.log('Received log entry:', event.payload);
    });

    return () => {
      listenLogEntryEvent.then(unlisten => unlisten());
    };
  }, []);

  async function greet() {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const msg = await commands.greet(name);
      setGreetMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <WindowTitlebar className="bg-transparent" />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Welcome to Tauri</CardTitle>
            <CardDescription className="text-lg text-gray-600">Build faster, lighter desktop applications with React</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                greet();
              }}
            >
              <div className="space-y-2">
                <label htmlFor="greet-input" className="text-sm font-medium text-gray-700">
                  Enter your name
                </label>
                <Input
                  id="greet-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Type your name here..."
                  className="h-12 text-lg border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg transition-all duration-200 text-white font-semibold"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Greeting...
                  </div>
                ) : (
                  '👋 Say Hello'
                )}
              </Button>
            </form>

            {greetMsg && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <p className="text-center text-xl text-green-700 font-medium">{greetMsg}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 flex gap-4 text-sm text-gray-500">
          <span>Built with</span>
          <Badge variant="outline">Tauri</Badge>
          <Badge variant="outline">React</Badge>
          <Badge variant="outline">TypeScript</Badge>
        </div>
      </main>
    </div>
  );
}

export default App;
