'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  routes,
  vehicles,
  mapNodes,
  crowdData,
  type MapNode,
} from '@/lib/mock-data';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface CityMapProps {
  onStationClick?: (stopId: string) => void;
}

// Smooth floating-point position for each vehicle
interface VehiclePos {
  progress: number; // 0 to (path.length - 1), floating point
  speed: number; // progress units per tick
  direction: 1 | -1;
}

// Mumbai peninsula coastline (Arabian Sea – west & south)
const coastlineD =
  'M 0,200 C 40,190 80,195 120,200 S 160,230 190,250 S 220,290 235,285 S 260,310 280,340 S 300,380 310,410 S 325,500 325,535 S 340,560 400,580 S 440,590 480,580 S 530,560 560,530 S 580,500 600,465 S 610,440 620,420 S 640,410 660,420 S 680,440 700,430 S 720,410 750,600 L 800,600 L 800,0 L 0,0 Z';

// Thane Creek / Mumbai Harbor (eastern water body)
const harborD =
  'M 480,580 C 500,560 530,530 560,500 S 600,440 620,420 S 660,400 700,400 S 750,420 800,430 L 800,600 L 480,600 Z';

// Mithi River
const riverPathD =
  'M 310,200 C 320,250 330,300 340,350 S 360,420 380,480 S 400,530 420,560';

// Western Express Highway (WEH)
const wehPathD = 'M 190,140 L 195,175 S 210,210 235,285 S 255,320 290,385 S 340,430 370,445';

// Eastern Express Highway (EEH)
const eehPathD = 'M 555,140 L 505,200 S 465,250 420,385 S 400,430 400,555';

// Central Railway line
const centralRailD = 'M 400,555 L 400,385 S 440,300 465,265 S 500,220 555,185';

// Western Railway line
const westernRailD = 'M 350,515 L 255,335 S 235,300 190,175';

// Harbor line towards Panvel
const harborLineD = 'M 400,555 S 480,520 600,465 S 640,440 670,420';

// Interpolate position along path based on floating-point progress
function getPositionOnPath(path: [number, number][], progress: number): [number, number] {
  const maxIdx = path.length - 1;
  const clamped = Math.max(0, Math.min(maxIdx, progress));
  const idx = Math.floor(clamped);
  const frac = clamped - idx;
  if (idx >= maxIdx) return path[maxIdx];
  const [x1, y1] = path[idx];
  const [x2, y2] = path[idx + 1];
  return [x1 + (x2 - x1) * frac, y1 + (y2 - y1) * frac];
}

// Calculate angle between two points for bus rotation
function getAngle(path: [number, number][], progress: number): number {
  const maxIdx = path.length - 1;
  const clamped = Math.max(0, Math.min(maxIdx, progress));
  const idx = Math.floor(clamped);
  if (idx >= maxIdx) {
    const [x1, y1] = path[maxIdx - 1];
    const [x2, y2] = path[maxIdx];
    return Math.atan2(y2 - y1, x2 - x1);
  }
  const [x1, y1] = path[idx];
  const [x2, y2] = path[idx + 1];
  return Math.atan2(y2 - y1, x2 - x1);
}

