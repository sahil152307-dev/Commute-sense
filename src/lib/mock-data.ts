// ============================================
// CommuteIQ - Mock Data Store
// Pre-seeded data for hackathon prototype
// ============================================

export interface Stop {
  stopId: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Route {
  routeId: string;
  routeName: string;
  routeColor: string;
  activeVehicles: string[];
  congestionIndex: 'Low' | 'Moderate' | 'High';
  currentDemand: number;
  capacity: number;
  stops: Stop[];
  path: [number, number][]; // SVG path coordinates for the city map
}

export interface Vehicle {
  vehicleId: string;
  type: 'bus' | 'metro' | 'e-rickshaw';
  routeId: string;
  speedKmph: number;
  passengers: number;
  capacity: number;
  lat: number;
  lng: number;
  status: 'active' | 'idle' | 'maintenance';
}

export interface TelematicsData {
  vehicleId: string;
  driverId: string;
  driverName: string;
  speedKmph: number;
  maxSpeed: number;
  harshBrakingEvents: number;
  harshAccelerationEvents: number;
  earRatio: number;
  drowsinessFlag: boolean;
  stabilityScore: number;
  fuelEfficiency: number;
  timestamp: string;
}

export interface CrowdData {
  stopId: string;
  stopName: string;
  currentCount: number;
  densityStatus: 'LOW' | 'MODERATE' | 'HIGH';
  recommendedAction: string;
  cameraId: string;
}

export interface JourneyStep {
  mode: 'walk' | 'bus' | 'metro' | 'e-rickshaw';
  from: string;
  to: string;
  duration: string;
  distance: string;
  fare: number;
  routeInfo?: string;
  color: string;
}

export interface JourneyPlan {
  totalDistance: string;
  totalDuration: string;
  totalFare: number;
  carbonSaved: string;
  steps: JourneyStep[];
}

// ---- ROUTES ----
export const routes: Route[] = [
  {
    routeId: 'route_101',
    routeName: 'Route 101 – Dadar to Andheri',
    routeColor: '#14b8a6',
    activeVehicles: ['BUS_101', 'BUS_102'],
    congestionIndex: 'High',
    currentDemand: 88,
    capacity: 120,
    stops: [
      { stopId: 'ST_01', name: 'Dadar Station', lat: 19.0183, lng: 72.8438 },
      { stopId: 'ST_02', name: 'Bandra Terminus', lat: 19.0544, lng: 72.8402 },
      { stopId: 'ST_03', name: 'Vile Parle', lat: 19.0900, lng: 72.8514 },
      { stopId: 'ST_04', name: 'Andheri East', lat: 19.1197, lng: 72.8464 },
    ],
    path: [[120, 180], [220, 200], [340, 190], [460, 175]],
  },
  {
    routeId: 'route_102',
    routeName: 'Route 102 – CSMT to Borivali',
    routeColor: '#f59e0b',
    activeVehicles: ['BUS_103', 'BUS_104', 'BUS_105'],
    congestionIndex: 'Moderate',
    currentDemand: 62,
    capacity: 120,
    stops: [
      { stopId: 'ST_05', name: 'CSMT', lat: 18.9398, lng: 72.8355 },
      { stopId: 'ST_06', name: 'Marine Drive', lat: 18.9433, lng: 72.8230 },
      { stopId: 'ST_07', name: 'Churchgate', lat: 18.9310, lng: 72.8285 },
      { stopId: 'ST_08', name: 'Malad', lat: 19.1564, lng: 72.8492 },
      { stopId: 'ST_09', name: 'Borivali West', lat: 19.2307, lng: 72.8567 },
    ],
    path: [[100, 350], [160, 320], [200, 300], [380, 260], [520, 240]],
  },
  {
    routeId: 'route_103',
    routeName: 'Route 103 – Thane to Mulund',
    routeColor: '#a855f7',
    activeVehicles: ['BUS_106'],
    congestionIndex: 'Low',
    currentDemand: 28,
    capacity: 80,
    stops: [
      { stopId: 'ST_10', name: 'Thane Station', lat: 19.2183, lng: 72.9781 },
      { stopId: 'ST_11', name: 'Mulund West', lat: 19.1750, lng: 72.9500 },
      { stopId: 'ST_12', name: 'Kanjurmarg', lat: 19.1480, lng: 72.9350 },
    ],
    path: [[550, 140], [480, 170], [420, 200]],
  },
  {
    routeId: 'route_104',
    routeName: 'Route 104 – City Center to Tech Hub',
    routeColor: '#ec4899',
    activeVehicles: ['BUS_107', 'BUS_108'],
    congestionIndex: 'High',
    currentDemand: 92,
    capacity: 100,
    stops: [
      { stopId: 'ST_01', name: 'Central Station', lat: 19.0760, lng: 72.8777 },
      { stopId: 'ST_02', name: 'IT Park', lat: 19.0880, lng: 72.8890 },
      { stopId: 'ST_13', name: 'Tech Hub', lat: 19.1000, lng: 72.9000 },
    ],
    path: [[200, 280], [300, 240], [420, 210]],
  },
];

// ---- VEHICLES ----
export const vehicles: Vehicle[] = [
  { vehicleId: 'BUS_101', type: 'bus', routeId: 'route_101', speedKmph: 35, passengers: 48, capacity: 60, lat: 19.06, lng: 72.85, status: 'active' },
  { vehicleId: 'BUS_102', type: 'bus', routeId: 'route_101', speedKmph: 28, passengers: 52, capacity: 60, lat: 19.09, lng: 72.84, status: 'active' },
  { vehicleId: 'BUS_103', type: 'bus', routeId: 'route_102', speedKmph: 42, passengers: 38, capacity: 60, lat: 19.05, lng: 72.84, status: 'active' },
  { vehicleId: 'BUS_104', type: 'bus', routeId: 'route_102', speedKmph: 0, passengers: 0, capacity: 60, lat: 19.15, lng: 72.84, status: 'active' },
  { vehicleId: 'BUS_105', type: 'bus', routeId: 'route_102', speedKmph: 22, passengers: 30, capacity: 60, lat: 19.20, lng: 72.85, status: 'active' },
  { vehicleId: 'BUS_106', type: 'bus', routeId: 'route_103', speedKmph: 45, passengers: 22, capacity: 40, lat: 19.20, lng: 72.96, status: 'active' },
  { vehicleId: 'BUS_107', type: 'bus', routeId: 'route_104', speedKmph: 18, passengers: 55, capacity: 50, lat: 19.08, lng: 72.88, status: 'active' },
  { vehicleId: 'BUS_108', type: 'bus', routeId: 'route_104', speedKmph: 38, passengers: 42, capacity: 50, lat: 19.09, lng: 72.89, status: 'active' },
  { vehicleId: 'BUS_109', type: 'bus', routeId: '', speedKmph: 0, passengers: 0, capacity: 60, lat: 19.12, lng: 72.90, status: 'idle' },
  { vehicleId: 'BUS_110', type: 'bus', routeId: '', speedKmph: 0, passengers: 0, capacity: 60, lat: 19.10, lng: 72.86, status: 'idle' },
  { vehicleId: 'METRO_01', type: 'metro', routeId: 'route_101', speedKmph: 80, passengers: 220, capacity: 300, lat: 19.07, lng: 72.84, status: 'active' },
  { vehicleId: 'METRO_02', type: 'metro', routeId: 'route_102', speedKmph: 75, passengers: 180, capacity: 300, lat: 19.10, lng: 72.84, status: 'active' },
  { vehicleId: 'ER_01', type: 'e-rickshaw', routeId: '', speedKmph: 15, passengers: 4, capacity: 6, lat: 19.09, lng: 72.87, status: 'active' },
  { vehicleId: 'ER_02', type: 'e-rickshaw', routeId: '', speedKmph: 12, passengers: 3, capacity: 6, lat: 19.11, lng: 72.88, status: 'idle' },
];

// ---- TELEMATICS ----
export const telematicsData: TelematicsData[] = [
  {
    vehicleId: 'BUS_101', driverId: 'DRV_882', driverName: 'Rajesh Kumar',
    speedKmph: 35, maxSpeed: 58, harshBrakingEvents: 2, harshAccelerationEvents: 1,
    earRatio: 0.18, drowsinessFlag: true, stabilityScore: 72, fuelEfficiency: 8.2,
    timestamp: new Date().toISOString(),
  },
  {
    vehicleId: 'BUS_103', driverId: 'DRV_445', driverName: 'Suresh Patel',
    speedKmph: 42, maxSpeed: 52, harshBrakingEvents: 0, harshAccelerationEvents: 0,
    earRatio: 0.35, drowsinessFlag: false, stabilityScore: 94, fuelEfficiency: 9.1,
    timestamp: new Date().toISOString(),
  },
  {
    vehicleId: 'BUS_107', driverId: 'DRV_221', driverName: 'Amit Singh',
    speedKmph: 18, maxSpeed: 45, harshBrakingEvents: 5, harshAccelerationEvents: 3,
    earRatio: 0.12, drowsinessFlag: true, stabilityScore: 58, fuelEfficiency: 6.8,
    timestamp: new Date().toISOString(),
  },
  {
    vehicleId: 'BUS_105', driverId: 'DRV_667', driverName: 'Vikram Joshi',
    speedKmph: 22, maxSpeed: 48, harshBrakingEvents: 1, harshAccelerationEvents: 1,
    earRatio: 0.28, drowsinessFlag: false, stabilityScore: 86, fuelEfficiency: 8.8,
    timestamp: new Date().toISOString(),
  },
];

// ---- CROWD DENSITY ----
export const crowdData: CrowdData[] = [
  { stopId: 'ST_01', stopName: 'Central Station', currentCount: 22, densityStatus: 'HIGH', recommendedAction: 'DISPATCH_EXTRA_BUS', cameraId: 'CAM_01' },
  { stopId: 'ST_02', stopName: 'IT Park', currentCount: 14, densityStatus: 'MODERATE', recommendedAction: 'MONITOR', cameraId: 'CAM_02' },
  { stopId: 'ST_05', stopName: 'CSMT', currentCount: 8, densityStatus: 'MODERATE', recommendedAction: 'MONITOR', cameraId: 'CAM_03' },
  { stopId: 'ST_04', stopName: 'Andheri East', currentCount: 3, densityStatus: 'LOW', recommendedAction: 'NONE', cameraId: 'CAM_04' },
  { stopId: 'ST_13', stopName: 'Tech Hub', currentCount: 19, densityStatus: 'HIGH', recommendedAction: 'DISPATCH_EXTRA_BUS', cameraId: 'CAM_05' },
  { stopId: 'ST_10', stopName: 'Thane Station', currentCount: 2, densityStatus: 'LOW', recommendedAction: 'NONE', cameraId: 'CAM_06' },
];

// ---- JOURNEY PLAN ----
export const sampleJourney: JourneyPlan = {
  totalDistance: '18.4 km',
  totalDuration: '52 min',
  totalFare: 65,
  carbonSaved: '3.2 kg CO₂',
  steps: [
    { mode: 'walk', from: 'Home – Sector 7', to: 'Dadar Station', duration: '8 min', distance: '0.6 km', fare: 0, color: '#94a3b8' },
    { mode: 'bus', from: 'Dadar Station', to: 'Bandra Terminus', duration: '15 min', distance: '6.2 km', fare: 20, routeInfo: 'Route 101', color: '#14b8a6' },
    { mode: 'metro', from: 'Bandra Terminus', to: 'Andheri Metro', duration: '18 min', distance: '8.5 km', fare: 30, routeInfo: 'Metro Line 1', color: '#f59e0b' },
    { mode: 'e-rickshaw', from: 'Andheri Metro', to: 'Tech Park Gate 4', duration: '11 min', distance: '3.1 km', fare: 15, color: '#a855f7' },
  ],
};

// ---- ETA DATA ----
export const etaData = {
  weather: 'Partly Cloudy',
  weatherFactor: 1.05,
  dayOfWeek: 'Monday',
  peakFactor: 1.15,
  signalDelay: '3-5 min',
  congestionZones: [
    { name: 'Bandra-Worli Sea Link', delay: '+4 min' },
    { name: 'Andheri Subway', delay: '+3 min' },
    { name: 'Dadar TT Circle', delay: '+5 min' },
  ],
};

// ---- STATIONS FOR SELECTOR ----
export const stations = [
  { id: 'ST_01', name: 'Central Station', routeIds: ['route_101', 'route_104'] },
  { id: 'ST_02', name: 'IT Park', routeIds: ['route_104'] },
  { id: 'ST_03', name: 'Vile Parle', routeIds: ['route_101'] },
  { id: 'ST_04', name: 'Andheri East', routeIds: ['route_101'] },
  { id: 'ST_05', name: 'CSMT', routeIds: ['route_102'] },
  { id: 'ST_06', name: 'Marine Drive', routeIds: ['route_102'] },
  { id: 'ST_07', name: 'Churchgate', routeIds: ['route_102'] },
  { id: 'ST_08', name: 'Malad', routeIds: ['route_102'] },
  { id: 'ST_09', name: 'Borivali West', routeIds: ['route_102'] },
  { id: 'ST_10', name: 'Thane Station', routeIds: ['route_103'] },
  { id: 'ST_11', name: 'Mulund West', routeIds: ['route_103'] },
  { id: 'ST_13', name: 'Tech Hub', routeIds: ['route_104'] },
];

// ---- SVG City Map Data ----
export interface MapNode {
  id: string;
  x: number;
  y: number;
  name: string;
  type: 'station' | 'depot' | 'hub';
}

export const mapNodes: MapNode[] = [
  { id: 'ST_01', x: 200, y: 280, name: 'Central Station', type: 'hub' },
  { id: 'ST_02', x: 300, y: 240, name: 'IT Park', type: 'station' },
  { id: 'ST_03', x: 340, y: 190, name: 'Vile Parle', type: 'station' },
  { id: 'ST_04', x: 460, y: 175, name: 'Andheri East', type: 'station' },
  { id: 'ST_05', x: 100, y: 350, name: 'CSMT', type: 'hub' },
  { id: 'ST_06', x: 160, y: 320, name: 'Marine Drive', type: 'station' },
  { id: 'ST_07', x: 200, y: 300, name: 'Churchgate', type: 'station' },
  { id: 'ST_08', x: 380, y: 260, name: 'Malad', type: 'station' },
  { id: 'ST_09', x: 520, y: 240, name: 'Borivali West', type: 'station' },
  { id: 'ST_10', x: 550, y: 140, name: 'Thane Station', type: 'hub' },
  { id: 'ST_11', x: 480, y: 170, name: 'Mulund West', type: 'station' },
  { id: 'ST_12', x: 420, y: 200, name: 'Kanjurmarg', type: 'station' },
  { id: 'ST_13', x: 420, y: 210, name: 'Tech Hub', type: 'hub' },
];

// Helper: get route by ID
export function getRoute(routeId: string) {
  return routes.find(r => r.routeId === routeId);
}

// Helper: get vehicle by ID
export function getVehicle(vehicleId: string) {
  return vehicles.find(v => v.vehicleId === vehicleId);
}

// Helper: get idle vehicles
export function getIdleVehicles() {
  return vehicles.filter(v => v.status === 'idle');
}

// Helper: get crowding at stop
export function getCrowdAtStop(stopId: string) {
  return crowdData.find(c => c.stopId === stopId);
}

// Simulate fluctuating crowd count
export function simulateCrowdFluctuation(baseCount: number): number {
  const delta = Math.floor(Math.random() * 7) - 3;
  return Math.max(0, baseCount + delta);
}

// Classify density
export function classifyDensity(count: number): { status: 'LOW' | 'MODERATE' | 'HIGH'; color: string; bgColor: string } {
  if (count < 5) return { status: 'LOW', color: '#22c55e', bgColor: 'oklch(0.22 0.03 145)' };
  if (count <= 15) return { status: 'MODERATE', color: '#f59e0b', bgColor: 'oklch(0.22 0.04 80)' };
  return { status: 'HIGH', color: '#ef4444', bgColor: 'oklch(0.22 0.04 25)' };
}

// ---- EMERGENCY EVENTS ----
export type EmergencyType = 'PUNCTURE' | 'DRIVER_UNAVAILABLE' | 'TRAFFIC_JAM' | 'BREAKDOWN';

export interface EmergencyEvent {
  id: string;
  type: EmergencyType;
  vehicleId: string;
  driverId: string;
  driverName: string;
  routeId: string;
  routeName: string;
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  passengersStranded: number;
  message: string;
  timestamp: string;
  resolved: boolean;
}

// Pre-seeded emergency events
export const emergencyEvents: EmergencyEvent[] = [
  {
    id: 'EMG_001',
    type: 'PUNCTURE',
    vehicleId: 'BUS_101', driverId: 'DRV_882', driverName: 'Rajesh Kumar',
    routeId: 'route_101', routeName: 'Route 101 – Dadar to Andheri',
    stopId: 'ST_02', stopName: 'Banda Terminus',
    lat: 19.0544, lng: 72.8402, mapX: 220, mapY: 200,
    passengersStranded: 48,
    message: 'BUS_101 front tyre punctured near Bandra Terminus. 48 passengers stranded.',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    resolved: false,
  },
  {
    id: 'EMG_002',
    type: 'TRAFFIC_JAM',
    vehicleId: 'BUS_107', driverId: 'DRV_221', driverName: 'Amit Singh',
    routeId: 'route_104', routeName: 'Route 104 – City Center to Tech Hub',
    stopId: 'ST_02', stopName: 'IT Park Junction',
    lat: 19.088, lng: 72.889, mapX: 300, mapY: 240,
    passengersStranded: 55,
    message: 'BUS_107 stuck in heavy traffic near IT Park. Signal congestion reported. 55 passengers affected.',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    resolved: false,
  },
  {
    id: 'EMG_003',
    type: 'DRIVER_UNAVAILABLE',
    vehicleId: 'BUS_105', driverId: 'DRV_667', driverName: 'Vikram Joshi',
    routeId: 'route_102', routeName: 'Route 102 – CSMT to Borivali',
    stopId: 'ST_08', stopName: 'Malad Depot',
    lat: 19.1564, lng: 72.8492, mapX: 380, mapY: 260,
    passengersStranded: 30,
    message: 'Driver Vikram Joshi reported medical emergency. BUS_105 halted at Malad. 30 passengers onboard.',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    resolved: false,
  },
];

// ---- TRAFFIC ZONES (for safest route avoidance) ----
export interface TrafficZone {
  name: string;
  mapX: number;
  mapY: number;
  radius: number;
  severity: 'low' | 'medium' | 'high';
  delayMinutes: number;
}

export const trafficZones: TrafficZone[] = [
  { name: 'Bandra-Worli Signal', mapX: 250, mapY: 215, radius: 35, severity: 'high', delayMinutes: 12 },
  { name: 'Andheri Subway', mapX: 450, mapY: 180, radius: 30, severity: 'medium', delayMinutes: 8 },
  { name: 'Dadar TT Circle', mapX: 160, mapY: 250, radius: 28, severity: 'high', delayMinutes: 15 },
  { name: 'JVLR Junction', mapX: 400, mapY: 200, radius: 25, severity: 'low', delayMinutes: 4 },
  { name: 'Borivali West Flyover', mapX: 530, mapY: 245, radius: 22, severity: 'medium', delayMinutes: 6 },
];

// ---- SAFEST ROUTE CALCULATOR ----
export function calculateSafestRoute(
  fromX: number, fromY: number,
  toX: number, toY: number,
): {
  safeWaypoints: [number, number][];
  directWaypoints: [number, number][];
  safeDistance: number;
  directDistance: number;
  safeTime: number;
  directTime: number;
  avoidedZones: string[];
} {
  // Direct route: straight line with slight curve
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const directWaypoints: [number, number][] = [
    [fromX, fromY],
    [midX, midY],
    [toX, toY],
  ];

  const directDist = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);

