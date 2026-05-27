import { NextResponse } from 'next/server';
import { db, sql } from '@/server/db';
import { users, rooms, roomPlayers, gameResults } from '@/server/db/schema';

export async function GET() {
  try {
    // Проверка подключения
    const result = await db.execute(sql`SELECT 1 as success`);
    
    // Проверка таблиц
    const usersCount = await db.select({ count: users.id }).from(users).then(r => r.length);
    const roomsCount = await db.select({ count: rooms.id }).from(rooms).then(r => r.length);
    const playersCount = await db.select({ count: roomPlayers.id }).from(roomPlayers).then(r => r.length);
    const resultsCount = await db.select({ count: gameResults.id }).from(gameResults).then(r => r.length);

    return NextResponse.json({
      success: true,
      database: 'connected',
      tables: {
        users: usersCount,
        rooms: roomsCount,
        room_players: playersCount,
        game_results: resultsCount,
      },
      message: 'Database is working properly',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      message: 'Database connection failed',
    }, { status: 500 });
  }
}
