'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Footprints,
  Bus,
  Train,
  Bike,
  Leaf,
  Route,
  Clock,
  MapPin,
  Ticket,
  Download,
  ArrowRight,
  IndianRupee,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
} from 'lucide-react';
import { sampleJourney, type JourneyStep } from '@/lib/mock-data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ---------- Mode Config ----------
const modeConfig: Record<
  JourneyStep['mode'],
  { icon: typeof Footprints; label: string; bgClass: string; textClass: string }
> = {
  walk: {
    icon: Footprints,
    label: 'Walk',
    bgClass: 'bg-slate-500/20',
    textClass: 'text-slate-300',
  },
  bus: {
    icon: Bus,
    label: 'Bus',
    bgClass: 'bg-teal-500/20',
    textClass: 'text-teal-400',
  },
  metro: {
    icon: Train,
    label: 'Metro',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
  },
  'e-rickshaw': {
    icon: Bike,
    label: 'E-Rickshaw',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
  },
};

// ---------- Deterministic QR SVG Generator ----------
function generateQRSvg(seed: string, size = 21): React.ReactNode {
  // Simple deterministic hash from seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Seeded pseudo-random using simple LCG
  const cellSize = 8;
  const padding = 12;
  const totalSize = size * cellSize + padding * 2;
  const centerStart = Math.floor(size / 2) - 2;
  const centerEnd = Math.floor(size / 2) + 2;

  let state = Math.abs(hash) || 1;
  const next = () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };

  const cells: React.ReactNode[] = [];

  // QR finder pattern positions
  const finderPositions = [
    { r: 0, c: 0 },      // top-left
    { r: 0, c: size - 7 }, // top-right
    { r: size - 7, c: 0 }, // bottom-left
  ];

  const isFinder = (r: number, c: number) =>
    finderPositions.some(
      (fp) => r >= fp.r && r < fp.r + 7 && c >= fp.c && c < fp.c + 7
    );

  const isFinderOuter = (r: number, c: number, fp: { r: number; c: number }) => {
    const lr = r - fp.r;
    const lc = c - fp.c;
    return (
      lr === 0 || lr === 6 || lc === 0 || lc === 6 ||
      (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)
    );
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip center area (for transit icon)
      if (r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd) {
        continue;
      }

      let filled = false;

      const finder = finderPositions.find((fp) => {
        const lr = r - fp.r;
        const lc = c - fp.c;
        return lr >= 0 && lr < 7 && lc >= 0 && lc < 7;
      });

      if (finder) {
        filled = isFinderOuter(r, c, finder);
      } else {
        filled = next() > 0.5;
      }

      if (filled) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize + padding}
            y={r * cellSize + padding}
            width={cellSize}
            height={cellSize}
            fill="#e2e8f0"
            rx={1}
          />
        );
      }
    }
  }

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Border */}
      <rect
        x={1}
        y={1}
        width={totalSize - 2}
        height={totalSize - 2}
        rx={8}
        fill="none"
        stroke="#14b8a6"
        strokeWidth={2}
      />
      {cells}
      {/* Center transit icon placeholder (small teal circle with train) */}
      <rect
        x={centerStart * cellSize + padding - 2}
        y={centerStart * cellSize + padding - 2}
        width={(centerEnd - centerStart + 1) * cellSize + 4}
        height={(centerEnd - centerStart + 1) * cellSize + 4}
        rx={4}
        fill="#0f172a"
      />
      <text
        x={((centerStart + centerEnd) / 2 + 0.5) * cellSize + padding}
        y={((centerStart + centerEnd) / 2 + 0.5) * cellSize + padding}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#14b8a6"
        fontSize={16}
      >
        🚇
      </text>
    </svg>
  );
}

