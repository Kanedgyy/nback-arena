'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/trpc';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const { data: room, isLoading } = trpc.room.get.useQuery({ roomId });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-2xl">Загрузка...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-2xl">Комната не найдена</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            {room.room.name}
          </h1>
          <p className="text-purple-200 text-center mb-6">
            ID сессии: <code className="bg-white/20 px-2 py-1 rounded text-sm">{roomId}</code>
          </p>

          {/* Информация о комнате */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between text-white/80">
              <span>N-Value:</span>
              <span className="font-semibold">{room.room.nValue}-Back</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Максимум игроков:</span>
              <span className="font-semibold">{room.room.maxPlayers}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Игроки:</span>
              <span className="font-semibold">{room.players.length}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Статус:</span>
              <span className="font-semibold">
                {room.room.isStarted ? '🔴 Идёт игра' : '🟢 Ожидание'}
              </span>
            </div>
          </div>

          {/* Список игроков */}
          <div className="mb-6">
            <h3 className="text-white/80 font-semibold mb-3">Игроки</h3>
            <div className="space-y-2">
              {room.players.map((player, idx) => (
                <div
                  key={player.id}
                  className="bg-white/5 rounded-lg p-3 flex justify-between items-center"
                >
                  <span className="text-white">
                    {idx === 0 && '👑 '}
                    Игрок {idx + 1}
                  </span>
                  <span className="text-white/60 text-sm">
                    ID: {player.userId.slice(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
            >
              ← Вернуться назад
            </button>

            <button
              onClick={() => {
                // TODO: Запуск игры
                alert('Запуск игры будет реализован позже');
              }}
              disabled={room.room.isStarted}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {room.room.isStarted ? 'Игра уже идёт' : '▶️ Начать игру'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
