'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { EmergencyEvent } from '@/lib/mock-data';
import type { Vehicle } from '@/lib/mock-data';
import { trafficZones, mapNodes, calculateSafestRoute } from '@/lib/mock-data';

interface SafestRouteMapProps {
  emergency: EmergencyEvent;
  selectedVehicle: Vehicle | undefined;
}

export function SafestRouteMap({ emergency }: SafestRouteMapProps) {
  const routeData = useMemo(() => {
    const vNode = mapNodes.find(n => n.name.includes('Central') || n.name.includes('Depot'));
    const fromX = vNode?.x ?? 200;
    const fromY = vNode?.y ?? 280;
    return calculateSafestRoute(fromX, fromY, emergency.mapX, emergency.mapY);
  }, [emergency.mapX, emergency.mapY]);

  const hasAvoidedZones = routeData.avoidedZones.length > 0;
  const timeSaved = routeData.directTime - routeData.safeTime;

  return (
    <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-white/5">
      <svg viewBox="0 0 650 400" className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="emg-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="emg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161b22" strokeWidth={0.5} />
          </pattern>
        </defs>

        <rect width="650" height="400" fill="#0d1117" />
        <rect width="650" height="400" fill="url(#emg-grid)" opacity={0.5} />

        {trafficZones.map((zone, i) => {
          const sevColor = zone.severity === 'high' ? '#ef4444' : zone.severity === 'medium' ? '#f59e0b' : '#65a30d';
          const isAvoided = routeData.avoidedZones.includes(zone.name);
          return (
            <g key={i}>
              <circle
                cx={zone.mapX}
                cy={zone.mapY}
                r={zone.radius}
                fill={sevColor}
                opacity={isAvoided ? 0.12 : 0.06}
                stroke={sevColor}
                strokeWidth={isAvoided ? 2 : 1}
                strokeDasharray={isAvoided ? '6 3' : '3 3'}
                strokeOpacity={isAvoided ? 0.6 : 0.3}
              />
              {isAvoided && (
                <text x={zone.mapX} y={zone.mapY + 4} textAnchor="middle" fill={sevColor} fontSize={7} fontFamily="system-ui" fontWeight={600}>
                  AVOID
                </text>
              )}
            </g>
          );
        })}

        {hasAvoidedZones && (
          <polyline
            points={routeData.directWaypoints.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="8 4"
            opacity={0.4}
          />
        )}

        <polyline
          points={routeData.safeWaypoints.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="#22c55e"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        <polyline
          points={routeData.safeWaypoints.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="#22c55e"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.15}
          filter="url(#emg-glow)"
        />

        <circle
          cx={routeData.safeWaypoints[0]?.[0]}
          cy={routeData.safeWaypoints[0]?.[1]}
          r={7}
          fill="#14b8a6"
          stroke="#fff"
          strokeWidth={2}
        />
        <text
          x={(routeData.safeWaypoints[0]?.[0] ?? 0) + 12}
          y={(routeData.safeWaypoints[0]?.[1] ?? 0) + 4}
          fill="#14b8a6"
          fontSize={8}
          fontFamily="system-ui"
          fontWeight={600}
        >
          DEPOT
        </text>

        <motion.circle
          cx={emergency.mapX}
          cy={emergency.mapY}
          r={10}
          fill="#ef4444"
          stroke="#fff"
          strokeWidth={2}
          filter="url(#emg-glow)"
          animate={{ r: [10, 16, 10], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <text
          x={emergency.mapX + 16}
          y={emergency.mapY + 4}
          fill="#ef4444"
          fontSize={8}
          fontFamily="system-ui"
          fontWeight={700}
        >
          SOS
        </text>

        {mapNodes.map((node) => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={3}
            fill="#334155"
            stroke="#475569"
            strokeWidth={0.5}
          />
        ))}

        <g transform="translate(12, 320)">
          <rect x={0} y={0} width={220} height={70} rx={8} fill="#0d1117" stroke="#21262d" strokeWidth={1} opacity={0.92} />
          {hasAvoidedZones && (
            <g transform="translate(12, 18)">
              <line x1={0} y1={0} x2={20} y2={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" opacity={0.6} />
              <text x={26} y={3} fill="#94a3b8" fontSize={8} fontFamily="system-ui">Direct (blocked)</text>
            </g>
          )}
          <g transform="translate(12, 36)">
            <line x1={0} y1={0} x2={20} y2={0} stroke="#22c55e" strokeWidth={3} />
            <text x={26} y={3} fill="#94a3b8" fontSize={8} fontFamily="system-ui">Safest Route</text>
          </g>
          {hasAvoidedZones && (
            <g transform="translate(12, 54)">
              <circle cx={6} cy={-2} r={5} fill="#ef4444" opacity={0.15} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 2" />
              <text x={26} y={1} fill="#94a3b8" fontSize={8} fontFamily="system-ui">Traffic zone (avoided)</text>
            </g>
          )}
        </g>
      </svg>

      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {hasAvoidedZones && (
          <div className="rounded-md bg-green-500/15 border border-green-500/30 px-2 py-1 text-[10px] font-semibold text-green-400">
            Safest: {routeData.safeTime} min
          </div>
        )}
        {hasAvoidedZones && (
          <div className="rounded-md bg-red-500/15 border border-red-500/30 px-2 py-1 text-[10px] font-semibold text-red-400 line-through">
            Direct: {routeData.directTime} min
          </div>
        )}
        {hasAvoidedZones && timeSaved > 0 && (
          <div className="rounded-md bg-teal-500/15 border border-teal-500/30 px-2 py-1 text-[10px] font-bold text-teal-400">
            Saves {timeSaved} min
          </div>
        )}
        {!hasAvoidedZones && (
          <div className="rounded-md bg-green-500/15 border border-green-500/30 px-2 py-1 text-[10px] font-semibold text-green-400">
            Clear route: {routeData.safeTime} min
          </div>
        )}
      </div>
    </div>
  );
}
