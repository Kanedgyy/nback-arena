'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc';

function AuthPage() {
  const router = useRouter();
  
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const signInMutation = trpc.auth.signIn.useMutation({
    onSuccess: (data) => {
      console.log('Sign in success:', data);
      localStorage.setItem('nback_user', JSON.stringify({ name: data.user.name || 'Игрок', email: data.user.email }));
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Sign in error:', error);
      setError(error.message || 'Invalid email or password');
    },
  });

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: (data) => {
      console.log('Sign up success:', data);
      localStorage.setItem('nback_user', JSON.stringify({ name: data.user.name || 'Игрок', email: data.user.email }));
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Sign up error:', error);
      setError(error.message || 'Registration failed');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLoginMode) {
      signInMutation.mutate({ email, password });
    } else {
      signUpMutation.mutate({ email, password, name });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">🎮 N-Back Arena</h1>
          <p className="text-xl text-purple-200">Multiplayer N-Back Training Game</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Информация об игре */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">📖 Как играть?</h2>
            <ul className="space-y-3 text-purple-200">
              <li className="flex items-start gap-3">
                <span className="text-2xl">•</span>
                <span>Запомните последовательность стимулов</span>
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

          {/* Форма входа/регистрации */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
            {/* Переключатель режимов */}
            <div className="flex gap-2 mb-6 p-1 bg-white/10 rounded-xl">
              <button
                onClick={() => setIsLoginMode(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  !isLoginMode
                    ? 'bg-pink-500 text-white'
                    : 'text-purple-200 hover:bg-white/10'
                }`}
              >
                Регистрация
              </button>
              <button
                onClick={() => setIsLoginMode(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  isLoginMode
                    ? 'bg-cyan-500 text-white'
                    : 'text-purple-200 hover:bg-white/10'
                }`}
              >
                Вход
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-purple-200 mb-2 text-sm font-semibold">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={20}
                    placeholder="Ваше имя"
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:border-pink-400 focus:outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-purple-200 mb-2 text-sm font-semibold">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:border-pink-400 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2 text-sm font-semibold">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={isLoginMode ? 'Введите пароль' : 'Минимум 6 символов'}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:border-pink-400 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoginMode ? signInMutation.isPending : signUpMutation.isPending}
                className={`w-full py-3 px-4 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLoginMode
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                } text-white shadow-lg`}
              >
                {isLoginMode
                  ? (signInMutation.isPending ? 'Вход...' : '🔐 Войти')
                  : (signUpMutation.isPending ? 'Регистрация...' : '✨ Создать аккаунт')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-purple-200 text-sm">
                После авторизации вы сможете создать комнату или присоединиться к игре
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-2xl">Загрузка...</div>
      </div>
    }>
      <AuthPage />
    </Suspense>
  );
}
