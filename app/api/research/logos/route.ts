import { NextResponse } from 'next/server';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const logosDir = join(process.cwd(), 'public', 'logos');

    if (!existsSync(logosDir)) {
      return NextResponse.json({
        exists: false,
        count: 0,
        logos: []
      });
    }

    const files = readdirSync(logosDir);
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];
    
    const logos = files
      .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
      .map(file => ({
        filename: file,
        url: `/logos/${file}`,
        school: file.replace(/\.[^/.]+$/, '').replace(/-/g, ' ')
      }));

    return NextResponse.json({
      exists: true,
      count: logos.length,
      logos
    });

  } catch (error) {
    console.error('Logos API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
