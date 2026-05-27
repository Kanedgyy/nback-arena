import { auth } from '@/server/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextResponse } from 'next/server';

const { handler } = toNextJsHandler(auth);

export async function GET(request: Request) {
  const response = await handler(request);
  addCorsHeaders(response);
  return response;
}

export async function POST(request: Request) {
  const response = await handler(request);
  addCorsHeaders(response);
  return response;
}

function addCorsHeaders(response: Response) {
  const origin = '*'; // Для production замените на ваш домен
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, { status: 200 });
  addCorsHeaders(response);
  return response;
}