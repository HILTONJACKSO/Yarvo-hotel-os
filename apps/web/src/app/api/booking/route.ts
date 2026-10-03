import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiKey = process.env.PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef';

    const res = await fetch(`${apiUrl}/api/public/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.message || 'Booking failed' }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiKey = process.env.PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef';

    const res = await fetch(`${apiUrl}/api/public/room-types`, {
      headers: {
        'x-api-key': apiKey,
      },
      // Avoid caching since room types/rates can change
      cache: 'no-store'
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.message }, { status: res.status });
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error('Fetch room types error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
