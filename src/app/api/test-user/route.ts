import { NextResponse } from 'next/server';
import { db, sql } from '@/server/db';
import { users } from '@/server/db/schema';

export async function POST() {
  try {
    // Создать тестового пользователя
    const testEmail = `test-${Date.now()}@example.com`;
    
    const result = await db.insert(users).values({
      email: testEmail,
      name: 'Test User',
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Test user created',
      user: result[0],
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      message: 'Failed to create test user',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Получить всех пользователей
    const allUsers = await db.select().from(users).limit(10);

    return NextResponse.json({
      success: true,
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      message: 'Failed to fetch users',
    }, { status: 500 });
  }
}