# 🎮 N-Back Arena

Соревновательный тренажёр N-back с влиянием ошибок на скорость игры.

## 🚀 Технологический стек

- **TypeScript** - строгая типизация
- **Next.js 16** (App Router) - фреймворк
- **tRPC** - type-safe API
- **Drizzle ORM** - ORM для PostgreSQL
- **Better Auth** - аутентификация
- **PostgreSQL** (Neon) - база данных
- **WebSocket** (ws) - real-time коммуникация
- **Vitest** - тестирование

## 🎯 Описание игры

### Основная механика
- Игроки видят последовательность позиций в сетке 3×3
- Нужно нажать «Совпадает», если текущая позиция совпадает с позицией N шагов назад
- N - параметр сложности (1-4)

### Многопользовательский режим
- 2-4 игрока в одной комнате
- Последовательность генерируется на сервере (одна для всех)
- Ответы проверяются сервером
- **Механика влияния ошибок**: каждые 3 ошибки любого игрока → увеличение скорости для всех
- Побеждает игрок с наибольшим количеством правильных ответов

### Боты
- Настраиваемая точность (0-100%)
- Могут играть вместо человека или как дополнительные игроки

## 🏗️ Архитектура

```
nback-game/
├── src/
│   ├── app/                    # Next.js App Router страницы
│   │   ├── api/trpc/           # tRPC endpoint
│   │   ├── room/[roomId]/      # Страница комнаты
│   │   ├── dashboard/          # Дашборд пользователя
│   │   └── page.tsx            # Главная страница
│   ├── components/             # React компоненты
│   │   ├── GameGrid.tsx        # Сетка 3×3
│   │   ├── PlayerStats.tsx     # Статистика игрока
│   │   └── GameControls.tsx    # Кнопки управления
│   ├── server/
│   │   ├── api/                # tRPC routers
│   │   │   ├── routers/        # Рутеры для room, game
│   │   │   └── root.ts         # Корневой рутер
│   │   ├── auth/               # Better Auth конфигурация
│   │   ├── db/                 # Drizzle ORM
│   │   │   ├── schema.ts       # Схема БД
│   │   │   └── index.ts        # Клиент БД
│   │   └── game/               # Игровая логика
│   │       ├── nback-engine.ts # Ядро игры
│   │       └── websocket.ts    # WebSocket сервер
│   └── trpc.ts                 # tRPC клиент
├── drizzle/                    # Миграции БД
├── tests/                      # Юнит-тесты
└── ...
```

## 📦 Установка

### Требования
- Node.js 20+
- PostgreSQL (локально или Neon)

### 1. Клонирование и установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Создайте `.env.local`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/nback_game

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# Game Settings
DEFAULT_N_VALUE=2
DEFAULT_STIMULUS_INTERVAL=1500
MAX_STIMULUS_SPEED=500
```

### 3. Инициализация базы данных

```bash
# Генерация миграций
npm run db:generate

# Применение миграций
npm run db:push

# Или через Drizzle Studio (опционально)
npm run db:studio
```

### 4. Запуск разработки

```bash
npm run dev
```

Приложение доступно по адресу `http://localhost:3000`

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm run test

# Запуск с watch mode
npm run test:run

# Coverage
npm run test:coverage
```

## 📚 API Endpoints (tRPC)

### Room Router

- `room.create` - Создать комнату
- `room.join` - Присоединиться к комнате
- `room.leave` - Покинуть комнату
- `room.get` - Получить информацию о комнате
- `room.addBot` - Добавить бота
- `room.start` - Начать игру

### Game Router

- `game.submitAnswer` - Отправить ответ
- `game.nextStimulus` - Перейти к следующему стимулу
- `game.getCurrentState` - Получить текущее состояние игры
- `game.getResults` - Получить результаты игры

## 🎮 Настройки игры

### Константы (в `nback-engine.ts`)

```typescript
const DEFAULT_CONFIG: GameConfig = {
  nValue: 2,              // N-значение по умолчанию
  totalStimuli: 30,       // Количество стимулов в раунде
  baseInterval: 1500,     // Базовый интервал (мс)
  speedStep: 300,         // Уменьшение интервала на уровень
  maxSpeedLevel: 5,       // Максимальный уровень скорости
  mistakesForSpeedUp: 3,  // Ошибки для увеличения скорости
};
```

## 🔧 Библиотеки

### Почему выбрана каждая библиотека:

#### tRPC vs GraphQL vs REST
- **tRPC**: Type-safe, эндпоинты выводятся из кода, меньше бандл
- **GraphQL**: Больше оверхеда, нужен schema-first подход
- **REST**: Нет type-safety на клиенте
- **Выбор**: tRPC - идеально для TypeScript проектов

#### Drizzle vs Prisma vs Kysely
- **Drizzle**: Лёгкий, SQL-like синтаксис, отличная производительность
- **Prisma**: Больше оверхеда, тяжёлый runtime
- **Kysely**: Только query builder, нет миграций из коробки
- **Выбор**: Drizzle - баланс между функциональностью и простотой

#### Better Auth vs NextAuth vs Clerk
- **Better Auth**: Современный, лёгкий, встроенная поддержка БД
- **NextAuth (Auth.js)**: Сложнее настройка, больше зависимостей
- **Clerk**: SaaS решение, меньше контроля
- **Выбор**: Better Auth - простой и мощный

#### ws vs Socket.io vs Pusher
- **ws**: Минималистичный, быстрый, нет оверхеда
- **Socket.io**: Много функций, но тяжёлый
- **Pusher**: SaaS, платный при масштабе
- **Выбор**: ws - достаточно для простой real-time логики

## 🏆 Как играть

1. **Создайте комнату** на главной странице
2. **Пригласите друзей** (поделитесь room ID)
3. **Добавьте ботов** (опционально) для заполнения мест
4. **Начните игру** (только хост)
5. **Нажимайте кнопки**:
   - ✓ **Match** - если позиция совпадает с N шагов назад
   - ❌ **No Match** - если не совпадает
6. **Побеждает** игрок с наибольшим количеством правильных ответов

## 🤖 Боты

Боты имеют настраиваемую точность (0-100%):
- **100%** - Идеальный игрок (не пропустит ни одного совпадения)
- **80%** - Хороший игрок (иногда ошибается)
- **50%** - Случайные ответы
- **20%** - Плохой игрок (часто ошибается)

## 📊 Схема БД

### Таблицы

#### `users`
- id, email, name, createdAt, updatedAt

#### `rooms`
- id, name, hostId, nValue, maxPlayers, isStarted, createdAt, updatedAt

#### `room_players`
- id, roomId, userId, score, mistakes, isReady, joinedAt

#### `game_results`
- id, roomId, userId, score, mistakes, correctAnswers, finalSpeed, rank, completedAt

## 🚀 Деплой

### Vercel

1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения
3. Настройте Neon PostgreSQL
4. Деплой

### WebSocket на Vercel

**Важно**: Vercel не поддерживает постоянные WebSocket соединения. Для production:
- Используйте **Vercel Edge Functions** для HTTP
- Вынесите WebSocket на отдельный сервер (Railway, Render, DigitalOcean)
- Или используйте **Pusher** / **Ably** как managed solution

## 🐛 Known Issues

- WebSocket сервер работает отдельно от Next.js (нужен отдельный порт 8080)
- В development mode используйте оба сервера (Next.js + WebSocket)

## 📝 License

MIT

## 👨‍💻 Авторы

Разработано как учебный проект для демонстрации fullstack архитектуры.
