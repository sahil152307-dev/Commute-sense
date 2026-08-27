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

// Subtle city blocks representing Mumbai's urban fabric
const cityBlocks = [
  { x: 20, y: 20, w: 95, h: 65 },
  { x: 135, y: 35, w: 55, h: 50 },
  { x: 20, y: 105, w: 75, h: 70 },
  { x: 115, y: 100, w: 65, h: 55 },
  { x: 210, y: 30, w: 110, h: 55 },
  { x: 340, y: 20, w: 85, h: 65 },
  { x: 445, y: 40, w: 75, h: 50 },
  { x: 545, y: 20, w: 80, h: 70 },
  { x: 20, y: 300, w: 55, h: 65 },
  { x: 260, y: 110, w: 70, h: 75 },
  { x: 365, y: 100, w: 55, h: 60 },
  { x: 270, y: 310, w: 95, h: 55 },
  { x: 385, y: 295, w: 80, h: 75 },
  { x: 485, y: 300, w: 85, h: 60 },
  { x: 580, y: 260, w: 55, h: 70 },
  { x: 20, y: 385, w: 105, h: 50 },
  { x: 145, y: 380, w: 85, h: 55 },
  { x: 250, y: 385, w: 70, h: 45 },
  { x: 545, y: 340, w: 85, h: 65 },
  { x: 580, y: 130, w: 50, h: 60 },
  { x: 440, y: 360, w: 90, h: 50 },
];

// Mithi River – curved path running roughly east–west through mid-map
const riverPathD =
  'M 0,258 C 70,252 140,275 240,264 S 390,248 490,258 S 590,252 650,256';

