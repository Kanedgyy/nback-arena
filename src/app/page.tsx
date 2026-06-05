'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 animate-gradient-xy"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-rose-400/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-xl w-full">
          {/* Logo and title */}
          <div className="text-center mb-10">
            <div className="inline-block mb-6 animate-bounce">
              <span className="text-8xl drop-shadow-2xl">🎮</span>
            </div>
            <h1 className="text-6xl font-black text-white mb-3 tracking-tight drop-shadow-lg"
                style={{ textShadow: '0 0 40px rgba(255,100,150,0.5)' }}>
              N-Back Arena
            </h1>
            <p className="text-xl text-white/90 font-medium tracking-wide">
              Тренируй память в формате мультиплеера
            </p>
          </div>

          {/* Glass card */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl"
               style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            {/* Mode toggle */}
            <div className="flex gap-3 mb-8 p-1.5 bg-white/10 rounded-2xl border border-white/10">
              <button
                onClick={() => setIsLoginMode(false)}
                className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${
                  !isLoginMode
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg scale-105'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Регистрация
              </button>
              <button
                onClick={() => setIsLoginMode(true)}
                className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${
                  isLoginMode
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg scale-105'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Вход
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-2xl text-white backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLoginMode && (
                <>
                  <div>
                    <label className="block text-white/90 mb-2 text-sm font-semibold tracking-wide">
                      Имя пользователя
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={20}
                      placeholder="Придумайте имя"
                      className="w-full px-5 py-4 bg-white/15 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2 text-sm font-semibold tracking-wide">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="w-full px-5 py-4 bg-white/15 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                    />
                  </div>
                </>
              )}

              {isLoginMode && (
                <div>
                  <label className="block text-white/90 mb-2 text-sm font-semibold tracking-wide">
                    Email или Имя
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email или имя"
                    className="w-full px-5 py-4 bg-white/15 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-white/90 mb-2 text-sm font-semibold tracking-wide">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={isLoginMode ? 'Введите пароль' : 'Минимум 6 символов'}
                  className="w-full px-5 py-4 bg-white/15 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoginMode ? signInMutation.isPending : signUpMutation.isPending}
                className={`w-full py-4 px-6 font-black text-lg rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] ${
                  isLoginMode
                    ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 hover:from-cyan-400 hover:via-teal-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/30'
                    : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:via-rose-400 hover:to-pink-500 shadow-lg shadow-pink-500/30'
                } text-white`}
              >
                {isLoginMode
                  ? (signInMutation.isPending ? '🔐 Вход...' : '🔐 Войти')
                  : (signUpMutation.isPending ? '✨ Регистрация...' : '✨ Создать аккаунт')}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-white/70 text-sm">
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">Загрузка...</div>
      </div>
    }>
      <AuthPage />
    </Suspense>
  );
}
