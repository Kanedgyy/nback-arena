'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">🎮 N-Back Arena</h1>
          <p className="text-xl text-purple-200">Multiplayer N-Back Training Game</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Создать игру */}
          <Link
            href="/auth/login?mode=create"
            className="group block bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-8 hover:bg-white/20 hover:border-pink-400 transition-all duration-300"
          >
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-white mb-2">Создать новую игру</h2>
            <p className="text-purple-200">Создайте комнату и пригласите друзей</p>
          </Link>

          {/* Присоединиться */}
          <Link
            href="/auth/login?mode=join"
            className="group block bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-8 hover:bg-white/20 hover:border-cyan-400 transition-all duration-300"
          >
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-white mb-2">Присоединиться</h2>
            <p className="text-purple-200">Введите ID сессии от друга</p>
          </Link>
        </div>

        {/* Инструкция */}
        <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">📖 Как играть?</h3>
          <ul className="space-y-3 text-purple-200">
            <li className="flex items-start gap-3">
              <span className="text-2xl">•</span>
              <span>Запомните последовательность стимулов (буквы/звуки)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">•</span>
              <span>Отвечайте, когда текущий стимул совпадает с N-ным предыдущим</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">•</span>
              <span>Соревнуйтесь с друзьями в реальном времени</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">•</span>
              <span>Побеждает тот, кто сделает меньше ошибок</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
