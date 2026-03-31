import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/cron-runs — recent run history with costs
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [runs, monthAgg] = await Promise.all([
    prisma.cronRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    }),
    prisma.cronRun.aggregate({
      where: {
        startedAt: { gte: monthStart },
        status: 'completed',
      },
      _sum: { estimatedCost: true, apiCalls: true },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    runs,
    monthSummary: {
      totalCost: Math.round((monthAgg._sum.estimatedCost || 0) * 100) / 100,
      totalCalls: monthAgg._sum.apiCalls || 0,
      runCount: monthAgg._count,
    },
  });
}