// ---------- Step Item ----------
function JourneyStepItem({
  step,
  index,
  isLast,
}: {
  step: JourneyStep;
  index: number;
  isLast: boolean;
}) {
  const config = modeConfig[step.mode];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.15, ease: 'easeOut' }}
      className="relative flex gap-4"
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        {/* Mode icon circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.35,
            delay: index * 0.15 + 0.1,
            type: 'spring',
            stiffness: 200,
          }}
          className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 ${config.bgClass} border-border`}
        >
          <Icon className={`size-4.5 ${config.textClass}`} />
        </motion.div>

        {/* Connecting line */}
        {!isLast && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{
              duration: 0.5,
              delay: index * 0.15 + 0.3,
              ease: 'easeOut',
            }}
            className="w-0.5 flex-1 bg-border min-h-[32px]"
          />
        )}
      </div>

      {/* Content card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.15 + 0.15 }}
        className={`flex-1 ${!isLast ? 'pb-6' : ''}`}
      >
        <div className="rounded-lg border border-border/60 bg-card/50 p-4 backdrop-blur-sm">
          {/* Mode badge + Route info */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              className={`${config.bgClass} ${config.textClass} border-transparent text-xs`}
            >
              {config.label}
            </Badge>
            {step.routeInfo && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <Route className="mr-1 size-3" />
                {step.routeInfo}
              </Badge>
            )}
          </div>

          {/* From / To */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <div className="size-2 rounded-full bg-teal-500" />
              <span className="text-foreground font-medium">{step.from}</span>
            </div>
            <div className="ml-1 flex items-center gap-2">
              <ArrowRight className="size-3 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div
                className="size-2 rounded-full"
                style={{ backgroundColor: step.color }}
              />
              <span className="text-foreground font-medium">{step.to}</span>
            </div>
          </div>

          {/* Duration, Distance, Fare */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {step.duration}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {step.distance}
            </span>
            {step.fare > 0 && (
              <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-foreground">
                <IndianRupee className="size-3" />
                {step.fare}
              </span>
            )}
            {step.fare === 0 && (
              <span className="ml-auto text-xs font-medium text-emerald-400">
                Free
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- Main Component ----------
export function JourneyPlanner() {
  const [qrOpen, setQrOpen] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const qrSeed = useMemo(
    () =>
      `${sampleJourney.steps.map((s) => s.from + s.to).join('|')}-${sampleJourney.totalFare}`,
    []
  );

  const handleDownload = () => {
    toast.success('Transit pass saved to your device!', {
      description: 'Your QR ticket is ready for scanning at any transit point.',
    });
    setQrOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ---- 1. Journey Summary Card ---- */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-foreground">
              <MapPin className="mr-1.5 inline size-4 text-teal-400" />
              Home – Sector 7
              <ArrowRight className="mx-2 inline size-3.5 text-muted-foreground" />
              Tech Park Gate 4
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="rounded-lg border border-border/60 bg-muted/40 p-3 text-center"
              >
                <Route className="mx-auto mb-1 size-4 text-muted-foreground" />
                <p className="text-base font-bold text-foreground">
                  {sampleJourney.totalDistance}
                </p>
                <p className="text-[11px] text-muted-foreground">Total Distance</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="rounded-lg border border-border/60 bg-muted/40 p-3 text-center"
              >
                <Clock className="mx-auto mb-1 size-4 text-muted-foreground" />
                <p className="text-base font-bold text-foreground">
                  {sampleJourney.totalDuration}
                </p>
                <p className="text-[11px] text-muted-foreground">Total Duration</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="rounded-lg border border-border/60 bg-muted/40 p-3 text-center"
              >
                <Leaf className="mx-auto mb-1 size-4 text-emerald-400" />
                <p className="text-base font-bold text-emerald-400">
                  {sampleJourney.carbonSaved}
                </p>
                <p className="text-[11px] text-muted-foreground">Carbon Saved</p>
              </motion.div>
            </div>

            {/* Generate Pass button */}
            <Button
              onClick={() => setQrOpen(true)}
              className="h-12 w-full rounded-lg bg-teal-600 text-base font-semibold text-white hover:bg-teal-500"
              size="lg"
            >
              <QrCode className="size-5" />
              Generate Pass
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- 2. Step-by-Step Journey Timeline ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Ticket className="size-4" />
          Journey Steps
        </h3>
        <div className="space-y-0">
          {sampleJourney.steps.map((step, i) => (
            <JourneyStepItem
              key={i}
              step={step}
              index={i}
              isLast={i === sampleJourney.steps.length - 1}
            />
          ))}
        </div>
      </motion.div>

      {/* ---- 3. Total Fare Card ---- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Fare
              </p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                <span className="text-2xl">
                  <IndianRupee className="inline size-6" />
                </span>
                {sampleJourney.totalFare}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge
                variant="outline"
                className="gap-1 border-border/60 text-xs text-muted-foreground"
              >
                <Smartphone className="size-3" />
                UPI
              </Badge>
              <Badge
                variant="outline"
                className="gap-1 border-border/60 text-xs text-muted-foreground"
              >
                <CreditCard className="size-3" />
                Card
              </Badge>
              <Badge
                variant="outline"
                className="gap-1 border-border/60 text-xs text-muted-foreground"
              >
                <Banknote className="size-3" />
                Cash
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- 4. QR Ticket Modal ---- */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="border-border/60 bg-[#0c1222] sm:max-w-sm">
          <AnimatePresence>
            {qrOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <DialogHeader>
                  <DialogTitle className="text-center text-base text-teal-400">
                    Your Unified Transit Pass
                  </DialogTitle>
                  <DialogDescription className="text-center text-xs">
                    Scan at any transit point along your route
                  </DialogDescription>
                </DialogHeader>

                {/* QR Code */}
                <div className="mx-auto my-4 flex items-center justify-center rounded-xl border-2 border-teal-500/30 bg-[#0f172a] p-5">
                  {generateQRSvg(qrSeed)}
                </div>

                {/* Journey summary in modal */}
                <div className="mx-auto max-w-xs space-y-2 rounded-lg border border-border/40 bg-muted/30 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium text-foreground">
                      {sampleJourney.steps[0].from}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium text-foreground">
                      {sampleJourney.steps[sampleJourney.steps.length - 1].to}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fare</span>
                    <span className="font-bold text-teal-400">
                      <IndianRupee className="inline size-3" />
                      {sampleJourney.totalFare}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid</span>
                    <span className="font-medium text-foreground">{today}</span>
                  </div>
                </div>

                <DialogFooter className="mt-2 sm:justify-center">
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-teal-600 text-white hover:bg-teal-500 sm:w-auto"
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
