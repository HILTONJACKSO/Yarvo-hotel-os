import { NextResponse, NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

function findFilePath(filename: string): string | null {
  const candidates = [
    '/app/uploads',
    '/app/apps/web/public/uploads',
    join(process.cwd(), 'apps/web/public/uploads'),
    join(process.cwd(), 'public/uploads'),
    '/app/public/uploads'
  ];

  for (const dir of candidates) {
    const fullPath = join(dir, filename);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await context.params;
    const decodedFilename = decodeURIComponent(filename);

    const filePath = findFilePath(decodedFilename) || findFilePath(filename);

    if (!filePath) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    // Guess mime type based on extension
    let contentType = 'application/octet-stream';
    const lower = filename.toLowerCase();
    if (lower.endsWith('.png')) contentType = 'image/png';
    else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (lower.endsWith('.gif')) contentType = 'image/gif';
    else if (lower.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (lower.endsWith('.webp')) contentType = 'image/webp';

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

export async function HEAD(request: NextRequest, context: { params: Promise<{ filename: string }> }) {
  return GET(request, context);
}
