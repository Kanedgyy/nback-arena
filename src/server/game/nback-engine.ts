/**
 * N-Back Game Engine
 * 
 * Core game logic for the N-back challenge with:
 * - Server-side sequence generation
 * - Answer validation
 * - Scoring system
 * - Speed acceleration based on mistakes
 * - Bot simulation
 */

// Grid positions (3x3 = 9 positions)
export type GridPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Stimulus {
  sequenceIndex: number;
  position: GridPosition;
}

export interface PlayerState {
  userId: string;
  isBot: boolean;
  botAccuracy?: number; // 0-100, only for bots
  score: number;
  mistakes: number;
  correctAnswers: number;
  lastResponse: boolean | null; // true = matched, false = no match, null = no response yet
}

export interface RoomState {
  roomId: string;
  nValue: number;
  stimulusInterval: number; // milliseconds
  baseInterval: number;
  sequence: Stimulus[];
  currentIndex: number;
  players: Map<string, PlayerState>;
  isRunning: boolean;
  speedLevel: number; // 0 = normal, increases with mistakes
  maxSpeedLevel: number;
}

export interface GameConfig {
  nValue: number;
  totalStimuli: number;
  baseInterval: number;
  speedStep: number; // how much to reduce interval per speed level
  maxSpeedLevel: number;
  mistakesForSpeedUp: number; // mistakes needed to increase speed
}

export const DEFAULT_CONFIG: GameConfig = {
  nValue: 2,
  totalStimuli: 30,
  baseInterval: 1500,
  speedStep: 300,
  maxSpeedLevel: 5,
  mistakesForSpeedUp: 3,
};

/**
 * Generates a random sequence of stimuli ensuring proper N-back challenges
 */
export function generateSequence(config: GameConfig): Stimulus[] {
  const sequence: Stimulus[] = [];
  
  for (let i = 0; i < config.totalStimuli; i++) {
    // 30% chance to create a match at valid positions (after index n)
    const canMatch = i >= config.nValue;
    const shouldMatch = canMatch && Math.random() < 0.3;
    
    let position: GridPosition;
    
    if (shouldMatch) {
      // Match with position n steps back
      position = sequence[i - config.nValue].position;
    } else {
      // Random position (avoid accidental matches)
      do {
        position = Math.floor(Math.random() * 9) as GridPosition;
      } while (canMatch && position === sequence[i - config.nValue].position);
    }
    
    sequence.push({
      sequenceIndex: i,
      position,
    });
  }
  
  return sequence;
}

/**
 * Creates a new room state with initial configuration
 */
export function createRoomState(
  roomId: string,
  config: Partial<GameConfig> = {}
): RoomState {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const sequence = generateSequence(mergedConfig);
  
  return {
    roomId,
    nValue: mergedConfig.nValue,
    stimulusInterval: mergedConfig.baseInterval,
    baseInterval: mergedConfig.baseInterval,
    sequence,
    currentIndex: 0,
    players: new Map(),
    isRunning: false,
    speedLevel: 0,
    maxSpeedLevel: mergedConfig.maxSpeedLevel,
  };
}

/**
 * Adds a player to the room
 */
export function addPlayer(
  room: RoomState,
  userId: string,
  isBot: boolean = false,
  botAccuracy: number = 0
): PlayerState {
  const player: PlayerState = {
    userId,
    isBot,
    botAccuracy: isBot ? botAccuracy : undefined,
    score: 0,
    mistakes: 0,
    correctAnswers: 0,
    lastResponse: null,
  };
  
  room.players.set(userId, player);
  return player;
}

/**
 * Removes a player from the room
 */
export function removePlayer(room: RoomState, userId: string): void {
  room.players.delete(userId);
}

/**
 * Validates a player's answer
 * @returns { correct: boolean; isNewMistake: boolean }
 */
