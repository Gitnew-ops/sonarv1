import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics: Record<string, unknown> = {};
  
  try {
    // Check environment variables
    diagnostics.env = {
      NODE_ENV: process.env.NODE_ENV,
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET (hidden)' : 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
    };
    
    // Try to connect to database
    const { db } = await import('@/lib/db');
    
    // Try a simple query
    const userCount = await db.user.count();
    diagnostics.database = {
      status: 'CONNECTED',
      userCount,
    };
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      diagnostics
    });
  } catch (error) {
    diagnostics.error = error instanceof Error ? {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    } : 'Unknown error';
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      diagnostics
    }, { status: 500 });
  }
}
