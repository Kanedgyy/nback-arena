'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc';

function CreateRoomForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTournament = searchParams.get('tournament') === '1';

  const [roomName, setRoomName] = useState('');
  const [nValue, setNValue] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isTournament) {
      setRoomName('🏆 Турнир');
    }
  }, [isTournament]);

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
      nValue: isTournament ? 1 : nValue,
      maxPlayers,
      isTournament,
    });
  };

  return (
    <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
          <h1 className="text-4xl font-black text-white text-center mb-3">
            {isTournament ? '🏆 Создать турнир' : '✨ Создать игру'}
          </h1>
          <p className="text-white/80 text-center mb-8 text-lg">
            {isTournament 
              ? '3 раунда: 1-Back → 2-Back → 3-Back' 
              : 'Настройте параметры игры'}
          </p>

          {error && (
            <div className="mb-5 p-4 bg-red-500/20 border-2 border-red-400/50 rounded-2xl text-white font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/90 mb-3 text-base font-semibold">Название комнаты</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder={isTournament ? '🏆 Турнир' : 'Моя крутая игра'}
                className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-lg placeholder-white/40 focus:ring-4 focus:ring-pink-400/30 focus:border-pink-400 transition-all"
              />
            </div>

            {!isTournament && (
              <div>
                <label className="block text-white/90 mb-3 text-base font-semibold">N-Value (сложность)</label>
                <select
                  value={nValue}
                  onChange={(e) => setNValue(Number(e.target.value))}
                  className="w-full px-5 py-4 bg-cyan-900/90 border-2 border-white/20 rounded-xl text-white text-lg font-semibold focus:ring-4 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all cursor-pointer"
                >
                  <option value={1} style={{ backgroundColor: '#1e3a5f', color: 'white' }}>1-Back (Легко)</option>
                  <option value={2} style={{ backgroundColor: '#1e3a5f', color: 'white' }}>2-Back (Средне)</option>
                  <option value={3} style={{ backgroundColor: '#1e3a5f', color: 'white' }}>3-Back (Сложно)</option>
                  <option value={4} style={{ backgroundColor: '#1e3a5f', color: 'white' }}>4-Back (Эксперт)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-white/90 mb-3 text-base font-semibold">Максимум игроков</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-5 py-4 bg-rose-900/90 border-2 border-white/20 rounded-xl text-white text-lg font-semibold focus:ring-4 focus:ring-rose-400/30 focus:border-rose-400 transition-all cursor-pointer"
              >
                <option value={2} style={{ backgroundColor: '#1e3a5f', color: 'white' }}>2 игрока</option>
                <option value={3} style={{ backgroundColor: '#1e3a5f', color: 'white' }}>3 игрока</option>
                <option value={4} style={{ backgroundColor: '#1e3a5f', color: 'white' }}>4 игрока</option>
                <option value={5} style={{ backgroundColor: '#1e3a5f', color: 'white' }}>5 игроков</option>
                <option value={6} style={{ backgroundColor: '#1e3a5f', color: 'white' }}>6 игроков</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={createRoomMutation.isPending}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 via-rose-500 to-cyan-500 hover:from-pink-400 hover:via-rose-400 hover:to-cyan-400 text-white font-black text-xl rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-xl"
            >
              {createRoomMutation.isPending 
                ? '⏳ Создание...' 
                : isTournament 
                  ? '🏆 Создать турнир' 
                  : '✨ Создать игру'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/dashboard" className="inline-block text-white/80 hover:text-white text-base font-semibold transition-all">
              ← Вернуться назад
            </Link>
          </div>
        </div>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 animate-gradient-xy"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10">
        <Suspense fallback={
          <div className="text-white text-3xl font-bold animate-pulse">Загрузка...</div>
        }>
          <CreateRoomForm />
        </Suspense>
      </div>
    </div>
  );
}