'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Eye,
  Bus,
  ArrowRightLeft,
  Send,
  Radio,
  Gauge,
  Users,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { routes, getIdleVehicles, type Route, type Vehicle } from '@/lib/mock-data';

// ---- Types ----
interface RouteStatus {
  routeId: string;
  routeName: string;
  congestionIndex: string;
  utilizationPct: number;
  currentDemand: number;
  totalCapacity: number;
  activeVehicles: string[];
  vehicleCount: number;
  routeColor: string;
}

interface FleetAlert {
  type: 'OVERCROWDING' | 'DROWSINESS' | string;
  routeId?: string;
  routeName?: string;
  vehicleId?: string;
  driverName?: string;
  demand?: number;
  earRatio?: number;
  message: string;
  timestamp: string;
}

interface FleetStatusResponse {
  success: boolean;
  routes: RouteStatus[];
  idleVehicles: string[];
  alerts: FleetAlert[];
  totalVehicles: number;
  activeVehicles: number;
  timestamp: string;
}

// ---- Helpers ----
function demandColor(demand: number): string {
  if (demand > 85) return '#ef4444';
  if (demand >= 50) return '#f59e0b';
  return '#22c55e';
}

function demandLabel(demand: number): string {
  if (demand > 85) return 'Critical';
  if (demand >= 50) return 'Moderate';
  return 'Normal';
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

// ---- Component ----
export function FleetConsole() {
  const [routeStatuses, setRouteStatuses] = useState<RouteStatus[]>([]);
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [idleVehicleIds, setIdleVehicleIds] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [dispatching, setDispatching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Overcrowded routes (demand > 85)
  const overcrowdedRoutes = useMemo(
    () => routeStatuses.filter((r) => r.utilizationPct > 85),
    [routeStatuses]
  );

  // Idle vehicles from mock data (rich objects)
  const idleVehicles: Vehicle[] = useMemo(() => getIdleVehicles(), []);

  // Fetch fleet status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/fleet/status');
      if (!res.ok) return;
      const data: FleetStatusResponse = await res.json();
      if (data.success) {
        setRouteStatuses(data.routes);
        setAlerts((prev) => {
          // Keep only recent unique alerts, prepend new ones
          const newAlerts = data.alerts.filter(
            (a) => !prev.some((p) => p.timestamp === a.timestamp && p.message === a.message)
          );
          return [...newAlerts, ...prev].slice(0, 50);
        });
        setIdleVehicleIds(data.idleVehicles);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Handle re-route dispatch
  const handleDispatch = async () => {
    if (!selectedVehicle || !selectedRoute) {
      toast.error('Select a vehicle and a target route.');
      return;
    }
    setDispatching(true);
    try {
      const res = await fetch('/api/v1/fleet/re-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceRouteId: '',
          targetRouteId: selectedRoute,
          vehicleId: selectedVehicle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, {
          description: data.updatedCapacityRelief,
        });
        setSelectedVehicle('');
        setSelectedRoute('');
        // Refresh immediately
        await fetchStatus();
      } else {
        toast.error(data.error || 'Dispatch failed.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ---- 1. Top Alert Bar ---- */}
      <AnimatePresence>
        {overcrowdedRoutes.length > 0 &&
          overcrowdedRoutes.map((route) => (
            <motion.div
              key={route.routeId}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="animate-pulse-alert rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 flex items-center gap-2"
            >
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
              <span>
                OVERCROWDING ALERT: {route.routeName} at {route.utilizationPct}% capacity
                – Immediate dispatch recommended
              </span>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* ---- 2. Main Grid + Dispatch Sidebar ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Fleet Heatmap Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="space-y-3">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="h-2 w-full rounded bg-muted" />
                    <div className="h-4 w-1/3 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))
            : routeStatuses.map((route) => {
                const color = demandColor(route.utilizationPct);
                const isOvercrowded = route.utilizationPct > 85;
                return (
                  <motion.div
                    key={route.routeId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className={
                        isOvercrowded
                          ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                          : 'border-border'
                      }
                    >
                      <CardHeader className="pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold leading-tight">
                            <span
                              className="mr-2 inline-block size-2.5 rounded-full"
                              style={{ backgroundColor: route.routeColor }}
                            />
                            {route.routeName}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px] font-bold uppercase"
                            style={{
                              borderColor: color,
                              color: color,
                            }}
                          >
                            {route.congestionIndex}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Utilization bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Utilization</span>
                            <span
                              className="font-bold tabular-nums"
                              style={{ color }}
                            >
                              {route.utilizationPct}%
                            </span>
                          </div>
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${route.utilizationPct}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Bus className="size-3" />
                            <span className="tabular-nums font-medium text-foreground">
                              {route.vehicleCount}
                            </span>{' '}
                            active
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="size-3" />
                            <span className="tabular-nums font-medium text-foreground">
                              {route.currentDemand}
                            </span>
                            /{route.totalCapacity}
                          </span>
                          <Badge
                            variant="secondary"
                            className="ml-auto text-[10px] px-1.5 py-0"
                            style={{
                              backgroundColor: `${color}18`,
                              color: color,
                              borderColor: `${color}30`,
                            }}
                          >
                            {demandLabel(route.utilizationPct)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
        </div>

        {/* ---- 3. Dispatch Panel (Right Sidebar) ---- */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="size-4 text-teal-400" />
                Quick Dispatch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Idle Vehicles List */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Available Vehicles
                </p>
                <ScrollArea className="max-h-40">
                  <div className="space-y-1.5 pr-2">
                    {idleVehicles.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">
                        No idle vehicles available
                      </p>
                    ) : (
                      idleVehicles.map((v) => (
                        <button
                          key={v.vehicleId}
                          onClick={() => setSelectedVehicle(v.vehicleId)}
                          className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                            selectedVehicle === v.vehicleId
                              ? 'border-teal-500/60 bg-teal-500/10 text-teal-300'
                              : 'border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/30'
                          }`}
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <Bus className="size-3" />
                            {v.vehicleId}
                          </span>
                          <span className="text-muted-foreground">
                            Cap: {v.capacity}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Target Route Select */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Target Route (Overcrowded)
                </p>
                <Select
                  value={selectedRoute}
                  onValueChange={setSelectedRoute}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select overcrowded route…" />
                  </SelectTrigger>
                  <SelectContent>
                    {overcrowdedRoutes.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No overcrowded routes
                      </SelectItem>
                    ) : (
                      overcrowdedRoutes.map((r) => (
                        <SelectItem key={r.routeId} value={r.routeId}>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block size-2 rounded-full bg-red-500"
                            />
                            {r.routeName} ({r.utilizationPct}%)
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Dispatch Button */}
              <Button
                className="w-full"
                style={{
                  backgroundColor: '#14b8a6',
                  color: '#0a0a0a',
                }}
                disabled={!selectedVehicle || !selectedRoute || dispatching}
                onClick={handleDispatch}
              >
                <ArrowRightLeft className="size-4" />
                {dispatching ? 'Dispatching…' : 'Re-Route Bus'}
              </Button>
            </CardContent>
          </Card>

          {/* Fleet Summary mini-card */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Gauge className="size-3" />
                Fleet Summary
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-lg font-bold text-teal-400 tabular-nums">
                    {routeStatuses.reduce((s, r) => s + r.vehicleCount, 0) + idleVehicles.length}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Total
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-lg font-bold text-amber-400 tabular-nums">
                    {idleVehicles.length}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Idle
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-lg font-bold text-red-400 tabular-nums">
                    {overcrowdedRoutes.length}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Critical
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                  <p className="text-lg font-bold text-green-400 tabular-nums">
                    {routeStatuses.filter((r) => r.utilizationPct < 50).length}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Normal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---- 4. Alerts Feed ---- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="size-4 text-amber-400" />
            Live Alerts Feed
            <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
              <Activity className="size-3 text-green-400" />
              Auto-refreshing every 8s
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64">
            <div className="space-y-2 pr-2">
              {alerts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No alerts yet. Monitoring fleet…
                </p>
              ) : (
                <AnimatePresence initial={false}>
                  {alerts.map((alert, idx) => {
                    const isOvercrowding = alert.type === 'OVERCROWDING';
                    return (
                      <motion.div
                        key={`${alert.timestamp}-${alert.message.slice(0, 40)}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-xs ${
                          isOvercrowding
                            ? 'border-red-500/30 bg-red-500/5'
                            : 'border-amber-500/30 bg-amber-500/5'
                        }`}
                      >
                        <div
                          className={`mt-0.5 shrink-0 rounded-full p-1 ${
                            isOvercrowding ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {isOvercrowding ? (
                            <AlertTriangle className="size-3" />
                          ) : (
                            <Eye className="size-3" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium leading-tight ${
                              isOvercrowding ? 'text-red-300' : 'text-amber-300'
                            }`}
                          >
                            {alert.message}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                            {formatTime(alert.timestamp)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[9px] px-1.5 py-0 ${
                            isOvercrowding
                              ? 'border-red-500/40 text-red-400'
                              : 'border-amber-500/40 text-amber-400'
                          }`}
                        >
                          {isOvercrowding ? 'OVERCROWDING' : 'DROWSINESS'}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
