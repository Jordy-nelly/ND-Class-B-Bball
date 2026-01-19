import { NextRequest, NextResponse } from 'next/server';

// Dynamic import for the research agent (Node.js only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, options = {} } = body;

    // Note: The research agent uses Node.js-specific modules (playwright, better-sqlite3)
    // These won't work in Edge runtime, so we spawn a child process
    const { spawn } = await import('child_process');
    const path = await import('path');
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'research', 'index.js');
    
    // Build command args based on action
    const args: string[] = [];
    
    switch (action) {
      case 'test':
        args.push('--test');
        break;
      case 'logos':
        args.push('--logos-only');
        if (options.limit) args.push(`--limit=${options.limit}`);
        break;
      case 'validate':
        args.push('--validate-only');
        break;
      case 'full':
      default:
        if (options.limit) args.push(`--limit=${options.limit}`);
        break;
    }

    // Return immediately with job started status
    // The actual scraping runs in background
    const child = spawn('node', [scriptPath, ...args], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore'
    });
    
    child.unref();

    return NextResponse.json({
      success: true,
      message: `Research agent started with action: ${action}`,
      pid: child.pid,
      args
    });

  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Research Agent API',
    endpoints: {
      'POST /api/research': {
        description: 'Start research agent',
        body: {
          action: 'test | logos | validate | full',
          options: {
            limit: 'number (optional, default 50)'
          }
        }
      }
    }
  });
}
