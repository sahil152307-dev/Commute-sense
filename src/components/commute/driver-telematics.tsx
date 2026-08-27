'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CircleStop,
  ChevronDown,
  Clock,
  Eye,
  Fuel,
  Gauge,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TelematicsData } from '@/lib/mock-data';
import { telematicsData as mockTelematics } from '@/lib/mock-data';

// ─── Color Helpers ───────────────────────────────────────────────────────────

const TEAL = '#14b8a6';
const AMBER = '#f59e0b';
const RED = '#ef4444';
const GREEN = '#22c55e';

function speedColor(speed: number): string {
  if (speed < 40) return GREEN;
  if (speed <= 55) return AMBER;
  return RED;
}

function stabilityColor(score: number): string {
  if (score >= 80) return GREEN;
  if (score >= 60) return AMBER;
  return RED;
}

function earColor(ear: number): string {
  if (ear >= 0.3) return GREEN;
  if (ear >= 0.2) return AMBER;
  return RED;
}

// ─── SVG Gauge Helpers ───────────────────────────────────────────────────────

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ─── Speed Gauge (Semi-circle) ───────────────────────────────────────────────

function SpeedGauge({ speed, maxSpeed }: { speed: number; maxSpeed: number }) {
  const cx = 80;
  const cy = 80;
  const r = 62;
  const maxGauge = 80;
  const angle = Math.min((speed / maxGauge) * 180, 180);
  const color = speedColor(speed);

  // Max speed marker position
  const maxAngle = Math.min((maxSpeed / maxGauge) * 180, 180);
  const maxPos = polarToCartesian(cx, cy, r - 8, 180 + (maxAngle - 180));
  const maxPosOuter = polarToCartesian(cx, cy, r + 4, 180 + (maxAngle - 180));

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="160" height="100" viewBox="0 0 160 100">
        {/* Background arc */}
        <path
          d={describeArc(cx, cy, r, 180, 360)}
          fill="none"
          stroke="oklch(0.25 0.01 260)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <motion.path
          d={describeArc(cx, cy, r, 180, 180 + angle)}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        {/* Max speed marker */}
        <line
          x1={maxPos.x}
          y1={maxPos.y}
          x2={maxPosOuter.x}
          y2={maxPosOuter.y}
          stroke={RED}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Tick marks */}
        {[0, 20, 40, 60, 80].map((tick) => {
          const tAngle = Math.min((tick / maxGauge) * 180, 180);
          const inner = polarToCartesian(cx, cy, r - 18, 180 + (tAngle > 0 ? tAngle : 0));
          const outer = polarToCartesian(cx, cy, r - 14, 180 + (tAngle > 0 ? tAngle : 0));
          return (
            <line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="oklch(0.5 0 0)"
              strokeWidth="1.5"
            />
          );
        })}
        {/* Center text */}
        <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize="28" fontWeight="bold">
          {Math.round(speed)}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="oklch(0.6 0 0)" fontSize="11">
          km/h
        </text>
      </svg>
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Gauge className="size-3" /> Speed
      </div>
      <div className="text-[10px] text-muted-foreground/60">Max: {maxSpeed} km/h</div>
    </div>
  );
}

// ─── Stability Gauge (Full ring) ─────────────────────────────────────────────

function StabilityGauge({ score }: { score: number }) {
  const cx = 70;
  const cy = 70;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = stabilityColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="oklch(0.25 0.01 260)"
          strokeWidth="10"
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="26" fontWeight="bold">
          {score}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="oklch(0.6 0 0)" fontSize="10">
          Stability
        </text>
      </svg>
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Activity className="size-3" /> Stability Score
      </div>
    </div>
  );
}

// ─── EAR Gauge (Circular 0-0.5) ──────────────────────────────────────────────

