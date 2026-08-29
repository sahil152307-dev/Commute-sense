import { NextResponse } from 'next/server';
import { vehicles, calculateSafestRoute, mapNodes } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicleId, emergencyStopId } = body;

    const vehicle = vehicles.find(v => v.vehicleId === vehicleId);
    const targetNode = mapNodes.find(n => n.id === emergencyStopId);

    if (!vehicle) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }
    if (!targetNode) {
      return NextResponse.json({ success: false, error: 'Emergency location not found' }, { status: 404 });
    }

    // Calculate safest route from vehicle's current position to emergency location
    const idleNode = mapNodes.find(n => n.name.includes('Central') || n.name.includes('Thane'));
    const fromX = idleNode?.x ?? 300;
    const fromY = idleNode?.y ?? 280;
    const toX = targetNode.x;
    const toY = targetNode.y;

    const routeData = calculateSafestRoute(fromX, fromY, toX, toY);

    // Update vehicle status
    vehicle.status = 'active';
    vehicle.speedKmph = 30;
    vehicle.passengers = 0;
    vehicle.routeId = 'EMERGENCY';

    return NextResponse.json({
      success: true,
      message: `${vehicleId} dispatched to ${targetNode.name} via safest route.`,
      vehicleId,
      targetLocation: targetNode.name,
      targetCoordinates: { lat: targetNode.lat ?? 0, lng: targetNode.lng ?? 0 },
      routeData,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
