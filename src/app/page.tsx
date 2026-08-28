'use client';

import { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/commute/header';
import { CommuterView } from '@/components/commute/commuter-view';
import { AdminView } from '@/components/commute/admin-view';
import { Bus, Shield, Brain, Route, Zap, Activity } from 'lucide-react';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function Home() {
  const [view, setView] = useState<'commuter' | 'admin'>('commuter');
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/20">
            <Bus className="h-6 w-6 text-teal-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">
              Commute<span className="text-teal-400">IQ</span>
            </h1>
            <p className="text-sm text-muted-foreground">Initializing...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header view={view} onViewChange={setView} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {view === 'commuter' ? <CommuterView /> : <AdminView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-3 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Bus className="h-3.5 w-3.5 text-teal-500/50" />
            <span className="text-xs text-muted-foreground">
              Commute<span className="text-teal-500/70">IQ</span> — Smart Urban Transit Intelligence
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Brain className="h-3 w-3 text-teal-500/40" />
              <span className="text-[10px] text-muted-foreground/60">CV Analytics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Route className="h-3 w-3 text-amber-500/40" />
              <span className="text-[10px] text-muted-foreground/60">Smart ETA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-purple-500/40" />
              <span className="text-[10px] text-muted-foreground/60">AI Routing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-emerald-500/40" />
              <span className="text-[10px] text-muted-foreground/60">Fleet AI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-rose-500/40" />
              <span className="text-[10px] text-muted-foreground/60">Telematics</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground/50">
            SIH 2026 • Problem #26205
          </div>
        </div>
      </footer>
    </div>
  );
}
