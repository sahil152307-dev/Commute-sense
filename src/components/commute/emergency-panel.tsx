'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bus,
  Send,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  Route as RouteIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { playAlertSound } from '@/lib/alert-sound';
import { SafestRouteMap } from './safest-route-map';
import { getVehicle, getIdleVehicles, type EmergencyEvent, type EmergencyType, type Vehicle } from '@/lib/mock-data';

function emergencyTypeInfo(type: EmergencyType) {
  switch (type) {
    case 'PUNCTURE':
      return { label: 'PUNCTURE', icon: () => <span>🔧</span>, bg: 'bg-red-500/15 border-red-500/40 text-red-400' };
    case 'TRAFFIC_JAM':
      return { label: 'TRAFFIC JAM', icon: () => <span>🚗</span>, bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400' };
    case 'DRIVER_UNAVAILABLE':
      return { label: 'DRIVER DOWN', icon: () => <span>👤</span>, bg: 'bg-orange-500/15 border-orange-500/40 text-orange-400' };
    case 'BREAKDOWN':
      return { label: 'BREAKDOWN', icon: () => <span>⚙️</span>, bg: 'bg-red-500/15 border-red-500/40 text-red-400' };
  }
}

function formatTimeShort(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  } catch {
    return iso;
  }
}

interface EmergencyPanelProps {
  emergencies: EmergencyEvent[];
  setEmergencies: React.Dispatch<React.SetStateAction<EmergencyEvent[]>>;
  dispatchedEmergencies: Set<string>;
  setDispatchedEmergencies: React.Dispatch<React.SetStateAction<Set<string>>>;
  onRescueBusStuck?: (vehicleId: string, originalEmergency: EmergencyEvent) => void;
}

