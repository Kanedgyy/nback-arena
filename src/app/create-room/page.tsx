'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc';

export default function CreateRoomPage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [nValue, setNValue] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState('');

  const createRoomMutation = trpc.room.create.useMutation({
    onSuccess: (data) => {
      console.log('Room created:', data);
      router.push(`/room/${data.id}`);
    },
    onError: (error) => {
      console.error('Create room error:', error);
      setError(error.message || 'Failed to create room');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Please enter a room name');
      return;
    }
    setError('');
    createRoomMutation.mutate({
      name: roomName,
      nValue,
      maxPlayers,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
          <h1 className="text-3xl font-bold text-white text-center mb-2">✨ Создать игру</h1>
          <p className="text-purple-200 text-center mb-8">Настройте параметры игры</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 mb-2 text-sm">Название комнаты</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Моя крутая игра"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-white/80 mb-2 text-sm">N-Value (сложность)</label>
              <select
                value={nValue}
                onChange={(e) => setNValue(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              >
                <option value={1}>1-Back (Легко)</option>
                <option value={2}>2-Back (Средне)</option>
                <option value={3}>3-Back (Сложно)</option>
                <option value={4}>4-Back (Эксперт)</option>
              </select>
            </div>

            <div>
              <label className="block text-white/80 mb-2 text-sm">Максимум игроков</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              >
                <option value={2}>2 игрока</option>
                <option value={3}>3 игрока</option>
                <option value={4}>4 игрока</option>
                <option value={5}>5 игроков</option>
                <option value={6}>6 игроков</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={createRoomMutation.isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {createRoomMutation.isPending ? 'Создание...' : '✨ Создать игру'}
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