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
  const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
  return Math.max(0, baseCount + delta);
}

// Classify density
export function classifyDensity(count: number): { status: 'LOW' | 'MODERATE' | 'HIGH'; color: string; bgColor: string } {
  if (count < 5) return { status: 'LOW', color: '#22c55e', bgColor: 'oklch(0.22 0.03 145)' };
  if (count <= 15) return { status: 'MODERATE', color: '#f59e0b', bgColor: 'oklch(0.22 0.04 80)' };
  return { status: 'HIGH', color: '#ef4444', bgColor: 'oklch(0.22 0.04 25)' };
}