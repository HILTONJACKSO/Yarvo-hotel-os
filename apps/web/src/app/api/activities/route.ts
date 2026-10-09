import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiKey = process.env.PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef';

    const res = await fetch(`${apiUrl}/api/v1/public/activities`, {
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store'
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.message }, { status: res.status });
    }

    return NextResponse.json({ success: true, data: data.data || data });
  } catch (error) {
    console.error('Fetch activities error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