  // Check which traffic zones the direct route passes through
  const zonesOnDirectRoute = trafficZones.filter(zone => {
    const distToZone = pointToLineDistance(fromX, fromY, toX, toY, zone.mapX, zone.mapY);
    return distToZone < zone.radius;
  });

  // Calculate direct time (including traffic delays)
  const directTrafficDelay = zonesOnDirectRoute.reduce((sum, z) => sum + z.delayMinutes, 0);
  const directTime = Math.round(directDist / 8 + directTrafficDelay); // 8 px/min base speed

  if (zonesOnDirectRoute.length === 0) {
    // No traffic on direct route, it IS the safest
    return {
      safeWaypoints: directWaypoints,
      directWaypoints,
      safeDistance: directDist,
      directDistance: directDist,
      safeTime: directTime,
      directTime,
      avoidedZones: [],
    };
  }

  // Calculate safe route: detour around traffic zones
  // Offset each problematic zone by pushing the route away from it
  let safeX = fromX;
  let safeY = fromY;
  const safeWaypoints: [number, number][] = [[safeX, safeY]];
  const avoidedZones: string[] = [];

  // Sort zones by proximity to midpoint (handle closest first)
  const sortedZones = [...zonesOnDirectRoute].sort((a, b) => {
    const distA = Math.sqrt((a.mapX - midX) ** 2 + (a.mapY - midY) ** 2);
    const distB = Math.sqrt((b.mapX - midX) ** 2 + (b.mapY - midY) ** 2);
    return distA - distB;
  });

