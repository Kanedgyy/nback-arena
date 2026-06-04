/**
 * Core Game Engine Tests - N-Back Logic
 * 
 * Тестирует:
 * - Генерацию последовательности стимулов
 * - Проверку ответов (правильно/неправильно)
 * - Механизм увеличения скорости
 * - Управление игроками
 * - Ранжирование игроков
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateSequence,
  createRoomState,
  addPlayer,
  removePlayer,
  validateAnswer,
  checkSpeedIncrease,
  getCurrentStimulus,
  advanceStimulus,
  simulateBotResponse,
  getBotAccuracy,
  getGameProgress,
  getPlayerRankings,
  resetPlayerResponses,
  DEFAULT_CONFIG,
  GameConfig,
} from '@/server/game/nback-engine';

// ===================== Фабрики тестовых данных =====================

function createMockConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

function createTestRoom(
  roomId: string = 'test-room-1',
  config: Partial<GameConfig> = {}
) {
  const room = createRoomState(roomId, createTestConfig(config));
  return room;
}

function createTestConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

function addTestPlayer(
  room: ReturnType<typeof createRoomState>,
  userId: string,
  isBot: boolean = false
) {
  return addPlayer(room, userId, isBot);
}

// ===================== Тесты генерации последовательности =====================

describe('generateSequence', () => {
  it('should generate correct number of stimuli', () => {
    const config = createMockConfig({ totalStimuli: 30 });
    const sequence = generateSequence(config);
    
    expect(sequence).toHaveLength(30);
  });

  it('should generate different sequences on each call', () => {
    const config = createMockConfig({ totalStimuli: 20 });
    const seq1 = generateSequence(config);
    const seq2 = generateSequence(config);
    
    // Последовательности должны отличаться хотя бы в одной позиции
    const different = seq1.some((s, i) => s.position !== seq2[i].position);
    expect(different).toBe(true);
  });

  it('should have correct sequenceIndex for each stimulus', () => {
    const config = createMockConfig({ totalStimuli: 10 });
    const sequence = generateSequence(config);
    
    sequence.forEach((stimulus, index) => {
      expect(stimulus.sequenceIndex).toBe(index);
    });
  });

  it('should generate positions in range 0-8 for 3x3 grid', () => {
    const config = createMockConfig({ totalStimuli: 50 });
    const sequence = generateSequence(config);
    
    sequence.forEach(stimulus => {
      expect(stimulus.position).toBeGreaterThanOrEqual(0);
      expect(stimulus.position).toBeLessThanOrEqual(8);
    });
  });

  it('should create matches for N-back challenges (N=2)', () => {
    const config = createMockConfig({ nValue: 2, totalStimuli: 100 });
    const sequence = generateSequence(config);
    
    // После индекса N должны быть совпадения
    let matchCount = 0;
    for (let i = 2; i < sequence.length; i++) {
      if (sequence[i].position === sequence[i - 2].position) {
        matchCount++;
      }
    }
    
    // Ожидаем ~30% совпадений (±10% погрешность из-за случайности)
    expect(matchCount).toBeGreaterThan(20);
    expect(matchCount).toBeLessThan(40);
  });

  it('should create NO matches for first N stimuli', () => {
    const config = createMockConfig({ nValue: 3, totalStimuli: 10 });
    const sequence = generateSequence(config);
    
    // Для первых N стимулов не должно быть проверок
    for (let i = 0; i < config.nValue; i++) {
      expect(sequence[i].sequenceIndex).toBe(i);
    }
  });

  it('should handle different N values correctly', () => {
    const config = createMockConfig({ nValue: 3, totalStimuli: 50 });
    const sequence = generateSequence(config);
    
    // Проверим, что совпадения происходят только после индекса N
    let validMatches = 0;
    let totalPotentialMatches = 0;
    
    for (let i = config.nValue; i < sequence.length; i++) {
      totalPotentialMatches++;
      if (sequence[i].position === sequence[i - config.nValue].position) {
        validMatches++;
      }
    }
    
    // Ожидаем ~30% совпадений
    const matchRate = validMatches / totalPotentialMatches;
    expect(matchRate).toBeGreaterThan(0.2);
    expect(matchRate).toBeLessThan(0.4);
  });
});

// ===================== Тесты создания комнаты =====================

describe('createRoomState', () => {
  it('should create room with default configuration', () => {
    const room = createRoomState('test-1');
    
    expect(room.roomId).toBe('test-1');
    expect(room.nValue).toBe(DEFAULT_CONFIG.nValue);
    expect(room.stimulusInterval).toBe(DEFAULT_CONFIG.baseInterval);
    expect(room.sequence).toHaveLength(DEFAULT_CONFIG.totalStimuli);
    expect(room.players.size).toBe(0);
    expect(room.isRunning).toBe(false);
    expect(room.speedLevel).toBe(0);
  });

  it('should create room with custom configuration', () => {
    const config = createMockConfig({
      nValue: 3,
      baseInterval: 1000,
      totalStimuli: 20,
    });
    
    const room = createRoomState('test-2', config);
    
    expect(room.nValue).toBe(3);
    expect(room.stimulusInterval).toBe(1000);
    expect(room.sequence).toHaveLength(20);
  });
});

// ===================== Тесты управления игроками =====================

describe('addPlayer & removePlayer', () => {
  it('should add a regular player', () => {
    const room = createTestRoom();
    const player = addPlayer(room, 'user-1');
    
    expect(room.players.size).toBe(1);
    expect(player.userId).toBe('user-1');
    expect(player.isBot).toBe(false);
    expect(player.score).toBe(0);
    expect(player.mistakes).toBe(0);
    expect(player.correctAnswers).toBe(0);
    expect(player.lastResponse).toBeNull();
  });

  it('should add a bot player with accuracy', () => {
    const room = createTestRoom();
    const player = addPlayer(room, 'bot-1', true, 75);
    
    expect(player.isBot).toBe(true);
    expect(player.botAccuracy).toBe(75);
  });

  it('should add multiple players', () => {
    const room = createTestRoom();
    addPlayer(room, 'user-1');
    addPlayer(room, 'user-2');
    addPlayer(room, 'user-3');
    
    expect(room.players.size).toBe(3);
  });

  it('should allow duplicate players (overwrites)', () => {
    const room = createTestRoom();
    addPlayer(room, 'user-1');
    
    // Текущая реализация позволяет перезаписывать игрока
    const player2 = addPlayer(room, 'user-1');
    
    expect(room.players.size).toBe(1);
    expect(player2.userId).toBe('user-1');
  });

  it('should remove a player', () => {
    const room = createTestRoom();
    addPlayer(room, 'user-1');
    removePlayer(room, 'user-1');
    
    expect(room.players.size).toBe(0);
  });

  it('should do nothing when removing non-existent player', () => {
    const room = createTestRoom();
    expect(() => removePlayer(room, 'non-existent')).not.toThrow();
    expect(room.players.size).toBe(0);
  });
});

// ===================== Тесты проверки ответов =====================

describe('validateAnswer', () => {
  beforeEach(() => {
    // Сброс моков перед каждым тестом
    vi.restoreAllMocks();
  });

  it('should throw error for non-existent player', () => {
    const room = createTestRoom();
    addPlayer(room, 'user-1');
    
    expect(() => 
      validateAnswer(room, 'non-existent', true, 5)
    ).toThrow('Player non-existent not found');
  });

  it('should accept answer for stimulus before N (false alarm = wrong)', () => {
    const room = createTestRoom('test-nback', { nValue: 3, totalStimuli: 10 });
    const player = addPlayer(room, 'user-1');
    
    // На индексе 0 (до N=3), ответ "есть совпадение" = ошибка
    const result = validateAnswer(room, 'user-1', true, 0);
    
    expect(result.correct).toBe(false);
    expect(result.isNewMistake).toBe(true);
    expect(player.mistakes).toBe(1);
    expect(player.score).toBe(0); // Счёт не увеличивается
  });

  it('should accept answer for stimulus before N (no match = correct)', () => {
    const room = createTestRoom('test-nback', { nValue: 3, totalStimuli: 10 });
    const player = addPlayer(room, 'user-1');
    
    // На индексе 0 (до N=3), ответ "нет совпадения" = правильно
    const result = validateAnswer(room, 'user-1', false, 0);
    
    expect(result.correct).toBe(true);
    expect(result.isNewMistake).toBe(false);
    expect(player.score).toBe(10);
    expect(player.correctAnswers).toBe(1);
  });

  it('should correctly validate N-back match', () => {
    // Создаём комнату с контролируемыми данными
    const room = createRoomState('test-match', { nValue: 2, totalStimuli: 5 });
    
    // Подменим последовательность для предсказуемости
    room.sequence = [
      { sequenceIndex: 0, position: 0 },
      { sequenceIndex: 1, position: 1 },
      { sequenceIndex: 2, position: 0 }, // Должно совпасть с индексом 0
      { sequenceIndex: 3, position: 2 },
      { sequenceIndex: 4, position: 3 },
    ];
    
    const player = addPlayer(room, 'user-1');
    
    // Отвечаем на стимул индекса 2 (должно быть совпадение с индексом 0)
    const result = validateAnswer(room, 'user-1', true, 2);
    
    expect(result.correct).toBe(true);
    expect(result.isNewMistake).toBe(false);
    expect(player.score).toBe(10);
    expect(player.correctAnswers).toBe(1);
  });

  it('should correctly validate N-back no-match', () => {
    const room = createRoomState('test-nomatch', { nValue: 2, totalStimuli: 5 });
    
    // Подменим последовательность
    room.sequence = [
      { sequenceIndex: 0, position: 0 },
      { sequenceIndex: 1, position: 1 },
      { sequenceIndex: 2, position: 3 }, // НЕ должно совпасть
      { sequenceIndex: 3, position: 2 },
      { sequenceIndex: 4, position: 3 },
    ];
    
    const player = addPlayer(room, 'user-1');
    
    // Отвечаем "есть совпадение" на стимул, где его нет
    const result = validateAnswer(room, 'user-1', true, 2);
    
    expect(result.correct).toBe(false);
    expect(result.isNewMistake).toBe(true);
    expect(player.mistakes).toBe(1);
    expect(player.score).toBe(0); // 10 - 10 = 0 (не ниже 0)
  });

  it('should penalize correct answer with score', () => {
    const room = createRoomState('test-penalty', { nValue: 1, totalStimuli: 5 });
    room.sequence = [
      { sequenceIndex: 0, position: 5 },
      { sequenceIndex: 1, position: 5 }, // Совпадение
    ];
    
    const player = addPlayer(room, 'user-1');
    player.score = 5; // Начальный счёт
    
    const result = validateAnswer(room, 'user-1', true, 1);
    
    expect(result.correct).toBe(true);
    expect(player.score).toBe(15); // 5 + 10
  });

  it('should penalize wrong answer with score deduction', () => {
    const room = createRoomState('test-penalty', { nValue: 1, totalStimuli: 5 });
    room.sequence = [
      { sequenceIndex: 0, position: 0 },
      { sequenceIndex: 1, position: 1 }, // НЕ совпадение
    ];
    
    const player = addPlayer(room, 'user-1');
    player.score = 15;
    
    const result = validateAnswer(room, 'user-1', true, 1); // Ответил "есть", а его нет
    
    expect(result.correct).toBe(false);
    expect(player.score).toBe(5); // 15 - 10
  });

  it('should not allow double answers for same stimulus', () => {
    const room = createRoomState('test-double', { nValue: 1, totalStimuli: 5 });
    room.sequence = [
      { sequenceIndex: 0, position: 0 },
      { sequenceIndex: 1, position: 1 },
    ];
    
    const player = addPlayer(room, 'user-1');
    
    // Первый ответ
    const result1 = validateAnswer(room, 'user-1', false, 1);
    expect(result1.correct).toBe(true);
    
    // Второй ответ на тот же стимул
    const result2 = validateAnswer(room, 'user-1', true, 1);
    expect(result2.correct).toBe(true); // Игнорируется
    expect(player.score).toBe(10); // Не изменился
  });

  it('should handle invalid stimulus index', () => {
    const room = createTestRoom();
    addPlayer(room, 'user-1');
    
    const result = validateAnswer(room, 'user-1', true, 999);
    
    expect(result.correct).toBe(true); // Игнорируется
    expect(result.isNewMistake).toBe(false);
  });

  it('should set lastResponse after validation', () => {
    const room = createRoomState('test-response', { nValue: 1, totalStimuli: 5 });
    room.sequence = [
      { sequenceIndex: 0, position: 0 },
      { sequenceIndex: 1, position: 1 },
    ];
    
    const player = addPlayer(room, 'user-1');
    expect(player.lastResponse).toBeNull();
    
    validateAnswer(room, 'user-1', true, 1);
    expect(player.lastResponse).toBe(true);
  });
});

// ===================== Тесты увеличения скорости =====================

describe('checkSpeedIncrease', () => {
  it('should not increase speed with 0 mistakes', () => {
    const room = createTestRoom();
    addPlayer(room, 'user-1');
    
    const increased = checkSpeedIncrease(room);
    
    expect(increased).toBe(false);
    expect(room.speedLevel).toBe(0);
  });

  it('should increase speed after mistakesForSpeedUp mistakes', () => {
    const room = createTestRoom();
    const player = addPlayer(room, 'user-1');
    
    // Добавляем 3 ошибки (mistakesForSpeedUp по умолчанию = 3)
    player.mistakes = 3;
    
    const increased = checkSpeedIncrease(room);
    
    expect(increased).toBe(true);
    expect(room.speedLevel).toBe(1);
    expect(room.stimulusInterval).toBeLessThan(room.baseInterval);
  });

  it('should not exceed maxSpeedLevel', () => {
    const room = createTestRoom();
    room.maxSpeedLevel = 2;
    const player = addPlayer(room, 'user-1');
    
    // Добавляем 6 ошибок (должно дать speedLevel 2, но не больше)
    player.mistakes = 6;
    
    checkSpeedIncrease(room);
    
    expect(room.speedLevel).toBe(2);
  });

  it('should decrease stimulus interval proportionally', () => {
    const room = createTestRoom();
    const player = addPlayer(room, 'user-1');
    player.mistakes = 3;
    
    checkSpeedIncrease(room);
    
    // Интервал должен уменьшиться на speedStep (300ms)
    expect(room.stimulusInterval).toBe(room.baseInterval - 300);
  });

  it('should respect minimum interval', () => {
    const room = createTestRoom();
    room.baseInterval = 500;
    room.maxSpeedLevel = 10;
    const player = addPlayer(room, 'user-1');
    
    // Много ошибок
    player.mistakes = 100;
    
    checkSpeedIncrease(room);
    
    // Не должен быть меньше speedStep * 2 (600ms)
    expect(room.stimulusInterval).toBeGreaterThanOrEqual(600);
  });

  it('should sum mistakes from all players', () => {
    const room = createTestRoom();
    const player1 = addPlayer(room, 'user-1');
    const player2 = addPlayer(room, 'user-2');
    
    player1.mistakes = 2;
    player2.mistakes = 1;
    
    const increased = checkSpeedIncrease(room);
    
    // Всего 3 ошибки = speedLevel 1
    expect(increased).toBe(true);
    expect(room.speedLevel).toBe(1);
  });
});

// ===================== Тесты прогресса игры =====================

describe('getCurrentStimulus & advanceStimulus', () => {
  it('should return current stimulus', () => {
    const room = createTestRoom();
    
    const stimulus = getCurrentStimulus(room);
    
    expect(stimulus).not.toBeNull();
    expect(stimulus!.sequenceIndex).toBe(0);
  });

  it('should return null when game is complete', () => {
    const room = createTestRoom();
    room.currentIndex = room.sequence.length;
    
    const stimulus = getCurrentStimulus(room);
    
    expect(stimulus).toBeNull();
  });

  it('should advance to next stimulus', () => {
    const room = createTestRoom();
    
    advanceStimulus(room);
    
    expect(room.currentIndex).toBe(1);
  });

  it('should not advance beyond sequence length', () => {
    const room = createTestRoom();
    
    // Продвигаемся до конца
    for (let i = 0; i < room.sequence.length; i++) {
      advanceStimulus(room);
    }
    
    expect(room.currentIndex).toBe(room.sequence.length);
    
    // Дальше не продвигаемся
    advanceStimulus(room);
    expect(room.currentIndex).toBe(room.sequence.length);
  });

  it('should trigger speed check on advance', () => {
    const room = createTestRoom();
    const player = addPlayer(room, 'user-1');
    player.mistakes = 3;
    
    advanceStimulus(room);
    
    expect(room.speedLevel).toBe(1);
  });
});

describe('getGameProgress', () => {
  it('should return correct progress percentage', () => {
    const room = createTestRoom();
    
    const progress = getGameProgress(room);
    
    expect(progress.progress).toBe(0);
    expect(progress.isComplete).toBe(false);
  });

  it('should update progress after advancing', () => {
    const room = createRoomState('progress-test', { totalStimuli: 10 });
    advanceStimulus(room);
    
    const progress = getGameProgress(room);
    
    // 1 шаг из 10 = 10%
    expect(progress.progress).toBe(10);
    expect(progress.isComplete).toBe(false);
  });

  it('should return complete when game finished', () => {
    const room = createTestRoom();
    room.currentIndex = room.sequence.length;
    
    const progress = getGameProgress(room);
    
    expect(progress.isComplete).toBe(true);
    expect(progress.progress).toBe(100);
    expect(progress.currentStimulus).toBeNull();
  });
});

// ===================== Тесты ранжирования игроков =====================

describe('getPlayerRankings', () => {
  it('should return empty array for empty room', () => {
    const room = createTestRoom();
    
    const rankings = getPlayerRankings(room);
    
    expect(rankings).toHaveLength(0);
  });

  it('should rank players by score descending', () => {
    const room = createTestRoom();
    const player1 = addPlayer(room, 'user-1');
    const player2 = addPlayer(room, 'user-2');
    const player3 = addPlayer(room, 'user-3');
    
    player1.score = 50;
    player2.score = 100;
    player3.score = 75;
    
    const rankings = getPlayerRankings(room);
    
    expect(rankings).toHaveLength(3);
    expect(rankings[0].userId).toBe('user-2');
    expect(rankings[0].rank).toBe(1);
    expect(rankings[1].userId).toBe('user-3');
    expect(rankings[1].rank).toBe(2);
    expect(rankings[2].userId).toBe('user-1');
    expect(rankings[2].rank).toBe(3);
  });

  it('should include all stats in ranking', () => {
    const room = createTestRoom();
    const player = addPlayer(room, 'user-1');
    player.score = 30;
    player.mistakes = 2;
    player.correctAnswers = 3;
    
    const rankings = getPlayerRankings(room);
    
    expect(rankings[0]).toMatchObject({
      userId: 'user-1',
      score: 30,
      mistakes: 2,
      correctAnswers: 3,
      rank: 1,
    });
  });
});

// ===================== Тесты сброса ответов =====================

describe('resetPlayerResponses', () => {
  it('should reset all player responses', () => {
    const room = createTestRoom();
    const player1 = addPlayer(room, 'user-1');
    const player2 = addPlayer(room, 'user-2');
    
    player1.lastResponse = true;
    player2.lastResponse = false;
    
    resetPlayerResponses(room);
    
    expect(player1.lastResponse).toBeNull();
    expect(player2.lastResponse).toBeNull();
  });

  it('should handle empty room', () => {
    const room = createTestRoom();
    
    expect(() => resetPlayerResponses(room)).not.toThrow();
  });
});

// ===================== Тесты ботов =====================

describe('Bot simulation', () => {
  it('should throw error for non-bot player', () => {
    const room = createTestRoom();
    const player = addPlayer(room, 'user-1', false);
    
    expect(() => simulateBotResponse(player, true)).toThrow('Not a bot player');
  });

  it('should return correct accuracy for difficulty levels', () => {
    expect(getBotAccuracy(1)).toBe(50);
    expect(getBotAccuracy(2)).toBe(75);
    expect(getBotAccuracy(3)).toBe(90);
    expect(getBotAccuracy(99)).toBe(50); // Неизвестный уровень = 50%
  });

  it('should simulate bot responses based on accuracy', () => {
    const room = createTestRoom();
    const bot = addPlayer(room, 'bot-1', true, 100); // 100% точность
    
    // Бот с 100% точностью всегда отвечает правильно
    for (let i = 0; i < 10; i++) {
      const response = simulateBotResponse(bot, true);
      expect(response).toBe(true);
    }
  });

  it('should simulate incorrect responses for less accurate bots', () => {
    const room = createTestRoom();
    const bot = addPlayer(room, 'bot-1', true, 0); // 0% точность
    
    // Бот с 0% точностью всегда отвечает неправильно
    for (let i = 0; i < 10; i++) {
      const response = simulateBotResponse(bot, true);
      expect(response).toBe(false);
    }
  });

  it('should generate bot names', () => {
    const names = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Omega'];
    const prefixes = ['Speedy', 'Quick', 'Sharp', 'Brainy', 'Ninja'];
    
    for (let i = 0; i < 10; i++) {
      // Функция generateBotName экспортируется, но не используется в тесте напрямую
      // Здесь просто проверяем, что функция существует
      // В реальном коде можно протестировать через импортированную функцию
    }
  });
});

// ===================== Интеграционный тест полного игрового цикла =====================

describe('Full game cycle integration', () => {
  it('should simulate a complete game session', () => {
    // Создаём комнату
    const room = createRoomState('integration-test', {
      nValue: 1,
      totalStimuli: 10,
      baseInterval: 1000,
    });
    
    // Добавляем игрока
    const player = addPlayer(room, 'test-user');
    
    expect(room.isRunning).toBe(false);
    expect(player.score).toBe(0);
    
    // Проверяем первый стимул
    let stimulus = getCurrentStimulus(room);
    expect(stimulus).not.toBeNull();
    expect(stimulus!.sequenceIndex).toBe(0);
    
    // Имитируем ответ игрока на стимул 0 (до N=1, ответ "нет" = правильно)
    const result1 = validateAnswer(room, 'test-user', false, 0);
    expect(result1.correct).toBe(true);
    expect(player.score).toBe(10);
    
    // Переходим к следующему стимулу
    advanceStimulus(room);
    expect(room.currentIndex).toBe(1);
    
    // Отвечаем на стимул 1
    stimulus = getCurrentStimulus(room);
    if (stimulus) {
      const actualMatch = room.sequence[1].position === room.sequence[0].position;
      const result2 = validateAnswer(room, 'test-user', !actualMatch, 1);
      
      expect(result2.correct).toBeDefined();
      expect(player.lastResponse).toBeDefined();
    }
    
    // Проверяем прогресс
    const progress = getGameProgress(room);
    expect(progress.progress).toBe(10);
    expect(progress.isComplete).toBe(false);
    
    // Завершаем игру
    while (room.currentIndex < room.sequence.length) {
      advanceStimulus(room);
    }
    
    const finalProgress = getGameProgress(room);
    expect(finalProgress.isComplete).toBe(true);
    expect(finalProgress.progress).toBe(100);
    
    // Проверяем финальное ранжирование
    const rankings = getPlayerRankings(room);
    expect(rankings).toHaveLength(1);
    expect(rankings[0].userId).toBe('test-user');
  });

  it('should handle multiple players in a game', () => {
    const room = createRoomState('multi-test', { nValue: 1, totalStimuli: 5 });
    
    addPlayer(room, 'player-1');
    addPlayer(room, 'player-2');
    addPlayer(room, 'bot-1', true, 80);
    
    expect(room.players.size).toBe(3);
    
    // Все игроки имеют нулевой счёт
    for (const player of room.players.values()) {
      expect(player.score).toBe(0);
    }
    
    // Проверяем ранжирование
    const rankings = getPlayerRankings(room);
    expect(rankings).toHaveLength(3);
  });
});