function EarGauge({ ear }: { ear: number }) {
  const cx = 70;
  const cy = 70;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.min(ear / 0.5, 1);
  const dashOffset = circumference - ratio * circumference;
  const color = earColor(ear);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="oklch(0.25 0.01 260)"
          strokeWidth="10"
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Eye icon in center */}
        <g transform={`translate(${cx - 14}, ${cy - 22})`}>
          <Eye className="size-7" stroke={color} fill="none" strokeWidth={1.8} />
        </g>
        <text x={cx} y={cy + 16} textAnchor="middle" fill={color} fontSize="22" fontWeight="bold">
          {ear.toFixed(2)}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="oklch(0.6 0 0)" fontSize="10">
          EAR Ratio
        </text>
      </svg>
      <div className="text-xs text-muted-foreground">
        {ear < 0.2 ? 'DANGER' : ear < 0.3 ? 'WARNING' : 'SAFE'}
      </div>
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  color: string;
  alert?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border p-4 ${
        alert ? 'border-red-500/40 bg-red-500/5' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="rounded-md p-1.5"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="size-4" style={{ color }} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
        {alert && (
          <Badge className="ml-auto bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
            <AlertTriangle className="size-2.5" />
            Alert
          </Badge>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </motion.div>
  );
}

// ─── Speed History Sparkline ─────────────────────────────────────────────────

function SpeedChart({ currentSpeed }: { currentSpeed: number }) {
  const points = useMemo(() => {
    const data: number[] = [];
    for (let i = 0; i < 20; i++) {
      const variation = (Math.random() - 0.5) * 16;
      data.push(Math.max(0, Math.min(80, currentSpeed + variation)));
    }
    // Ensure last point is close to current
    data[19] = currentSpeed;
    return data;
  }, [currentSpeed]);

  const width = 320;
  const height = 80;
  const padding = 4;
  const maxVal = Math.max(...points, 1);

  const xStep = (width - padding * 2) / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: padding + i * xStep,
    y: height - padding - (p / maxVal) * (height - padding * 2),
  }));

  // Smooth curve using cardinal spline-like approach (quadratic bezier through midpoints)
  let smoothPath = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const cp1x = (coords[i].x + coords[i + 1].x) / 2;
    const cp1y = coords[i].y;
    const cp2x = (coords[i].x + coords[i + 1].x) / 2;
    const cp2y = coords[i + 1].y;
    smoothPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${coords[i + 1].x} ${coords[i + 1].y}`;
  }

  const areaPath =
    smoothPath + ` L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

  const lineColor = speedColor(currentSpeed);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill="url(#speedGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d={smoothPath}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {/* End dot */}
      <motion.circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r="3"
        fill={lineColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      />
    </svg>
  );
}

// ─── Eye Diagram (Fatigue Simulator) ─────────────────────────────────────────

