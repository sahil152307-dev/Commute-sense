'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Activity,
  Clock,
  ChevronDown,
  Wifi,
  Cpu,
  Monitor,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  color: string; // clothing color
  bodyH: number;
  bodyW: number;
}

// ---------- Helpers ----------
function generatePeople(count: number, canvasW: number, canvasH: number): Person[] {
  const people: Person[] = [];
  const clothingColors = [
    '#e91e63', // pink/magenta
    '#5d4037', // dark brown
    '#1b5e20', // dark olive
    '#0d47a1', // navy
    '#4a148c', // deep purple
    '#bf360c', // dark orange
    '#37474f', // blue grey
    '#212121', // near black
    '#f9a825', // amber
    '#00695c', // teal dark
  ];

  // Define zones where people can appear
  const zones = [
    // On the road / near bus
    { xMin: 40, xMax: canvasW * 0.45, yMin: canvasH * 0.45, yMax: canvasH * 0.75 },
    // Near bus shelter
    { xMin: canvasW * 0.55, xMax: canvasW * 0.9, yMin: canvasH * 0.35, yMax: canvasH * 0.7 },
    // Platform / sidewalk
    { xMin: 40, xMax: canvasW * 0.9, yMin: canvasH * 0.72, yMax: canvasH * 0.88 },
  ];

  for (let i = 0; i < count; i++) {
    const zone = zones[i % zones.length];
    const bw = 10 + Math.random() * 6;
    const bh = 20 + Math.random() * 10;
    people.push({
      x: zone.xMin + Math.random() * (zone.xMax - zone.xMin),
      y: zone.yMin + Math.random() * (zone.yMax - zone.yMin),
      confidence: 0.78 + Math.random() * 0.21,
      id: i + 1,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15,
      color: clothingColors[Math.floor(Math.random() * clothingColors.length)],
      bodyH: bh,
      bodyW: bw,
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

const DENSITY_CONFIG = {
  LOW: { color: '#22c55e', label: 'Low', bgClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  MODERATE: { color: '#f59e0b', label: 'Moderate', bgClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  HIGH: { color: '#ef4444', label: 'High', bgClass: 'bg-red-500/15 text-red-400 border-red-500/30' },
} as const;

type DensityStatus = keyof typeof DENSITY_CONFIG;

function generateHistory(current: number, points = 30) {
  const hist: number[] = [];
  for (let i = 0; i < points - 1; i++) {
    hist.push(Math.max(0, current + Math.floor(Math.random() * 8) - 4));
  }
  hist.push(current);
  return hist;
}

// ---------- Component ----------
export function CrowdMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const peopleRef = useRef<Person[]>([]);
  const timeRef = useRef(new Date());
  const frameCountRef = useRef(0);
  const fpsRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const detectionTimerRef = useRef(0);

  // Refs for animation loop
  const activeCrowdRef = useRef(crowdData[0]);
  const densityColorRef = useRef(DENSITY_CONFIG[crowdData[0].densityStatus].color);
  const densityStatusRef = useRef<DensityStatus>(crowdData[0].densityStatus);
  const liveCountRef = useRef(crowdData[0].currentCount);

  const [selectedStop, setSelectedStop] = useState<string>(crowdData[0].stopId);
  const [liveCount, setLiveCount] = useState(crowdData[0].currentCount);
  const [history, setHistory] = useState(() =>
    generateHistory(crowdData[0].currentCount),
  );
  const [showCameraSelect, setShowCameraSelect] = useState(false);

  const activeCrowd = useMemo(
    () => crowdData.find((c) => c.stopId === selectedStop) ?? crowdData[0],
    [selectedStop],
  );

  const densityCfg = DENSITY_CONFIG[activeCrowd.densityStatus];

  // Keep refs in sync
  useEffect(() => { activeCrowdRef.current = activeCrowd; }, [activeCrowd]);
  useEffect(() => { densityColorRef.current = densityCfg.color; }, [densityCfg.color]);
  useEffect(() => { densityStatusRef.current = activeCrowd.densityStatus; }, [activeCrowd.densityStatus]);
  useEffect(() => { liveCountRef.current = liveCount; }, [liveCount]);

  // Regenerate people when stop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    peopleRef.current = generatePeople(liveCount, rect.width, rect.height);
  }, [selectedStop, liveCount]);

  // Fluctuate count every 3s
  useEffect(() => {
    const base = activeCrowd.currentCount;
    const iv = setInterval(() => {
      const next = simulateCrowdFluctuation(base);
      setLiveCount(next);
      setHistory((h) => [...h.slice(1), next]);
    }, 3000);
    return () => clearInterval(iv);
  }, [activeCrowd.currentCount]);

  // ---------- Canvas draw loop ----------
  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;

    // FPS counter
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsTimeRef.current >= 1000) {
      fpsRef.current = frameCountRef.current;
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }
    timeRef.current = new Date();
    detectionTimerRef.current += 1;

    const crowd = activeCrowdRef.current;
    const dColor = densityColorRef.current;
    const dStatus = densityStatusRef.current;
    const count = liveCountRef.current;

    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // ===== BACKGROUND: Light scene (like a real camera feed) =====
    // Sky / building backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.35);
    skyGrad.addColorStop(0, '#b8c4ce');
    skyGrad.addColorStop(1, '#a0aab4');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.35);

    // Buildings silhouette
    ctx.fillStyle = '#8a949e';
    const buildings = [
      { x: 0, w: W * 0.12, h: H * 0.25 },
      { x: W * 0.1, w: W * 0.08, h: H * 0.3 },
      { x: W * 0.16, w: W * 0.15, h: H * 0.22 },
      { x: W * 0.3, w: W * 0.1, h: H * 0.28 },
      { x: W * 0.38, w: W * 0.07, h: H * 0.2 },
      { x: W * 0.82, w: W * 0.18, h: H * 0.26 },
    ];
    for (const b of buildings) {
      ctx.fillRect(b.x, H * 0.35 - b.h, b.w, b.h);
      // Windows
      ctx.fillStyle = 'rgba(200,220,240,0.3)';
      for (let wy = H * 0.35 - b.h + 8; wy < H * 0.32; wy += 14) {
        for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 10) {
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
      ctx.fillStyle = '#8a949e';
    }

    // Ground / road area
    const groundGrad = ctx.createLinearGradient(0, H * 0.35, 0, H);
    groundGrad.addColorStop(0, '#c8cdd2');
    groundGrad.addColorStop(0.5, '#b0b8c0');
    groundGrad.addColorStop(1, '#a8b0b8');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H * 0.35, W, H * 0.65);

    // Road surface
    ctx.fillStyle = '#7a828a';
    ctx.fillRect(0, H * 0.52, W, H * 0.22);

    // Lane markings - dashed white center line
    ctx.setLineDash([20, 15]);
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.63);
    ctx.lineTo(W, H * 0.63);
    ctx.stroke();
    ctx.setLineDash([]);

    // Road edge - yellow line
    ctx.strokeStyle = '#e8b830';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.52);
    ctx.lineTo(W, H * 0.52);
    ctx.stroke();

    // Sidewalk
    ctx.fillStyle = '#d0d4d8';
    ctx.fillRect(0, H * 0.74, W, H * 0.06);
    ctx.strokeStyle = '#b0b8c0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.74);
    ctx.lineTo(W, H * 0.74);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, H * 0.80);
    ctx.lineTo(W, H * 0.80);
    ctx.stroke();

    // Platform area (bottom)
    ctx.fillStyle = '#c0c8d0';
    ctx.fillRect(0, H * 0.80, W, H * 0.20);

    // ===== BUS SHELTER =====
    const shelterX = W * 0.6;
    const shelterY = H * 0.30;
    const shelterW = W * 0.30;
    const shelterH = H * 0.48;

    // Shelter back panel
    ctx.fillStyle = 'rgba(180,190,200,0.6)';
    ctx.fillRect(shelterX, shelterY, shelterW, shelterH);
    ctx.strokeStyle = 'rgba(140,155,170,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(shelterX, shelterY, shelterW, shelterH);

    // Shelter roof
    ctx.fillStyle = 'rgba(100,115,130,0.7)';
    ctx.fillRect(shelterX - 8, shelterY, shelterW + 16, 6);

    // Shelter roof supports
    ctx.strokeStyle = 'rgba(100,115,130,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shelterX, shelterY + 6);
    ctx.lineTo(shelterX, shelterY + shelterH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(shelterX + shelterW, shelterY + 6);
    ctx.lineTo(shelterX + shelterW, shelterY + shelterH);
    ctx.stroke();

    // Shelter bench
    ctx.fillStyle = 'rgba(120,130,140,0.5)';
    ctx.fillRect(shelterX + 10, shelterY + shelterH - 20, shelterW - 20, 5);

    // Shelter label
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(80,90,100,0.5)';
    ctx.fillText('BUS SHELTER', shelterX + 8, shelterY - 4);

    // ===== YELLOW BUS =====
    const busX = W * 0.08;
    const busY = H * 0.44;
    const busW = W * 0.38;
    const busH = H * 0.16;

    // Bus shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(busX + busW / 2, busY + busH + 4, busW * 0.45, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bus body
    ctx.fillStyle = '#f5c518';
    ctx.beginPath();
    ctx.roundRect(busX, busY, busW, busH, [4, 4, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = '#c9a20d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bus roof highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(busX + 2, busY + 2, busW - 4, busH * 0.15);

    // Bus windows
    ctx.fillStyle = '#2a3a5c';
    const winStartX = busX + busW * 0.2;
    const winW = busW * 0.1;
    const winH = busH * 0.45;
    const winY = busY + busH * 0.15;
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(winStartX + i * (winW + 4), winY, winW, winH);
      // Window reflection
      ctx.fillStyle = 'rgba(150,180,220,0.15)';
      ctx.fillRect(winStartX + i * (winW + 4), winY, winW * 0.4, winH);
      ctx.fillStyle = '#2a3a5c';
    }

    // Windshield
    ctx.fillStyle = '#1e3050';
    ctx.beginPath();
    ctx.roundRect(busX + busW * 0.04, winY, busW * 0.13, winH, 2);
    ctx.fill();

    // Bus destination sign
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(busX + 6, busY + 4, busW * 0.5, 12);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#f5c518';
    ctx.fillText(crowd.stopName.toUpperCase(), busX + 10, busY + 13);

    // Bus wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(busX + busW * 0.18, busY + busH + 1, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(busX + busW * 0.82, busY + busH + 1, 6, 0, Math.PI * 2); ctx.fill();
    // Wheel hubcaps
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(busX + busW * 0.18, busY + busH + 1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(busX + busW * 0.82, busY + busH + 1, 2.5, 0, Math.PI * 2); ctx.fill();

    // ===== MOVE PEOPLE =====
    const people = peopleRef.current;
    const updated = people.map((p) => {
      let nx = p.x + p.vx;
      let ny = p.y + p.vy;
      let nvx = p.vx;
      let nvy = p.vy;
      // Keep within their zones
      if (nx < 30 || nx > W - 30) nvx *= -1;
      if (ny < H * 0.35 || ny > H * 0.92) nvy *= -1;
      // Slight random direction change
      if (Math.random() < 0.01) {
        nvx = (Math.random() - 0.5) * 0.25;
        nvy = (Math.random() - 0.5) * 0.15;
      }
      nx = Math.max(30, Math.min(W - 30, nx));
      ny = Math.max(H * 0.35, Math.min(H * 0.92, ny));
      return { ...p, x: nx, y: ny, vx: nvx, vy: nvy };
    });
    peopleRef.current = updated;

    // ===== DRAW PEOPLE + BOUNDING BOXES =====
    for (const p of updated) {
      const boxPad = 8;
      const bx = p.x - p.bodyW / 2 - boxPad;
      const by = p.y - p.bodyH - 10 - boxPad;
      const bw = p.bodyW + boxPad * 2;
      const bh = p.bodyH + 14 + boxPad * 2;

      // Person silhouette (simple body shape)
      // Head
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - p.bodyH - 6, p.bodyW * 0.35, p.bodyW * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillRect(p.x - p.bodyW / 2, p.y - p.bodyH, p.bodyW, p.bodyH);
      // Legs
      ctx.fillStyle = '#3a4a5a';
      ctx.fillRect(p.x - p.bodyW / 2 + 1, p.y, p.bodyW * 0.4, 8);
      ctx.fillRect(p.x + 1, p.y, p.bodyW * 0.4, 8);

      // Teal bounding box
      ctx.strokeStyle = 'rgba(20,184,166,0.85)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);

      // Corner brackets (teal, thicker)
      const cl = 7;
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2.5;
      // Top-left
      ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
      // Top-right
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();

      // Label badge: #ID
      const label = `#${p.id}`;
      ctx.font = 'bold 9px monospace';
      const tw = ctx.measureText(label).width;
      const labelW = tw + 8;
      ctx.fillStyle = 'rgba(20,184,166,0.9)';
      ctx.beginPath();
      ctx.roundRect(bx, by - 14, labelW, 13, 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, bx + 4, by - 4);

      // Confidence % at bottom of box
      const confText = `${(p.confidence * 100).toFixed(0)}%`;
      ctx.font = '8px monospace';
      const cw = ctx.measureText(confText).width;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(bx, by + bh + 2, cw + 6, 11, 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(20,184,166,0.9)';
      ctx.fillText(confText, bx + 3, by + bh + 10);
    }

    // ===== BOTTOM CLASSIFICATION BAR =====
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, H - 28, W, 28);
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(20,184,166,0.7)';
    ctx.fillText('CLASSIFICATION: YOLOv8-Person', 10, H - 12);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(`CONF THRESHOLD: 0.75`, 190, H - 12);
    ctx.fillText(`NMS IOU: 0.45`, 330, H - 12);
    ctx.fillStyle = dColor;
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`DENSITY: ${dStatus.toUpperCase()}`, 450, H - 12);

    // ===== CV OVERLAY: Timestamp + CAM info (bottom-right) =====
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    const tsText = `${formatTime(timeRef.current)}  |  ${fpsRef.current} FPS`;
    ctx.font = '9px monospace';
    const tsW = ctx.measureText(tsText).width;
    ctx.fillRect(W - tsW - 16, H - 28, tsW + 16, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(tsText, W - tsW - 10, H - 12);

    ctx.restore();
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
      peopleRef.current = generatePeople(liveCount, rect.width, rect.height);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [liveCount]);

  const maxHist = Math.max(...history, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 w-full">
      {/* ---- LEFT: CV Camera Feed ---- */}
      <motion.div
        className="lg:col-span-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-white/10 bg-[#0f1214]">
          {/* Top header bar - matches screenshot style */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0d0f] border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center size-7 rounded-md bg-emerald-500/15">
                <Eye className="size-4 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-white/90">
                Passenger Density <span className="text-white/40 font-normal">·</span>{' '}
                <span className="text-white/50 font-medium">Computer Vision</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Density status badge */}
              <Badge
                variant="outline"
                className={`text-[10px] font-bold px-2.5 py-0.5 border ${densityCfg.bgClass}`}
              >
                {densityCfg.label.toUpperCase()}
              </Badge>
              <span className="text-xs text-white/70 font-medium">
                {liveCount} detected
              </span>

              {/* Camera selector - pill style */}
              <div className="relative">
                <button
                  onClick={() => setShowCameraSelect(!showCameraSelect)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/5 text-xs text-white/80 hover:bg-teal-500/10 transition-colors"
                >
                  <span className="text-teal-400 font-mono text-[10px]">{activeCrowd.cameraId}</span>
                  <span className="text-white/40">·</span>
                  <span>{activeCrowd.stopName}</span>
                  <ChevronDown className={`size-3 text-white/40 transition-transform ${showCameraSelect ? 'rotate-180' : ''}`} />
                </button>
                {showCameraSelect && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-lg border border-white/10 bg-[#111a16] py-1 shadow-xl">
                    {crowdData.map((c) => {
                      const cfg = DENSITY_CONFIG[c.densityStatus];
                      return (
                        <button
                          key={c.stopId}
                          onClick={() => { setSelectedStop(c.stopId); setShowCameraSelect(false); }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="size-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          <span className="text-xs text-white/80 font-mono">{c.cameraId}</span>
                          <span className="text-xs text-white/50">·</span>
                          <span className="text-xs text-white/70">{c.stopName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <CardContent className="p-0 relative">
            <canvas
              ref={canvasRef}
              className="w-full h-[380px] sm:h-[440px] lg:h-[480px] block"
            />
            {/* LIVE indicator overlay */}
            <motion.div
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/20 backdrop-blur-sm"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <span className="size-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-red-400 tracking-wider">LIVE</span>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- RIGHT: Stats Panel ---- */}
      <motion.div
        className="lg:col-span-2 flex flex-col gap-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {/* Live Count - Large gauge style */}
        <Card className="border-white/10 bg-[#0f1214]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                Passengers Detected
              </span>
              <motion.div
                className="size-2.5 rounded-full"
                style={{ backgroundColor: densityCfg.color }}
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
            <div className="flex items-end gap-3 mt-2">
              <motion.span
                key={liveCount}
                className="text-6xl font-bold tabular-nums tracking-tight"
                style={{ color: densityCfg.color }}
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {liveCount}
              </motion.span>
              <span className="text-white/30 text-sm mb-2 font-medium">people</span>
            </div>
            {/* Density level bar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Density Level</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold px-2 py-0 border ${densityCfg.bgClass}`}
                >
                  {densityCfg.label}
                </Badge>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: densityCfg.color }}
                  animate={{
                    width: `${Math.min((liveCount / 25) * 100, 100)}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-white/20 tabular-nums">
                <span>0</span>
                <span>LOW</span>
                <span>MODERATE</span>
                <span>HIGH</span>
                <span>25+</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status Indicators */}
        <Card className="border-white/10 bg-[#0f1214]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="size-3.5 text-teal-400" />
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                System Status
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Wifi className="size-3.5 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-white/30">Stream</p>
                  <p className="text-xs text-emerald-400 font-semibold">Connected</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="size-3.5 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-white/30">Model</p>
                  <p className="text-xs text-white/70 font-mono">YOLOv8</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="size-3.5 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-white/30">Inference</p>
                  <p className="text-xs text-white/70 font-mono">~33ms</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-3.5 text-amber-400" />
                <div>
                  <p className="text-[10px] text-white/30">Accuracy</p>
                  <p className="text-xs text-amber-400 font-semibold">94.2%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Density History Sparkline */}
        <Card className="border-white/10 bg-[#0f1214]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="size-3.5 text-teal-400" />
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                  Density Trend
                </span>
              </div>
              <div className="flex items-center gap-1 text-white/20">
                <Clock className="size-3" />
                <span className="text-[9px] font-mono">Last {history.length * 3}s</span>
              </div>
            </div>
            <div className="flex items-end gap-[2px] h-14">
              {history.map((val, i) => {
                const h = Math.max(3, (val / maxHist) * 100);
                const isLast = i === history.length - 1;
                return (
                  <motion.div
                    key={`${selectedStop}-${i}`}
                    className="flex-1 rounded-t-sm min-w-[4px]"
                    style={{
                      backgroundColor: isLast
                        ? densityCfg.color
                        : `${densityCfg.color}33`,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.3, delay: i * 0.015 }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* All Monitored Stops */}
        <Card className="border-white/10 bg-[#0f1214]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="size-3.5 text-teal-400" />
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                All Cameras
              </span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {crowdData.map((c) => {
                const cfg = DENSITY_CONFIG[c.densityStatus];
                const isActive = c.stopId === selectedStop;
                return (
                  <motion.button
                    key={c.stopId}
                    onClick={() => setSelectedStop(c.stopId)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all w-full ${
                      isActive
                        ? 'bg-white/8 ring-1 ring-white/10'
                        : 'hover:bg-white/3'
                    }`}
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="text-[10px] text-white/30 font-mono shrink-0">{c.cameraId}</span>
                    <span className="text-xs text-white/70 truncate flex-1">{c.stopName}</span>
                    <span
                      className="text-xs font-bold tabular-nums shrink-0"
                      style={{ color: cfg.color }}
                    >
                      {c.currentCount}
                    </span>
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