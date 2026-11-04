import { NextResponse } from 'next/server';

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/newsletter`, {
      headers: { 'x-api-key': API_KEY },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json({
      success: res.ok,
      data: json?.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, data: [], error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/api/v1/public/newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ email: body.email }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: json?.message || 'Failed to subscribe to newsletter.' },
        { status: res.status }
      );
    }
    return NextResponse.json({
      success: true,
      data: json?.data || json,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Network error subscribing to newsletter.' },
      { status: 500 }
    );
  }
}
