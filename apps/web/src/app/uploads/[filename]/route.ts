import { NextResponse, NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest, context: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await context.params;
    
    // Support local dev environment and production standalone Docker
    const isProduction = process.env.NODE_ENV === 'production';
    const uploadDir = isProduction 
      ? join(process.cwd(), 'apps/web/public/uploads') 
      : join(process.cwd(), 'public/uploads');

    const filePath = join(uploadDir, filename);

    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    // Guess mime type based on extension
    let contentType = 'application/octet-stream';
    if (filename.toLowerCase().endsWith('.png')) contentType = 'image/png';
    else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (filename.toLowerCase().endsWith('.gif')) contentType = 'image/gif';
    else if (filename.toLowerCase().endsWith('.svg')) contentType = 'image/svg+xml';
    else if (filename.toLowerCase().endsWith('.webp')) contentType = 'image/webp';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