export function CityMap({ onStationClick }: CityMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // ----- Derived data --------------------------------------------------

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

  // Build initial animation state from active vehicles
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
      if (route.stops.some((s) => s.stopId === node.id)) {
        return route.routeColor;
      }
    }
    return '#64748b';
  }, []);

  const getCrowdForNode = useCallback(
    (nodeId: string) => crowdData.find((c) => c.stopId === nodeId),
    []
  );

  // ----- Vehicle animation ---------------------------------------------

  // Advance vehicles along their paths every 2 s
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

          if (nextIdx >= len - 1) {
            nextIdx = len - 1;
            nextDir[v.vehicleId] = -1;
          } else if (nextIdx <= 0) {
            nextIdx = 0;
            nextDir[v.vehicleId] = 1;
          }

          nextPos[v.vehicleId] = nextIdx;
        });

        return { positions: nextPos, directions: nextDir };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [activeVehiclesOnRoutes]);

  // ----- Render --------------------------------------------------------

  return (
    <div className="w-full aspect-video relative rounded-lg overflow-hidden border border-white/5">
      <svg
        ref={svgRef}
        viewBox="0 0 650 450"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Mumbai transit map – interactive SVG"
        role="img"
      >
        {/* ---- Defs: filters ---- */}
        <defs>
          <filter
            id="route-glow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id="vehicle-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle background grid pattern */}
          <pattern
            id="grid-pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#161b22"
              strokeWidth={0.5}
            />
          </pattern>
        </defs>

        {/* ---- Background ---- */}
        <rect width="650" height="450" fill="#0d1117" />
        <rect width="650" height="450" fill="url(#grid-pattern)" opacity={0.5} />

        {/* ---- City Blocks ---- */}
        {cityBlocks.map((block, i) => (
          <rect
            key={`block-${i}`}
            x={block.x}
            y={block.y}
            width={block.w}
            height={block.h}
            fill="#161b22"
            stroke="#21262d"
            strokeWidth={0.5}
            rx={3}
          />
        ))}

        {/* ---- Mithi River ---- */}
        <path
          d={riverPathD}
          fill="none"
          stroke="#1a365d"
          strokeWidth={14}
          strokeLinecap="round"
          opacity={0.35}
        />
        <path
          d={riverPathD}
          fill="none"
          stroke="#1e4976"
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.25}
        />
        <path
          d={riverPathD}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.15}
        />

        {/* ---- Route Paths ---- */}
        {routes.map((route) => {
          const points = route.path
            .map(([x, y]) => `${x},${y}`)
            .join(' ');
          return (
            <g key={route.routeId}>
              {/* Outer glow */}
              <polyline
                points={points}
                fill="none"
                stroke={route.routeColor}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.15}
                filter="url(#route-glow)"
              />
              {/* Main stroke */}
              <polyline
                points={points}
                fill="none"
                stroke={route.routeColor}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
              {/* Bright centre highlight */}
              <polyline
                points={points}
                fill="none"
                stroke={route.routeColor}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.4}
              />
            </g>
          );
        })}

        {/* ---- Station Nodes ---- */}
        {mapNodes.map((node) => {
          const r = node.type === 'hub' ? 8 : 5;
          const fillColor = getRouteColorForNode(node);
          const crowd = getCrowdForNode(node.id);

          return (
            <g key={node.id}>
              {/* Subtle pulse ring for hubs */}
              {node.type === 'hub' && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 4}
                  fill="none"
                  stroke={fillColor}
                  strokeWidth={1}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: [0, 0.3, 0],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* Station dot */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={fillColor}
                stroke="#ffffff"
                strokeWidth={2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.4,
                  delay: node.x / 1200,
                  type: 'spring',
                  stiffness: 200,
                }}
              />

              {/* Station name label */}
              <text
                x={node.x}
                y={node.y - r - 7}
                textAnchor="middle"
                fill={node.type === 'hub' ? '#e2e8f0' : '#94a3b8'}
                fontSize={node.type === 'hub' ? 9 : 8}
                fontFamily="system-ui, sans-serif"
                fontWeight={node.type === 'hub' ? 600 : 400}
              >
                {node.name}
              </text>

              {/* Tooltip overlay (foreignObject so Radix can work) */}
              <foreignObject
                x={node.x - 20}
                y={node.y - 20}
                width={40}
                height={40}
                style={{ pointerEvents: 'auto' }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-full h-full cursor-pointer"
                      onClick={() => onStationClick?.(node.id)}
                      aria-label={`Station: ${node.name}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-gray-900 border border-gray-700 text-gray-100 shadow-xl"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-xs leading-tight">
                        {node.name}
                      </span>
                      <span className="text-[10px] text-gray-400 capitalize">
                        {node.type}
                      </span>
                      {crowd ? (
                        <span className="text-[11px]">
                          Crowd:{' '}
                          <span
                            className={
                              crowd.densityStatus === 'HIGH'
                                ? 'text-red-400 font-semibold'
                                : crowd.densityStatus === 'MODERATE'
                                  ? 'text-amber-400 font-medium'
                                  : 'text-green-400 font-medium'
                            }
                          >
                            {crowd.currentCount}
                          </span>
                          <span className="text-gray-500 ml-1">
                            ({crowd.densityStatus})
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500">
                          No crowd data
                        </span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </foreignObject>
            </g>
          );
        })}

        {/* ---- Animated Vehicles ---- */}
        {activeVehiclesOnRoutes.map((v) => {
          const pathIdx = vehicleAnim.positions[v.vehicleId] ?? 0;
          const [vx, vy] = v.route.path[pathIdx] ?? v.route.path[0];
          const isMetro = v.type === 'metro';

          return (
            <motion.g
              key={v.vehicleId}
              initial={{ x: vx, y: vy }}
              animate={{ x: vx, y: vy }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              filter="url(#vehicle-glow)"
            >
              {/* Vehicle body */}
              <rect
                x={isMetro ? -10 : -8}
                y={isMetro ? -4 : -5}
                width={isMetro ? 20 : 16}
                height={isMetro ? 8 : 10}
                rx={2}
                fill={v.route.routeColor}
                stroke="#ffffff"
                strokeWidth={1.5}
              />

              {/* Windows */}
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

              {/* Vehicle ID label */}
              <text
                x={isMetro ? 14 : 12}
                y={isMetro ? 3 : 4}
                fill="#e2e8f0"
                fontSize={7}
                fontFamily="monospace"
                fontWeight={600}
              >
                {v.vehicleId}
              </text>
            </motion.g>
          );
        })}

        {/* ---- Legend (bottom-left) ---- */}
        <g transform="translate(12, 358)">
          {/* Legend background */}
          <rect
            x={0}
            y={0}
            width={160}
            height={85}
            rx={8}
            fill="#0d1117"
            stroke="#21262d"
            strokeWidth={1}
            opacity={0.92}
          />

          {/* Title */}
          <text
            x={12}
            y={18}
            fill="#e2e8f0"
            fontSize={10}
            fontWeight={700}
            fontFamily="system-ui, sans-serif"
            letterSpacing={0.5}
          >
            ROUTES
          </text>

          {/* Route entries */}
          {routes.map((route, i) => (
            <g key={route.routeId} transform={`translate(12, ${30 + i * 14})`}>
              {/* Color swatch line */}
              <line
                x1={0}
                y1={0}
                x2={16}
                y2={0}
                stroke={route.routeColor}
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* Route short name */}
              <text
                x={22}
                y={3.5}
                fill="#94a3b8"
                fontSize={8}
                fontFamily="system-ui, sans-serif"
              >
                {route.routeName.split('–')[0].trim()}
              </text>
              {/* Congestion badge */}
              <text
                x={100}
                y={3.5}
                fill={
                  route.congestionIndex === 'High'
                    ? '#ef4444'
                    : route.congestionIndex === 'Moderate'
                      ? '#f59e0b'
                      : '#22c55e'
                }
                fontSize={7}
                fontFamily="system-ui, sans-serif"
                fontWeight={600}
              >
                {route.congestionIndex.toUpperCase()}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
