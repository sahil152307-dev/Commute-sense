'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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

import { crowdData, simulateCrowdFluctuation } from '@/lib/mock-data';

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
  zoneIndex: number; // which zone this person belongs to
  boarding: boolean;
  boarded: boolean;
}

// ---------- Zone definitions (proportional) ----------
const ZONE_DEFS = [
  // Zone A: near bus shelter entrance (sidewalk) — right of center
  { xMin: 0.55, xMax: 0.65, yMin: 0.76, yMax: 0.88 },
  // Zone B: inside bus shelter area — people waiting
  { xMin: 0.62, xMax: 0.88, yMin: 0.76, yMax: 0.92 },
  // Zone C: platform/far sidewalk (well below road)
  { xMin: 0.15, xMax: 0.45, yMin: 0.80, yMax: 0.92 },
  // Zone D: far left sidewalk area
  { xMin: 0.02, xMax: 0.12, yMin: 0.78, yMax: 0.88 },
];

// ---------- Helpers ----------
function generatePeople(count: number, canvasW: number, canvasH: number): Person[] {
  const people: Person[] = [];
  const clothingColors = [
    '#e91e63', '#5d4037', '#1b5e20', '#0d47a1', '#4a148c',
    '#bf360c', '#37474f', '#212121', '#f9a825', '#00695c',
  ];

  for (let i = 0; i < count; i++) {
    const zoneIndex = i % ZONE_DEFS.length;
    const zd = ZONE_DEFS[zoneIndex];
    const bw = 10 + Math.random() * 6;
    const bh = 20 + Math.random() * 10;
    people.push({
      x: zd.xMin * canvasW + Math.random() * (zd.xMax - zd.xMin) * canvasW,
      y: zd.yMin * canvasH + Math.random() * (zd.yMax - zd.yMin) * canvasH,
      confidence: 0.78 + Math.random() * 0.21,
      id: i + 1,
      vx: (Math.random() - 0.5) * 0.015,
      vy: (Math.random() - 0.5) * 0.01,
      color: clothingColors[Math.floor(Math.random() * clothingColors.length)],
      bodyH: bh,
      bodyW: bw,
      zoneIndex,
      boarding: false,
      boarded: false,
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

// ---------- Bus animation phases ----------
// Phase 0: approach from left (-busW to stopX) — ~8s
// Phase 1: stopped at shelter (doors open, idle) — ~6s
// Phase 2: depart to right (stopX to W+busW) — ~8s
// Phase 3: off-screen pause before next loop — ~4s
const BUS_PHASE_DURATIONS = [8000, 6000, 8000, 4000]; // ms
const BUS_TOTAL_CYCLE = BUS_PHASE_DURATIONS.reduce((a, b) => a + b, 0);

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
  const busStartTimeRef = useRef(Date.now());
  const wheelAngleRef = useRef(0);
  const doorPosRef = useRef<{x:number;y:number}|null>(null);
  const boardingInitRef = useRef(false);

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

    ctx.fillStyle = 'rgba(160,175,190,0.85)';
    ctx.fillRect(shelterX, shelterY, shelterW, shelterH);
    ctx.strokeStyle = 'rgba(140,155,170,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(shelterX, shelterY, shelterW, shelterH);

    const glassCount = 3;
    const glassGap = shelterW / (glassCount + 1);
    for (let gi = 1; gi <= glassCount; gi++) {
      const gx = shelterX + gi * glassGap - 4;
      const gy = shelterY + 10;
      const gw = 8;
      const gh = shelterH - 30;
      ctx.fillStyle = 'rgba(140,180,210,0.75)';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = 'rgba(120,150,180,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);
    }

    ctx.fillStyle = 'rgba(80,95,110,0.9)';
    ctx.fillRect(shelterX - 8, shelterY, shelterW + 16, 8);

    ctx.strokeStyle = 'rgba(80,95,110,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shelterX, shelterY + 8);
    ctx.lineTo(shelterX, shelterY + shelterH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(shelterX + shelterW, shelterY + 8);
    ctx.lineTo(shelterX + shelterW, shelterY + shelterH);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100,115,130,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(shelterX, shelterY + shelterH * 0.5);
    ctx.lineTo(shelterX + shelterW, shelterY + shelterH * 0.5);
    ctx.stroke();

    const tbX = shelterX + shelterW * 0.6;
    const tbY = shelterY + 14;
    const tbW = shelterW * 0.32;
    const tbH = 18;
    ctx.fillStyle = 'rgba(220,230,240,0.9)';
    ctx.fillRect(tbX, tbY, tbW, tbH);
    ctx.strokeStyle = 'rgba(140,150,160,0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tbX, tbY, tbW, tbH);
    ctx.fillStyle = 'rgba(60,70,80,0.6)';
    ctx.font = '6px monospace';
    ctx.fillText('ROUTE 42', tbX + 3, tbY + 7);
    ctx.fillText('12:30  12:45', tbX + 3, tbY + 15);

    ctx.fillStyle = 'rgba(120,130,140,0.5)';
    ctx.fillRect(shelterX + 10, shelterY + shelterH - 20, shelterW - 20, 5);

    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(80,90,100,0.5)';
    ctx.fillText('BUS SHELTER', shelterX + 8, shelterY - 4);

    // ===== ANIMATED YELLOW BUS =====
    const busW = W * 0.38;
    const busH = H * 0.18;
    const busRoadY = H * 0.54; // bus rides on the road area
    const stopX = W * 0.08; // where bus stops (near shelter)

    // Calculate bus phase and position
    const elapsed = (now - busStartTimeRef.current) % BUS_TOTAL_CYCLE;
    let phase = 0;
    let phaseElapsed = elapsed;
    for (let i = 0; i < BUS_PHASE_DURATIONS.length; i++) {
      if (phaseElapsed < BUS_PHASE_DURATIONS[i]) {
        phase = i;
        break;
      }
      phaseElapsed -= BUS_PHASE_DURATIONS[i];
    }
    const phaseProgress = phaseElapsed / BUS_PHASE_DURATIONS[phase]; // 0..1

    let busX: number;
    let busMoving = false;
    let busStopped = false;

    if (phase === 0) {
      // Approaching: ease-out from left off-screen to stop position
      const eased = 1 - Math.pow(1 - phaseProgress, 3); // ease-out cubic
      busX = -busW + (stopX + busW) * eased;
      busMoving = true;
    } else if (phase === 1) {
      // Stopped at shelter
      busX = stopX;
      busStopped = true;
    } else if (phase === 2) {
      // Departing: ease-in to the right off-screen
      const eased = Math.pow(phaseProgress, 3); // ease-in cubic
      busX = stopX + (W + busW - stopX) * eased;
      busMoving = true;
    } else {
      // Off-screen pause
      busX = W + busW + 100; // far off-screen
    }

    // Update wheel rotation angle when moving
    if (busMoving) {
      wheelAngleRef.current += 0.12;
    }
    const wheelAngle = wheelAngleRef.current;

    // Only draw bus if on-screen
    if (busX > -busW - 10 && busX < W + 10) {
      const busY = busRoadY;

      // Bus ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(busX + busW / 2, busY + busH + 5, busW * 0.48, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bus body
      ctx.fillStyle = '#f5c518';
      ctx.beginPath();
      ctx.roundRect(busX, busY, busW, busH, [4, 4, 2, 2]);
      ctx.fill();
      ctx.strokeStyle = '#c9a20d';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Roof highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(busX + 2, busY + 2, busW - 4, busH * 0.12);

      // Decorative stripe
      ctx.fillStyle = '#8b1a1a';
      ctx.fillRect(busX, busY + busH * 0.55, busW, busH * 0.08);

      // Destination sign (front/right side)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(busX + busW * 0.38, busY + 4, busW * 0.58, 12);
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#f5c518';
      ctx.fillText(crowd.stopName.toUpperCase(), busX + busW * 0.41, busY + 13);

      // Windows (center of bus body)
      ctx.fillStyle = '#2a3a5c';
      const winStartX = busX + busW * 0.08;
      const winW = busW * 0.10;
      const winH = busH * 0.55;
      const winY = busY + busH * 0.12;
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(winStartX + i * (winW + 4), winY, winW, winH);
        ctx.strokeStyle = '#c9a20d';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(winStartX + i * (winW + 4), winY, winW, winH);
        ctx.fillStyle = 'rgba(150,180,220,0.2)';
        ctx.fillRect(winStartX + i * (winW + 4), winY, winW * 0.4, winH);
        ctx.fillStyle = '#2a3a5c';
      }

      // Windshield (RIGHT side = FRONT, bus moves left-to-right)
      ctx.fillStyle = '#1e3050';
      ctx.beginPath();
      ctx.roundRect(busX + busW * 0.84, winY, busW * 0.13, winH, 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a20d';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Side mirror (RIGHT side = front)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(busX + busW, busY + busH * 0.22);
      ctx.lineTo(busX + busW + 12, busY + busH * 0.18);
      ctx.stroke();
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(busX + busW + 5, busY + busH * 0.12, 10, 8);
      ctx.fillStyle = 'rgba(100,140,180,0.5)';
      ctx.fillRect(busX + busW + 6, busY + busH * 0.13, 8, 6);

      // Front indicator light (RIGHT = front)
      ctx.fillStyle = '#f5a623';
      ctx.fillRect(busX + busW - 4, busY + busH * 0.7, 4, 5);

      // Tail/brake lights (LEFT = back of bus)
      if (busStopped) {
        ctx.fillStyle = '#ff2020';
        ctx.shadowColor = '#ff2020';
        ctx.shadowBlur = 6;
        ctx.fillRect(busX, busY + busH * 0.65, 4, 6);
        ctx.fillRect(busX, busY + busH * 0.8, 4, 6);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(busX, busY + busH * 0.65, 4, 6);
        ctx.fillRect(busX, busY + busH * 0.8, 4, 6);
      }

      // Wheels with rotation spokes
      const wheelCenters = [
        { cx: busX + busW * 0.18, cy: busY + busH + 1 },
        { cx: busX + busW * 0.82, cy: busY + busH + 1 },
      ];
      for (const wc of wheelCenters) {
        // Tire
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(wc.cx, wc.cy, 7, 0, Math.PI * 2);
        ctx.fill();
        // Hubcap
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(wc.cx, wc.cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Rotating spokes
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        for (let s = 0; s < 4; s++) {
          const angle = wheelAngle + (s * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(wc.cx, wc.cy);
          ctx.lineTo(wc.cx + Math.cos(angle) * 5, wc.cy + Math.sin(angle) * 5);
          ctx.stroke();
        }
      }

      // Door (RIGHT side near front - curb side)
      const doorX = busX + busW * 0.76;
      const doorY = busY + busH * 0.28;
      const doorW = busW * 0.05;
      const doorH = busH * 0.67;
      if (busStopped) {
        // Open door - dark interior visible
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeStyle = 'rgba(200,180,50,0.6)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(doorX, doorY, doorW, doorH);
        // Step/stair visible
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(doorX, doorY + doorH - 4, doorW, 4);
        // "STOP" indicator above bus
        ctx.fillStyle = 'rgba(239,68,68,0.85)';
        ctx.font = 'bold 9px monospace';
        const stopLabel = 'STOPPED';
        const slW = ctx.measureText(stopLabel).width + 10;
        ctx.beginPath();
        ctx.roundRect(busX + busW / 2 - slW / 2, busY - 18, slW, 14, 3);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(stopLabel, busX + busW / 2 - slW / 2 + 5, busY - 8);
        // Store door world position for boarding
        doorPosRef.current = { x: doorX + doorW / 2, y: doorY + doorH };
      } else {
        // Closed door
        ctx.fillStyle = '#e0b015';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeStyle = '#c9a20d';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(doorX, doorY, doorW, doorH);
        doorPosRef.current = null;
        boardingInitRef.current = false;
      }
    }

    // ===== MOVE PEOPLE (zone-locked + boarding) =====
    const people = peopleRef.current;
    const doorPos = doorPosRef.current;

    // Initialize boarding: when bus just stopped, pick some people to board
    if (busStopped && doorPos && !boardingInitRef.current) {
      boardingInitRef.current = true;
      // Reset all boarding/boarded states first
      for (const p of people) {
        p.boarding = false;
        p.boarded = false;
      }
      // Pick up to 4 people from the closest zones (A & B near shelter)
      const candidates = people.filter(p => p.zoneIndex <= 1 && !p.boarded);
      const count = Math.min(candidates.length, 4);
      const shuffled = candidates.sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        shuffled[i].boarding = true;
      }
    }

    // Reset boarding when bus leaves
    if (!busStopped) {
      for (const p of people) {
        if (p.boarded) {
          p.boarded = false;
          p.boarding = false;
          const zd = ZONE_DEFS[p.zoneIndex];
          p.x = zd.xMin * W + Math.random() * (zd.xMax - zd.xMin) * W;
          p.y = zd.yMin * H + Math.random() * (zd.yMax - zd.yMin) * H;
        }
      }
    }

    const updated = people.map((p) => {
      // Skip boarded people (invisible, inside bus)
      if (p.boarded) return p;

      // Boarding people: move toward door
      if (p.boarding && doorPos) {
        const targetX = doorPos.x + (p.id % 3) * 12 - 12; // slight spread
        const targetY = doorPos.y + 2;
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 3) {
          // Reached the door - board the bus
          return { ...p, boarded: true, boarding: false, x: targetX, y: targetY };
        }
        const speed = 0.8;
        return {
          ...p,
          x: p.x + (dx / dist) * speed,
          y: p.y + (dy / dist) * speed,
        };
      }

      // Normal zone-locked movement
      const zd = ZONE_DEFS[p.zoneIndex];
      const zoneXMin = zd.xMin * W;
      const zoneXMax = zd.xMax * W;
      const zoneYMin = zd.yMin * H;
      const zoneYMax = zd.yMax * H;

      let nx = p.x + p.vx;
      let ny = p.y + p.vy;
      let nvx = p.vx;
      let nvy = p.vy;

      // Bounce off zone boundaries
      if (nx < zoneXMin || nx > zoneXMax) nvx *= -1;
      if (ny < zoneYMin || ny > zoneYMax) nvy *= -1;

      // Slight random direction change
      if (Math.random() < 0.003) {
        nvx = (Math.random() - 0.5) * 0.015;
        nvy = (Math.random() - 0.5) * 0.01;
      }

      // Clamp strictly to zone
      nx = Math.max(zoneXMin, Math.min(zoneXMax, nx));
      ny = Math.max(zoneYMin, Math.min(zoneYMax, ny));

      return { ...p, x: nx, y: ny, vx: nvx, vy: nvy };
    });
    peopleRef.current = updated;

    // ===== DRAW PEOPLE + BOUNDING BOXES (sorted by Y - painter's algorithm) =====
    const visiblePeople = [...updated].filter(p => !p.boarded).sort((a, b) => a.y - b.y);
    for (const p of visiblePeople) {
      const boxPad = 8;
      const bx = p.x - p.bodyW / 2 - boxPad;
      const by = p.y - p.bodyH - 10 - boxPad;
      const bw = p.bodyW + boxPad * 2;
      const bh = p.bodyH + 14 + boxPad * 2;

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

      // Corner brackets
      const cl = 7;
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
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

      // Confidence %
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
          {/* Top header bar */}
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
              <Badge
                variant="outline"
                className={`text-[10px] font-bold px-2.5 py-0.5 border ${densityCfg.bgClass}`}
              >
                {densityCfg.label.toUpperCase()}
              </Badge>
              <span className="text-xs text-white/70 font-medium">
                {liveCount} detected
              </span>

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