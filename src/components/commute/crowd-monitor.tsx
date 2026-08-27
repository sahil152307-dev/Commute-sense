'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Users,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Eye,
  TrendingUp,
  Clock,
  Radio,
  ChevronRight,
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
import { crowdData, classifyDensity, simulateCrowdFluctuation } from '@/lib/mock-data';

// ---------- Types ----------
interface Person {
  x: number;
  y: number;
  confidence: number;
  id: number;
  vx: number;
  vy: number;
}

// ---------- Helpers ----------
function generatePeople(count: number, canvasW: number, canvasH: number): Person[] {
  const margin = 40;
  const people: Person[] = [];
  for (let i = 0; i < count; i++) {
    people.push({
      x: margin + Math.random() * (canvasW - 2 * margin - 20),
      y: margin + Math.random() * (canvasH - 2 * margin - 50),
      confidence: 0.82 + Math.random() * 0.17,
      id: i,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3,
    });
  }
  return people;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const DENSITY_CONFIG = {
  LOW: { color: '#22c55e', label: 'Low', glow: 'rgba(34,197,94,0.25)' },
  MODERATE: { color: '#f59e0b', label: 'Moderate', glow: 'rgba(245,158,11,0.25)' },
  HIGH: { color: '#ef4444', label: 'High', glow: 'rgba(239,68,68,0.3)' },
} as const;

type DensityStatus = keyof typeof DENSITY_CONFIG;

function generateHistory(current: number, points = 20) {
  const hist: number[] = [];
  for (let i = 0; i < points - 1; i++) {
    hist.push(Math.max(0, current + Math.floor(Math.random() * 10) - 5));
  }
  hist.push(current);
  return hist;
}

// ---------- Component ----------
export function CrowdMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const peopleRef = useRef<Person[]>([]);
  const scanlineYRef = useRef(0);
  const timeRef = useRef(new Date());
  const frameCountRef = useRef(0);
  const fpsRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());

  // Refs to pass reactive data into the animation loop
  const activeCrowdRef = useRef(crowdData[0]);
  const densityColorRef = useRef(DENSITY_CONFIG[crowdData[0].densityStatus].color);
  const densityStatusRef = useRef<DensityStatus>(crowdData[0].densityStatus);

  const [selectedStop, setSelectedStop] = useState<string>(crowdData[0].stopId);
  const [liveCount, setLiveCount] = useState(crowdData[0].currentCount);
  const [history, setHistory] = useState(() =>
    generateHistory(crowdData[0].currentCount),
  );

  const activeCrowd = useMemo(
    () => crowdData.find((c) => c.stopId === selectedStop) ?? crowdData[0],
    [selectedStop],
  );

  const density = useMemo(() => classifyDensity(liveCount), [liveCount]);

  const densityCfg = DENSITY_CONFIG[activeCrowd.densityStatus];

  // Keep refs in sync with reactive values
  useEffect(() => { activeCrowdRef.current = activeCrowd; }, [activeCrowd]);
  useEffect(() => { densityColorRef.current = densityCfg.color; }, [densityCfg.color]);
  useEffect(() => { densityStatusRef.current = activeCrowd.densityStatus; }, [activeCrowd.densityStatus]);

  // Regenerate people when stop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    peopleRef.current = generatePeople(liveCount, rect.width, rect.height);
  }, [selectedStop, liveCount]);

  // Fluctuate count every 2s
  useEffect(() => {
    const base = activeCrowd.currentCount;
    const iv = setInterval(() => {
      const next = simulateCrowdFluctuation(base);
      setLiveCount(next);
      setHistory((h) => [...h.slice(1), next]);
    }, 2000);
    return () => clearInterval(iv);
  }, [activeCrowd.currentCount]);

  // ---------- Canvas draw loop (single effect, reads from refs) ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function draw() {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      // FPS
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        fpsRef.current = frameCountRef.current;
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      timeRef.current = new Date();

      const crowd = activeCrowdRef.current;
      const dColor = densityColorRef.current;
      const dStatus = densityStatusRef.current;

      // --- Background (dark CCTV) ---
      ctx.fillStyle = '#0a0f0d';
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = 'rgba(20,184,166,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // --- Ground / platform area ---
      ctx.fillStyle = 'rgba(20,184,166,0.03)';
      ctx.fillRect(20, H - 80, W - 40, 50);
      ctx.strokeStyle = 'rgba(20,184,166,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, H - 80, W - 40, 50);
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(20,184,166,0.3)';
      ctx.fillText('PLATFORM AREA', 28, H - 60);

      // --- Bus shelter ---
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(W * 0.6, 50, W * 0.32, H * 0.55);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(W * 0.6, 50, W * 0.32, H * 0.55);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W * 0.58, 50); ctx.lineTo(W * 0.94, 50); ctx.stroke();
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText('BUS SHELTER', W * 0.7, 46);

      // --- Move people slightly (mutate in-place via local ref copy) ---
      const people = peopleRef.current;
      const updated = people.map((p) => {
        let nx = p.x + p.vx;
        let ny = p.y + p.vy;
        let nvx = p.vx;
        let nvy = p.vy;
        if (nx < 30 || nx > W - 50) nvx *= -1;
        if (ny < 60 || ny > H - 90) nvy *= -1;
        nx = Math.max(30, Math.min(W - 50, nx));
        ny = Math.max(60, Math.min(H - 90, ny));
        return { ...p, x: nx, y: ny, vx: nvx, vy: nvy };
      });
      peopleRef.current = updated;

      // --- Draw people silhouettes + bounding boxes ---
      for (const p of updated) {
        const pw = 20;
        const ph = 30;
        const boxPad = 6;

        // Silhouette color based on density
        const silhouetteColor =
          dStatus === 'HIGH'
            ? 'rgba(239,68,68,0.55)'
            : dStatus === 'MODERATE'
              ? 'rgba(245,158,11,0.5)'
              : 'rgba(34,197,94,0.45)';
        ctx.fillStyle = silhouetteColor;
        ctx.fillRect(p.x, p.y, pw, ph);

        // Head circle
        ctx.beginPath();
        ctx.arc(p.x + pw / 2, p.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();

        // Green bounding box
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          p.x - boxPad,
          p.y - 12 - boxPad,
          pw + boxPad * 2,
          ph + 17 + boxPad * 2,
        );

        // Confidence label
        const confText = `${(p.confidence * 100).toFixed(0)}%`;
        ctx.font = '9px monospace';
        const tw = ctx.measureText(confText).width;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(p.x - boxPad, p.y - 20 - boxPad, tw + 6, 12);
        ctx.fillStyle = '#22c55e';
        ctx.fillText(confText, p.x - boxPad + 3, p.y - 11 - boxPad);

        // Corner brackets
        const bx = p.x - boxPad;
        const by = p.y - 12 - boxPad;
        const bw = pw + boxPad * 2;
        const bh = ph + 17 + boxPad * 2;
        const cl = 6;
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();
      }

      // --- Scanline effect ---
      scanlineYRef.current = (scanlineYRef.current + 1.5) % H;
      const sy = scanlineYRef.current;
      const grad = ctx.createLinearGradient(0, sy - 30, 0, sy + 30);
      grad.addColorStop(0, 'rgba(20,184,166,0)');
      grad.addColorStop(0.5, 'rgba(20,184,166,0.12)');
      grad.addColorStop(1, 'rgba(20,184,166,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, sy - 30, W, 60);
      ctx.strokeStyle = 'rgba(20,184,166,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();

      // --- CRT horizontal scanlines ---
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1);
      }

      // --- Vignette ---
      const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      // --- Overlay: Top-left ---
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#14b8a6';
      ctx.fillText(`CAM: ${crowd.cameraId}`, 12, 20);
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(formatDate(timeRef.current), 12, 36);
      ctx.fillText(formatTime(timeRef.current), 12, 50);

      // --- Overlay: Top-right LIVE + FPS ---
      const liveText = '\u25CF LIVE';
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(liveText, W - ctx.measureText(liveText).width - 12, 20);
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(`${fpsRef.current} FPS`, W - 50, 36);

      // --- Overlay: Bottom-left ---
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(crowd.stopName.toUpperCase(), 12, H - 14);

      // --- Overlay: Bottom-right ---
      const detText = `DETECTED: ${updated.length}`;
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = dColor;
      ctx.fillText(detText, W - ctx.measureText(detText).width - 12, H - 14);

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      peopleRef.current = generatePeople(liveCount, rect.width, rect.height);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [liveCount]);

  const maxHist = Math.max(...history, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 w-full">
      {/* ---- LEFT: CCTV Canvas ---- */}
      <motion.div
        className="lg:col-span-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-[#14b8a6]/20 bg-[#080d0b]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="size-5 text-[#14b8a6]" />
                <CardTitle className="text-sm text-white/90">
                  CV Passenger Density Tracker
                </CardTitle>
              </div>
              <motion.span
                className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Radio className="size-3" />
                LIVE
              </motion.span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <canvas
              ref={canvasRef}
              className="w-full h-[360px] sm:h-[420px] lg:h-[460px] block"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- RIGHT: Density Stats Panel ---- */}
      <motion.div
        className="lg:col-span-2 flex flex-col gap-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {/* Camera Selector */}
        <Card className="border-[#14b8a6]/20 bg-[#080d0b]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="size-4 text-[#14b8a6]" />
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Camera Feed
              </span>
            </div>
            <Select value={selectedStop} onValueChange={setSelectedStop}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select stop" />
              </SelectTrigger>
              <SelectContent className="bg-[#111a16] border-white/10">
                {crowdData.map((c) => {
                  const cfg = DENSITY_CONFIG[c.densityStatus];
                  return (
                    <SelectItem key={c.stopId} value={c.stopId}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                        {c.stopName}
                        <span className="text-white/40 text-xs ml-auto">{c.cameraId}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Live Count Card */}
        <Card className="border-[#14b8a6]/20 bg-[#080d0b]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Passengers Detected
              </span>
              <motion.div
                className="size-2 rounded-full"
                style={{ backgroundColor: densityCfg.color }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
            <div className="flex items-end gap-3">
              <motion.span
                key={liveCount}
                className="text-5xl font-bold tabular-nums"
                style={{ color: densityCfg.color }}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {liveCount}
              </motion.span>
              <span className="text-white/40 text-sm mb-2">people</span>
            </div>
            <div className="mt-2">
              <Badge
                className="text-[11px] font-semibold border-0"
                style={{
                  backgroundColor: densityCfg.glow,
                  color: densityCfg.color,
                }}
              >
                {activeCrowd.densityStatus === 'HIGH' && (
                  <AlertTriangle className="size-3 mr-1" />
                )}
                {activeCrowd.densityStatus === 'LOW' && (
                  <ShieldCheck className="size-3 mr-1" />
                )}
                {activeCrowd.densityStatus === 'MODERATE' && (
                  <Activity className="size-3 mr-1" />
                )}
                {densityCfg.label} Density
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Action */}
        <Card className="border-[#14b8a6]/20 bg-[#080d0b]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-[#14b8a6]" />
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Recommended Action
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCrowd.recommendedAction}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-sm font-medium text-white/90">
                  {activeCrowd.recommendedAction === 'DISPATCH_EXTRA_BUS'
                    ? '🚍 Dispatch additional bus immediately'
                    : activeCrowd.recommendedAction === 'MONITOR'
                      ? '👁️ Continue monitoring \u2014 no action needed'
                      : '✅ All clear \u2014 normal operations'}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {activeCrowd.recommendedAction === 'DISPATCH_EXTRA_BUS'
                    ? 'Density threshold exceeded. Consider rerouting idle vehicles.'
                    : activeCrowd.recommendedAction === 'MONITOR'
                      ? 'Density within acceptable range. Maintain current schedule.'
                      : 'Low footfall detected. No intervention required.'}
                </p>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Density History Sparkline */}
        <Card className="border-[#14b8a6]/20 bg-[#080d0b]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-[#14b8a6]" />
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Density History
                </span>
              </div>
              <div className="flex items-center gap-1 text-white/30">
                <Clock className="size-3" />
                <span className="text-[10px]">Last {history.length * 2}s</span>
              </div>
            </div>
            <div className="flex items-end gap-[3px] h-16">
              {history.map((val, i) => {
                const h = Math.max(4, (val / maxHist) * 100);
                const isLast = i === history.length - 1;
                return (
                  <motion.div
                    key={`${selectedStop}-${i}`}
                    className="flex-1 rounded-sm min-w-[6px]"
                    style={{
                      backgroundColor: isLast
                        ? densityCfg.color
                        : `${densityCfg.color}44`,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* All Stops Overview */}
        <Card className="border-[#14b8a6]/20 bg-[#080d0b]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-4 text-[#14b8a6]" />
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                All Monitored Stops
              </span>
            </div>
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {crowdData.map((c) => {
                const cfg = DENSITY_CONFIG[c.densityStatus];
                const isActive = c.stopId === selectedStop;
                return (
                  <motion.button
                    key={c.stopId}
                    onClick={() => setSelectedStop(c.stopId)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors w-full ${
                      isActive
                        ? 'bg-white/10 ring-1 ring-white/10'
                        : 'hover:bg-white/5'
                    }`}
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/90 truncate">{c.stopName}</p>
                      <p className="text-[10px] text-white/30">
                        {c.cameraId} · {c.recommendedAction}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: cfg.color }}
                      >
                        {c.currentCount}
                      </span>
                      <ChevronRight className="size-3.5 text-white/20" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
