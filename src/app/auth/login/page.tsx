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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 animate-gradient-xy"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 w-full max-w-md p-4">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
          <h1 className="text-4xl font-black text-white text-center mb-3">🎮 N-Back Arena</h1>
          <p className="text-white/80 text-center mb-8 text-lg">Войдите, чтобы играть</p>

          {error && (
            <div className="mb-5 p-4 bg-red-500/20 border-2 border-red-400/50 rounded-2xl text-white font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/90 mb-3 text-base font-semibold">Email или Имя</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-lg placeholder-white/40 focus:ring-4 focus:ring-pink-400/30 focus:border-pink-400 transition-all"
                placeholder="example@email.com или username"
              />
            </div>

            <div>
              <label className="block text-white/90 mb-3 text-base font-semibold">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-lg placeholder-white/40 focus:ring-4 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
                placeholder="Введите пароль"
              />
            </div>

            <button
              type="submit"
              disabled={signInMutation.isPending}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 via-rose-500 to-cyan-500 hover:from-pink-400 hover:via-rose-400 hover:to-cyan-400 text-white font-black text-xl rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-xl"
            >
              {signInMutation.isPending ? '⏳ Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-8 text-center text-white/90 text-base">
            Нет аккаунта?{' '}
            <Link href="/auth/register" className="text-cyan-300 hover:text-cyan-200 font-bold underline">
              Зарегистрироваться
            </Link>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="inline-block text-white/80 hover:text-white text-base font-semibold transition-all">
              ← Вернуться на главную
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
      <div className="min-h-screen bg-gradient-to-br from-pink-600 via-rose-500 to-cyan-400 flex items-center justify-center">
        <div className="text-white text-3xl font-bold animate-pulse">Загрузка...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}