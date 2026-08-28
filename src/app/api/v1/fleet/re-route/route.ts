import { NextResponse } from 'next/server';
import { vehicles, routes } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceRouteId, targetRouteId, vehicleId } = body;

    const vehicle = vehicles.find(v => v.vehicleId === vehicleId);
    const targetRoute = routes.find(r => r.routeId === targetRouteId);

    if (!vehicle) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }
    if (!targetRoute) {
      return NextResponse.json({ success: false, error: 'Target route not found' }, { status: 404 });
    }

    // Simulate re-routing
    vehicle.routeId = targetRouteId;
    vehicle.status = 'active';
    vehicle.speedKmph = 25;
    vehicle.passengers = 0;

    targetRoute.activeVehicles.push(vehicleId);

    return NextResponse.json({
      success: true,
      message: `${vehicleId} successfully re-routed to ${targetRoute.routeName}.`,
      updatedCapacityRelief: `${vehicle.capacity} Seats Added`,
      newRouteId: targetRouteId,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
