'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Car,
  TrainFront,
  Footprints,
  Clock,
  IndianRupee,
  MapPin,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Star,
  Navigation,
  SwapIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { stations } from '@/lib/mock-data';

// ---- Types ----

interface TransportOption {
  mode: string;
  icon: string;
  etaMinutes: number;
  fare: number;
  distance: string;
  availability: string;
  advantage: string;
  color: string;
  recommended: boolean;
}

interface FastestTransportResponse {
  from: string;
  to: string;
  busAvailable: boolean;
  busEtaMinutes: number;
  busDelayReason: string;
  transports: TransportOption[];
  suggestion: string;
}

// ---- Icon mapping ----

const MODE_ICONS: Record<string, typeof Zap> = {
  'train-front': TrainFront,
  car: Car,
  zap: Zap,
  footprints: Footprints,
};

// ---- Loading Skeleton ----

function TransportSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

// ---- Transport Card ----

function TransportCard({ option, index }: { option: TransportOption; index: number }) {
  const IconComponent = MODE_ICONS[option.icon] || Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, delay: index * 0.06 }}
    >
      <Card
        className={
          'py-3 sm:py-4 gap-0 transition-all hover:border-white/15 ' +
          (option.recommended
            ? 'border-2 bg-gradient-to-br from-white/[0.04] to-transparent'
            : 'border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent hover:bg-white/[0.04]')
        }
        style={option.recommended ? { borderColor: option.color + '60' } : undefined}
      >
        <CardContent className="p-3 sm:p-4 space-y-2.5">
          {/* Header row */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center size-9 sm:size-10 rounded-lg shrink-0"
              style={{ backgroundColor: option.color + '18' }}
            >
              <IconComponent className="size-4 sm:size-5" style={{ color: option.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-[15px] font-semibold text-foreground truncate">
                  {option.mode}
                </p>
                {option.recommended && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-400 border-amber-500/30">
                    <Star className="size-2.5 mr-0.5" />
                    FASTEST
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {option.advantage}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between pl-0 sm:pl-12 gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <motion.span
                  key={option.etaMinutes}
                  initial={{ opacity: 0.5, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-bold tabular-nums"
                  style={{ color: option.color }}
                >
                  {option.etaMinutes}
                </motion.span>
                <span className="text-xs text-muted-foreground">min</span>
              </div>
              <div className="flex items-center gap-1">
                <IndianRupee className="size-3 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground tabular-nums">{option.fare}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <MapPin className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{option.distance}</span>
              </div>
            </div>
            <span className={
              'text-[10px] px-2 py-0.5 rounded-full border shrink-0 ' +
              (option.availability.toLowerCase().includes('available')
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20')
            }>
              {option.availability}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---- Main Component ----

export function FastestTransport() {
  const [fromStation, setFromStation] = useState(stations[0].id);
  const [toStation, setToStation] = useState('');
  const [data, setData] = useState<FastestTransportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Available "to" stations (exclude selected "from")
  const availableToStations = stations.filter(s => s.id !== fromStation);

  // Auto-select a sensible "to" station if none selected
  useEffect(() => {
    if (!toStation || toStation === fromStation) {
      // Pick second station from the list
      const fallback = availableToStations[0];
      if (fallback) setToStation(fallback.id);
    }
  }, [fromStation]);

  const fetchTransport = useCallback(async (fromId: string, toId: string, silent = false) => {
    if (!toId) return;
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const toName = stations.find(s => s.id === toId)?.name || '';
      const res = await fetch(`/api/v1/fastest-transport?stationId=${fromId}&destination=${encodeURIComponent(toName)}`);
      if (!res.ok) throw new Error('Failed to fetch transport data');
      const result: FastestTransportResponse = await res.json();
      setData(result);
    } catch {
      console.error('Transport fetch failed');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
 if (toStation) fetchTransport(fromStation, toStation);
  }, [fromStation, toStation, fetchTransport]);

  // Auto-refresh every 8s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (toStation) fetchTransport(fromStation, toStation, true);
    }, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fromStation, toStation, fetchTransport]);

  const swapStations = () => {
    const prevFrom = fromStation;
    const prevTo = toStation;
    if (prevTo && prevTo !== prevFrom) {
      setFromStation(prevTo);
      setToStation(prevFrom);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ---- Header: From / To selectors + swap + refresh ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Station selectors row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
          {/* From */}
          <div className="flex-1 min-w-0">
            <label className="font-body text-[11px] font-normal text-muted-foreground mb-1 block flex items-center gap-1">
              <MapPin className="size-3 text-teal-400" />
              From
            </label>
            <Select value={fromStation} onValueChange={(v) => { setFromStation(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <MapPin className="size-3 text-muted-foreground shrink-0" />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap button */}
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={swapStations}
              className="h-9 w-9 rounded-full border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="size-4 rotate-90 sm:rotate-0" />
            </Button>
          </div>

          {/* To */}
          <div className="flex-1 min-w-0">
            <label className="font-body text-[11px] font-normal text-muted-foreground mb-1 block flex items-center gap-1">
              <Navigation className="size-3 text-amber-400" />
              To
            </label>
            <Select value={toStation} onValueChange={setToStation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {availableToStations.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <Navigation className="size-3 text-muted-foreground shrink-0" />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isRefreshing && <RefreshCw className="size-3.5 animate-spin text-teal-400" />}
          <Navigation className="size-3.5" />
          <span className="text-teal-500 font-medium">Auto-refresh 8s</span>
          {data && (
            <span className="text-muted-foreground/50">•</span>
          )}
          {data && (
            <span className="text-muted-foreground/60">
              {data.from} → {data.to}
            </span>
          )}
        </div>
      </motion.div>

      {/* ---- Content ---- */}
      {isLoading ? (
        <TransportSkeleton />
      ) : data ? (
        <div className="space-y-4">
          {/* Bus Status Alert */}
          <AnimatePresence mode="wait">
            <motion.div
              key={data.from + data.to + data.busAvailable}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <Card className={
                'border ' +
                (data.busAvailable
                  ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                  : 'border-red-500/20 bg-red-500/[0.03]')
              }>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className={
                      'flex items-center justify-center size-8 rounded-lg shrink-0 ' +
                      (data.busAvailable ? 'bg-emerald-500/10' : 'bg-red-500/10')
                    }>
                      {data.busAvailable ? (
                        <Zap className="size-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="size-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={
                        'text-sm font-semibold ' +
                        (data.busAvailable ? 'text-emerald-400' : 'text-red-400')
                      }>
                        {data.busAvailable
                          ? `Bus available in ${data.busEtaMinutes} min`
                          : 'Bus delayed or unavailable'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {data.busDelayReason || (data.busAvailable
                          ? `Next bus to ${data.to} arriving in ${data.busEtaMinutes} minutes.`
                          : `No buses available to ${data.to} in reasonable time. Consider alternatives below.`
                        )}
                      </p>
                      {!data.busAvailable && data.suggestion && (
                        <p className="text-xs text-amber-400 mt-1.5 font-medium">
                          {data.suggestion}
                        </p>
                      )}
                    </div>
                    {data.busAvailable && (
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-emerald-400 tabular-nums">{data.busEtaMinutes}</p>
                        <p className="text-[10px] text-muted-foreground">min ETA</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Transport Options Grid */}
          <div>
            <h3 className="font-heading text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3 flex items-center gap-1.5">
              <Navigation className="size-3.5 text-teal-400" />
              Alternative Transport Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {data.transports.map((t, i) => (
                <TransportCard key={t.mode} option={t} index={i} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
