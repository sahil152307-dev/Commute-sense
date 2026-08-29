'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Navigation, Ticket, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrowdMonitor } from './crowd-monitor';
import { ETAEngine } from './eta-engine';
import { JourneyPlanner } from './journey-planner';
import { FastestTransport } from './fastest-transport';

type CommuterTab = 'crowd' | 'eta' | 'journey' | 'fastest';

const tabs: { id: CommuterTab; label: string; icon: typeof Eye; description: string }[] = [
  { id: 'crowd', label: 'Live Crowd Monitor', icon: Eye, description: 'AI-Powered Passenger Density Tracking' },
  { id: 'eta', label: 'Smart ETA', icon: Navigation, description: 'Predictive Arrival with Congestion Forecast' },
  { id: 'journey', label: 'Journey Planner', icon: Ticket, description: 'Multi-Modal Route & QR Ticket' },
  { id: 'fastest', label: 'Fastest Transport', icon: Zap, description: 'Alternative Transport When Bus is Delayed' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export function CommuterView() {
  const [activeTab, setActiveTab] = useState<CommuterTab>('crowd');

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-bold tracking-tight">Commuter Dashboard</h2>
          <p className="text-sm text-muted-foreground">Real-time transit intelligence for your journey</p>
        </div>
        <div className="flex gap-0.5 sm:gap-1 rounded-lg border border-white/5 bg-white/[0.02] p-0.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm font-medium transition-all whitespace-nowrap shrink-0',
                activeTab === tab.id
                  ? 'text-teal-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="commuter-tab-bg"
                  className="absolute inset-0 rounded-md bg-teal-500/10 ring-1 ring-teal-500/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Description */}
      <motion.p
        key={activeTab}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xs font-medium text-muted-foreground/70"
      >
        {tabs.find(t => t.id === activeTab)?.description}
      </motion.p>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          {activeTab === 'crowd' && (
            <motion.div variants={itemVariants}>
              <CrowdMonitor />
            </motion.div>
          )}
          {activeTab === 'eta' && (
            <motion.div variants={itemVariants}>
              <ETAEngine />
            </motion.div>
          )}
          {activeTab === 'journey' && (
            <motion.div variants={itemVariants}>
              <JourneyPlanner />
            </motion.div>
          )}
          {activeTab === 'fastest' && (
            <motion.div variants={itemVariants}>
              <FastestTransport />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
