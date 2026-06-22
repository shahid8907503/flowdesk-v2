import React, { useState } from 'react';
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
    <div className="min-h-screen bg-darkBg text-slate-100 relative overflow-hidden font-sans">
      {/* Background radial glow accents */}
      <div className="absolute top-[-25%] left-[-15%] w-[800px] h-[800px] rounded-full bg-indigo-600/5 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[900px] h-[900px] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-white text-xl">F</span>
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FlowDesk</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
            Sign In
          </Link>
          <Link to="/signup" className="glass-button-primary">
            Start Free
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative z-10 flex flex-col items-center">
        {/* Release Pill */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-indigo-400 font-semibold mb-8 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5"><Sparkles size={11} /> FlowDesk v1.0 is now live</span>
          <ChevronRight size={12} />
        </motion.div>

        {/* Master Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-8xl font-black tracking-tight max-w-5xl leading-[1.05] mb-6"
        >
          Manage Projects at the <br/>
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-500 bg-clip-text text-transparent">
            Speed of Thought.
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-3xl mb-12 leading-relaxed font-normal"
        >
          FlowDesk combines drag-and-drop Kanban, atomic time tracking, real-time collaboration, and executive-grade sprint metrics into a unified dark-first SaaS workspace.
        </motion.p>

        {/* Feature List Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-12 text-xs font-semibold text-slate-500 uppercase tracking-widest"
        >
          <span className="flex items-center gap-1.5"><Users size={12} className="text-indigo-500" /> Live Collaboration</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Clock size={12} className="text-indigo-500" /> Atomic Time Tracking</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><TrendingUp size={12} className="text-indigo-500" /> Burn-down Analytics</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-indigo-500" /> Enterprise Security</span>
        </motion.div>

        {/* Call to Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24"
        >
          <Link to="/signup" className="glass-button-primary text-base px-8 py-4">
            Start Free Workspace
            <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="glass-button-secondary text-base px-8 py-4">
            Live Demo
          </Link>
        </motion.div>

        {/* Interactive Product Showcase (Kanban Demo) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full max-w-5xl rounded-2xl border border-white/10 bg-white/[0.01] p-4 shadow-[0_0_50px_rgba(99,102,241,0.08)] backdrop-blur-md relative"
        >
          {/* Showcase header tools */}
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-indigo-500/80"></span>
              <span className="text-xs font-semibold text-slate-400">Interactive Kanban Preview — Click cards to move them between statuses</span>
            </div>
            <button 
              onClick={resetDemoCards}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-400 transition-colors bg-white/5 px-2.5 py-1 rounded-md border border-white/5"
            >
              <RotateCcw size={10} />
              Reset Demo
            </button>
          </div>

          {/* Simulated Kanban Columns Grid */}
          <div className="bg-[#12101a]/40 border border-white/5 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-left min-h-[300px]">
            
            {/* 1. Backlog Column */}
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Backlog</span>
                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500">
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
                      className="p-3 bg-[#18181B] border border-white/5 rounded-lg shadow-sm hover:border-indigo-500/30 transition-all cursor-pointer relative group"
                    >
                      <div className="text-xs font-semibold text-slate-100 mb-2 leading-normal group-hover:text-indigo-300">{c.title}</div>
                      <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span className={`px-1.5 py-0.5 rounded border font-medium ${getColColor(c.priority)}`}>{c.priority}</span>
                        <span>{c.points} pts</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* 2. In Progress Column */}
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
                <span className="text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-400">
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
                      className="p-3 bg-[#18181B] border border-white/5 rounded-lg shadow-sm hover:border-indigo-500/30 transition-all cursor-pointer relative group"
                    >
                      <div className="text-xs font-semibold text-slate-100 mb-2 leading-normal group-hover:text-indigo-300">{c.title}</div>
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
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Review</span>
                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500">
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
                      className="p-3 bg-[#18181B] border border-white/5 rounded-lg shadow-sm hover:border-indigo-500/30 transition-all cursor-pointer relative group"
                    >
                      <div className="text-xs font-semibold text-slate-100 mb-2 leading-normal group-hover:text-indigo-300">{c.title}</div>
                      <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span className={`px-1.5 py-0.5 rounded border font-medium ${getColColor(c.priority)}`}>{c.priority}</span>
                        <span>{c.points} pts</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* 4. Completed Column */}
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Done</span>
                <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 font-bold">
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
                      className="p-3 bg-[#18181B]/80 border border-emerald-500/20 rounded-lg shadow-sm hover:border-indigo-500/30 transition-all cursor-pointer relative group"
                    >
                      <div className="text-xs font-semibold text-slate-400 line-through mb-2 leading-normal group-hover:text-indigo-300">{c.title}</div>
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
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
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Equipped for High-Velocity Teams</h2>
          <p className="text-slate-400 max-w-xl mx-auto">FlowDesk packs every essential SaaS developer feature into a single unified dark glassmorphism system.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            whileHover={{ scale: 1.02, translateY: -2 }}
            className="glass-card p-8 rounded-2xl border border-white/5"
          >
            <div className="h-12 w-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
              <Zap size={22} />
            </div>
            <h3 className="text-xl font-bold mb-3">Live Sockets Collaboration</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience instant live collaboration. Tasks, comments, and members presence update immediately across all boards without manual reloads.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, translateY: -2 }}
            className="glass-card p-8 rounded-2xl border border-white/5"
          >
            <div className="h-12 w-12 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 mb-6 border border-violet-500/20">
              <Clock size={22} />
            </div>
            <h3 className="text-xl font-bold mb-3">Integrated Time Tracker</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track times directly inside your cards. Pause, play, and end session logs, then watch hours auto-aggregate into team velocity metrics.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, translateY: -2 }}
            className="glass-card p-8 rounded-2xl border border-white/5"
          >
            <div className="h-12 w-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
              <TrendingUp size={22} />
            </div>
            <h3 className="text-xl font-bold mb-3">Burn-down Analytics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Evaluate project timelines using advanced Recharts components. Track remaining story points, team velocity, and historic sprint progression.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, translateY: -2 }}
            className="glass-card p-8 rounded-2xl border border-white/5"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-xl font-bold mb-3">Enterprise Auth & 2FA</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Secure workspaces with argon2 hashing, JWT refresh token rotation cookies, and full email-based 2FA OTP codes.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, translateY: -2 }}
            className="glass-card p-8 rounded-2xl border border-white/5"
          >
            <div className="h-12 w-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 mb-6 border border-amber-500/20">
              <Layers size={22} />
            </div>
            <h3 className="text-xl font-bold mb-3">Outgoing Webhooks</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connect external services. Dispatch payloads to external hooks when cards enter "Done" with robust HMAC payload verification.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, translateY: -2 }}
            className="glass-card p-8 rounded-2xl border border-white/5"
          >
            <div className="h-12 w-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
              <FileText size={22} />
            </div>
            <h3 className="text-xl font-bold mb-3">Complete Audit Logs</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Keep records of every card create, column transfer, configuration change, and member invitation in detailed audit logs.
            </p>
          </motion.div>
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
              <div className="h-9 w-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs uppercase">
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
              <div className="h-9 w-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-xs uppercase">
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
          <div className="glass-card p-8 rounded-2xl border-2 border-indigo-500 relative flex flex-col justify-between shadow-lg shadow-indigo-500/10">
            <div className="absolute top-4 right-4 bg-indigo-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Pro SaaS</h3>
              <p className="text-xs text-indigo-400 mb-6">For fast-growing development teams.</p>
              <div className="text-4xl font-extrabold text-white mb-6">
                $12 <span className="text-xs text-slate-500 font-normal">/ user / mo</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2 text-indigo-300">✓ Unlimited Workspaces & Boards</li>
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
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 relative z-10">
        <p>&copy; {new Date().getFullYear()} FlowDesk SaaS. All rights reserved. Created in JavaScript only.</p>
        <div className="flex gap-4">
          <Link to="/login" className="hover:underline">Terms of Service</Link>
          <Link to="/signup" className="hover:underline">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
