'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc';

export default function JoinRoomPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');

  const joinRoomMutation = trpc.room.join.useMutation({
    onSuccess: (data) => {
      console.log('Joined room:', data);
      router.push(`/room/${data.id}`);
    },
    onError: (error) => {
      console.error('Join room error:', error);
      setError(error.message || 'Failed to join room');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      setError('Please enter a session ID');
      return;
    }
    setError('');
    joinRoomMutation.mutate({ sessionId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
          <h1 className="text-3xl font-bold text-white text-center mb-2">🚀 Присоединиться</h1>
          <p className="text-purple-200 text-center mb-8">Введите ID сессии от друга</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 mb-2 text-sm">ID сессии</label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="abc123-def456-ghi789"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={joinRoomMutation.isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {joinRoomMutation.isPending ? 'Подключение...' : '🚀 Присоединиться к игре'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-white/60 hover:text-white text-sm">
              ← Вернуться назад
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}