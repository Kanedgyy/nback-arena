# N-Back Arena - Тестирование

Полное руководство по тестированию проекта N-Back Arena.

## 📊 Охват тестами

| Тип тестов | Фреймворк | Файлы | Количество тестов |
|------------|-----------|-------|-------------------|
| **Unit (ядро игры)** | Vitest | `tests/unit/nback-engine.test.ts` | 51 |
| **Unit (tRPC роутер)** | Vitest | `tests/unit/room-router.test.ts` | 24 |
| **Unit (UI компоненты)** | Vitest + RTL | `tests/unit/GameGrid.test.tsx` | 23 |
| **Существующие тесты** | Vitest | `tests/nback-engine.test.ts` | 25 |
| **E2E** | Playwright | `tests/e2e/create-room.spec.ts` | 15 |
| **ВСЕГО** | - | - | **138 тестов** |

## 🛠️ Стек тестирования

### Unit и интеграционные тесты
- **Vitest** - фреймворк для тестирования
- **React Testing Library** - тестирование React компонентов
- **@testing-library/jest-dom** - расширенные матчеры

### E2E тесты
- **Playwright** - кросс-браузерное E2E тестирование
  - Chromium
  - Firefox
  - WebKit (Safari)

## 📁 Структура тестов

```
tests/
├── setup.ts                    # Глобальная настройка тестов
├── nback-engine.test.ts        # Существующие тесты ядра
└── unit/
    ├── nback-engine.test.ts    # Детальные тесты ядра игры (51 тест)
    ├── room-router.test.ts     # Тесты tRPC роутера комнат (24 теста)
    └── GameGrid.test.tsx       # Тесты UI компонентов (23 теста)
└── e2e/
    └── create-room.spec.ts     # E2E сценарии (15 тестов)
```

## 🏃 Запуск тестов

### Unit тесты (Vitest)

```bash
# Запуск всех unit тестов
npm run test

# Запуск в режиме наблюдения
npm run test -- --watch

# Запуск с покрытием кода
npm run test:coverage

# Запуск конкретного файла тестов
npx vitest run tests/unit/nback-engine.test.ts
```

### E2E тесты (Playwright)

```bash
# Запуск всех E2E тестов (без UI)
npm run test:e2e

# Запуск с открытым UI
npm run test:e2e:ui

# Запуск в headed режиме (видно браузер)
npm run test:e2e:headed

# Запуск для конкретного браузера
npx playwright test --project=chromium
```

## 📝 Описание тестов

### 1. Тесты ядра игры (`nback-engine.test.ts`)

**Тестируемая логика:**
- Генерация последовательности стимулов
- Проверка ответов (правильно/неправильно)
- Механизм увеличения скорости после ошибок
- Управление игроками
- Ранжирование игроков
- Интеграционные тесты полного цикла

**Ключевые тесты:**
```typescript
// Генерация последовательности
describe('generateSequence', () => {
  it('should generate correct number of stimuli');
  it('should create matches for N-back challenges');
});

// Проверка ответов
describe('validateAnswer', () => {
  it('should correctly validate N-back match');
  it('should penalize incorrect answers');
  it('should not allow double answers');
});

// Увеличение скорости
describe('checkSpeedIncrease', () => {
  it('should increase speed after mistakesForSpeedUp mistakes');
  it('should not exceed maxSpeedLevel');
});
```

### 2. Тесты tRPC роутера (`room-router.test.ts`)

**Тестируемая логика:**
- Создание комнаты с валидацией
- Присоединение к комнате
- Добавление/удаление ботов
- Негативные сценарии

**Ключевые тесты:**
```typescript
// Валидация
describe('Room creation validation', () => {
  it('should validate room name requirements');
  it('should validate nValue range');
  it('should validate maxPlayers range');
});

// Управление ботами
describe('Bot management', () => {
  it('should generate unique bot IDs');
  it('should track bot accuracy levels');
  it('should prevent adding bot when room is full');
});

// Негативные сценарии
describe('Error scenarios', () => {
  it('should handle room not found error');
  it('should handle room full error');
  it('should handle game started error');
});
```

### 3. Тесты UI компонентов (`GameGrid.test.tsx`)

**Тестируемая логика:**
- Рендер сетки 3×3
- Подсветка активной позиции
- Реакция на изменение props

**Ключевые тесты:**
```typescript
describe('GameGrid Component', () => {
  it('should render 3x3 grid (9 cells)');
  it('should highlight active position');
  it('should have correct container dimensions');
  it('should re-render when activePosition changes');
});
```

### 4. E2E тесты (`create-room.spec.ts`)

**Тестируемые сценарии:**
- Полный пользовательский поток
- Логин → создание комнаты → начало игры → ходы
- Негативные сценарии
- Производительность

**Ключевые сценарии:**
```typescript
test('should login successfully', async ({ page });
test('should create a new room', async ({ page });
test('should add bot to room', async ({ page });
test('should start game', async ({ page });
test('should make a game move', async ({ page });
test('should see score update after move', async ({ page });
test('should complete full game session', async ({ page });
```

## 🎯 Моки и хелперы

### Мокируемые зависимости

```typescript
// База данных
vi.mock('@/server/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

// tRPC роутеры
vi.mock('@/server/api/routers/game', () => ({
  setRoomState: vi.fn(),
  getRoomState: vi.fn(),
}));

// Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), ... }),
}));
```

### Фабрики тестовых данных

```typescript
// Создание тестовой комнаты
function createTestRoom(roomId = 'test-room-1', config = {}) {
  const room = createRoomState(roomId, createTestConfig(config));
  return room;
}

// Создание конфигурации
function createTestConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}

// Добавление тестового игрока
function addTestPlayer(room, userId, isBot = false) {
  return addPlayer(room, userId, isBot);
}
```

## 📈 Покрытие кода

Запустить с покрытием:

```bash
npm run test:coverage
```

Отчёт будет доступен в `coverage/`:
- `coverage/index.html` - HTML отчёт
- `coverage/lcov-report/index.html` - детальный отчёт

## 🔧 Конфигурация

### Vitest (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Playwright (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
});
```

## ✅ Лучшие практики

1. **Изоляция тестов** - каждый тест независим
2. **Фикстуры** - используйте фабрику для создания тестовых данных
3. **Асинхронность** - используйте `waitFor` и `act`
4. **Негативные сценарии** - тестируйте ошибки
5. **Интеграционные тесты** - проверяйте полный цикл

## 🐛 Отладка

```bash
# Vitest с детальной информацией
npx vitest run --reporter=verbose

# Playwright с отладкой
npx playwright test --debug

# Playwright в headed режиме
npx playwright test --headed --project=chromium
```

## 📚 Ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Matchers](https://jestjs.io/docs/expect)