export function CityMap({ onStationClick }: CityMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const vehiclePositionsRef = useRef<Record<string, VehiclePos>>({});
  const [vehicleSnapshot, setVehicleSnapshot] = useState<Record<string, VehiclePos>>({});

  const activeVehiclesOnRoutes = useMemo(
    () =>
      vehicles
        .filter((v) => v.routeId && v.status === 'active')
        .map((v) => ({
          ...v,
          route: routes.find((r) => r.routeId === v.routeId)!,
        }))
        .filter((v) => v.route),
    []
  );

  // Initialize vehicle positions with random starting points and realistic speeds
  const initializedRef = useRef(false);
  useEffect(() => {
    const positions: Record<string, VehiclePos> = {};
    activeVehiclesOnRoutes.forEach((v, i) => {
      const pathLen = v.route.path.length;
      // Random starting position spread across the route
      const startPos = (i / activeVehiclesOnRoutes.length) * (pathLen - 1) + Math.random() * 0.5;
      // Speed based on vehicle speed — VERY slow for realistic real-time feel
      // A bus takes ~2-4 minutes to traverse a full route
      const baseSpeed = 0.0008 + (v.speedKmph / 100) * 0.001;
      positions[v.vehicleId] = {
        progress: Math.min(startPos, pathLen - 1),
        speed: baseSpeed + Math.random() * 0.0005,
        direction: Math.random() > 0.5 ? 1 : -1,
      };
    });
    vehiclePositionsRef.current = positions;
    initializedRef.current = true;
  }, [activeVehiclesOnRoutes]);

  const getRouteColorForNode = useCallback((node: MapNode): string => {
    for (const route of routes) {
      if (route.stops.some((s) => s.stopId === node.id)) return route.routeColor;
    }
    return '#64748b';
  }, []);

  const getCrowdForNode = useCallback(
    (nodeId: string) => crowdData.find((c) => c.stopId === nodeId),
    []
  );

  // Track pause timers for station stops
  const pauseTimersRef = useRef<Record<string, number>>({});

  // Animation loop: update positions every 100ms for realistic movement
  useEffect(() => {
    const interval = setInterval(() => {
      if (!initializedRef.current) return;
      const positions = vehiclePositionsRef.current;
      const pauseTimers = pauseTimersRef.current;
      let changed = false;

      activeVehiclesOnRoutes.forEach((v) => {
        const pos = positions[v.vehicleId];
        if (!pos) return;
        const pathLen = v.route.path.length;
        if (pathLen < 2) return;

        // Check if this bus is paused at a station
        const pauseKey = v.vehicleId;
        if (pauseTimers[pauseKey] && pauseTimers[pauseKey] > 0) {
          pauseTimers[pauseKey] -= 1;
          changed = true;
          return; // Skip movement while paused
        }

        pos.progress += pos.speed * pos.direction;

        // Check if approaching a station point — pause briefly
        for (let si = 0; si < pathLen; si++) {
          const dist = Math.abs(pos.progress - si);
          if (dist < pos.speed * 1.2 && !pauseTimers[`${pauseKey}_${si}`]) {
            // Snap to station and pause for 20-40 ticks (2-4 seconds)
            pos.progress = si;
            pauseTimers[pauseKey] = 20 + Math.floor(Math.random() * 20);
            pauseTimers[`${pauseKey}_${si}`] = 1; // Mark this station as visited
            break;
          }
        }

        // Bounce at endpoints with longer pause
        if (pos.progress >= pathLen - 1) {
          pos.progress = pathLen - 1;
          pos.direction = -1;
          pauseTimers[pauseKey] = 40 + Math.floor(Math.random() * 20);
          // Reset station visit markers for return trip
          for (let si = 0; si < pathLen; si++) {
            delete pauseTimers[`${pauseKey}_${si}`];
          }
        } else if (pos.progress <= 0) {
          pos.progress = 0;
          pos.direction = 1;
          pauseTimers[pauseKey] = 40 + Math.floor(Math.random() * 20);
          for (let si = 0; si < pathLen; si++) {
            delete pauseTimers[`${pauseKey}_${si}`];
          }
        }
        changed = true;
      });

      if (changed) {
        // Create a shallow copy snapshot for React to detect change
        const snapshot: Record<string, VehiclePos> = {};
        for (const key of Object.keys(positions)) {
          snapshot[key] = { ...positions[key] };
        }
        setVehicleSnapshot(snapshot);
      }
    }, 100); // 100ms = 10 FPS — slower update rate for realistic feel

    return () => clearInterval(interval);
  }, [activeVehiclesOnRoutes]);

  return (
    <div className="w-full aspect-video relative rounded-lg overflow-hidden border border-white/5">
      <svg
        ref={svgRef}
        viewBox="0 0 800 620"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Mumbai transit map – interactive SVG"
        role="img"
      >
        <defs>
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="vehicle-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="bus-shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
          </filter>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161b22" strokeWidth={0.5} />
          </pattern>
          {/* Sea gradient */}
          <linearGradient id="sea-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0c1929" />
            <stop offset="100%" stopColor="#0a1628" />
          </linearGradient>
          {/* Bus body gradient */}
          <linearGradient id="bus-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="800" height="620" fill="#0d1117" />
        <rect width="800" height="620" fill="url(#grid-pattern)" opacity={0.3} />

        {/* Arabian Sea / Coastline */}
        <path d={coastlineD} fill="url(#sea-grad)" opacity={0.6} />
        <path d={coastlineD} fill="none" stroke="#1e3a5f" strokeWidth={2} opacity={0.5} />

        {/* Mumbai Harbor / Thane Creek */}
        <path d={harborD} fill="#0c1929" opacity={0.4} />
        <path d={harborD} fill="none" stroke="#1e3a5f" strokeWidth={1.5} opacity={0.3} />

        {/* Sea labels */}
        <text x={60} y={310} fill="#1e3a5f" fontSize={14} fontFamily="system-ui" fontWeight={600} opacity={0.5} transform="rotate(-80, 60, 310)">ARABIAN SEA</text>
        <text x={680} y={480} fill="#1e3a5f" fontSize={10} fontFamily="system-ui" fontWeight={500} opacity={0.4}>THANE CREEK</text>

        {/* Mithi River */}
        <path d={riverPathD} fill="none" stroke="#1a365d" strokeWidth={10} strokeLinecap="round" opacity={0.3} />
        <path d={riverPathD} fill="none" stroke="#1e4976" strokeWidth={4} strokeLinecap="round" opacity={0.2} />

        {/* Western Express Highway */}
        <path d={wehPathD} fill="none" stroke="#2d2d3d" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 4" opacity={0.5} />

        {/* Eastern Express Highway */}
        <path d={eehPathD} fill="none" stroke="#2d2d3d" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 4" opacity={0.5} />

        {/* Railway lines (subtle) */}
        <path d={centralRailD} fill="none" stroke="#3d2d1d" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" opacity={0.35} />
        <path d={westernRailD} fill="none" stroke="#3d2d1d" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" opacity={0.35} />
        <path d={harborLineD} fill="none" stroke="#3d2d1d" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" opacity={0.35} />

        {/* Highway labels */}
        <text x={145} y={260} fill="#4a5568" fontSize={7} fontFamily="system-ui" fontWeight={500} opacity={0.5} transform="rotate(-70, 145, 260)">WEH</text>
        <text x={490} y={300} fill="#4a5568" fontSize={7} fontFamily="system-ui" fontWeight={500} opacity={0.5} transform="rotate(-78, 490, 300)">EEH</text>

        {/* Route Paths */}
        {routes.map((route) => {
          const points = route.path.map(([x, y]) => `${x},${y}`).join(' ');
          return (
            <g key={route.routeId}>
              <polyline points={points} fill="none" stroke={route.routeColor} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.15} filter="url(#route-glow)" />
              <polyline points={points} fill="none" stroke={route.routeColor} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
              <polyline points={points} fill="none" stroke={route.routeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
            </g>
          );
        })}

        {/* Station Nodes */}
        {mapNodes.map((node) => {
          const r = node.type === 'hub' ? 8 : 5;
          const fillColor = getRouteColorForNode(node);
          const crowd = getCrowdForNode(node.id);
          return (
            <g key={node.id}>
              {node.type === 'hub' && (
                <motion.circle
                  cx={node.x} cy={node.y} r={r + 4}
                  fill="none" stroke={fillColor} strokeWidth={1}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <motion.circle
                cx={node.x} cy={node.y} r={r}
                fill={fillColor} stroke="#ffffff" strokeWidth={2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: node.x / 2000, type: 'spring', stiffness: 200 }}
              />
              <text
                x={node.x}
                y={node.y - r - 7}
                textAnchor="middle"
                fill={node.type === 'hub' ? '#e2e8f0' : '#94a3b8'}
                fontSize={node.type === 'hub' ? 10 : 8}
                fontFamily="system-ui, sans-serif"
                fontWeight={node.type === 'hub' ? 600 : 400}
              >
                {node.name}
              </text>
              <foreignObject x={node.x - 20} y={node.y - 20} width={40} height={40} style={{ pointerEvents: 'auto' }}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full h-full cursor-pointer" onClick={() => onStationClick?.(node.id)} aria-label={`Station: ${node.name}`} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900 border border-gray-700 text-gray-100 shadow-xl">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-body font-semibold text-xs leading-tight">{node.name}</span>
                      <span className="font-body text-[10px] text-gray-400 capitalize">{node.type}</span>
                      {crowd ? (
                        <span className="font-body text-[11px]">
                          Crowd:{' '}
                          <span className={crowd.densityStatus === 'HIGH' ? 'text-red-400 font-semibold' : crowd.densityStatus === 'MODERATE' ? 'text-amber-400 font-medium' : 'text-green-400 font-medium'}>
                            {crowd.currentCount}
                          </span>
                          <span className="text-gray-500 ml-1">({crowd.densityStatus})</span>
                        </span>
                      ) : (
                        <span className="font-body text-[10px] text-gray-500">No crowd data</span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </foreignObject>
            </g>
          );
        })}

        {/* Animated Vehicles - Smooth real-time movement */}
        {activeVehiclesOnRoutes.map((v) => {
          const pos = vehicleSnapshot[v.vehicleId];
          if (!pos) return null;
          const [vx, vy] = getPositionOnPath(v.route.path, pos.progress);
          const angle = getAngle(v.route.path, pos.progress) * (180 / Math.PI);
          const isMetro = v.type === 'metro';

          return (
            <g
              key={v.vehicleId}
              transform={`translate(${vx}, ${vy}) rotate(${angle})`}
              filter="url(#vehicle-glow)"
            >
              {isMetro ? (
                <>
                  {/* Metro - elongated sleek shape */}
                  <rect x={-12} y={-5} width={24} height={10} rx={3} fill={v.route.routeColor} stroke="#ffffff" strokeWidth={1.5} filter="url(#bus-shadow)" />
                  <rect x={-9} y={-3} width={5} height={6} rx={0.5} fill="#0d1117" opacity={0.6} />
                  <rect x={-2} y={-3} width={5} height={6} rx={0.5} fill="#0d1117" opacity={0.6} />
                  <rect x={5} y={-3} width={5} height={6} rx={0.5} fill="#0d1117" opacity={0.6} />
                </>
              ) : (
                <>
                  {/* Bus - realistic shape with windshield */}
                  <rect x={-9} y={-6} width={18} height={12} rx={2.5} fill={v.route.routeColor} stroke="#ffffff" strokeWidth={1.2} filter="url(#bus-shadow)" />
                  <rect x={-9} y={-6} width={18} height={12} rx={2.5} fill="url(#bus-grad)" />
                  {/* Windshield */}
                  <rect x={-7.5} y={-4.5} width={4.5} height={4.5} rx={0.8} fill="#1a3a5c" opacity={0.8} />
                  {/* Side windows */}
                  <rect x={-2} y={-4.5} width={3.5} height={4.5} rx={0.5} fill="#1a3a5c" opacity={0.6} />
                  <rect x={2.5} y={-4.5} width={3.5} height={4.5} rx={0.5} fill="#1a3a5c" opacity={0.6} />
                  {/* Wheels */}
                  <circle cx={-5} cy={6.5} r={1.5} fill="#1a1a2e" stroke="#333" strokeWidth={0.5} />
                  <circle cx={5} cy={6.5} r={1.5} fill="#1a1a2e" stroke="#333" strokeWidth={0.5} />
                  {/* Headlights */}
                  <rect x={8.5} y={-3} width={1.5} height={2} rx={0.3} fill="#fef08a" opacity={0.9} />
                  <rect x={8.5} y={1} width={1.5} height={2} rx={0.3} fill="#ef4444" opacity={0.7} />
                </>
              )}
              {/* Vehicle ID label */}
              <g transform={`translate(0, ${isMetro ? -10 : -11})`}>
                <rect x={-14} y={-6} width={28} height={9} rx={3} fill="#0d1117" stroke={v.route.routeColor} strokeWidth={0.5} opacity={0.85} />
                <text x={0} y={1} textAnchor="middle" fill="#e2e8f0" fontSize={6} fontFamily="monospace" fontWeight={600}>{v.vehicleId}</text>
              </g>
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(12, 12)">
          <rect x={0} y={0} width={155} height={32 + routes.length * 16} rx={8} fill="#0d1117" stroke="#21262d" strokeWidth={1} opacity={0.92} />
          <text x={12} y={18} fill="#e2e8f0" fontSize={10} fontWeight={700} fontFamily="system-ui, sans-serif" letterSpacing={0.5}>MUMBAI ROUTES</text>
          {routes.map((route, i) => (
            <g key={route.routeId} transform={`translate(12, ${30 + i * 16})`}>
              <line x1={0} y1={0} x2={16} y2={0} stroke={route.routeColor} strokeWidth={3} strokeLinecap="round" />
              <text x={22} y={3.5} fill="#94a3b8" fontSize={8} fontFamily="system-ui, sans-serif">{route.routeName.split('–')[0].trim()}</text>
              <text x={100} y={3.5} fill={route.congestionIndex === 'High' ? '#ef4444' : route.congestionIndex === 'Moderate' ? '#f59e0b' : '#22c55e'} fontSize={7} fontFamily="system-ui, sans-serif" fontWeight={600}>{route.congestionIndex.toUpperCase()}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
