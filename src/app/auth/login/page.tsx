'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'create';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const signInMutation = trpc.auth.signIn.useMutation({
    onSuccess: (data) => {
      console.log('Sign in success:', data);
      if (mode === 'create') {
        router.push('/create-room');
      } else {
        router.push('/join-room');
      }
    },
    onError: (error) => {
      console.error('Sign in error:', error);
      setError(error.message || 'Invalid email or password');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    signInMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
          <h1 className="text-3xl font-bold text-white text-center mb-2">🎮 N-Back Arena</h1>
          <p className="text-purple-200 text-center mb-8">Войдите, чтобы играть</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 mb-2 text-sm">Email адрес</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-white/80 mb-2 text-sm">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Введите пароль"
              />
            </div>

            <button
              type="submit"
              disabled={signInMutation.isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {signInMutation.isPending ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center text-white/70">
            Нет аккаунта?{' '}
            <Link href="/auth/register" className="text-pink-400 hover:text-pink-300 font-semibold">
              Зарегистрироваться
            </Link>
          </div>

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-2xl">Загрузка...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}