  for (const zone of sortedZones) {
    avoidedZones.push(zone.name);
    // Calculate direction from zone center to the route midpoint, then push away
    const angle = Math.atan2(midY - zone.mapY, midX - zone.mapX);
    const detourDist = zone.radius + 25; // Go around the zone
    const wpX = zone.mapX + Math.cos(angle) * detourDist;
    const wpY = zone.mapY + Math.sin(angle) * detourDist;
    // Clamp to map bounds
    const clampedX = Math.max(30, Math.min(620, wpX));
    const clampedY = Math.max(30, Math.min(420, wpY));
    safeWaypoints.push([clampedX, clampedY]);
  }

  safeWaypoints.push([toX, toY]);

  // Calculate safe route distance
  let safeDistance = 0;
  for (let i = 1; i < safeWaypoints.length; i++) {
    const dx = safeWaypoints[i][0] - safeWaypoints[i - 1][0];
    const dy = safeWaypoints[i][1] - safeWaypoints[i - 1][1];
    safeDistance += Math.sqrt(dx * dx + dy * dy);
  }

  // Safe route has no traffic delays (by design)
  const safeTime = Math.round(safeDistance / 8);

  return {
    safeWaypoints,
    directWaypoints,
    safeDistance,
    directDistance: directDist,
    safeTime,
    directTime,
    avoidedZones,
  };
}

