'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc';

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: (data) => {
      console.log('Sign up success:', data);
      router.push('/create-room');
    },
    onError: (error) => {
      console.error('Sign up error:', error);
      setError(error.message || 'Registration failed');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    signUpMutation.mutate({ email, password, name });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
          <h1 className="text-3xl font-bold text-white text-center mb-2">🎮 Филворд</h1>
          <p className="text-purple-200 text-center mb-8">Создайте аккаунт для игры</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 mb-2 text-sm">Имя пользователя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={20}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Ваше имя"
              />
            </div>

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
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Минимум 6 символов"
              />
            </div>

            <button
              type="submit"
              disabled={signUpMutation.isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {signUpMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 text-center text-white/70">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="text-pink-400 hover:text-pink-300 font-semibold">
              Войти
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