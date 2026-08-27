import { NextResponse } from 'next/server';
import { crowdData, simulateCrowdFluctuation, classifyDensity } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stopId = searchParams.get('stopId');

  if (stopId) {
    const stop = crowdData.find(c => c.stopId === stopId);
    if (!stop) {
      return NextResponse.json({ success: false, error: 'Stop not found' }, { status: 404 });
    }
    const count = simulateCrowdFluctuation(stop.currentCount);
    const density = classifyDensity(count);
    return NextResponse.json({
      success: true,
      stopId: stop.stopId,
      stopName: stop.stopName,
      currentCount: count,
      densityStatus: density.status,
      recommendedAction: count > 15 ? 'DISPATCH_EXTRA_BUS' : 'MONITOR',
      cameraId: stop.cameraId,
    });
  }

  const allStops = crowdData.map(stop => {
    const count = simulateCrowdFluctuation(stop.currentCount);
    const density = classifyDensity(count);
    return {
      stopId: stop.stopId,
      stopName: stop.stopName,
      currentCount: count,
      densityStatus: density.status,
      recommendedAction: count > 15 ? 'DISPATCH_EXTRA_BUS' : count > 5 ? 'MONITOR' : 'NONE',
      cameraId: stop.cameraId,
    };
  });

  const anyHigh = allStops.some(s => s.densityStatus === 'HIGH');

  return NextResponse.json({
    success: true,
    stops: allStops,
    systemAlert: anyHigh ? 'OVERCROWDING_DETECTED' : null,
    timestamp: new Date().toISOString(),
  });
}
