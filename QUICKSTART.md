# 🚀 Quick Start Guide

## Быстрый старт проекта N-Back Arena

### 1. Установка зависимостей

```bash
cd nback-game
npm install
```

### 2. Настройка окружения

Скопируйте `.env.local.example` в `.env.local` и заполните значения:

```bash
cp .env.local.example .env.local
```

Затем отредактируйте `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nback_game
BETTER_AUTH_SECRET=your-secret-key-here-change-in-production
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Инициализация базы данных

```bash
# Генерация миграций (если ещё не сгенерированы)
npm run db:generate

# Применение миграций к БД
npm run db:push
```

### 4. Запуск разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### 5. Запуск тестов

```bash
# Все тесты
npm run test

# Один раз
npm run test:run

# С coverage
npm run test:coverage
```

## 📂 Структура проекта

```
nback-game/
├── src/
│   ├── app/                      # Страницы Next.js
│   │   ├── api/trpc/             # tRPC endpoint (HTTP + SSE)
│   │   ├── room/[roomId]/        # Страница комнаты
│   │   ├── dashboard/            # Дашборд
│   │   └── page.tsx              # Главная
│   ├── components/               # React компоненты
│   │   ├── GameGrid.tsx          # Сетка 3×3
│   │   ├── PlayerStats.tsx       # Статистика
│   │   ├── GameControls.tsx      # Управление
│   │   └── TrpcProvider.tsx      # tRPC провайдер (с SSE support)
│   ├── server/
│   │   ├── api/                  # tRPC routers
│   │   │   ├── routers/
│   │   │   │   ├── game.ts       # Игровой router с subscriptions
│   │   │   │   └── room.ts       # Комнатный router
│   │   │   ├── root.ts           # Корневой router
│   │   │   └── trpc.ts           # tRPC конфигурация (SSE)
│   │   ├── auth/                 # Better Auth с кастомным адаптером
│   │   ├── db/
│   │   │   ├── schema.ts         # Схема БД
│   │   │   └── index.ts          # Клиент БД
│   │   ├── game/
│   │   │   └── nback-engine.ts   # Ядро игры
│   │   └── context.ts            # tRPC контекст с auth
│   ├── hooks/
│   │   └── useAuth.ts            # Auth hook
│   └── trpc.ts                   # tRPC клиент (с SSE support)
├── drizzle/                      # Миграции
├── tests/                        # Юнит-тесты
└── package.json
```

## 🎮 Основные файлы

### Игровая логика
- `src/server/game/nback-engine.ts` - Ядро игры (генерация, проверка ответов, scoring)

### API
- `src/server/api/routers/room.ts` - Управление комнатами
- `src/server/api/routers/game.ts` - Игровые операции

### UI
- `src/app/page.tsx` - Главная страница (auth + создание комнат)
- `src/app/room/[roomId]/page.tsx` - Страница игры
- `src/components/` - UI компоненты

## 🔧 Команды

```bash
npm run dev          # Запуск разработки
npm run build        # Сборка для production
npm run start        # Запуск production сервера
npm run lint         # Проверка кода
npm run test         # Запуск тестов
npm run db:generate  # Генерация миграций
npm run db:push      # Применение миграций
npm run db:studio    # Drizzle Studio (GUI для БД)
```

## 🐛 Troubleshooting

### Проблемы с базой данных
```bash
# Пересоздать миграции
rm -rf drizzle/*.sql
npm run db:generate
npm run db:push
```

### Ошибки TypeScript
```bash
# Очистка кеша
rm -rf .next
npm run dev
```

### Проблемы с зависимостями
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Дополнительные ресурсы

- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🎯 Следующие шаги

1. Подключите реальную базу данных (Neon PostgreSQL)
2. Настройте аутентификацию Better Auth
3. Разверните на Vercel - SSE subscriptions работают из коробки

Удачи в разработке! 🚀
