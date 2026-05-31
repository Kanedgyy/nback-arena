'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'games' | 'stats' | 'rules' | 'profile';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('games');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('nback_user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('nback_user');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-2xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🎮 N-Back Arena</h1>
          <div className="flex items-center gap-4">
            <span className="text-purple-200">Привет, {user.name}!</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 text-red-200 rounded-lg transition-all text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('games')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'games'
                  ? 'text-white border-pink-400'
                  : 'text-purple-300 border-transparent hover:text-white'
              }`}
            >
              🎯 Игры
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'stats'
                  ? 'text-white border-cyan-400'
                  : 'text-purple-300 border-transparent hover:text-white'
              }`}
            >
              📊 Статистика
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'rules'
                  ? 'text-white border-green-400'
                  : 'text-purple-300 border-transparent hover:text-white'
              }`}
            >
              📖 Правила
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'profile'
                  ? 'text-white border-yellow-400'
                  : 'text-purple-300 border-transparent hover:text-white'
              }`}
            >
              👤 Профиль
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'games' && (
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => router.push('/create-room')}
              className="group bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-8 hover:bg-white/20 hover:border-pink-400 transition-all duration-300 text-left"
            >
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-white mb-2">Создать новую игру</h2>
              <p className="text-purple-200">Создайте комнату и пригласите друзей</p>
            </button>

            <button
              onClick={() => router.push('/join-room')}
              className="group bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-8 hover:bg-white/20 hover:border-cyan-400 transition-all duration-300 text-left"
            >
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-white mb-2">Присоединиться</h2>
              <p className="text-purple-200">Введите ID сессии от друга</p>
            </button>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6">📊 Ваша статистика</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">🎮</div>
                <div className="text-3xl font-bold text-white">0</div>
                <div className="text-purple-200">Игр сыграно</div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-3xl font-bold text-white">0</div>
                <div className="text-purple-200">Побед</div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">⭐</div>
                <div className="text-3xl font-bold text-white">0</div>
                <div className="text-purple-200">Средний счёт</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6">📖 Правила игры</h2>
            <div className="space-y-6 text-purple-100">
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Что такое N-Back?</h3>
                <p>N-Back — это задача для тренировки рабочей памяти. Вам показывают последовательность стимулов (позиции на сетке), и вы должны определить, совпадает ли текущий стимул с тем, который был показан N шагов назад.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Как играть:</h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400">•</span>
                    <span>Каждые 2 секунды показывается новая позиция на сетке 3×3</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400">•</span>
                    <span>Нажимайте "Совпадение", если текущая позиция совпадает с позицией из N шагов назад</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400">•</span>
                    <span>Не нажимайте ничего, если совпадения нет</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400">•</span>
                    <span>Правильный ответ: +10 очков</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400">•</span>
                    <span>Ложное срабатывание: +1 ошибка</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Сложность:</h3>
                <p>N-Value определяет сложность игры. Например, при 2-Back вы должны сравнивать текущую позицию с позицией, которая была показана 2 шага назад.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6">👤 Ваш профиль</h2>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-purple-200 mb-1">Имя пользователя</div>
                <div className="text-2xl font-bold text-white">{user.name}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-purple-200 mb-1">Email</div>
                <div className="text-2xl font-bold text-white">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-400/50 text-red-200 font-bold rounded-xl transition-all"
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
