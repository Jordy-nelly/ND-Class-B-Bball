import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const dataDir = join(process.cwd(), 'data');
    const jsonPath = join(dataDir, 'research-report.json');
    const mdPath = join(dataDir, 'research-report.md');

    const response: {
      exists: boolean;
      json?: unknown;
      markdown?: string;
      lastModified?: string;
    } = {
      exists: false
    };

    if (existsSync(jsonPath)) {
      const jsonContent = readFileSync(jsonPath, 'utf-8');
      response.json = JSON.parse(jsonContent);
      response.exists = true;
      
      const stats = await import('fs').then(fs => fs.statSync(jsonPath));
      response.lastModified = stats.mtime.toISOString();
    }

    if (existsSync(mdPath)) {
      response.markdown = readFileSync(mdPath, 'utf-8');
    }

    if (!response.exists) {
      return NextResponse.json(
        { 
          exists: false, 
          message: 'No research report found. Run the research agent first.' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
