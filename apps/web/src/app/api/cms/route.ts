import { NextResponse } from 'next/server';
import { DEFAULT_CMS_CONTENT, mergeWithDefaultContent } from '@/lib/default-cms-content';

function getApiConfig() {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiKey = process.env.PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef';
  return { apiUrl, apiKey };
}

export async function GET() {
  try {
    const { apiUrl, apiKey } = getApiConfig();
    const res = await fetch(`${apiUrl}/api/v1/public/website-content`, {
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_CMS_CONTENT,
        propertyId: null,
      });
    }

    const payload = await res.json();
    const result = payload.data || payload;
    const merged = mergeWithDefaultContent(result?.content || result);

    return NextResponse.json({
      success: true,
      data: merged,
      propertyId: result?.propertyId || null,
    });
  } catch (error) {
    console.error('Failed to fetch CMS content:', error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_CMS_CONTENT,
      propertyId: null,
    });
  }
}

export async function POST(request: Request) {
  try {
    const { apiUrl, apiKey } = getApiConfig();
    const body = await request.json();
    const content = body.content !== undefined ? body.content : body;

    if (!content) {
      return NextResponse.json({ success: false, error: 'No content provided' }, { status: 400 });
    }

    const updateRes = await fetch(`${apiUrl}/api/v1/public/website-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ content }),
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      return NextResponse.json({
        success: false,
        error: updateData.message || 'Failed to update CMS content'
      }, { status: updateRes.status });
    }

    const saved = updateData.data?.websiteContent || updateData.data || content;
    return NextResponse.json({
      success: true,
      data: mergeWithDefaultContent(saved),
      message: 'Website content saved successfully'
    });
  } catch (error: any) {
    console.error('Failed to update CMS content:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
