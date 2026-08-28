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

interface VehicleAnim {
  positions: Record<string, number>;
  directions: Record<string, number>;
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

export function CityMap({ onStationClick }: CityMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

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

  const buildInitialAnim = useCallback((): VehicleAnim => {
    const positions: Record<string, number> = {};
    const directions: Record<string, number> = {};
    activeVehiclesOnRoutes.forEach((v, i) => {
      positions[v.vehicleId] = i % v.route.path.length;
      directions[v.vehicleId] = 1;
    });
    return { positions, directions };
  }, [activeVehiclesOnRoutes]);

  const [vehicleAnim, setVehicleAnim] = useState<VehicleAnim>(buildInitialAnim);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicleAnim((prev) => {
        const nextPos = { ...prev.positions };
        const nextDir = { ...prev.directions };
        activeVehiclesOnRoutes.forEach((v) => {
          const path = v.route.path;
          const len = path.length;
          if (len < 2) return;
          const currentIdx = nextPos[v.vehicleId] ?? 0;
          const dir = nextDir[v.vehicleId] ?? 1;
          let nextIdx = currentIdx + dir;
          if (nextIdx >= len - 1) { nextIdx = len - 1; nextDir[v.vehicleId] = -1; }
          else if (nextIdx <= 0) { nextIdx = 0; nextDir[v.vehicleId] = 1; }
          nextPos[v.vehicleId] = nextIdx;
        });
        return { positions: nextPos, directions: nextDir };
      });
    }, 2000);
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
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161b22" strokeWidth={0.5} />
          </pattern>
          {/* Sea gradient */}
          <linearGradient id="sea-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0c1929" />
            <stop offset="100%" stopColor="#0a1628" />
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
                      <span className="font-semibold text-xs leading-tight">{node.name}</span>
                      <span className="text-[10px] text-gray-400 capitalize">{node.type}</span>
                      {crowd ? (
                        <span className="text-[11px]">
                          Crowd:{' '}
                          <span className={crowd.densityStatus === 'HIGH' ? 'text-red-400 font-semibold' : crowd.densityStatus === 'MODERATE' ? 'text-amber-400 font-medium' : 'text-green-400 font-medium'}>
                            {crowd.currentCount}
                          </span>
                          <span className="text-gray-500 ml-1">({crowd.densityStatus})</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500">No crowd data</span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </foreignObject>
            </g>
          );
        })}

        {/* Animated Vehicles */}
        {activeVehiclesOnRoutes.map((v) => {
          const pathIdx = vehicleAnim.positions[v.vehicleId] ?? 0;
          const [vx, vy] = v.route.path[pathIdx] ?? v.route.path[0];
          const isMetro = v.type === 'metro';
          return (
            <motion.g key={v.vehicleId} initial={{ x: vx, y: vy }} animate={{ x: vx, y: vy }} transition={{ duration: 1.8, ease: 'easeInOut' }} filter="url(#vehicle-glow)">
              <rect x={isMetro ? -10 : -8} y={isMetro ? -4 : -5} width={isMetro ? 20 : 16} height={isMetro ? 8 : 10} rx={2} fill={v.route.routeColor} stroke="#ffffff" strokeWidth={1.5} />
              {isMetro ? (
                <>
                  <rect x={-7} y={-2} width={4} height={4} rx={0.5} fill="#0d1117" opacity={0.7} />
                  <rect x={-1} y={-2} width={4} height={4} rx={0.5} fill="#0d1117" opacity={0.7} />
                  <rect x={5} y={-2} width={4} height={4} rx={0.5} fill="#0d1117" opacity={0.7} />
                </>
              ) : (
                <>
                  <rect x={-5} y={-3} width={3} height={3} rx={0.5} fill="#0d1117" opacity={0.7} />
                  <rect x={-1} y={-3} width={3} height={3} rx={0.5} fill="#0d1117" opacity={0.7} />
                  <rect x={3} y={-3} width={3} height={3} rx={0.5} fill="#0d1117" opacity={0.7} />
                </>
              )}
              <text x={isMetro ? 14 : 12} y={isMetro ? 3 : 4} fill="#e2e8f0" fontSize={7} fontFamily="monospace" fontWeight={600}>{v.vehicleId}</text>
            </motion.g>
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
