/**
 * E2E Tests with Playwright
 * 
 * Тестирует:
 * - Пользователь логинится
 * - Создаёт комнату
 * - Начинает игру
 * - Делает 1 ход
 * - Видит обновление счёта
 */

import { test, expect, Page } from '@playwright/test';

// ===================== Фикстуры =====================

test.describe('N-Back Arena E2E', () => {
  
  // ===================== Логин =====================
  
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Заполняем форму
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    
    // Нажимаем кнопку входа
    await page.click('button[type="submit"]');
    
    // Ждём перенаправления на dashboard
    await page.waitForURL(/\/dashboard/);
    
    expect(page.url()).toContain('/dashboard');
  });

  // ===================== Создание комнаты =====================
  
  test('should create a new room', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Нажимаем кнопку создания комнаты
    await page.click('text=Create Room');
    
    // Заполняем форму создания
    await page.fill('[name="name"]', 'Test Room E2E');
    await page.selectOption('[name="nValue"]', '2');
    await page.selectOption('[name="maxPlayers"]', '4');
    
    // Создаём комнату
    await page.click('button:has-text("Create")');
    
    // Ждём перенаправления в комнату
    await page.waitForURL(/\/room\/.+/);
    
    // Проверяем что мы в комнате
    expect(page.url()).toMatch(/\/room\/[a-f0-9-]+/);
  });

  // ===================== Присоединение к комнате =====================
  
  test('should join an existing room', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Нажимаем кнопку присоединения
    await page.click('text=Join Room');
    
    // Вводим код комнаты
    await page.fill('[name="roomId"]', 'test-room-123');
    
    // Присоединяемся
    await page.click('button:has-text("Join")');
    
    // Ждём перенаправления
    await page.waitForURL(/\/room\/.+/);
    
    expect(page.url()).toMatch(/\/room\/.+/);
  });

  // ===================== Добавление бота =====================
  
  test('should add bot to room', async ({ page }) => {
    await page.goto('/room/test-room-123');
    
    // Нажимаем кнопку добавления бота
    await page.click('button:has-text("Add Bot")');
    
    // Выбираем сложность
    await page.selectOption('[name="difficulty"]', '2');
    
    // Добавляем
    await page.click('button:has-text("Add")');
    
    // Проверяем что бот добавлен
    await expect(page.locator('text=Bot')).toBeVisible();
  });

  // ===================== Начало игры =====================
  
  test('should start game', async ({ page }) => {
    await page.goto('/room/test-room-123');
    
    // Нажимаем кнопку начала игры
    await page.click('button:has-text("Start Game")');
    
    // Ждём перехода к экрану игры
    await page.waitForURL(/\/room\/.+/);
    
    // Проверяем что игра началась
    const gameGrid = page.locator('.grid');
    await expect(gameGrid).toBeVisible();
  });

  // ===================== Игровой ход =====================
  
  test('should make a game move', async ({ page }) => {
    await page.goto('/room/test-room-123');
    
    // Начинаем игру
    await page.click('button:has-text("Start Game")');
    
    // Ждём появления сетки
    await page.waitForSelector('.grid');
    
    // Нажимаем кнопку "Match" (Совпадение)
    await page.click('button:has-text("Match")');
    
    // Ждём ответа от сервера
    await page.waitForTimeout(1000);
    
    // Проверяем что ход был сделан
    const scoreElement = page.locator('[data-testid="score"]');
    await expect(scoreElement).toBeVisible();
  });

  // ===================== Обновление счёта =====================
  
  test('should see score update after move', async ({ page }) => {
    await page.goto('/room/test-room-123');
    
    // Начинаем игру
    await page.click('button:has-text("Start Game")');
    
    // Запоминаем начальный счёт
    const initialScoreText = await page.locator('[data-testid="score"]').textContent();
    const initialScore = parseInt(initialScoreText?.match(/\d+/)?.[0] || '0');
    
    // Делаем ход
    await page.click('button:has-text("Match")');
    
    // Ждём обновления
    await page.waitForTimeout(1500);
    
    // Проверяем обновлённый счёт
    const updatedScoreText = await page.locator('[data-testid="score"]').textContent();
    const updatedScore = parseInt(updatedScoreText?.match(/\d+/)?.[0] || '0');
    
    // Счёт должен измениться
    expect(updatedScore).not.toBe(initialScore);
  });

  // ===================== Негативный сценарий =====================
  
  test('should not create room without authentication', async ({ page }) => {
    // Удаляем сессию (если есть)
    await page.context().clearCookies();
    
    // Пытаемся перейти к созданию комнаты
    await page.goto('/create-room');
    
    // Должно перенаправить на логин
    await page.waitForURL(/\/auth\/login/);
    
    expect(page.url()).toContain('/auth/login');
  });

  test('should not join non-existent room', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Нажимаем кнопку присоединения
    await page.click('text=Join Room');
    
    // Вводим несуществующий код
    await page.fill('[name="roomId"]', 'non-existent-room-999');
    
    // Пытаемся присоединиться
    await page.click('button:has-text("Join")');
    
    // Должна появиться ошибка
    await expect(page.locator('text=Room not found')).toBeVisible();
  });

  test('should not add bot when room is full', async ({ page }) => {
    await page.goto('/room/test-room-full');
    
    // Заполняем комнату игроками
    for (let i = 0; i < 4; i++) {
      await page.click('button:has-text("Add Bot")');
    }
    
    // Пробуем добавить ещё одного
    await page.click('button:has-text("Add Bot")');
    
    // Должна появиться ошибка
    await expect(page.locator('text=Room is full')).toBeVisible();
  });

  // ===================== Полный игровой цикл =====================
  
  test('should complete full game session', async ({ page }) => {
    // 1. Логин
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // 2. Создаём комнату
    await page.click('text=Create Room');
    await page.fill('[name="name"]', 'E2E Test Room');
    await page.selectOption('[name="nValue"]', '2');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/room\/.+/);
    
    // 3. Добавляем бота
    await page.click('button:has-text("Add Bot")');
    await page.selectOption('[name="difficulty"]', '2');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Bot')).toBeVisible();
    
    // 4. Начинаем игру
    await page.click('button:has-text("Start Game")');
    await page.waitForSelector('.grid');
    
    // 5. Делаем несколько ходов
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("Match")');
      await page.waitForTimeout(1500);
    }
    
    // 6. Проверяем финальный счёт
    const finalScore = await page.locator('[data-testid="score"]').textContent();
    expect(finalScore).toBeTruthy();
    
    // 7. Проверяем прогресс игры
    const progressElement = page.locator('[data-testid="progress"]');
    await expect(progressElement).toBeVisible();
  });

  // ===================== Тесты производительности =====================
  
  test('should load game room within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/room/test-room-123');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('should respond to button clicks within 500ms', async ({ page }) => {
    await page.goto('/room/test-room-123');
    
    const startTime = Date.now();
    await page.click('button:has-text("Start Game")');
    await page.waitForSelector('.grid');
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(500);
  });
});
