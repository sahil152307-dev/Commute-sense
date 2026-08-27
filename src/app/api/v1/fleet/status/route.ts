import { NextResponse } from 'next/server';
import { routes, vehicles } from '@/lib/mock-data';

export async function GET() {
  const fleetStatus = routes.map(route => {
    const routeVehicles = vehicles.filter(v => v.routeId === route.routeId);
    const totalPassengers = routeVehicles.reduce((sum, v) => sum + v.passengers, 0);
    const totalCapacity = routeVehicles.reduce((sum, v) => sum + v.capacity, 0);
    const utilizationPct = totalCapacity > 0 ? Math.round((totalPassengers / totalCapacity) * 100) : 0;

    return {
      routeId: route.routeId,
      routeName: route.routeName,
      congestionIndex: utilizationPct > 85 ? 'High' : utilizationPct > 50 ? 'Moderate' : 'Low',
      utilizationPct,
      currentDemand: totalPassengers,
      totalCapacity,
      activeVehicles: routeVehicles.map(v => v.vehicleId),
      vehicleCount: routeVehicles.length,
      routeColor: route.routeColor,
    };
  });

  const idleVehicles = vehicles.filter(v => v.status === 'idle');
  const alerts = routes
    .filter(r => r.currentDemand > 85)
    .map(r => ({
      type: 'OVERCROWDING',
      routeId: r.routeId,
      routeName: r.routeName,
      demand: r.currentDemand,
      message: `${r.routeName} at ${r.currentDemand}% capacity. Immediate dispatch recommended.`,
      timestamp: new Date().toISOString(),
    }));

  // Telematics alerts
  const telematicsAlerts = [
    {
      type: 'DROWSINESS',
      vehicleId: 'BUS_101',
      driverId: 'DRV_882',
      driverName: 'Rajesh Kumar',
      earRatio: 0.18,
      message: 'DROWSINESS ALERT: Driver Rajesh Kumar (BUS_101) – EAR ratio 0.18 below threshold.',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'DROWSINESS',
      vehicleId: 'BUS_107',
      driverId: 'DRV_221',
      driverName: 'Amit Singh',
      earRatio: 0.12,
      message: 'DROWSINESS ALERT: Driver Amit Singh (BUS_107) – EAR ratio 0.12 CRITICAL.',
      timestamp: new Date().toISOString(),
    },
  ];

  return NextResponse.json({
    success: true,
    routes: fleetStatus,
    idleVehicles: idleVehicles.map(v => v.vehicleId),
    alerts: [...alerts, ...telematicsAlerts],
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    timestamp: new Date().toISOString(),
  });
}
