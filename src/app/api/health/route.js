import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint to verify database connection
 */
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Count records to verify tables exist
    const urlCount = await prisma.trackedUrl.count();
    const configCount = await prisma.config.count();
    
    return NextResponse.json({
      ok: true,
      status: 'healthy',
      database: 'connected',
      tables: {
        trackedUrls: urlCount,
        config: configCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
