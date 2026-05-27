import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export async function GET() {
  try {
    // Проверка подключения к БД
    const session = await auth.api.getSession({
      headers: new Headers(),
    });

    return NextResponse.json({
      success: true,
      auth: 'configured',
      session: session ? 'found' : 'none',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      message: 'Auth configuration error',
    }, { status: 500 });
  }
}