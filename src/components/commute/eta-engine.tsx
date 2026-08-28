'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  AlertTriangle,
  Clock,
  Users,
  Bus,
  Thermometer,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { CityMap } from '@/components/commute/city-map';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { stations } from '@/lib/mock-data';

// ---- API response types ----

interface CongestionZone {
  name: string;
  delay: string;
}

interface WeatherInfo {
  weather: string;
  weatherFactor: number;
  temperature: number;
}

interface RouteETA {
  routeId: string;
  routeName: string;
  routeColor: string;
  etaMinutes: number;
  congestionLevel: 'Low' | 'Moderate' | 'High';
  nextVehicleId: string;
  passengerCount: number;
  vehicleCapacity: number;
}

interface ETAResponse {
  stationId: string;
  stationName: string;
  weather: WeatherInfo;
  congestionZones: CongestionZone[];
  routes: RouteETA[];
  updatedAt: string;
}

// ---- Congestion badge color helper ----

function congestionBadgeStyle(level: 'Low' | 'Moderate' | 'High') {
  switch (level) {
    case 'Low':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Moderate':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'High':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
  }
}

// ---- Animated ETA Number ----

function AnimatedETA({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="font-bold tabular-nums"
    >
      {value}
    </motion.span>
  );
}

// ---- Loading Skeleton ----

function ETASkeleton() {
  return (
    <div className="space-y-4">
      {/* Station selector skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64" />
      </div>

      {/* Weather + congestion row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      {/* Route ETA cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}

// ---- Main Component ----

export function ETAEngine() {
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0].id);
  const [etaData, setEtaData] = useState<ETAResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchETA = useCallback(async (stationId: string, silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`/api/v1/eta?stationId=${stationId}`);
      if (!res.ok) throw new Error('Failed to fetch ETA data');
      const data: ETAResponse = await res.json();
      setEtaData(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      console.error('ETA fetch failed');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch + station change
  useEffect(() => {
    fetchETA(selectedStationId);
  }, [selectedStationId, fetchETA]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!selectedStationId) return;

    intervalRef.current = setInterval(() => {
      fetchETA(selectedStationId, true);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedStationId, fetchETA]);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ---- Top: City Map ---- */}
      <section aria-label="City transit map">
        <CityMap onStationClick={(id) => setSelectedStationId(id)} />
      </section>

      {/* ---- Bottom: ETA Info Panel ---- */}
      <section
        aria-label="ETA information panel"
        className="rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm p-4 sm:p-6"
      >
        {isLoading ? (
          <ETASkeleton />
        ) : (
          <div className="space-y-4">
            {/* ---- Header: Station selector + refresh indicator ---- */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="station-select"
                  className="text-sm font-medium text-muted-foreground whitespace-nowrap"
                >
                  Station
                </label>
                <Select
                  value={selectedStationId}
                  onValueChange={setSelectedStationId}
                >
                  <SelectTrigger id="station-select" className="w-[240px] sm:w-[280px]">
                    <SelectValue placeholder="Select a station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isRefreshing && (
                  <RefreshCw className="size-3.5 animate-spin text-teal-400" />
                )}
                <Clock className="size-3.5" />
                <span className="tabular-nums">
                  {lastUpdated ? `Updated ${lastUpdated}` : 'Live'}
                </span>
                <span className="text-teal-500 font-medium ml-1">Auto-refresh 5s</span>
              </div>
            </div>

            {/* ---- Info Grid: Weather + Congestion ---- */}
            <AnimatePresence mode="wait">
              {etaData && (
                <motion.div
                  key={etaData.stationId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Weather Card */}
                    <Card className="py-4 gap-3 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center size-10 rounded-lg bg-teal-500/10">
                            <Cloud className="size-5 text-teal-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium">
                              Weather Condition
                            </p>
                            <p className="text-sm font-semibold text-foreground truncate">
                              {etaData.weather.weather}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Thermometer className="size-3.5 text-amber-400" />
                            <span>{etaData.weather.temperature}°C</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Delay factor </span>
                            <span className="font-semibold text-amber-400 tabular-nums">
                              ×{etaData.weather.weatherFactor.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Congestion Zone Delays Card */}
                    <Card className="py-4 gap-3 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5 text-amber-400" />
                          Congestion Zone Delays
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-1">
                        <ul className="space-y-2 max-h-24 overflow-y-auto">
                          {etaData.congestionZones.map((zone) => (
                            <li
                              key={zone.name}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-xs text-muted-foreground truncate">
                                {zone.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10 shrink-0"
                              >
                                {zone.delay}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                        {etaData.congestionZones.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">
                            No congestion zones active
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* ---- Route ETA Cards ---- */}
                  {etaData.routes.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Bus className="size-3.5 text-teal-400" />
                        Arriving Routes at {etaData.stationName}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-[28rem] sm:max-h-96 overflow-y-auto pr-1">
                        {etaData.routes.map((route) => (
                          <motion.div
                            key={route.routeId}
                            layout
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                          >
                            <Card className="py-3 sm:py-4 gap-0 border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent hover:border-white/10 transition-colors">
                              <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                                {/* Route header: color bar + name + congestion badge */}
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                  <div
                                    className="w-1 h-7 sm:h-8 rounded-full shrink-0"
                                    style={{ backgroundColor: route.routeColor }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm sm:text-[15px] font-semibold text-foreground truncate">
                                      {route.routeName}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] sm:text-[10px] shrink-0 ${congestionBadgeStyle(route.congestionLevel)}`}
                                  >
                                    {route.congestionLevel}
                                  </Badge>
                                </div>

                                {/* ETA + details row */}
                                <div className="flex items-end justify-between gap-3 sm:gap-4 pl-4">
                                  {/* ETA minutes */}
                                  <div className="flex items-baseline gap-1">
                                    <Timer className="size-4 sm:size-5 text-teal-400 mb-0.5" />
                                    <AnimatedETA value={route.etaMinutes} />
                                    <span className="text-xs sm:text-sm text-muted-foreground">
                                      min
                                    </span>
                                  </div>

                                  {/* Vehicle + passenger info */}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Bus className="size-3" />
                                      <span className="font-mono text-foreground/70">
                                        {route.nextVehicleId}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="size-3" />
                                      <span>
                                        <span className="text-foreground/70 tabular-nums">
                                          {route.passengerCount}
                                        </span>
                                        <span className="text-muted-foreground/60">
                                          /{route.vehicleCapacity}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Passenger load bar */}
                                <div className="pl-4">
                                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                      className="h-full rounded-full"
                                      style={{
                                        backgroundColor:
                                          route.passengerCount / route.vehicleCapacity > 0.8
                                            ? '#ef4444'
                                            : route.passengerCount / route.vehicleCapacity > 0.5
                                              ? '#f59e0b'
                                              : '#14b8a6',
                                      }}
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${Math.min((route.passengerCount / route.vehicleCapacity) * 100, 100)}%`,
                                      }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 200,
                                        damping: 25,
                                      }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {etaData.routes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bus className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No active routes serving this station</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
