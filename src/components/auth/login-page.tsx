'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Shield,
  Activity,
  Zap,
  Brain,
  Route,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface LoginUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface LoginPageProps {
  onLogin: (user: LoginUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: name || undefined, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed');
          setLoading(false);
          return;
        }
        onLogin(data);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Login failed');
          setLoading(false);
          return;
        }
        onLogin(data);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="flex w-full max-w-md flex-col items-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex flex-col items-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/25">
              <Bus className="h-7 w-7 text-teal-400" />
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">
              Commute<span className="text-teal-400">IQ</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Smart Urban Transit Intelligence
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6 flex flex-wrap items-center justify-center gap-2"
          >
            {[
              { icon: Brain, label: 'CV Analytics', color: 'text-teal-400 border-teal-500/20 bg-teal-500/[0.04]' },
              { icon: Route, label: 'Smart ETA', color: 'text-amber-400 border-amber-500/20 bg-amber-500/[0.04]' },
              { icon: Zap, label: 'AI Routing', color: 'text-purple-400 border-purple-500/20 bg-purple-500/[0.04]' },
              { icon: Shield, label: 'Fleet AI', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.04]' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${item.color}`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              );
            })}
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="w-full"
          >
            <Card className="border-white/10 bg-[#0f1214]/80 backdrop-blur-sm">
              <CardContent className="p-5 sm:p-7">
                {/* Tab Toggle */}
                <div className="mb-5 flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                  <button
                    onClick={() => { setIsSignUp(false); setError(''); }}
                    className={`relative flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                      !isSignUp ? 'text-teal-400' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {!isSignUp && (
                      <motion.div
                        layoutId="auth-tab"
                        className="absolute inset-0 rounded-md bg-teal-500/15 ring-1 ring-teal-500/30"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">Sign In</span>
                  </button>
                  <button
                    onClick={() => { setIsSignUp(true); setError(''); }}
                    className={`relative flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                      isSignUp ? 'text-teal-400' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isSignUp && (
                      <motion.div
                        layoutId="auth-tab"
                        className="absolute inset-0 rounded-md bg-teal-500/15 ring-1 ring-teal-500/30"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">Sign Up</span>
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.form
                    key={isSignUp ? 'signup' : 'signin'}
                    initial={{ opacity: 0, x: isSignUp ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isSignUp ? -10 : 10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Name (sign up only) */}
                    <AnimatePresence>
                      {isSignUp && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1.5 overflow-hidden"
                        >
                          <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                            Full Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                            <Input
                              id="name"
                              type="text"
                              placeholder="Enter your name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="h-10 border-white/10 bg-white/[0.03] pl-9 text-sm placeholder:text-muted-foreground/40"
                              autoComplete="name"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-10 border-white/10 bg-white/[0.03] pl-9 text-sm placeholder:text-muted-foreground/40"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 border-white/10 bg-white/[0.03] pl-9 pr-9 text-sm placeholder:text-muted-foreground/40"
                          autoComplete={isSignUp ? 'new-password' : 'current-password'}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs font-medium text-red-400"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={loading || !email || !password || (isSignUp && !name)}
                      className="h-10 w-full bg-teal-500/90 text-white hover:bg-teal-500"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {isSignUp ? 'Create Account' : 'Sign In'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                </AnimatePresence>

                <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/40">
                  <Activity className="h-3 w-3" />
                  <span>SIH 2026 · Problem #26205</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <footer className="mt-auto border-t border-white/5 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-center px-4 py-3">
          <div className="flex items-center gap-2">
            <Bus className="h-3.5 w-3.5 text-teal-500/50" />
            <span className="text-xs text-muted-foreground">
              Commute<span className="text-teal-500/70">IQ</span> — Smart Urban Transit Intelligence
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
