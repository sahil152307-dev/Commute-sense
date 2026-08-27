'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Shield, Activity, Zap, Brain, Route } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  view: 'commuter' | 'admin';
  onViewChange: (view: 'commuter' | 'admin') => void;
}

const featureBadges = [
  { icon: Brain, label: 'CV Analytics', color: 'text-teal-400' },
  { icon: Route, label: 'Smart ETA', color: 'text-amber-400' },
  { icon: Zap, label: 'AI Routing', color: 'text-purple-400' },
  { icon: Shield, label: 'Fleet AI', color: 'text-emerald-400' },
  { icon: Activity, label: 'Telematics', color: 'text-rose-400' },
];

export function Header({ view, onViewChange }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 ring-1 ring-teal-500/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bus className="h-5 w-5 text-teal-400" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Commute<span className="text-teal-400">IQ</span>
            </h1>
            <p className="hidden text-[10px] leading-none text-muted-foreground sm:block">
              SIH 2026 • Smart Transit Intelligence
            </p>
          </div>
        </div>

        {/* Feature Badges - hidden on small screens */}
        <div className="hidden items-center gap-3 lg:flex">
          {featureBadges.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1"
              >
                <Icon className={cn('h-3 w-3', item.color)} />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Time + Toggle */}
        <div className="flex items-center gap-4">
          {/* Live Clock */}
          <div className="hidden text-right sm:block">
            <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {formattedTime}
            </div>
            <div className="text-[10px] text-muted-foreground">{formattedDate}</div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 ring-1 ring-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">LIVE</span>
          </div>

          {/* View Toggle */}
          <div className="relative flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                className="absolute inset-0.5 rounded-md bg-teal-500/15 ring-1 ring-teal-500/30"
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  width: 'calc(50% - 2px)',
                  x: view === 'admin' ? 'calc(100% + 0px)' : '0px',
                }}
              />
            </AnimatePresence>
            <button
              onClick={() => onViewChange('commuter')}
              className={cn(
                'relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'commuter' ? 'text-teal-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Commuter</span>
            </button>
            <button
              onClick={() => onViewChange('admin')}
              className={cn(
                'relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'admin' ? 'text-teal-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
