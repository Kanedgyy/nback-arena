# 🎮 N-Back Arena

Соревновательный тренажёр N-back с влиянием ошибок на скорость игры.

## 🚀 Технологический стек

- **TypeScript** - строгая типизация
- **Next.js 16** (App Router) - фреймворк
- **tRPC** - type-safe API с SSE subscriptions для real-time
- **Drizzle ORM** - ORM для PostgreSQL
- **Better Auth** - аутентификация с кастомным адаптером
- **PostgreSQL** (Neon) - база данных
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
│   │       └── nback-engine.ts # Ядро игры
│   └── context.ts              # tRPC контекст с auth
│   └── trpc.ts                 # tRPC клиент
├── drizzle/                    # Миграции БД
├── tests/                      # Юнит-тесты
└── ...
```

## 📚 Документация

- [README.md](./README.md) - Основная документация
- [QUICKSTART.md](./QUICKSTART.md) - Быстрый старт
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Деплой на Vercel
- [TESTING.md](./TESTING.md) - Тестирование

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

- `game.onGameUpdate` - Subscription для real-time обновлений игры (SSE)
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
- **tRPC**: Type-safe, эндпоинты выводятся из кода, меньше бандл, встроенные subscriptions
- **GraphQL**: Больше оверхеда, нужен schema-first подход
- **REST**: Нет type-safety на клиенте
- **Выбор**: tRPC - идеально для TypeScript проектов с real-time потребностями

#### SSE vs WebSocket vs Socket.io
- **SSE (Server-Sent Events)**: Проще, работает через HTTP, автоматический переподключение, идеально для Vercel
- **WebSocket**: Двусторонняя связь, но сложнее деплой на serverless
- **Socket.io**: Много функций, но тяжёлый
- **Выбор**: SSE через tRPC subscriptions - работает на Vercel без проблем

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

### Таблицы аутентификации (Better Auth)

#### `users`
- `id` (uuid) - уникальный идентификатор
- `email` (varchar) - email пользователя
- `email_verified` (boolean) - подтверждён ли email
- `name` (varchar) - имя пользователя
- `image` (varchar) - URL аватара
- `password` (varchar) - хеш пароля
- `createdAt` (timestamp) - дата создания
- `updatedAt` (timestamp) - дата обновления

#### `sessions`
- `id` (uuid) - уникальный идентификатор сессии
- `userId` (uuid) - ссылка на пользователя
- `expiresAt` (timestamp) - дата истечения сессии
- `token` (varchar) - токен сессии
- `ipAddress` (varchar) - IP адрес
- `userAgent` (varchar) - User-Agent браузера
- `createdAt` (timestamp) - дата создания
- `updatedAt` (timestamp) - дата обновления

#### `accounts`
- `id` (uuid) - уникальный идентификатор
- `userId` (uuid) - ссылка на пользователя
- `accountId` (varchar) - ID аккаунта в провайдере
- `providerId` (varchar) - ID провайдера (google, github, etc.)
- `accessToken` (text) - access token
- `refreshToken` (text) - refresh token
- `accessTokenExpiresAt` (timestamp)
- `refreshTokenExpiresAt` (timestamp)
- `scope` (text) - permissions scope
- `idToken` (text) - id token для OIDC
- `password` (varchar) - хеш пароля (для email/password провайдера)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### `verifications`
- `id` (uuid) - уникальный идентификатор
- `identifier` (varchar) - идентификатор (email, phone)
- `value` (text) - значение для верификации
- `expiresAt` (timestamp) - дата истечения
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Игровые таблицы

#### `rooms`
- `id` (uuid) - уникальный идентификатор комнаты
- `name` (varchar) - название комнаты
- `hostId` (uuid) - создатель комнаты
- `nValue` (integer) - N-значение для игры
- `maxPlayers` (integer) - максимальное количество игроков
- `isStarted` (boolean) - началась ли игра
- `isTournament` (boolean) - турнирный режим
- `tournamentRound` (integer) - текущий раунд турнира
- `tournamentTotalRounds` (integer) - всего раундов в турнире
- `tournamentResultsJson` (text) - результаты турнира (JSON)
- `gameStateJson` (text) - состояние игры (JSON)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### `room_players`
- `id` (uuid) - уникальный идентификатор
- `roomId` (uuid) - ссылка на комнату
- `userId` (uuid) - ссылка на игрока
- `score` (integer) - текущий счёт
- `mistakes` (integer) - количество ошибок
- `isReady` (boolean) - готов ли игрок
- `isBot` (boolean) - бот ли это
- `botDifficulty` (integer) - сложность бота (1-3)
- `joinedAt` (timestamp) - дата присоединения

#### `game_results`
- `id` (uuid) - уникальный идентификатор
- `roomId` (uuid) - ссылка на комнату
- `userId` (uuid) - ссылка на игрока
- `score` (integer) - финальный счёт
- `mistakes` (integer) - количество ошибок
- `correctAnswers` (integer) - правильных ответов
- `finalSpeed` (integer) - финальная скорость (мс)
- `rank` (integer) - место в игре
- `completedAt` (timestamp) - дата завершения

## 🚀 Деплой

### Vercel

1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения
3. Настройте Neon PostgreSQL
4. Деплой

**Примечание**: tRPC SSE subscriptions работают на Vercel без дополнительных настроек.

## 🐛 Known Issues

- In-memory room states - для production нужен Redis для масштабирования

## 📝 License

MIT

## 👨‍💻 Авторы

Разработано как учебный проект для демонстрации fullstack архитектуры.
