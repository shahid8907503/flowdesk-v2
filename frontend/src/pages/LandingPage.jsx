import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

const LandingPage = () => {
  const [demoCards, setDemoCards] = useState([
    { id: 'c1', title: 'Configure webhooks system', col: 'backlog', priority: 'High', points: 3 },
    { id: 'c2', title: 'Integrate Socket.IO triggers', col: 'progress', priority: 'High', points: 5, running: true },
    { id: 'c3', title: 'Write Supertest transactions', col: 'review', priority: 'Medium', points: 1 },
    { id: 'c4', title: 'Build interactive dashboards', col: 'done', priority: 'Low', points: 2 }
  ]);

  const [activeFeature, setActiveFeature] = useState('sockets');
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(6322);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatSeconds = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const features = [
    {
      id: 'sockets',
      title: 'Live Sockets Collaboration',
      description: 'Experience instant live collaboration. Tasks, comments, and members presence update immediately across all boards without manual reloads.',
      icon: Zap,
      badge: 'Real-time'
    },
    {
      id: 'tracker',
      title: 'Integrated Time Tracker',
      description: 'Track times directly inside your cards. Pause, play, and end session logs, then watch hours auto-aggregate into team velocity metrics.',
      icon: Clock,
      badge: 'Productivity'
    },
    {
      id: 'analytics',
      title: 'Burn-down Analytics',
      description: 'Evaluate project timelines using advanced Recharts components. Track remaining story points, team velocity, and historic sprint progression.',
      icon: TrendingUp,
      badge: 'Metrics'
    },
    {
      id: 'auth',
      title: 'Enterprise Auth & 2FA',
      description: 'Secure workspaces with argon2 hashing, JWT refresh token rotation cookies, and full email-based 2FA OTP codes.',
      icon: ShieldCheck,
      badge: 'Security'
    },
    {
      id: 'webhooks',
      title: 'Outgoing Webhooks',
      description: 'Connect external services. Dispatch payloads to external hooks when cards enter "Done" with robust HMAC payload verification.',
      icon: Layers,
      badge: 'Integrations'
    },
    {
      id: 'audit',
      title: 'Complete Audit Logs',
      description: 'Keep records of every card create, column transfer, configuration change, and member invitation in detailed audit logs.',
      icon: FileText,
      badge: 'Compliance'
    }
  ];

  const moveDemoCard = (id) => {
    setDemoCards(prev => prev.map(c => {
      if (c.id === id) {
        let nextCol;
        if (c.col === 'backlog') nextCol = 'progress';
        else if (c.col === 'progress') nextCol = 'review';
        else if (c.col === 'review') nextCol = 'done';
        else nextCol = 'backlog';
        return { ...c, col: nextCol };
      }
      return c;
    }));
  };

  const resetDemoCards = () => {
    setDemoCards([
      { id: 'c1', title: 'Configure webhooks system', col: 'backlog', priority: 'High', points: 3 },
      { id: 'c2', title: 'Integrate Socket.IO triggers', col: 'progress', priority: 'High', points: 5, running: true },
      { id: 'c3', title: 'Write Supertest transactions', col: 'review', priority: 'Medium', points: 1 },
      { id: 'c4', title: 'Build interactive dashboards', col: 'done', priority: 'Low', points: 2 }
    ]);
  };

  const getColColor = (priority) => {
    if (priority === 'High') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (priority === 'Medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="min-h-screen bg-darkBg text-slate-200 relative overflow-hidden font-sans">
      {/* Background radial glow accents */}
      <div className="absolute top-[-25%] left-[-15%] w-[800px] h-[800px] rounded-full bg-accentColor/5 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[900px] h-[900px] rounded-full bg-accentViolet/3 blur-[150px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2">
          <svg className="h-6 w-6 text-accentColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="4" height="18" rx="1" />
            <rect x="10" y="3" width="4" height="12" rx="1" />
            <rect x="17" y="3" width="4" height="15" rx="1" />
          </svg>
          <span className="font-semibold text-lg tracking-tight text-white">
            Flow<span className="text-slate-400 font-light">Desk</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/login" className="text-slate-400 hover:text-white transition-colors text-xs font-medium">
            Sign In
          </Link>
          <Link to="/signup" className="glass-button-primary px-5 py-2">
            Start Free
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-16 text-center relative z-10 flex flex-col items-center">
        {/* Release Pill */}
        <Link to="/signup">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-accentColor font-bold mb-8 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5"><Sparkles size={11} /> FlowDesk v1.1 is now live</span>
            <ChevronRight size={12} />
          </motion.div>
        </Link>

        {/* Master Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.08] mb-6 font-sans"
        >
          Engineering workspaces, <br className="hidden md:inline" />
          <span className="text-slate-400 font-light">designed to flow.</span>
        </motion.h1>

        {/* Description */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm md:text-base text-slate-400 max-w-2xl mb-12 leading-relaxed font-normal"
        >
          FlowDesk integrates instant live collaborative boards, precise card-based time tracking, and historic sprint analytics into a keyboard-driven engineering command center.
        </motion.p>

        {/* Feature List Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-12 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
        >
          <span className="flex items-center gap-1.5"><Users size={12} className="text-accentColor" /> Live Collaboration</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Clock size={12} className="text-accentColor" /> Precise Loggers</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><TrendingUp size={12} className="text-accentColor" /> Burn-down Analytics</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-accentColor" /> JWT Security</span>
        </motion.div>

        {/* Call to Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <Link to="/signup" className="glass-button-primary text-xs px-8 py-3.5">
            Deploy Workspace
            <ArrowRight size={14} />
          </Link>
          <Link to="/login" className="glass-button-secondary text-xs px-8 py-3.5">
            Interactive Console
          </Link>
        </motion.div>

        {/* Interactive Product Showcase (Kanban Demo) styled as a premium browser window */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full max-w-5xl rounded-xl border border-white/5 bg-[#0A0B0E] shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_80px_rgba(217,119,6,0.04)] overflow-hidden relative"
        >
          {/* Mock Browser Header Bar */}
          <div className="bg-[#0E1015] border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/30 border border-red-500/10"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/30 border border-yellow-500/10"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/30 border border-green-500/10"></span>
            </div>
            <div className="bg-white/5 border border-white/5 px-4 py-1 rounded text-[9px] text-slate-500 font-mono w-80 truncate text-center">
              app.flowdesk.io/workspaces/dev_default/board_active
            </div>
            <button 
              onClick={resetDemoCards}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-accentColor transition-colors bg-white/5 px-2.5 py-1 rounded border border-white/5"
            >
              <RotateCcw size={10} />
              Reset Board
            </button>
          </div>

          <div className="p-6 bg-gradient-to-b from-[#0A0B0E] to-[#0E1015] text-left">
            {/* Showcase Tip */}
            <p className="text-[10px] font-semibold text-slate-500 mb-4 bg-white/5 border border-white/5 inline-block px-2.5 py-1 rounded-md">
              💡 Drag & Drop Simulation: Click on any card to move it across columns.
            </p>

            {/* Simulated Kanban Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[300px]">
              
              {/* 1. Backlog Column */}
              <div className="bg-[#13151D]/60 border border-white/5 rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3.5 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Backlog</span>
                  <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-400 font-mono">
                    {demoCards.filter(c => c.col === 'backlog').length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  <AnimatePresence>
                    {demoCards.filter(c => c.col === 'backlog').map(c => (
                      <motion.div
                        layout
                        key={c.id}
                        onClick={() => moveDemoCard(c.id)}
                        className="p-3 bg-[#171922] border border-white/5 rounded-lg shadow-sm hover:border-accentColor/30 transition-all cursor-pointer relative group"
                      >
                        <div className="text-[11px] font-semibold text-slate-200 mb-2 leading-normal group-hover:text-accentColor">{c.title}</div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span className={`px-1.5 py-0.5 rounded border font-medium ${getColColor(c.priority)}`}>{c.priority}</span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-600 font-medium">{c.points} pts</span>
                            <span className="h-4 w-4 rounded-full bg-accentColor/10 border border-accentColor/20 text-accentColor flex items-center justify-center font-bold text-[8px]">SC</span>
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* 2. In Progress Column */}
              <div className="bg-[#13151D]/60 border border-white/5 rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3.5 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
                  <span className="text-[9px] bg-accentColor/10 px-2 py-0.5 rounded text-accentColor font-mono">
                    {demoCards.filter(c => c.col === 'progress').length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  <AnimatePresence>
                    {demoCards.filter(c => c.col === 'progress').map(c => (
                      <motion.div
                        layout
                        key={c.id}
                        onClick={() => moveDemoCard(c.id)}
                        className="p-3 bg-[#171922] border border-white/5 rounded-lg shadow-sm hover:border-accentColor/30 transition-all cursor-pointer relative group"
                      >
                        <div className="text-[11px] font-semibold text-slate-200 mb-2 leading-normal group-hover:text-accentColor">{c.title}</div>
                        <div className="flex justify-between items-center text-[9px]">
                          <span className={`px-1.5 py-0.5 rounded border font-medium ${getColColor(c.priority)}`}>{c.priority}</span>
                          <span className="text-red-400 font-bold flex items-center gap-1 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                            01:45:22
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* 3. Review Column */}
              <div className="bg-[#13151D]/60 border border-white/5 rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3.5 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Review</span>
                  <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-400 font-mono">
                    {demoCards.filter(c => c.col === 'review').length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  <AnimatePresence>
                    {demoCards.filter(c => c.col === 'review').map(c => (
                      <motion.div
                        layout
                        key={c.id}
                        onClick={() => moveDemoCard(c.id)}
                        className="p-3 bg-[#171922] border border-white/5 rounded-lg shadow-sm hover:border-accentColor/30 transition-all cursor-pointer relative group"
                      >
                        <div className="text-[11px] font-semibold text-slate-200 mb-2 leading-normal group-hover:text-accentColor">{c.title}</div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span className={`px-1.5 py-0.5 rounded border font-medium ${getColColor(c.priority)}`}>{c.priority}</span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-600 font-medium">{c.points} pts</span>
                            <span className="h-4 w-4 rounded-full bg-accentViolet/10 border border-accentViolet/20 text-accentViolet flex items-center justify-center font-bold text-[8px]">MH</span>
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* 4. Completed Column */}
              <div className="bg-[#13151D]/60 border border-white/5 rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3.5 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Done</span>
                  <span className="text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400 font-mono font-bold">
                    {demoCards.filter(c => c.col === 'done').length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  <AnimatePresence>
                    {demoCards.filter(c => c.col === 'done').map(c => (
                      <motion.div
                        layout
                        key={c.id}
                        onClick={() => moveDemoCard(c.id)}
                        className="p-3 bg-[#171922]/80 border border-emerald-500/10 rounded-lg shadow-sm hover:border-accentColor/30 transition-all cursor-pointer relative group"
                      >
                        <div className="text-[11px] font-semibold text-slate-500 line-through mb-2 leading-normal group-hover:text-accentColor">{c.title}</div>
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 scale-95">
                            Completed
                          </span>
                          <span className="text-slate-600 font-medium">{c.points} pts</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </section>

      {/* Interactive Feature Showcase */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-accentColor">Platform Core</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Equipped for High-Velocity Teams</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Explore the enterprise architecture built directly into FlowDesk.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Tabs Navigation (Left) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {features.map((feat) => {
              const Icon = feat.icon;
              const isActive = activeFeature === feat.id;
              return (
                <button
                  key={feat.id}
                  onClick={() => setActiveFeature(feat.id)}
                  className={`text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                    isActive
                      ? 'bg-accentColor/10 border-accentColor/20 text-white shadow-lg'
                      : 'bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.03] hover:border-white/10 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg border ${
                    isActive ? 'bg-accentColor/20 border-accentColor/25 text-accentColor' : 'bg-white/5 border-white/5 text-slate-400'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm">{feat.title}</span>
                      {feat.badge && (
                        <span className={`text-[9px] px-2 py-0.5 rounded font-mono ${
                          isActive ? 'bg-accentColor/20 text-accentColor' : 'bg-white/5 text-slate-500'
                        }`}>
                          {feat.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-normal line-clamp-2">{feat.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Preview Showcase (Right) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeFeature === 'sockets' && (
                  <div className="bg-[#13151D]/80 border border-white/5 rounded-xl p-6 flex flex-col h-full justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-accentColor font-semibold mb-3 block font-mono">Socket.IO Event Stream</span>
                      <h4 className="text-lg font-bold text-white mb-4">Active Board Room Updates</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-medium text-slate-200">Sarah Chen</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">room: workspace_1</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-accentViolet animate-pulse"></span>
                            <span className="text-xs font-medium text-slate-200">Marcus Harris</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">card_move: card_84 &rarr; Done</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                            <span className="text-xs font-medium text-slate-200">Alex Rodriguez</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">timer_start: card_11</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono border-t border-white/5 pt-4 mt-6">
                      {`io.to("board:sprint_3").emit("board_change", { action: "card_move" });`}
                    </div>
                  </div>
                )}

                {activeFeature === 'tracker' && (
                  <div className="bg-[#13151D]/80 border border-white/5 rounded-xl p-6 flex flex-col h-full justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-accentViolet font-semibold mb-3 block font-mono">Task Session Timer</span>
                      <h4 className="text-lg font-bold text-white mb-4">Integrated Developer Stopwatch</h4>
                      <div className="bg-black/25 border border-white/5 rounded-xl p-6 text-center max-w-sm mx-auto">
                        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-mono">Active Time Logged</p>
                        <p className="text-4xl font-mono font-semibold text-white tracking-wider mb-4">
                          {formatSeconds(timerSeconds)}
                        </p>
                        <button 
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isTimerRunning 
                              ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {isTimerRunning ? 'Pause Session' : 'Resume Session'}
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-normal border-t border-white/5 pt-4 mt-6">
                      Accumulated time logs are pushed to MongoDB session transactions for high accuracy velocity calculations.
                    </div>
                  </div>
                )}

                {activeFeature === 'analytics' && (
                  <div className="bg-[#13151D]/80 border border-white/5 rounded-xl p-6 flex flex-col h-full justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-accentColor font-semibold mb-3 block font-mono">Burndown Metrics</span>
                      <h4 className="text-lg font-bold text-white mb-4">Sprint Story Points Velocity</h4>
                      <div className="h-32 w-full flex items-end justify-between gap-1 pt-4 px-2 bg-black/25 border border-white/5 rounded-xl">
                        <svg className="w-full h-full text-accentColor" viewBox="0 0 100 50" preserveAspectRatio="none">
                          <line x1="0" y1="5" x2="100" y2="45" stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
                          <path d="M 0 5 L 20 15 L 40 18 L 60 30 L 80 32 L 100 45" fill="none" stroke="#D97706" strokeWidth="2" />
                        </svg>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-1">
                        <span>Day 1</span>
                        <span>Day 5</span>
                        <span>Day 10 (Sprint End)</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                      <span>Current Velocity: 34 pts / sprint</span>
                      <span className="text-emerald-400 font-bold">On Schedule</span>
                    </div>
                  </div>
                )}

                {activeFeature === 'auth' && (
                  <div className="bg-[#13151D]/80 border border-white/5 rounded-xl p-6 flex flex-col h-full justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-3 block font-mono">Security Center</span>
                      <h4 className="text-lg font-bold text-white mb-4">Multi-Factor Authentication</h4>
                      <div className="bg-black/25 border border-white/5 rounded-xl p-4 flex flex-col items-center max-w-sm mx-auto">
                        <p className="text-[10px] text-slate-400 text-center mb-3">Verification required: Enter the 6-digit OTP code sent to your email.</p>
                        <div className="flex gap-2 mb-4">
                          {['8', '9', '0', '7', '', ''].map((val, idx) => (
                            <input 
                              key={idx} 
                              type="text" 
                              value={val} 
                              disabled 
                              className={`w-8 h-10 border rounded-lg text-center font-mono text-sm font-semibold ${
                                val ? 'border-accentColor text-accentColor bg-accentColor/5' : 'border-white/10 bg-white/5 text-slate-500'
                              }`} 
                            />
                          ))}
                        </div>
                        <button className="w-full py-1.5 rounded-lg bg-accentColor hover:brightness-105 text-white text-xs font-semibold transition-colors cursor-pointer">
                          Verify Code
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 border-t border-white/5 pt-4 mt-6">
                      Argon2id hashing security combined with rotate-on-use JWT access and refresh cookies.
                    </div>
                  </div>
                )}

                {activeFeature === 'webhooks' && (
                  <div className="bg-[#13151D]/80 border border-white/5 rounded-xl p-6 flex flex-col h-full justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-3 block font-mono">Outgoing Integrations</span>
                      <h4 className="text-lg font-bold text-white mb-4">JSON Webhook Payloads</h4>
                      <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-slate-300 leading-normal overflow-x-auto">
                        <p className="text-slate-500">// Header: x-flowdesk-signature-256</p>
                        <pre>{`{
  "event": "card.completed",
  "timestamp": "${new Date().toISOString()}",
  "data": {
    "cardId": "card_982b1c",
    "title": "Configure webhooks",
    "assignee": "Sarah Chen",
    "points": 3
  }
}`}</pre>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 border-t border-white/5 pt-4 mt-6">
                      Robust HMAC SHA-256 payloads dispatched to custom API endpoints upon task completion.
                    </div>
                  </div>
                )}

                {activeFeature === 'audit' && (
                  <div className="bg-[#13151D]/80 border border-white/5 rounded-xl p-6 flex flex-col h-full justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-accentColor font-semibold mb-3 block font-mono">Compliance Trails</span>
                      <h4 className="text-lg font-bold text-white mb-4">Immutable Audit Logs</h4>
                      <div className="overflow-hidden border border-white/5 rounded-lg text-left text-xs bg-black/25">
                        <table className="w-full text-[10px] text-slate-400">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-slate-300">
                              <th className="p-2">Event</th>
                              <th className="p-2">Actor</th>
                              <th className="p-2">IP Address</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-white/5">
                              <td className="p-2 font-mono text-accentColor">workspace.delete_request</td>
                              <td className="p-2">Sarah C.</td>
                              <td className="p-2">192.168.1.42</td>
                            </tr>
                            <tr className="border-b border-white/5">
                              <td className="p-2 font-mono text-accentViolet">mfa.enabled</td>
                              <td className="p-2">Marcus H.</td>
                              <td className="p-2">203.0.113.12</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-mono text-amber-400">webhook.created</td>
                              <td className="p-2">Alex R.</td>
                              <td className="p-2">198.51.100.7</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 border-t border-white/5 pt-4 mt-6">
                      Ensures SOC 2 compliance readiness with fully traceable historical modifications logs.
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Loved by Fast Teams</h2>
          <p className="text-slate-400">See what makers say about FlowDesk's speed and integration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-xl border border-white/5 flex flex-col justify-between">
            <p className="text-sm text-slate-300 italic leading-relaxed mb-6">
              "The command palette and atomic time tracking completely transformed our sprint reviews. We tracked 150 hours in the first week without a single hitch."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-accentColor/10 border border-accentColor/25 flex items-center justify-center text-accentColor font-bold text-xs uppercase">
                SC
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Sarah Chen</h4>
                <p className="text-[10px] text-slate-500">VP Engineering, LinearV</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-xl border border-white/5 flex flex-col justify-between">
            <p className="text-sm text-slate-300 italic leading-relaxed mb-6">
              "We migrated from Jira in less than an hour. The dark-first design is extremely elegant, and the Socket.IO real-time sync is incredibly fast."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-accentViolet/10 border border-accentViolet/25 flex items-center justify-center text-accentViolet font-bold text-xs uppercase">
                MH
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Marcus Harris</h4>
                <p className="text-[10px] text-slate-500">Lead Architect, Notion Labs</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-xl border border-white/5 flex flex-col justify-between">
            <p className="text-sm text-slate-300 italic leading-relaxed mb-6">
              "The webhook support with HMAC validation lets us tie FlowDesk seamlessly into our production pipelines. Exceptional engineering quality."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-xs uppercase">
                AR
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Alex Rodriguez</h4>
                <p className="text-[10px] text-slate-500">SRE Director, DevCorp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing plans */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Flexible Pricing for Any Scale</h2>
          <p className="text-slate-400">Simple flat-rate pricing. Start for free and upgrade as you grow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="glass-card p-8 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Free Plan</h3>
              <p className="text-xs text-slate-500 mb-6">Perfect for small side projects.</p>
              <div className="text-4xl font-extrabold text-white mb-6">$0</div>
              <ul className="space-y-3 text-xs text-slate-400 mb-8">
                <li className="flex items-center gap-2">✓ 1 Workspace</li>
                <li className="flex items-center gap-2">✓ 3 Active Kanban Boards</li>
                <li className="flex items-center gap-2">✓ Basic Socket Syncing</li>
                <li className="flex items-center gap-2">✓ Standard Auth</li>
              </ul>
            </div>
            <Link to="/signup" className="glass-button-secondary w-full py-2">
              Get Started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="glass-card p-8 rounded-2xl border border-accentColor relative flex flex-col justify-between shadow-lg shadow-accentColor/5">
            <div className="absolute top-4 right-4 bg-accentColor text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Pro SaaS</h3>
              <p className="text-xs text-accentColor mb-6">For fast-growing development teams.</p>
              <div className="text-4xl font-extrabold text-white mb-6">
                $12 <span className="text-xs text-slate-500 font-normal">/ user / mo</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2 text-accentColor">✓ Unlimited Workspaces & Boards</li>
                <li className="flex items-center gap-2">✓ Live Sockets Collaboration</li>
                <li className="flex items-center gap-2">✓ Integrated Card Time Tracker</li>
                <li className="flex items-center gap-2">✓ Recharts Burn-down Metrics</li>
                <li className="flex items-center gap-2">✓ Outgoing Webhooks & Digests</li>
                <li className="flex items-center gap-2">✓ Email verification & 2FA OTP</li>
              </ul>
            </div>
            <Link to="/signup" className="glass-button-primary w-full py-2">
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-card p-8 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Enterprise</h3>
              <p className="text-xs text-slate-500 mb-6">For large scale operations.</p>
              <div className="text-4xl font-extrabold text-white mb-6">Custom</div>
              <ul className="space-y-3 text-xs text-slate-400 mb-8">
                <li className="flex items-center gap-2">✓ Custom Outgoing Webhook endpoints</li>
                <li className="flex items-center gap-2">✓ Immutable Audit Logs export</li>
                <li className="flex items-center gap-2">✓ Dedicated SMTP email gateways</li>
                <li className="flex items-center gap-2">✓ SLA Support guarantees</li>
              </ul>
            </div>
            <Link to="/signup" className="glass-button-secondary w-full py-2">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 pt-24 pb-12 border-t border-white/5 relative z-10 text-xs text-slate-500">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accentColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="4" height="18" rx="1" />
                <rect x="10" y="3" width="4" height="12" rx="1" />
                <rect x="17" y="3" width="4" height="15" rx="1" />
              </svg>
              <span className="font-semibold text-lg tracking-tight text-white">
                Flow<span className="text-slate-400 font-light">Desk</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              Enterprise-grade SaaS Kanban and real-time collaboration workspace built for engineering squads.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-[10px]">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-white transition-colors">Kanban Boards</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Time Tracking</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Burndown Analytics</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">HMAC Webhooks</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-[10px]">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">API Reference</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">System Status</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Support Center</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-[10px]">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">GDPR & Security</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Cookie Preferences</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-8 text-slate-600">
          <p>&copy; {new Date().getFullYear()} FlowDesk. All rights reserved.</p>
          <p>Created with clean engineering architectures.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
