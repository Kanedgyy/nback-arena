import { auth } from '@/server/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextResponse } from 'next/server';

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

export async function GET(request: Request) {
  try {
    const response = await authGet(request);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Auth GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const response = await authPost(request);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Auth POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const response = await authPost(request);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Auth PATCH error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const response = await authPost(request);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Auth PUT error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const response = await authGet(request);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Auth DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

function addCorsHeaders(response: Response) {
  const origin = '*';
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', origin);
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  return newResponse;
}