function EyeDiagram({ ear }: { ear: number }) {
  // EAR ratio controls eyelid openness: 0 = fully closed, 0.4+ = fully open
  const openness = Math.min(Math.max(ear / 0.4, 0.05), 1);
  const isDanger = ear < 0.2;

  // Eye geometry
  const eyeW = 60;
  const eyeH = 22 * openness;
  const leftEyeCx = 85;
  const rightEyeCx = 215;
  const eyeCy = 75;

  // Eyelid (upper) position - moves down when drowsy
  const eyelidY = eyeCy - eyeH;
  const eyeColor = isDanger ? RED : ear < 0.3 ? AMBER : GREEN;

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/60 border border-border">
      {/* Scanline effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-teal-500/5 to-transparent animate-scanline" />
      </div>

      {/* Camera overlay text */}
      <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
        <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
        REC • DRV-CAM-01
      </div>
      <div className="absolute top-2 right-3 text-[10px] text-muted-foreground/40">
        {new Date().toLocaleTimeString()}
      </div>

      {/* Face outline */}
      <svg
        viewBox="0 0 300 150"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Face oval */}
        <ellipse
          cx="150"
          cy="80"
          rx="90"
          ry="55"
          fill="none"
          stroke="oklch(0.35 0 0)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.5"
        />

        {/* Left eye - white sclera */}
        <ellipse
          cx={leftEyeCx}
          cy={eyeCy}
          rx={eyeW / 2}
          ry={Math.max(eyeH, 3)}
          fill="oklch(0.3 0.01 260)"
          stroke={eyeColor}
          strokeWidth="1.5"
        />
        {/* Left iris */}
        <circle
          cx={leftEyeCx}
          cy={eyeCy}
          r={8 * openness + 3}
          fill={eyeColor}
          opacity="0.7"
        />
        {/* Left pupil */}
        <circle cx={leftEyeCx} cy={eyeCy} r={3} fill={eyeColor} />
        {/* Left upper eyelid */}
        <path
          d={`M ${leftEyeCx - eyeW / 2 - 4} ${eyelidY} Q ${leftEyeCx} ${eyelidY - 6} ${leftEyeCx + eyeW / 2 + 4} ${eyelidY}`}
          fill="oklch(0.2 0.01 260)"
          stroke="oklch(0.35 0 0)"
          strokeWidth="1.5"
        />

        {/* Right eye - white sclera */}
        <ellipse
          cx={rightEyeCx}
          cy={eyeCy}
          rx={eyeW / 2}
          ry={Math.max(eyeH, 3)}
          fill="oklch(0.3 0.01 260)"
          stroke={eyeColor}
          strokeWidth="1.5"
        />
        {/* Right iris */}
        <circle
          cx={rightEyeCx}
          cy={eyeCy}
          r={8 * openness + 3}
          fill={eyeColor}
          opacity="0.7"
        />
        {/* Right pupil */}
        <circle cx={rightEyeCx} cy={eyeCy} r={3} fill={eyeColor} />
        {/* Right upper eyelid */}
        <path
          d={`M ${rightEyeCx - eyeW / 2 - 4} ${eyelidY} Q ${rightEyeCx} ${eyelidY - 6} ${rightEyeCx + eyeW / 2 + 4} ${eyelidY}`}
          fill="oklch(0.2 0.01 260)"
          stroke="oklch(0.35 0 0)"
          strokeWidth="1.5"
        />

        {/* Nose hint */}
        <path
          d="M 147 88 L 150 100 L 153 88"
          fill="none"
          stroke="oklch(0.35 0 0)"
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Mouth - frown when drowsy */}
        <path
          d={isDanger
            ? 'M 135 118 Q 150 112 165 118'
            : 'M 135 115 Q 150 120 165 115'
          }
          fill="none"
          stroke="oklch(0.35 0 0)"
          strokeWidth="1.2"
          opacity="0.5"
        />

        {/* Detection bounding box */}
        <rect
          x="35"
          y="20"
          width="230"
          height="120"
          fill="none"
          stroke={eyeColor}
          strokeWidth="1"
          strokeDasharray="6 3"
          opacity="0.3"
          rx="4"
        />
        <text
          x="40"
          y="18"
          fill={eyeColor}
          fontSize="8"
          opacity="0.6"
        >
          FACE DETECTED
        </text>
      </svg>

      {/* EAR value overlay */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Eye className="size-3" style={{ color: eyeColor }} />
          <span className="text-[10px]" style={{ color: eyeColor }}>
            EAR: {ear.toFixed(2)}
          </span>
        </div>
        <Badge
          className={`text-[9px] ${
            isDanger
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : ear < 0.3
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-green-500/20 text-green-400 border-green-500/30'
          }`}
        >
          {isDanger ? 'DROWSY' : ear < 0.3 ? 'SLEEPY' : 'ALERT'}
        </Badge>
      </div>
    </div>
  );
}

// ─── Trip Duration Calculator ────────────────────────────────────────────────

