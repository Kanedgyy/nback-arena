# 🔧 Database Setup

## Настройка базы данных для N-Back Arena

### Локальная разработка

#### 1. Установите PostgreSQL (если нет)

**Windows:**
- Скачайте с [postgresql.org](https://www.postgresql.org/download/windows/)
- Или используйте Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt install postgresql
sudo systemctl start postgresql
```

#### 2. Создайте базу данных

```bash
# Войдите в PostgreSQL
psql -U postgres

# Создайте базу данных и пользователя
CREATE DATABASE nback_game;
CREATE USER nback_user WITH PASSWORD 'nback_password';
GRANT ALL PRIVILEGES ON DATABASE nback_game TO nback_user;
\q
```

#### 3. Настройте `.env.local`

```bash
# Скопируйте пример
cp .env.local.example .env.local
```

Отредактируйте `.env.local`:

```env
# Database (локальный PostgreSQL)
DATABASE_URL=postgresql://nback_user:nback_password@localhost:5432/nback_game

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here-change-in-production-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Game Settings
DEFAULT_N_VALUE=2
DEFAULT_STIMULUS_INTERVAL=1500
MAX_STIMULUS_SPEED=500
```

#### 4. Примените миграции

```bash
# Генерация миграций (если ещё не сгенерированы)
npm run db:generate

# Применение миграций к БД
npm run db:push
```

#### 5. Проверьте БД (опционально)

```bash
# Запуск Drizzle Studio (GUI для БД)
npm run db:studio
```

Откроется веб-интерфейс для просмотра таблиц и данных.

---

### Production (Neon PostgreSQL)

#### 1. Создайте базу данных на Neon

1. Перейдите на [console.neon.tech](https://console.neon.tech)
2. Создайте новый проект
3. Скопируйте **Connection String** из раздела **Connection Details**

#### 2. Настройте переменные окружения

В `.env.local` (для локального тестирования production БД):

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/nback_game?sslmode=require
BETTER_AUTH_SECRET=your-production-secret-key-min-32-chars
BETTER_AUTH_URL=https://your-app.vercel.app
```

#### 3. Примените миграции

```bash
npm run db:push
```

**Или через Neon SQL Editor:**

1. Откройте Neon Dashboard
2. Перейдите в **SQL Editor**
3. Миграции применятся автоматически при первом подключении

---

## Структура базы данных

### Таблицы аутентификации (Better Auth)

| Таблица | Описание | Колонки |
|---------|----------|---------|
| `users` | Пользователи | 8 (id, email, email_verified, name, image, password, createdAt, updatedAt) |
| `sessions` | Сессии пользователей | 8 (id, userId, expiresAt, token, ipAddress, userAgent, createdAt, updatedAt) |
| `accounts` | OAuth аккаунты | 13 (id, userId, accountId, providerId, accessToken, refreshToken, ...) |
| `verifications` | Верификации | 6 (id, identifier, value, expiresAt, createdAt, updatedAt) |

### Игровые таблицы

| Таблица | Описание | Колонки |
|---------|----------|---------|
| `rooms` | Игровые комнаты | 13 (id, name, hostId, nValue, maxPlayers, isStarted, isTournament, ...) |
| `room_players` | Игроки в комнате | 9 (id, roomId, userId, score, mistakes, isReady, isBot, botDifficulty, joinedAt) |
| `game_results` | Результаты игр | 9 (id, roomId, userId, score, mistakes, correctAnswers, finalSpeed, rank, completedAt) |

---

## Команды для работы с БД

```bash
# Применить миграции
npm run db:push

# Сгенерировать миграции
npm run db:generate

# Открыть Drizzle Studio
npm run db:studio

# Очистить БД (осторожно!)
npm run db:drop && npm run db:push
```

---

## Troubleshooting

### Ошибка: "Database does not exist"

**Решение:** Создайте базу данных перед применением миграций.

### Ошибка: "Connection refused"

**Решение:** Убедитесь, что PostgreSQL запущен:
```bash
# Windows (PowerShell)
Get-Service postgresql*

# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

### Ошибка: "Authentication failed"

**Решение:** Проверьте логин/пароль в `DATABASE_URL`.

### Ошибка: "SSL connection required"

**Решение:** Добавьте `?sslmode=require` к connection string (для Neon).

---

## Migration History

Миграции хранятся в папке `drizzle/`:

- `0000_*.sql` - Начальная схема (users, rooms, room_players, game_results)
- `0001_*.sql` - Обновления схемы
- `0002_*.sql` - Better Auth таблицы (sessions, accounts, verifications)

Для применения всех миграций используйте `npm run db:push`.
