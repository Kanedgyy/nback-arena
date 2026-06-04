# 🔧 Точная миграция для Neon (с проверками)

## SQL скрипт для применения в Neon Dashboard

Этот скрипт проверяет существование объектов перед созданием:

```sql
-- ========================================
-- 1. Добавляем колонки в users (если нет)
-- ========================================
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

-- ========================================
-- 2. Создаём таблицу sessions (если нет)
-- ========================================
CREATE TABLE IF NOT EXISTS "sessions" (
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

-- ========================================
-- 3. Создаём таблицу accounts (если нет)
-- ========================================
CREATE TABLE IF NOT EXISTS "accounts" (
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

-- ========================================
-- 4. Создаём таблицу verifications (если нет)
-- ========================================
CREATE TABLE IF NOT EXISTS "verifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "identifier" varchar(255) NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ========================================
-- 5. Добавляем foreign keys (если нет)
-- ========================================
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

-- ========================================
-- 6. Проверка результатов
-- ========================================
-- Показать все колонки в users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Показать все таблицы
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## Как применить

1. Откройте **Neon Dashboard**: https://console.neon.tech
2. Выберите ваш проект
3. Нажмите **SQL Editor** (слева в меню)
4. Вставьте весь SQL скрипт выше
5. Нажмите **Run** (или Ctrl+Enter)

## Ожидаемый результат

Если всё успешно, вы увидите:
- ✅ Сообщение об успешном выполнении
- ✅ Список колонок таблицы `users` (должно быть 8 колонок)
- ✅ Список таблиц (должны быть: accounts, game_results, room_players, rooms, sessions, users, verifications)

## Проверка перед деплоем

Выполните этот запрос для проверки:

```sql
-- Проверка что все таблицы существуют
SELECT 
    'users' as table_name, 
    COUNT(*) as column_count 
FROM information_schema.columns WHERE table_name = 'users'
UNION ALL
SELECT 'sessions', COUNT(*) FROM information_schema.columns WHERE table_name = 'sessions'
UNION ALL
SELECT 'accounts', COUNT(*) FROM information_schema.columns WHERE table_name = 'accounts'
UNION ALL
SELECT 'verifications', COUNT(*) FROM information_schema.columns WHERE table_name = 'verifications';
```

**Ожидаемый результат:**
```
table_name    | column_count
--------------|-------------
users         | 8
sessions      | 8
accounts      | 13
verifications | 6
```

## После применения

1. ✅ Сделайте **Redeploy** на Vercel
2. ✅ Попробуйте зарегистрироваться/войти
3. ✅ Проверьте Vercel Function Logs

---

**Примечание:** Если видите сообщения о том, что объекты уже существуют - это нормально, скрипт создан с защитой от повторного применения.
