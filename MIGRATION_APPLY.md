# 🔧 Применение миграций на Vercel/Neon

## Проблема

На Vercel в логах ошибка:
```
column "email_verified" does not exist
```

Это означает, что миграции не применены к базе данных.

## Решение

### Способ 1: Автоматическое применение через Drizzle Kit (рекомендуется)

1. Откройте **Neon Dashboard**: https://console.neon.tech
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Скопируйте содержимое файла `drizzle/0002_overjoyed_robin_chapel.sql`
5. Выполните SQL скрипт

Или используйте команду:

```bash
npm run db:push
```

Но для этого нужно установить соединение с Neon из локальной машины.

### Способ 2: Ручное применение SQL

Выполните следующий SQL в Neon SQL Editor:

```sql
-- Добавить недостающие колонки в users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" varchar(255);

-- Создать таблицу sessions (если не существует)
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

-- Создать таблицу accounts (если не существует)
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

-- Создать таблицу verifications (если не существует)
CREATE TABLE IF NOT EXISTS "verifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "identifier" varchar(255) NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Добавить foreign keys
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
    ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
    ON DELETE cascade ON UPDATE no action;
```

### Шаг 3: Проверка

После применения миграций:

1. Сделайте **Redeploy** на Vercel
2. Попробуйте зарегистрироваться/войти
3. Проверьте Vercel Function Logs - ошибок не должно быть

## Проверка таблиц

Убедитесь, что все таблицы существуют:

```sql
-- Проверить таблицу users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Проверить таблицу sessions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions';

-- Проверить таблицу accounts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts';
```

## Ошибки и решения

### Ошибка: "relation 'users' does not exist"

**Причина:** Таблица не создана.

**Решение:** Примените миграции через Neon Dashboard.

### Ошибка: "column 'email_verified' does not exist"

**Причина:** Миграции не применены.

**Решение:** Выполните SQL скрипт выше.

### Ошибка: "duplicate key value violates unique constraint"

**Причина:** Миграции уже применены.

**Решение:** Пропустите этот шаг, миграции уже применены.
