import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiKey = process.env.PUBLIC_API_KEY || 'yarvo_pub_prod_kwalee_7890abcdef';

    const res = await fetch(`${apiUrl}/api/v1/public/event-bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to submit event booking request' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, data: data.data || data });
  } catch (error: any) {
    console.error('Submit event booking error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
