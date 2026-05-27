import { auth } from '@/server/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextResponse } from 'next/server';

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

export async function GET(request: Request) {
  const response = await authGet(request);
  return addCorsHeaders(response);
}

export async function POST(request: Request) {
  const response = await authPost(request);
  return addCorsHeaders(response);
}

export async function PATCH(request: Request) {
  const response = await authPost(request);
  return addCorsHeaders(response);
}

export async function PUT(request: Request) {
  const response = await authPost(request);
  return addCorsHeaders(response);
}

export async function DELETE(request: Request) {
  const response = await authGet(request);
  return addCorsHeaders(response);
}

export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

function addCorsHeaders(response: Response) {
  const origin = '*'; // Для production замените на ваш домен
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', origin);
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  return newResponse;
}