function calcTripDuration(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = Math.abs(now - then);
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DriverTelematics() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [data, setData] = useState<TelematicsData[]>(mockTelematics);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const selectedDriver = useMemo(
    () => data.find((d) => d.vehicleId === selectedVehicleId),
    [data, selectedVehicleId]
  );

  const isDrowsy = useMemo(
    () =>
      !!selectedDriver &&
      (selectedDriver.drowsinessFlag || selectedDriver.earRatio < 0.2),
    [selectedDriver]
  );

  // Auto-select first driver on mount
  useEffect(() => {
    if (data.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(data[0].vehicleId);
    }
  }, [data, selectedVehicleId]);

  // Poll API every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/telematics?vehicleId=${selectedVehicleId}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            // Update the specific driver data in state
            setData((prev) =>
              prev.map((d) => (d.vehicleId === selectedVehicleId ? { ...d, ...json.data } : d))
            );
          }
        }
      } catch {
        // Fallback: simulate slight random variations locally
        setData((prev) =>
          prev.map((d) => {
            if (d.vehicleId !== selectedVehicleId) return d;
            return {
              ...d,
              speedKmph: Math.max(0, Math.min(80, d.speedKmph + (Math.random() - 0.5) * 6)),
              earRatio: Math.max(0.05, Math.min(0.45, d.earRatio + (Math.random() - 0.5) * 0.03)),
              stabilityScore: Math.max(20, Math.min(100, d.stabilityScore + (Math.random() - 0.5) * 3)),
              timestamp: new Date().toISOString(),
            };
          })
        );
      }
      setCurrentTime(Date.now());
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedVehicleId]);

  // Re-key for speed chart on speed change
  const speedChartKey = selectedDriver ? Math.round(selectedDriver.speedKmph / 5) : 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 lg:p-6 space-y-5">
        {/* Header + Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="size-5" style={{ color: TEAL }} />
              Driver Telematics & Drowsiness Alert
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edge-AI real-time driver monitoring system
            </p>
          </div>
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Select driver..." />
            </SelectTrigger>
            <SelectContent>
              {data.map((d) => (
                <SelectItem key={d.vehicleId} value={d.vehicleId}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor: d.drowsinessFlag || d.earRatio < 0.2 ? RED : GREEN,
                      }}
                    />
                    {d.driverName}
                    <span className="text-muted-foreground text-xs">({d.vehicleId})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drowsiness Alert Banner */}
        <AnimatePresence>
          {isDrowsy && selectedDriver && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="animate-pulse-alert rounded-lg border-2 border-red-500/60 bg-red-600 px-5 py-4 text-white shadow-lg shadow-red-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-7 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold tracking-wide">
                      🚨 DROWSINESS ALERT
                    </div>
                    <div className="text-sm mt-1 opacity-95">
                      Driver <span className="font-semibold">{selectedDriver.driverName}</span> ({selectedDriver.vehicleId}) is showing signs of drowsiness.
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs opacity-80">
                      <span>
                        EAR Ratio: <span className="font-bold text-white">{selectedDriver.earRatio.toFixed(2)}</span>
                      </span>
                      <span className="text-red-200">•</span>
                      <span>
                        Stability: <span className="font-bold text-white">{selectedDriver.stabilityScore}%</span>
                      </span>
                      <span className="text-red-200">•</span>
                      <span>
                        Speed: <span className="font-bold text-white">{Math.round(selectedDriver.speedKmph)} km/h</span>
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-medium bg-red-500/30 rounded px-2.5 py-1 inline-block">
                      ⚠️ Immediate intervention recommended — Alert dispatched to fleet supervisor
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gauges Row */}
        {selectedDriver && (
          <motion.div
            key="gauges"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="py-4">
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <SpeedGauge
                    speed={selectedDriver.speedKmph}
                    maxSpeed={selectedDriver.maxSpeed}
                  />
                  <StabilityGauge score={selectedDriver.stabilityScore} />
                  <EarGauge ear={selectedDriver.earRatio} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Metrics Grid (2x2) */}
        {selectedDriver && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <MetricCard
              icon={CircleStop}
              label="Harsh Braking"
              value={selectedDriver.harshBrakingEvents}
              unit="events"
              color={selectedDriver.harshBrakingEvents > 2 ? RED : TEAL}
              alert={selectedDriver.harshBrakingEvents > 2}
            />
            <MetricCard
              icon={Zap}
              label="Harsh Acceleration"
              value={selectedDriver.harshAccelerationEvents}
              unit="events"
              color={selectedDriver.harshAccelerationEvents > 1 ? AMBER : TEAL}
              alert={selectedDriver.harshAccelerationEvents > 1}
            />
            <MetricCard
              icon={Fuel}
              label="Fuel Efficiency"
              value={selectedDriver.fuelEfficiency.toFixed(1)}
              unit="km/L"
              color={selectedDriver.fuelEfficiency > 8 ? GREEN : AMBER}
            />
            <MetricCard
              icon={Clock}
              label="Trip Duration"
              value={calcTripDuration(selectedDriver.timestamp)}
              unit=""
              color={TEAL}
            />
          </motion.div>
        )}

        {/* Speed History + Fatigue Simulator Row */}
        {selectedDriver && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Speed History Chart */}
            <motion.div
              key="speed-chart"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="py-4">
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="size-4" style={{ color: TEAL }} />
                    Speed History (Live)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SpeedChart key={speedChartKey} currentSpeed={selectedDriver.speedKmph} />
                  <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground/60">
                    <span>-40s</span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: speedColor(selectedDriver.speedKmph) }} />
                      {Math.round(selectedDriver.speedKmph)} km/h current
                    </span>
                    <span>now</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Driver Fatigue Simulator */}
            <motion.div
              key="fatigue-sim"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="py-4">
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="size-4" style={{ color: isDrowsy ? RED : TEAL }} />
                    Driver Fatigue Simulator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EyeDiagram ear={selectedDriver.earRatio} />
                  <div className="mt-2 text-[10px] text-muted-foreground/50 text-center">
                    Simulated driver camera view • EAR-based eyelid tracking
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
