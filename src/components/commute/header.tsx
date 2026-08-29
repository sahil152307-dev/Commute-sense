'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Shield, Activity, Zap, Brain, Route, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  view: 'commuter' | 'admin';
  onViewChange: (view: 'commuter' | 'admin') => void;
  userName: string;
  onLogout: () => void;
}

const featureBadges = [
  { icon: Brain, label: 'CV Analytics', color: 'text-teal-400' },
  { icon: Route, label: 'Smart ETA', color: 'text-amber-400' },
  { icon: Zap, label: 'AI Routing', color: 'text-purple-400' },
  { icon: Shield, label: 'Fleet AI', color: 'text-emerald-400' },
  { icon: Activity, label: 'Telematics', color: 'text-rose-400' },
];

export function Header({ view, onViewChange, userName, onLogout }: HeaderProps) {
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
      <div className="mx-auto flex h-14 sm:h-16 max-w-[1600px] items-center justify-between px-3 sm:px-6">
        {/* Logo + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <motion.div
            className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 ring-1 ring-teal-500/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-teal-400" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="font-heading text-[15px] sm:text-lg font-extrabold tracking-[-0.02em] truncate">
              Commute<span className="text-teal-400">IQ</span>
            </h1>
            <p className="hidden text-[10px] font-normal leading-tight tracking-wide uppercase text-muted-foreground/60 sm:block">
              SIH 2026 &middot; Smart Transit Intelligence
            </p>
          </div>
        </div>

        {/* Feature Badges - hidden on small screens */}
        <div className="hidden items-center gap-2 xl:flex">
          {featureBadges.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1"
              >
                <Icon className={cn('h-3 w-3', item.color)} />
                <span className="text-[11px] font-normal text-muted-foreground">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Time + User + Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Live Clock - hidden on mobile */}
          <div className="hidden text-right sm:block">
            <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {formattedTime}
            </div>
            <div className="text-[10px] text-muted-foreground">{formattedDate}</div>
          </div>

          {/* Live indicator - smaller on mobile */}
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 sm:px-2 py-1 ring-1 ring-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400">LIVE</span>
          </div>

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10 transition-colors hover:bg-white/10">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#0f1214]">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                <p className="text-[11px] text-muted-foreground">Commuter</p>
              </div>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                'relative z-10 flex items-center gap-1.5 rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'commuter' ? 'text-teal-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Commuter</span>
            </button>
            <button
              onClick={() => onViewChange('admin')}
              className={cn(
                'relative z-10 flex items-center gap-1.5 rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors',
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
