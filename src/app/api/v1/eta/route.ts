import { NextResponse } from 'next/server';
import { routes, etaData, stations } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('stationId');

  const station = stations.find(s => s.id === stationId);

  const stationETAs = station
    ? station.routeIds.map(rId => {
        const route = routes.find(r => r.routeId === rId);
        const baseMinutes = 8 + Math.floor(Math.random() * 15);
        const weatherAdj = etaData.weatherFactor;
        const peakAdj = etaData.peakFactor;
        const congestionAdj = route?.congestionIndex === 'High' ? 1.3 : route?.congestionIndex === 'Moderate' ? 1.15 : 1.0;
        const eta = Math.round(baseMinutes * weatherAdj * peakAdj * congestionAdj);
        return {
          routeId: rId,
          routeName: route?.routeName ?? rId,
          routeColor: route?.routeColor ?? '#14b8a6',
          etaMinutes: eta,
          congestionLevel: (route?.congestionIndex ?? 'Low') as 'Low' | 'Moderate' | 'High',
          nextVehicleId: route?.activeVehicles[0] ?? 'N/A',
          passengerCount: route ? Math.floor(route.currentDemand / Math.max(route.activeVehicles.length, 1)) : 0,
          vehicleCapacity: route ? Math.floor(route.capacity / Math.max(route.activeVehicles.length, 1)) : 40,
        };
      })
    : [];

  return NextResponse.json({
    stationId: stationId ?? '',
    stationName: station?.name ?? 'All Stations',
    weather: {
      weather: etaData.weather,
      weatherFactor: etaData.weatherFactor,
      temperature: 32,
    },
    congestionZones: etaData.congestionZones,
    routes: stationETAs,
    updatedAt: new Date().toISOString(),
  });
}