export function EmergencyPanel({ emergencies, setEmergencies, dispatchedEmergencies, setDispatchedEmergencies, onRescueBusStuck }: EmergencyPanelProps) {
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyEvent | null>(null);
  const [emergencyVehicle, setEmergencyVehicle] = useState<string>('');
  const [emergencyDispatching, setEmergencyDispatching] = useState(false);
  const [showRouteMap, setShowRouteMap] = useState(false);

  // Track dispatched vehicles for "rescue bus stuck" simulation
  const dispatchedVehiclesRef = useRef<{ vehicleId: string; emergency: EmergencyEvent; timer: ReturnType<typeof setTimeout> }[]>([]);

  const activeEmergencies = emergencies.filter(e => !e.resolved);
  const idleVehicles: Vehicle[] = getIdleVehicles();
  const selectedEmergencyVehicle = emergencyVehicle ? getVehicle(emergencyVehicle) : undefined;

  const handleSelectEmergency = (emg: EmergencyEvent) => {
    setSelectedEmergency(emg);
    setShowRouteMap(true);
    playAlertSound(emg.type);
  };

  const handleResolveEmergency = (emgId: string) => {
    setEmergencies(prev => prev.map(e => e.id === emgId ? { ...e, resolved: true } : e));
    setDispatchedEmergencies(prev => new Set([...prev, emgId]));
    toast.success('Emergency marked as resolved.');
  };

  const handleEmergencyDispatch = async () => {
    if (!emergencyVehicle || !selectedEmergency) {
      toast.error('Select a vehicle to dispatch.');
      return;
    }
    setEmergencyDispatching(true);
    try {
      const res = await fetch('/api/v1/fleet/emergency-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: emergencyVehicle, emergencyStopId: selectedEmergency.stopId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, {
          description: `Routed via safest path. ETA: ${data.routeData.safeTime} min. Avoiding: ${data.routeData.avoidedZones.join(', ') || 'None'}`,
        });
        // Schedule potential "rescue bus stuck" alert (30% chance after 25-45s)
        if (onRescueBusStuck && Math.random() < 0.3) {
          const delay = 25000 + Math.random() * 20000;
          const timer = setTimeout(() => {
            onRescueBusStuck(emergencyVehicle, selectedEmergency);
            dispatchedVehiclesRef.current = dispatchedVehiclesRef.current.filter(d => d.vehicleId !== emergencyVehicle);
          }, delay);
          dispatchedVehiclesRef.current.push({ vehicleId: emergencyVehicle, emergency: selectedEmergency, timer });
        }
        setEmergencyVehicle('');
        setSelectedEmergency(null);
        setShowRouteMap(false);
        setEmergencies(prev => prev.map(e => e.id === selectedEmergency.id ? { ...e, resolved: true } : e));
        setDispatchedEmergencies(prev => new Set([...prev, selectedEmergency.id]));
        playAlertSound('INFO');
      } else {
        toast.error(data.error || 'Emergency dispatch failed.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setEmergencyDispatching(false);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      dispatchedVehiclesRef.current.forEach(d => clearTimeout(d.timer));
    };
  }, []);

  return (
    <>
      {/* Emergency Events Card */}
      <Card className="border-red-500/20 relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading flex items-center gap-2 text-sm sm:text-base">
            <AlertTriangle className="size-4 text-red-400" />
            <span>Emergency Dispatch</span>
            {activeEmergencies.length > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px] px-1.5">
                {activeEmergencies.length} ACTIVE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <ScrollArea className="max-h-40 sm:max-h-48">
            <div className="space-y-2 pr-2">
              {emergencies.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No emergencies reported.</p>
              ) : (
                emergencies.map((emg) => {
                  const info = emergencyTypeInfo(emg.type);
                  const isDispatched = dispatchedEmergencies.has(emg.id);
                  const EmerIcon = info.icon;
                  return (
                    <motion.div
                      key={emg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={
                        emg.resolved
                          ? 'rounded-lg border border-green-500/20 bg-green-500/5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs'
                          : 'rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs'
                      }
                    >
                        <div className="flex items-start gap-3">
                          <div className={
                            emg.resolved
                              ? 'mt-0.5 shrink-0 rounded-full bg-green-500/20 text-green-400 p-1.5'
                              : 'mt-0.5 shrink-0 rounded-full bg-red-500/20 text-red-400 p-1.5'
                          }>
                            {emg.resolved ? <CheckCircle2 className="size-3" /> : <EmerIcon />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={"text-[9px] px-1.5 py-0 border " + info.bg}>
                                {info.label}
                              </Badge>
                              <span className="font-semibold text-foreground">{emg.vehicleId}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="font-medium text-foreground/80">{emg.driverName}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="flex items-center gap-0.5 text-amber-400">
                                <Users className="size-3" /> {emg.passengersStranded} stranded
                              </span>
                            </div>
                            <p className="mt-1 text-muted-foreground leading-relaxed line-clamp-2">{emg.message}</p>
                            <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-1 text-muted-foreground/60">
                                <MapPin className="size-3" /> {emg.stopName}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground/60">
                                <Clock className="size-3" /> {formatTimeShort(emg.timestamp)}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground/60">
                                <RouteIcon className="size-3" /> {emg.routeName.split('–')[0].trim()}
                              </span>
                            </div>
                            {!emg.resolved && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <Button
                                  size="sm"
                                  className="h-7 text-[10px] sm:text-[11px] px-2 sm:px-3"
                                  style={{ backgroundColor: '#14b8a6', color: '#0a0a0a' }}
                                  onClick={() => handleSelectEmergency(emg)}
                                >
                                  <Navigation className="size-3 mr-0.5 sm:mr-1" />
                                  <span className="hidden sm:inline">Dispatch to Location</span><span className="sm:hidden">Dispatch</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[10px] sm:text-[11px] text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  onClick={() => handleResolveEmergency(emg.id)}
                                >
                                  <CheckCircle2 className="size-3 mr-0.5 sm:mr-1" />
                                  Resolve
                                </Button>
                              </div>
                            )}
                            {isDispatched && emg.resolved && (
                              <p className="mt-1.5 text-[10px] text-green-400 font-medium">
                                ✓ Relief bus dispatched successfully
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Emergency Dispatch Panel (conditional) */}
      <AnimatePresence>
        {showRouteMap && selectedEmergency && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <Card className="border-teal-500/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading flex items-center gap-2 text-base">
                    <Navigation className="size-4 text-teal-400" />
                    Safest Route to {selectedEmergency.stopName}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => { setShowRouteMap(false); setSelectedEmergency(null); setEmergencyVehicle(''); }}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <SafestRouteMap emergency={selectedEmergency} selectedVehicle={selectedEmergencyVehicle} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Select Bus to Dispatch</p>
                    <ScrollArea className="max-h-28">
                      <div className="space-y-1.5 pr-2">
                        {idleVehicles.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic py-2">No idle vehicles</p>
                        ) : (
                          idleVehicles.map((v) => (
                            <button
                              key={v.vehicleId}
                              onClick={() => setEmergencyVehicle(v.vehicleId)}
                              className={
                                emergencyVehicle === v.vehicleId
                                  ? 'w-full flex items-center justify-between rounded-md border border-teal-500/60 bg-teal-500/10 text-teal-300 px-3 py-2 text-xs cursor-pointer text-left'
                                  : 'w-full flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs cursor-pointer text-left hover:border-muted-foreground/40 hover:bg-muted/30'
                              }
                            >
                              <span className="flex items-center gap-2 font-medium">
                                <Bus className="size-3" /> {v.vehicleId}
                              </span>
                              <span className="text-muted-foreground">Cap: {v.capacity} • From Depot</span>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                      <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="size-3" /> Emergency Summary
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Type: </span><span className="font-medium text-foreground">{selectedEmergency.type.replace('_', ' ')}</span></div>
                        <div><span className="text-muted-foreground">Bus: </span><span className="font-medium text-red-400">{selectedEmergency.vehicleId}</span></div>
                        <div><span className="text-muted-foreground">Location: </span><span className="font-medium text-foreground">{selectedEmergency.stopName}</span></div>
                        <div><span className="text-muted-foreground">Stranded: </span><span className="font-bold text-red-400">{selectedEmergency.passengersStranded} people</span></div>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      style={{ backgroundColor: '#14b8a6', color: '#0a0a0a' }}
                      disabled={!emergencyVehicle || emergencyDispatching}
                      onClick={handleEmergencyDispatch}
                    >
                      <Send className="size-4" />
                      {emergencyDispatching ? 'Dispatching via Safest Route…' : 'Dispatch Bus Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
