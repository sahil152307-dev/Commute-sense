import { NextResponse } from 'next/server';
import { telematicsData } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');

  const data = vehicleId
    ? telematicsData.filter(t => t.vehicleId === vehicleId)
    : telematicsData;

  // Simulate real-time fluctuation
  const enriched = data.map(t => ({
    ...t,
    speedKmph: t.speedKmph + Math.floor(Math.random() * 6) - 3,
    earRatio: Math.max(0.05, t.earRatio + (Math.random() * 0.06 - 0.03)),
    stabilityScore: Math.min(100, Math.max(0, t.stabilityScore + Math.floor(Math.random() * 4) - 2)),
    harshBrakingEvents: t.harshBrakingEvents + (Math.random() > 0.8 ? 1 : 0),
    timestamp: new Date().toISOString(),
  }));

  return NextResponse.json({
    success: true,
    telematics: enriched,
    alertCount: enriched.filter(t => t.drowsinessFlag || t.earRatio < 0.2).length,
    timestamp: new Date().toISOString(),
  });
}
