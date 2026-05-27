'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [nValue, setNValue] = useState(2);

  // Mock authentication (replace with real tRPC calls)
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, just redirect to dashboard
    router.push('/dashboard');
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) return;
    // For demo, create a mock room ID
    const mockRoomId = crypto.randomUUID();
    router.push(`/room/${mockRoomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2">🎮 N-Back Arena</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Competitive N-Back Training
        </p>

        {/* Auth Form */}
        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                isLoginMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                !isLoginMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Your name"
                  required={!isLoginMode}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {isLoginMode ? 'Login' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Create Room */}
        <div className="border-t dark:border-gray-700 pt-8">
          <h2 className="text-xl font-semibold mb-4">Create a Room</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                placeholder="My Awesome Room"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">N-Value</label>
              <select
                value={nValue}
                onChange={(e) => setNValue(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
              >
                <option value={1}>1-Back (Easy)</option>
                <option value={2}>2-Back (Medium)</option>
                <option value={3}>3-Back (Hard)</option>
                <option value={4}>4-Back (Expert)</option>
              </select>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
