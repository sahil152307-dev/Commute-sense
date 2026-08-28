import { NextResponse } from 'next/server';
import { stations, routes, vehicles, etaData } from '@/lib/mock-data';

// Haversine distance between two lat/lng points (km)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Random integer within [min, max]
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float within [min, max] with given decimals
function randFloat(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

interface TransportOption {
  mode: string;
  icon: string;
  etaMinutes: number;
  fare: number;
  distance: string;
  availability: string;
  advantage: string;
  color: string;
  recommended: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('stationId');
  const destinationParam = searchParams.get('destination');

  // Validate stationId
  if (!stationId) {
    return NextResponse.json(
      { error: 'stationId query parameter is required' },
      { status: 400 },
    );
  }

  const station = stations.find(s => s.id === stationId);
  if (!station) {
    return NextResponse.json(
      { error: `Station ${stationId} not found` },
      { status: 404 },
    );
  }

  // Determine destination: use provided param or pick next station on a route
  let destinationName: string;
  let destinationStation = stations.find(s => s.name === destinationParam);

  if (destinationParam && destinationStation) {
    destinationName = destinationStation.name;
  } else if (destinationParam) {
    // Destination name provided but not found in stations — use as-is
    destinationName = destinationParam;
  } else {
    // Pick the next station on any route serving the selected station
    const servingRoutes = routes.filter(r =>
      r.stops.some(s => s.stopId === stationId),
    );

    if (servingRoutes.length > 0) {
      // Pick a random route that serves this station
      const route = servingRoutes[randInt(0, servingRoutes.length - 1)];
      const currentIdx = route.stops.findIndex(s => s.stopId === stationId);
      // Pick next station if available, else previous
      const nextIdx =
        currentIdx < route.stops.length - 1 ? currentIdx + 1 : currentIdx - 1;
      destinationName = route.stops[nextIdx].name;
    } else {
      destinationName = 'Nearest Hub';
    }
  }

  // Calculate approximate distance
  const destCoords = destinationStation
    ? { lat: destinationStation.lat || 19.08, lng: destinationStation.lng || 72.88 }
    : null;
  const stationCoords = (() => {
    // Find coordinates from routes' stops
    for (const r of routes) {
      const stop = r.stops.find(s => s.stopId === stationId);
      if (stop) return { lat: stop.lat, lng: stop.lng };
    }
    return { lat: 19.076, lng: 72.8777 };
  })();

  // Base distance: if we have both coords, use haversine; otherwise estimate 3-10 km
  const baseDistanceKm = destCoords
    ? haversineKm(stationCoords.lat, stationCoords.lng, destCoords.lat, destCoords.lng)
    : randFloat(3.0, 10.0);

  // Road distance is ~1.3-1.5x straight-line distance
  const roadDistanceKm = randFloat(baseDistanceKm * 1.25, baseDistanceKm * 1.5);
  const walkDistanceKm = randFloat(baseDistanceKm * 0.9, baseDistanceKm * 1.1);

  // ---- Bus ETA ----
  const servingRoutes = routes.filter(r =>
    r.stops.some(s => s.stopId === stationId),
  );
  const congestionLevel = servingRoutes.length > 0
    ? servingRoutes.reduce(
        (worst, r) =>
          r.congestionIndex === 'High' && worst !== 'High'
            ? r.congestionIndex
            : worst,
        servingRoutes[0].congestionIndex,
      )
    : 'Moderate';

  const busBaseEta = Math.round((roadDistanceKm / 20) * 60); // ~20 km/h avg bus speed
  const congestionMultiplier =
    congestionLevel === 'High' ? 1.8 : congestionLevel === 'Moderate' ? 1.3 : 1.0;
  const peakMultiplier = etaData.peakFactor;
  const weatherMultiplier = etaData.weatherFactor;
  const randomVariation = randFloat(0.85, 1.15);
  const busEta = Math.round(
    busBaseEta * congestionMultiplier * peakMultiplier * weatherMultiplier * randomVariation,
  );

  const busAvailable = busEta <= 15;
  const busDelayReasons = [
    'Traffic congestion',
    'Signal delays',
    'Road work ahead',
    'Peak hour rush',
    'Accident on route',
    'Bus breakdown reported',
    'Heavy rainfall slowing traffic',
  ];
  const busDelayReason = busAvailable
    ? (congestionLevel === 'High' ? 'Traffic congestion' : 'Minor delays')
    : busDelayReasons[randInt(0, busDelayReasons.length - 1)];

  // ---- Alternative Transport Options ----
  const transports: TransportOption[] = [];

  // 1. Metro
  const metroBaseEta = Math.round((roadDistanceKm / 45) * 60); // ~45 km/h avg metro
  const metroEta = Math.max(3, Math.round(metroBaseEta * randFloat(0.9, 1.1)));
  const metroFare = Math.min(40, Math.max(10, Math.round(roadDistanceKm * 4.5 + randInt(-3, 3))));
  const metroNearby = randInt(1, 5);
  transports.push({
    mode: 'Metro',
    icon: 'train-front',
    etaMinutes: metroEta,
    fare: metroFare,
    distance: `${randFloat(roadDistanceKm * 0.85, roadDistanceKm * 1.0)} km`,
    availability: metroNearby >= 2 ? `Available (${metroNearby} nearby)` : 'Available',
    advantage: busEta > metroEta
      ? `Faster than bus, no traffic`
      : 'Air-conditioned, reliable schedule',
    color: '#f59e0b',
    recommended: false,
  });

  // 2. Auto Rickshaw
  const autoBaseEta = Math.round((roadDistanceKm / 25) * 60); // ~25 km/h
  const autoCongestionMult = congestionLevel === 'High' ? 1.4 : congestionLevel === 'Moderate' ? 1.15 : 1.0;
  const autoEta = Math.max(5, Math.round(autoBaseEta * autoCongestionMult * randFloat(0.9, 1.1)));
  const autoBaseFare = 25; // Mumbai auto base fare
  const autoPerKmFare = 15; // ~15 INR/km after first km
  const autoFare = Math.round(
    autoBaseFare + Math.max(0, roadDistanceKm - 1) * autoPerKmFare + randInt(-10, 10),
  );
  const autoNearby = randInt(2, 8);
  transports.push({
    mode: 'Auto Rickshaw',
    icon: 'car',
    etaMinutes: autoEta,
    fare: autoFare,
    distance: `${randFloat(roadDistanceKm * 0.95, roadDistanceKm * 1.05)} km`,
    availability: `Available (${autoNearby} nearby)`,
    advantage: 'Door-to-door, flexible route',
    color: '#22c55e',
    recommended: false,
  });

  // 3. E-Rickshaw
  const erickBaseEta = Math.round((roadDistanceKm / 15) * 60); // ~15 km/h
  const erickEta = Math.max(8, Math.round(erickBaseEta * randFloat(0.9, 1.15)));
  const erickFare = Math.min(30, Math.max(10, Math.round(roadDistanceKm * 7 + randInt(-3, 3))));
  const erickNearby = randInt(1, 4);
  transports.push({
    mode: 'E-Rickshaw',
    icon: 'zap',
    etaMinutes: erickEta,
    fare: erickFare,
    distance: `${randFloat(walkDistanceKm * 0.8, walkDistanceKm * 1.0)} km`,
    availability: `Available (${erickNearby} nearby)`,
    advantage: 'Cheapest option, eco-friendly',
    color: '#a855f7',
    recommended: false,
  });

  // 4. Cab / Ola / Uber
  const cabBaseEta = Math.round((roadDistanceKm / 30) * 60); // ~30 km/h
  const cabCongestionMult = congestionLevel === 'High' ? 1.35 : congestionLevel === 'Moderate' ? 1.1 : 1.0;
  const cabEta = Math.max(5, Math.round(cabBaseEta * cabCongestionMult * randFloat(0.85, 1.15)));
  const cabBaseFare = 80;
  const cabPerKmFare = 18;
  const cabFare = Math.round(
    cabBaseFare + Math.max(0, roadDistanceKm - 2) * cabPerKmFare + randInt(-15, 15),
  );
  const cabNearby = randInt(3, 10);
  transports.push({
    mode: 'Cab / Ola / Uber',
    icon: 'car',
    etaMinutes: cabEta,
    fare: cabFare,
    distance: `${randFloat(roadDistanceKm * 0.95, roadDistanceKm * 1.05)} km`,
    availability: `Available (${cabNearby} nearby)`,
    advantage: 'Comfortable, AC, direct route',
    color: '#14b8a6',
    recommended: false,
  });

  // 5. Walking
  const walkSpeedKmph = 4.5;
  const walkEta = Math.round((walkDistanceKm / walkSpeedKmph) * 60);
  transports.push({
    mode: 'Walking',
    icon: 'footprints',
    etaMinutes: walkEta,
    fare: 0,
    distance: `${randFloat(walkDistanceKm * 0.9, walkDistanceKm * 1.0)} km`,
    availability: 'Always',
    advantage: walkDistanceKm < 2 ? 'Free, short walk' : 'Free, good for health',
    color: '#94a3b8',
    recommended: false,
  });

  // Sort by ETA (fastest first)
  transports.sort((a, b) => a.etaMinutes - b.etaMinutes);

  // Mark the fastest non-walking option as recommended (unless it's walking)
  // If the fastest is walking, recommend the next fastest
  const fastestNonWalk = transports.find(t => t.mode !== 'Walking');
  if (fastestNonWalk) {
    fastestNonWalk.recommended = true;
  }

  // Generate suggestion
  const recommended = transports.find(t => t.recommended);
  const timeSaved = busEta - (recommended?.etaMinutes ?? 0);
  let suggestion: string;

  if (!busAvailable) {
    suggestion = `Bus is delayed by ${busEta} min. ${recommended?.mode} is the fastest alternative (${recommended?.etaMinutes} min). Take ${recommended?.mode} from ${station.name} to ${destinationName}.`;
  } else if (timeSaved > 0) {
    suggestion = `${recommended?.mode} is ${timeSaved} min faster than bus. Take ${recommended?.mode} from ${station.name} to ${destinationName}.`;
  } else {
    suggestion = `Bus is on time (${busEta} min). ${recommended?.mode} takes ${recommended?.etaMinutes} min from ${station.name} to ${destinationName}.`;
  }

  return NextResponse.json({
    from: station.name,
    to: destinationName,
    busAvailable,
    busEtaMinutes: busEta,
    busDelayReason,
    transports,
    suggestion,
  });
}
