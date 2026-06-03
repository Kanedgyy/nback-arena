'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc';

type Tab = 'games' | 'rules' | 'profile';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('games');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const utils = trpc.useUtils();

  useEffect(() => {
    const storedUser = localStorage.getItem('nback_user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('nback_user');
    utils.invalidate();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400"></div>
      <div className="absolute inset-0 bg-[pattern] opacity-10"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="relative backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎮</span>
            <h1 className="text-3xl font-black text-white tracking-tight">N-Back Arena</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-2xl">👤</span>
              <span className="text-white font-bold text-lg">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 transform hover:scale-105"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('games')}
              className={`px-8 py-5 font-bold text-lg transition-all duration-300 border-b-4 ${
                activeTab === 'games'
                  ? 'text-white border-pink-400 bg-white/10'
                  : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              🎯 Игры
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-8 py-5 font-bold text-lg transition-all duration-300 border-b-4 ${
                activeTab === 'rules'
                  ? 'text-white border-cyan-400 bg-white/10'
                  : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              📖 Правила
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-8 py-5 font-bold text-lg transition-all duration-300 border-b-4 ${
                activeTab === 'profile'
                  ? 'text-white border-rose-400 bg-white/10'
                  : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              👤 Профиль
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'games' && (
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => router.push('/create-room')}
              className="group backdrop-blur-xl bg-white/10 border-2 border-white/20 rounded-3xl p-8 hover:bg-white/20 hover:border-pink-400 transition-all duration-300 text-left transform hover:scale-[1.02] shadow-xl"
            >
              <div className="text-7xl mb-4 transform group-hover:scale-110 transition-transform">✨</div>
              <h2 className="text-3xl font-black text-white mb-3">Обычная игра</h2>
              <p className="text-white/80 text-lg">Создайте комнату и пригласите друзей</p>
              <div className="mt-4 flex items-center gap-2 text-pink-300 font-bold group-hover:text-pink-200">
                <span>Начать</span>
                <span className="text-xl">→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/create-room?tournament=1')}
              className="group backdrop-blur-xl bg-white/10 border-2 border-white/20 rounded-3xl p-8 hover:bg-white/20 hover:border-yellow-400 transition-all duration-300 text-left transform hover:scale-[1.02] shadow-xl"
            >
              <div className="text-7xl mb-4 transform group-hover:scale-110 transition-transform">🏆</div>
              <h2 className="text-3xl font-black text-white mb-3">Турнир</h2>
              <p className="text-white/80 text-lg">3 раунда: 1-Back → 2-Back → 3-Back</p>
              <div className="mt-4 flex items-center gap-2 text-yellow-300 font-bold group-hover:text-yellow-200">
                <span>Начать</span>
                <span className="text-xl">→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/join-room')}
              className="group backdrop-blur-xl bg-white/10 border-2 border-white/20 rounded-3xl p-8 hover:bg-white/20 hover:border-cyan-400 transition-all duration-300 text-left transform hover:scale-[1.02] shadow-xl md:col-span-2"
            >
              <div className="text-7xl mb-4 transform group-hover:scale-110 transition-transform">🚀</div>
              <h2 className="text-3xl font-black text-white mb-3">Присоединиться</h2>
              <p className="text-white/80 text-lg">Введите ID сессии от друга</p>
              <div className="mt-4 flex items-center gap-2 text-cyan-300 font-bold group-hover:text-cyan-200">
                <span>Войти</span>
                <span className="text-xl">→</span>
              </div>
            </button>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
            <h2 className="text-4xl font-black text-white mb-8">📖 Правила игры</h2>
            <div className="space-y-6 text-white/90 text-lg">
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Что такое N-Back?</h3>
                <p className="leading-relaxed">N-Back — это научная задача для тренировки рабочей памяти. Вам показывают последовательность позиций на сетке 3×3, и вы должны определить, совпадает ли текущая позиция с той, что была показана N шагов назад.</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Как играть:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">⚡</span>
                    <span>Каждые 2 секунды показывается новая позиция на сетке</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">👆</span>
                    <span>Нажимайте "Совпадает", если текущая позиция совпадает с позицией из N шагов назад</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <span>Правильный ответ: +10 очков</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">❌</span>
                    <span>Ложное срабатывание: +1 ошибка</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Сложность:</h3>
                <p className="leading-relaxed">N-Value определяет сложность. При 2-Back вы сравниваете с позицией 2 шага назад, при 3-Back — с позицией 3 шага назад и так далее.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border-2 border-white/20 shadow-2xl max-w-xl mx-auto">
            <h2 className="text-4xl font-black text-white mb-8 text-center">👤 Профиль</h2>
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-white/70 text-sm font-semibold mb-2">Имя пользователя</div>
                <div className="text-3xl font-black text-white">{user.name}</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-white/70 text-sm font-semibold mb-2">Email</div>
                <div className="text-2xl font-bold text-white">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black text-xl rounded-2xl transition-all duration-300 shadow-lg shadow-red-500/30 transform hover:scale-105"
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
