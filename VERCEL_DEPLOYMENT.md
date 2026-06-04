# 🚀 Vercel Deployment Guide

## Переменные окружения

Для работы аутентификации необходимо настроить переменные окружения в Vercel.

### 1. Сгенерируйте BETTER_AUTH_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Скопируйте полученное значение (64 символа).

### 2. Добавьте переменные в Vercel Dashboard

1. Откройте проект на [vercel.com](https://vercel.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Settings** → **Environment Variables**
4. Добавьте следующие переменные:

#### Production Environment
| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db` |
| `BETTER_AUTH_SECRET` | Secret key (64 chars) | `57cf1371086d006ec0fb4941dc049a0c10c245a09217ce6cc03c6cbd0b03cb5e` |
| `BETTER_AUTH_URL` | Your Vercel app URL | `https://your-app.vercel.app` |

#### Preview Environment (опционально)
Те же переменные, но `BETTER_AUTH_URL` будет автоматически подставляться Vercel.

### 3. Redeploy

После добавления переменных:
1. Перейдите в **Deployments**
2. Нажмите **Redeploy** на последнем деплое
3. Или сделайте новый push в репозиторий

### 4. Проверка

После деплоя проверьте:
- ✅ Аутентификация работает (регистрация/вход)
- ✅ Сессии сохраняются
- ✅ tRPC subscription работают (SSE)

## Troubleshooting

### Ошибка: "You are using the default secret"

**Причина:** `BETTER_AUTH_SECRET` не установлен или слишком короткий.

**Решение:**
1. Убедитесь, что переменная добавлена в Vercel
2. Секрет должен быть минимум 32 символа
3. Сделайте redeploy после добавления

### Ошибка: "DATABASE_URL is not set"

**Причина:** Переменная `DATABASE_URL` не добавлена.

**Решение:**
1. Получите connection string из Neon Dashboard
2. Добавьте в Vercel Environment Variables
3. Сделайте redeploy

### Локальная разработка

Для локальной разработки создайте `.env.local`:

```bash
cp .env.local.example .env.local
```

Отредактируйте `.env.local` с вашими значениями.

## Безопасность

⚠️ **Никогда не коммитьте `.env.local` в Git!**

Файл `.env.local` уже добавлен в `.gitignore`. Используйте `.env.local.example` как шаблон.

## Production Checklist

- [ ] `DATABASE_URL` настроен (Neon PostgreSQL)
- [ ] `BETTER_AUTH_SECRET` установлен (64 символа)
- [ ] `BETTER_AUTH_URL` установлен (ваш Vercel домен)
- [ ] Сделан redeploy после добавления переменных
- [ ] Аутентификация тестируется в production
- [ ] SSE subscriptions работают (проверьте консоль браузера)
