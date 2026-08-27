'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  Volume2,
  VolumeX,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  routes,
  getIdleVehicles,
  type Vehicle,
  type EmergencyType,
  emergencyEvents as initialEmergencies,
  generateRandomEmergency,
} from '@/lib/mock-data';
import { playAlertSound, setMuted } from '@/lib/alert-sound';
import { EmergencyPanel } from './emergency-panel';

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
  type: string;
  vehicleId?: string;
  routeName?: string;
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
}

function demandColor(d: number) {
  if (d > 85) return '#ef4444';
  if (d >= 50) return '#f59e0b';
  return '#22c55e';
}

function demandLabel(d: number) {
  if (d > 85) return 'Critical';
  if (d >= 50) return 'Moderate';
  return 'Normal';
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return iso; }
}

export function FleetConsole() {
  const [routeStatuses, setRouteStatuses] = useState<RouteStatus[]>([]);
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);
  const [emergencies, setEmergencies] = useState(initialEmergencies);
  const [dispatchedEmergencies, setDispatchedEmergencies] = useState<Set<string>>(new Set());
  const playedIds = useRef<Set<string>>(new Set());

  const overcrowdedRoutes = useMemo(() => routeStatuses.filter(r => r.utilizationPct > 85), [routeStatuses]);
  const idleVehicles: Vehicle[] = useMemo(() => getIdleVehicles(), []);
  const activeEmergencies = useMemo(() => emergencies.filter(e => !e.resolved), [emergencies]);

  const toggleSound = useCallback(() => {
    const next = !soundMuted;
    setSoundMuted(next);
    setMuted(next);
  }, [soundMuted]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/fleet/status');
      if (!res.ok) return;
      const data: FleetStatusResponse = await res.json();
      if (data.success) {
        setRouteStatuses(data.routes);
        setAlerts(prev => [...data.alerts, ...prev].slice(0, 50));
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Simulate new emergencies
  useEffect(() => {
    const schedule = () => {
      const delay = 20000 + Math.random() * 20000;
      return setTimeout(() => {
        const ev = generateRandomEmergency();
        setEmergencies(prev => [ev, ...prev].slice(0, 20));
        if (!playedIds.current.has(ev.id)) {
          playedIds.current.add(ev.id);
          playAlertSound(ev.type);
        }
        setAlerts(prev => [{ type: ev.type, vehicleId: ev.vehicleId, routeName: ev.routeName, message: ev.message, timestamp: ev.timestamp }, ...prev].slice(0, 50));
        schedule();
      }, delay);
    };
    const timer = schedule();
    return () => clearTimeout(timer);
  }, []);

  // Sound for initial emergencies
  useEffect(() => {
    const t = setTimeout(() => {
      for (const emg of initialEmergencies) {
        if (!playedIds.current.has(emg.id)) {
          playedIds.current.add(emg.id);
          playAlertSound(emg.type);
        }
      }
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const handleDispatch = async () => {
    if (!selectedVehicle || !selectedRoute) { toast.error('Select a vehicle and a target route.'); return; }
    setDispatching(true);
    try {
      const res = await fetch('/api/v1/fleet/re-route', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceRouteId: '', targetRouteId: selectedRoute, vehicleId: selectedVehicle }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { description: data.updatedCapacityRelief });
        setSelectedVehicle(''); setSelectedRoute('');
        await fetchStatus();
      } else { toast.error(data.error || 'Dispatch failed.'); }
    } catch { toast.error('Network error.'); } finally { setDispatching(false); }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Emergency banner */}
      <AnimatePresence>
        {activeEmergencies.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <div className="flex items-center justify-between rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                  <AlertTriangle className="size-5 text-red-400" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-red-400">{activeEmergencies.length} Active Emergenc{activeEmergencies.length === 1 ? 'y' : 'ies'}</p>
                  <p className="text-xs text-red-300/70">{activeEmergencies.reduce((s, e) => s + e.passengersStranded, 0)} passengers need assistance</p>
                </div>
              </div>
              <button onClick={toggleSound} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {soundMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                {soundMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overcrowding alerts */}
      <AnimatePresence>
        {overcrowdedRoutes.map(route => (
          <motion.div key={route.routeId} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="animate-pulse-alert rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-red-400" />
            <span>OVERCROWDING: {route.routeName} at {route.utilizationPct}% – Dispatch recommended</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Emergency panel + dispatch */}
      <EmergencyPanel
        emergencies={emergencies}
        setEmergencies={setEmergencies}
        dispatchedEmergencies={dispatchedEmergencies}
        setDispatchedEmergencies={setDispatchedEmergencies}
      />

      {/* Main grid + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="space-y-3"><div className="h-4 w-2/3 rounded bg-muted" /><div className="h-2 w-full rounded bg-muted" /><div className="h-4 w-1/3 rounded bg-muted" /></CardContent></Card>
          )) : routeStatuses.map(route => {
            const color = demandColor(route.utilizationPct);
            const isOvercrowded = route.utilizationPct > 85;
            return (
              <motion.div key={route.routeId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className={isOvercrowded ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'border-border'}>
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-tight">
                        <span className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: route.routeColor }} />
                        {route.routeName}
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0 text-[10px] font-bold uppercase" style={{ borderColor: color, color }}>{route.congestionIndex}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className="font-bold tabular-nums" style={{ color }}>{route.utilizationPct}%</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${route.utilizationPct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Bus className="size-3" /><span className="tabular-nums font-medium text-foreground">{route.vehicleCount}</span> active</span>
                      <span className="flex items-center gap-1"><Users className="size-3" /><span className="tabular-nums font-medium text-foreground">{route.currentDemand}</span>/{route.totalCapacity}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0" style={{ backgroundColor: `${color}18`, color, borderColor: `${color}30` }}>{demandLabel(route.utilizationPct)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Send className="size-4 text-teal-400" />Quick Re-Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Available Vehicles</p>
                <ScrollArea className="max-h-32">
                  <div className="space-y-1.5 pr-2">
                    {idleVehicles.length === 0 ? <p className="text-xs text-muted-foreground italic py-2">No idle vehicles</p> : idleVehicles.map(v => (
                      <button key={v.vehicleId} onClick={() => setSelectedVehicle(v.vehicleId)} className={selectedVehicle === v.vehicleId ? 'w-full flex items-center justify-between rounded-md border border-teal-500/60 bg-teal-500/10 text-teal-300 px-3 py-2 text-xs cursor-pointer text-left' : 'w-full flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs cursor-pointer text-left hover:border-muted-foreground/40 hover:bg-muted/30'}>
                        <span className="flex items-center gap-2 font-medium"><Bus className="size-3" />{v.vehicleId}</span>
                        <span className="text-muted-foreground">Cap: {v.capacity}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target Route</p>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select overcrowded route…" /></SelectTrigger>
                  <SelectContent>
                    {overcrowdedRoutes.length === 0 ? <SelectItem value="_none" disabled>No overcrowded routes</SelectItem> : overcrowdedRoutes.map(r => (
                      <SelectItem key={r.routeId} value={r.routeId}><span className="flex items-center gap-2"><span className="inline-block size-2 rounded-full bg-red-500" />{r.routeName} ({r.utilizationPct}%)</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" style={{ backgroundColor: '#14b8a6', color: '#0a0a0a' }} disabled={!selectedVehicle || !selectedRoute || dispatching} onClick={handleDispatch}>
                <ArrowRightLeft className="size-4" />{dispatching ? 'Dispatching…' : 'Re-Route Bus'}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Gauge className="size-3" />Fleet Summary</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center"><p className="text-lg font-bold text-teal-400 tabular-nums">{routeStatuses.reduce((s, r) => s + r.vehicleCount, 0) + idleVehicles.length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p></div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center"><p className="text-lg font-bold text-amber-400 tabular-nums">{idleVehicles.length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Idle</p></div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center"><p className="text-lg font-bold text-red-400 tabular-nums">{activeEmergencies.length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Emergencies</p></div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center"><p className="text-lg font-bold text-green-400 tabular-nums">{routeStatuses.filter(r => r.utilizationPct < 50).length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Normal</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="size-4 text-amber-400" />Live Alerts Feed
            <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground"><Activity className="size-3 text-green-400" />Auto-refresh 8s</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64">
            <div className="space-y-2 pr-2">
              {alerts.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No alerts yet.</p> : (
                <AnimatePresence initial={false}>
                  {alerts.map((alert, idx) => {
                    const isOvercrowding = alert.type === 'OVERCROWDING';
                    const isEmergency = ['PUNCTURE', 'TRAFFIC_JAM', 'DRIVER_UNAVAILABLE', 'BREAKDOWN'].includes(alert.type);
                    const border = isOvercrowding || isEmergency ? 'border-red-500/30' : 'border-amber-500/30';
                    const bg = isOvercrowding || isEmergency ? 'bg-red-500/5' : 'bg-amber-500/5';
                    const text = isOvercrowding || isEmergency ? 'text-red-300' : 'text-amber-300';
                    const iconBg = isOvercrowding || isEmergency ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400';
                    return (
                      <motion.div key={`${alert.timestamp}-${idx}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-xs ${bg} ${border}`}>
                        <div className={`mt-0.5 shrink-0 rounded-full p-1 ${iconBg}`}>
                          {(isOvercrowding || isEmergency) ? <AlertTriangle className="size-3" /> : <Eye className="size-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium leading-tight ${text}`}>{alert.message}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">{formatTime(alert.timestamp)}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[9px] px-1.5 py-0 ${border} ${text}`}>{alert.type}</Badge>
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