function pointToLineDistance(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

// Generate a random future emergency event
export function generateRandomEmergency(): EmergencyEvent {
  const types: EmergencyType[] = ['PUNCTURE', 'TRAFFIC_JAM', 'DRIVER_UNAVAILABLE', 'BREAKDOWN'];
  const type = types[Math.floor(Math.random() * types.length)];
  const activeBuses = vehicles.filter(v => v.type === 'bus' && v.status === 'active');
  const bus = activeBuses[Math.floor(Math.random() * activeBuses.length)];
  const route = routes.find(r => r.routeId === bus.routeId);
  const stop = route?.stops[Math.floor(Math.random() * route.stops.length)];
  const node = mapNodes.find(n => n.id === stop?.stopId);
  const drivers = ['Rajesh K.', 'Suresh P.', 'Amit S.', 'Vikram J.', 'Prasad M.', 'Deepak T.'];

  const messages: Record<EmergencyType, string> = {
    PUNCTURE: `${bus.vehicleId} reported tyre puncture near ${stop?.name ?? 'unknown location'}. ${bus.passengers} passengers stranded on ${route?.routeName ?? 'route'}.`,
    TRAFFIC_JAM: `${bus.vehicleId} is stuck in heavy traffic near ${stop?.name ?? 'unknown location'}. Estimated delay 15+ min. ${bus.passengers} passengers onboard.`,
    DRIVER_UNAVAILABLE: `Driver medical emergency on ${bus.vehicleId} at ${stop?.name ?? 'unknown location'}. Bus halted. ${bus.passengers} passengers need immediate relocation.`,
    BREAKDOWN: `${bus.vehicleId} engine breakdown near ${stop?.name ?? 'unknown location'}. Vehicle non-operational. ${bus.passengers} passengers stranded.`,
  };

  return {
    id: `EMG_${Date.now()}`,
    type,
    vehicleId: bus.vehicleId,
    driverId: `DRV_${Math.floor(100 + Math.random() * 900)}`,
    driverName: drivers[Math.floor(Math.random() * drivers.length)],
    routeId: bus.routeId,
    routeName: route?.routeName ?? '',
    stopId: stop?.stopId ?? '',
    stopName: stop?.name ?? node?.name ?? 'Unknown',
    lat: stop?.lat ?? node?.lat ?? 19.07,
    lng: stop?.lng ?? node?.lng ?? 72.87,
    mapX: node?.x ?? 300,
    mapY: node?.y ?? 250,
    passengersStranded: bus.passengers,
    message: messages[type],
    timestamp: new Date().toISOString(),
    resolved: false,
  };
}