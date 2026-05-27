import { describe, it, expect } from 'vitest';
import {
  generateSequence,
  validateAnswer,
  checkSpeedIncrease,
  createRoomState,
  addPlayer,
  advanceStimulus,
  getGameProgress,
  getPlayerRankings,
  simulateBotResponse,
  DEFAULT_CONFIG,
  type GameConfig,
  type GridPosition,
} from '../src/server/game/nback-engine';

describe('N-Back Game Engine', () => {
  describe('generateSequence', () => {
    it('should generate sequence of correct length', () => {
      const config: GameConfig = {
        ...DEFAULT_CONFIG,
        totalStimuli: 20,
      };
      const sequence = generateSequence(config);
      expect(sequence).toHaveLength(20);
    });

    it('should generate valid grid positions (0-8)', () => {
      const config: GameConfig = DEFAULT_CONFIG;
      const sequence = generateSequence(config);
      
      sequence.forEach((stimulus) => {
        expect(stimulus.position).toBeGreaterThanOrEqual(0);
        expect(stimulus.position).toBeLessThanOrEqual(8);
      });
    });

    it('should have proper sequenceIndex incrementing', () => {
      const config: GameConfig = { ...DEFAULT_CONFIG, totalStimuli: 10 };
      const sequence = generateSequence(config);
      
      sequence.forEach((stimulus, index) => {
        expect(stimulus.sequenceIndex).toBe(index);
      });
    });

    it('should create some matching stimuli', () => {
      const config: GameConfig = { ...DEFAULT_CONFIG, totalStimuli: 50 };
      const sequence = generateSequence(config);
      const nValue = config.nValue;
      
      let matchCount = 0;
      for (let i = nValue; i < sequence.length; i++) {
        if (sequence[i].position === sequence[i - nValue].position) {
          matchCount++;
        }
      }
      
      // Should have approximately 30% matches after index n
      const possibleMatches = sequence.length - nValue;
      const matchRate = matchCount / possibleMatches;
      expect(matchRate).toBeGreaterThan(0.2); // At least 20% matches
      expect(matchRate).toBeLessThan(0.5); // At most 50% matches
    });
  });

  describe('createRoomState', () => {
    it('should create room with correct configuration', () => {
      const room = createRoomState('test-room-1', { nValue: 3 });
      
      expect(room.roomId).toBe('test-room-1');
      expect(room.nValue).toBe(3);
      expect(room.sequence).toHaveLength(DEFAULT_CONFIG.totalStimuli);
      expect(room.currentIndex).toBe(0);
      expect(room.isRunning).toBe(false);
      expect(room.speedLevel).toBe(0);
    });

    it('should initialize with base interval', () => {
      const room = createRoomState('test-room-2');
      expect(room.stimulusInterval).toBe(room.baseInterval);
    });
  });

  describe('addPlayer', () => {
    it('should add player to room', () => {
      const room = createRoomState('test-room-3');
      const player = addPlayer(room, 'user-123', false);
      
      expect(room.players.size).toBe(1);
      expect(player.userId).toBe('user-123');
      expect(player.score).toBe(0);
      expect(player.mistakes).toBe(0);
      expect(player.correctAnswers).toBe(0);
      expect(player.isBot).toBe(false);
    });

    it('should add bot player with accuracy', () => {
      const room = createRoomState('test-room-4');
      const player = addPlayer(room, 'bot-1', true, 85);
      
      expect(player.isBot).toBe(true);
      expect(player.botAccuracy).toBe(85);
    });
  });

  describe('validateAnswer', () => {
    it('should accept answer before Nth stimulus', () => {
      const room = createRoomState('test-room-5', { nValue: 3 });
      addPlayer(room, 'user-1');
      
      // Before index 3, any answer should be accepted without penalty
      const result = validateAnswer(room, 'user-1', true);
      expect(result.correct).toBe(true);
      expect(result.isNewMistake).toBe(false);
    });

    it('should give correct answer when player matches correctly', () => {
      const config: GameConfig = { ...DEFAULT_CONFIG, nValue: 2, totalStimuli: 10 };
      const room = createRoomState('test-room-6', config);
      addPlayer(room, 'user-1');
      
      // Manually set up a match scenario
      const matchPosition = room.sequence[0].position;
      room.sequence[2].position = matchPosition; // Force a match at index 2
      room.currentIndex = 3; // Move to index 3
      
      const result = validateAnswer(room, 'user-1', true);
      expect(result.correct).toBe(true);
      expect(result.isNewMistake).toBe(false);
    });

    it('should penalize incorrect answers', () => {
      const room = createRoomState('test-room-7', { nValue: 2, totalStimuli: 20 });
      addPlayer(room, 'user-1');
      
      room.currentIndex = 5;
      
      // Force a situation where current position does NOT match n-back position
      const nBackPos = room.sequence[2].position;
      // Make sure current position is different from n-back position
      let currentPos = 0;
      while (currentPos === nBackPos) {
        currentPos = (currentPos + 1) % 9;
      }
      room.sequence[4].position = currentPos as GridPosition;
      
      // Player incorrectly says there IS a match (true) when there isn't
      const result = validateAnswer(room, 'user-1', true);
      expect(result.isNewMistake).toBe(true);
      
      const player = room.players.get('user-1');
      expect(player?.mistakes).toBe(1);
      expect(player?.score).toBe(0);
    });

    it('should update score for correct answers', () => {
      const room = createRoomState('test-room-8', { nValue: 2 });
      addPlayer(room, 'user-1');
      
      // Set up a non-match scenario
      room.currentIndex = 3;
      
      const currentPos = room.sequence[2].position;
      const nBackPos = room.sequence[0].position;
      
      // If they don't match, player should say false
      if (currentPos !== nBackPos) {
        const result = validateAnswer(room, 'user-1', false);
        expect(result.correct).toBe(true);
        expect(room.players.get('user-1')?.score).toBe(10);
      }
    });
  });

  describe('checkSpeedIncrease', () => {
    it('should not increase speed with few mistakes', () => {
      const room = createRoomState('test-room-9');
      addPlayer(room, 'user-1');
      addPlayer(room, 'user-2');
      
      room.players.get('user-1')!.mistakes = 2;
      room.players.get('user-2')!.mistakes = 0;
      
      const increased = checkSpeedIncrease(room);
      expect(increased).toBe(false);
      expect(room.speedLevel).toBe(0);
    });

    it('should increase speed after 3 total mistakes', () => {
      const room = createRoomState('test-room-10');
      addPlayer(room, 'user-1');
      addPlayer(room, 'user-2');
      
      room.players.get('user-1')!.mistakes = 2;
      room.players.get('user-2')!.mistakes = 1;
      
      const increased = checkSpeedIncrease(room);
      expect(increased).toBe(true);
      expect(room.speedLevel).toBe(1);
    });

    it('should reduce interval when speed increases', () => {
      const room = createRoomState('test-room-11');
      addPlayer(room, 'user-1');
      
      room.players.get('user-1')!.mistakes = 3;
      
      const initialInterval = room.stimulusInterval;
      checkSpeedIncrease(room);
      
      expect(room.stimulusInterval).toBeLessThan(initialInterval);
    });

    it('should respect max speed level', () => {
      const room = createRoomState('test-room-12');
      addPlayer(room, 'user-1');
      
      // Give enough mistakes to exceed max speed level
      room.players.get('user-1')!.mistakes = 20; // Should be 6+ levels
      
      checkSpeedIncrease(room);
      expect(room.speedLevel).toBeLessThanOrEqual(room.maxSpeedLevel);
    });
  });

  describe('getGameProgress', () => {
    it('should return 0% progress at start', () => {
      const room = createRoomState('test-room-13');
      const progress = getGameProgress(room);
      
      expect(progress.progress).toBe(0);
      expect(progress.isComplete).toBe(false);
    });

    it('should return 100% progress when complete', () => {
      const room = createRoomState('test-room-14');
      room.currentIndex = room.sequence.length;
      
      const progress = getGameProgress(room);
      
      expect(progress.progress).toBe(100);
      expect(progress.isComplete).toBe(true);
    });

    it('should return correct intermediate progress', () => {
      const room = createRoomState('test-room-15', { totalStimuli: 20 });
      room.currentIndex = 10;
      
      const progress = getGameProgress(room);
      
      expect(progress.progress).toBe(50);
    });
  });

  describe('getPlayerRankings', () => {
    it('should rank players by score', () => {
      const room = createRoomState('test-room-16');
      addPlayer(room, 'user-1');
      addPlayer(room, 'user-2');
      addPlayer(room, 'user-3');
      
      // Set different scores
      room.players.get('user-1')!.score = 50;
      room.players.get('user-2')!.score = 100;
      room.players.get('user-3')!.score = 75;
      
      const rankings = getPlayerRankings(room);
      
      expect(rankings[0].userId).toBe('user-2');
      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].userId).toBe('user-3');
      expect(rankings[1].rank).toBe(2);
      expect(rankings[2].userId).toBe('user-1');
      expect(rankings[2].rank).toBe(3);
    });

    it('should include bot players in rankings', () => {
      const room = createRoomState('test-room-17');
      addPlayer(room, 'user-1', false);
      addPlayer(room, 'bot-1', true, 80);
      
      room.players.get('user-1')!.score = 50;
      room.players.get('bot-1')!.score = 80;
      
      const rankings = getPlayerRankings(room);
      
      expect(rankings[0].isBot).toBe(true);
      expect(rankings[1].isBot).toBe(false);
    });
  });

  describe('simulateBotResponse', () => {
    it('should respond correctly based on accuracy', () => {
      const room = createRoomState('test-room-18');
      const player = addPlayer(room, 'bot-1', true, 100);
      
      const actualMatch = true;
      let correctResponses = 0;
      
      // Test with 100% accuracy - should always be correct
      for (let i = 0; i < 10; i++) {
        const response = simulateBotResponse(player, actualMatch);
        if (response === actualMatch) correctResponses++;
      }
      
      expect(correctResponses).toBe(10);
    });

    it('should sometimes respond incorrectly at 50% accuracy', () => {
      const room = createRoomState('test-room-19');
      const player = addPlayer(room, 'bot-1', true, 50);
      
      const actualMatch = true;
      let correctResponses = 0;
      
      for (let i = 0; i < 100; i++) {
        const response = simulateBotResponse(player, actualMatch);
        if (response === actualMatch) correctResponses++;
      }
      
      // Should be approximately 50% correct (with some variance)
      expect(correctResponses).toBeGreaterThan(40);
      expect(correctResponses).toBeLessThan(60);
    });
  });

  describe('advanceStimulus', () => {
    it('should increment currentIndex', () => {
      const room = createRoomState('test-room-20', { totalStimuli: 10 });
      room.currentIndex = 5;
      
      advanceStimulus(room);
      
      expect(room.currentIndex).toBe(6);
    });

    it('should not exceed sequence length', () => {
      const room = createRoomState('test-room-21', { totalStimuli: 10 });
      room.currentIndex = 10;
      
      advanceStimulus(room);
      
      expect(room.currentIndex).toBe(10); // Should not exceed
    });
  });
});
