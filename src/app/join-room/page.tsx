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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 animate-gradient-xy"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 w-full max-w-md p-4">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
          <h1 className="text-4xl font-black text-white text-center mb-3">🚀 Присоединиться</h1>
          <p className="text-white/80 text-center mb-8 text-lg">Введите ID сессии от друга</p>

          {error && (
            <div className="mb-5 p-4 bg-red-500/20 border-2 border-red-400/50 rounded-2xl text-white font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/90 mb-3 text-base font-semibold">ID сессии</label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="abc123-def456-ghi789"
                className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-lg placeholder-white/40 focus:ring-4 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={joinRoomMutation.isPending}
              className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-teal-500 to-pink-500 hover:from-cyan-400 hover:via-teal-400 hover:to-pink-400 text-white font-black text-xl rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-xl"
            >
              {joinRoomMutation.isPending ? '⏳ Подключение...' : '🚀 Присоединиться к игре'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/dashboard" className="inline-block text-white/80 hover:text-white text-base font-semibold transition-all">
              ← Вернуться назад
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}