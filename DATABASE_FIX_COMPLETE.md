# 🔧 ПОЛНОЕ ИСПРАВЛЕНИЕ БАЗЫ ДАННЫХ

## Проблема

Таблица `sessions` существует, но **не имеет колонки `token`**. Это критическая ошибка схемы.

## Решение - Полная пересоздание таблиц better-auth

### ⚠️ ВАЖНО: Сначала сделайте backup!

В Neon Dashboard:
1. Откройте ваш проект
2. **Settings** → **Backups** → **Create Backup**

Или экспортируйте данные:
```sql
-- Экспорт пользователей (если есть важные данные)
COPY users TO STDOUT WITH CSV HEADER;
```

---

## Шаг 1: Проверка текущей структуры

Выполните этот запрос, чтобы увидеть проблему:

```sql
-- Проверить структуру sessions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;
```

**Ожидаемый результат (8 колонок):**
```
id | uuid | NO
user_id | uuid | NO
expires_at | timestamp | NO
token | varchar | NO  ← ЭТОЙ КОЛОНКИ НЕТ!
ip_address | varchar | YES
user_agent | varchar | YES
created_at | timestamp | NO
updated_at | timestamp | NO
```

---

## Шаг 2: Полное исправление (выполнить в SQL Editor)

```sql
-- ============================================
-- 1. Удаляем старые таблицы (если есть)
-- ============================================
DROP TABLE IF EXISTS "verifications" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;

-- ============================================
-- 2. Проверяем/добавляем колонки в users
-- ============================================
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'image') THEN
        ALTER TABLE "users" ADD COLUMN "image" varchar(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE "users" ADD COLUMN "password" varchar(255);
    END IF;
END $$;

-- ============================================
-- 3. Создаём таблицу sessions ПРАВИЛЬНО
-- ============================================
CREATE TABLE "sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "expires_at" timestamp NOT NULL,
    "token" varchar(255) NOT NULL,
    "ip_address" varchar(255),
    "user_agent" varchar(255),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "sessions_token_unique" UNIQUE("token")
);

-- ============================================
-- 4. Создаём таблицу accounts
-- ============================================
CREATE TABLE "accounts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "account_id" varchar(255) NOT NULL,
    "provider_id" varchar(255) NOT NULL,
    "access_token" text,
    "refresh_token" text,
    "access_token_expires_at" timestamp,
    "refresh_token_expires_at" timestamp,
    "scope" text,
    "id_token" text,
    "password" varchar(255),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- 5. Создаём таблицу verifications
-- ============================================
CREATE TABLE "verifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "identifier" varchar(255) NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- 6. Добавляем foreign keys
-- ============================================
DO $$ 
BEGIN 
    -- FK для accounts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_user_id_users_id_fk' 
        AND table_name = 'accounts'
    ) THEN
        ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
            ON DELETE cascade;
    END IF;
    
    -- FK для sessions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sessions_user_id_users_id_fk' 
        AND table_name = 'sessions'
    ) THEN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
            ON DELETE cascade;
    END IF;
END $$;

-- ============================================
-- 7. ФИНАЛЬНАЯ ПРОВЕРКА
-- ============================================
-- Показать все колонки sessions
SELECT 'sessions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- Показать количество строк в каждой таблице
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'verifications', COUNT(*) FROM verifications;
```

---

## Шаг 3: Проверка успеха

После выполнения SQL, проверьте:

```sql
-- Должно быть 8 колонок
SELECT COUNT(*) as session_columns
FROM information_schema.columns 
WHERE table_name = 'sessions';

-- Должно быть 4 таблицы
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'sessions', 'accounts', 'verifications')
ORDER BY table_name;
```

**Ожидаемый результат:**
```
session_columns = 8 ✅
```

```
table_name
-----------
accounts
sessions
users
verifications
```

---

## Шаг 4: Redeploy на Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Ваш проект → **Deployments**
3. Нажмите **Redeploy** на последнем деплое

---

## Шаг 5: Тестирование

После деплоя:
1. Попробуйте зарегистрироваться с новым email
2. Проверьте Vercel Function Logs
3. Ошибок не должно быть!

---

## 🔍 Диагностика проблем

### Если ошибка "relation does not exist"

Таблицы не созданы. Выполните SQL скрипт выше ещё раз.

### Если ошибка "foreign key violation"

Foreign keys не добавлены. Проверьте:

```sql
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_name IN ('sessions', 'accounts');
```

Должно быть 2 записи.

### Если ошибка "column does not exist"

Колонки не добавлены. Проверьте структуру:

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('users', 'sessions', 'accounts', 'verifications')
ORDER BY table_name, ordinal_position;
```

---

## 📞 Если что-то пошло не так

1. Сделайте скриншот ошибки из Neon SQL Editor
2. Проверьте Vercel Function Logs
3. Убедитесь, что все 4 таблицы существуют с правильными колонками
