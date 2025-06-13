import '@/assets/index.css';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

function App() {
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');

  async function greet() {
    setGreetMsg(await invoke('greet', { name }));
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-purple-700 mb-4">Welcome to Tauri + React</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            greet();
          }}
        >
          <input
            id="greet-input"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            onChange={e => setName(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <button type="submit" className="bg-purple-600 text-white font-semibold py-2 rounded-md hover:bg-purple-700 transition">
            Greet
          </button>
        </form>
        <p className="mt-6 text-center text-lg text-green-600 min-h-[2rem]">{greetMsg}</p>
      </div>
    </main>
  );
}

export default App;