export function validateAnswer(
  room: RoomState,
  userId: string,
  playerAnswer: boolean // true = player claims match, false = player claims no match
): { correct: boolean; isNewMistake: boolean } {
  const player = room.players.get(userId);
  if (!player) {
    throw new Error(`Player ${userId} not found in room ${room.roomId}`);
  }
  
  const currentIndex = room.currentIndex;
  const nValue = room.nValue;
  
  // Can only answer if we're past the Nth stimulus
  if (currentIndex < nValue) {
    return { correct: true, isNewMistake: false }; // No answer expected yet
  }
  
  const currentStimulus = room.sequence[currentIndex - 1];
  const nBackStimulus = room.sequence[currentIndex - 1 - nValue];
  
  const actualMatch = currentStimulus.position === nBackStimulus.position;
  const correct = playerAnswer === actualMatch;
  
  player.lastResponse = playerAnswer;
  
  if (correct) {
    player.score += 10;
    player.correctAnswers += 1;
  } else {
    player.mistakes += 1;
  }
  
  return { correct, isNewMistake: !correct };
}

/**
 * Checks if speed should be increased based on total mistakes
 */
export function checkSpeedIncrease(room: RoomState): boolean {
  let totalMistakes = 0;
  for (const player of room.players.values()) {
    totalMistakes += player.mistakes;
  }
  
  const newSpeedLevel = Math.floor(totalMistakes / DEFAULT_CONFIG.mistakesForSpeedUp);
  
  if (newSpeedLevel > room.speedLevel && newSpeedLevel <= room.maxSpeedLevel) {
    room.speedLevel = newSpeedLevel;
    room.stimulusInterval = Math.max(
      room.baseInterval - (room.speedLevel * DEFAULT_CONFIG.speedStep),
      DEFAULT_CONFIG.speedStep * 2 // Minimum interval
    );
    return true;
  }
  
  return false;
}

/**
 * Gets the current stimulus (for display)
 */
export function getCurrentStimulus(room: RoomState): Stimulus | null {
  if (room.currentIndex >= room.sequence.length) {
    return null;
  }
  return room.sequence[room.currentIndex];
}

/**
 * Advances to the next stimulus
 */
export function advanceStimulus(room: RoomState): void {
  if (room.currentIndex < room.sequence.length) {
    room.currentIndex += 1;
    
    // Check for speed increase after mistakes
    checkSpeedIncrease(room);
  }
}

/**
 * Simulates a bot response
 */
export function simulateBotResponse(player: PlayerState, actualMatch: boolean): boolean {
  if (!player.isBot || player.botAccuracy === undefined) {
    throw new Error('Not a bot player');
  }
  
  // Bot decides based on accuracy percentage
  const shouldRespondCorrectly = Math.random() * 100 < player.botAccuracy;
  
  if (shouldRespondCorrectly) {
    return actualMatch;
  } else {
    return !actualMatch;
  }
}

/**
 * Gets game progress
 */
export function getGameProgress(room: RoomState): {
  progress: number;
  currentStimulus: Stimulus | null;
  isComplete: boolean;
} {
  const progress = (room.currentIndex / room.sequence.length) * 100;
  const isComplete = room.currentIndex >= room.sequence.length;
  const currentStimulus = isComplete ? null : room.sequence[room.currentIndex];
  
  return { progress, currentStimulus, isComplete };
}

/**
 * Gets player rankings
 */
export function getPlayerRankings(room: RoomState): Array<{
  userId: string;
  isBot: boolean;
  score: number;
  mistakes: number;
  correctAnswers: number;
  rank: number;
}> {
  const players = Array.from(room.players.entries())
    .map(([userId, player]) => ({
      userId,
      isBot: player.isBot,
      score: player.score,
      mistakes: player.mistakes,
      correctAnswers: player.correctAnswers,
    }))
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  
  return players;
}

/**
 * Resets player responses for new stimulus
 */
export function resetPlayerResponses(room: RoomState): void {
  for (const player of room.players.values()) {
    player.lastResponse = null;
  }
}
