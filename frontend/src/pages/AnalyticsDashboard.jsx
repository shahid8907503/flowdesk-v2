import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetBoardsQuery } from '../features/boards/boardApi';
import { useGetBurndown, useGetTimeTracking } from '../features/analyticsAndOthersApi';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Loader2, 
  Clock,
  Sparkles,
  Calendar
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const params = useParams();
  const { workspaceId } = params;

  // Retrieve boards in workspace to select from
  const { data: boardsData, isLoading: boardsLoading } = useGetBoardsQuery(workspaceId);
  const boards = boardsData?.boards || [];

  const [selectedBoardId, setSelectedBoardId] = useState('');

  // Fallback to first board if none selected
  const activeBoardId = selectedBoardId || boards[0]?._id;

  const { data: burndownData, isLoading: bdLoading } = useGetBurndown(activeBoardId, { skip: !activeBoardId });
  const { data: timeData, isLoading: timeLoading } = useGetTimeTracking(activeBoardId, { skip: !activeBoardId });

  const burndown = burndownData?.burndown || {};
  const timeTracking = timeData?.timeTracking || {};

  // Calculate cumulative story points closed for a true burndown/burnup curve
  let cumulativePoints = 0;
  const cumulativeData = (burndown.closedTasksPerDay || []).map(item => {
    cumulativePoints += (item.storyPoints || 0);
    return {
      date: item.date,
      completed: cumulativePoints,
      remaining: Math.max(0, (burndown.totalStoryPoints || 0) - cumulativePoints)
    };
  });

  if (boardsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top selection bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-400" />
            Executive Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">Evaluate sprint velocities, burndown rates, and time logs.</p>
        </div>

        {boards.length > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Sprint Board:</span>
            <select
              value={activeBoardId || ''}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg py-2 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {boards.map(b => (
                <option key={b._id} value={b._id} className="bg-[#12101a]">{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/5 max-w-xl mx-auto">
          <Calendar size={40} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Sprint Boards Found</h3>
          <p className="text-slate-500 text-xs leading-relaxed px-6">Create boards inside the dashboard first to display completion metrics and time logs here.</p>
        </div>
      ) : bdLoading || timeLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : (
        <>
          {/* Summary stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-xl space-y-2 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completion Ratio</span>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="text-emerald-400" size={18} />
                <h2 className="text-xl font-black text-white">{burndown.completionPercentage || 0}%</h2>
              </div>
              <p className="text-[10px] text-slate-500">{burndown.completedCards || 0} of {burndown.totalCards || 0} tasks finished</p>
            </div>

            <div className="glass-card p-5 rounded-xl space-y-2 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Remaining Points</span>
              <div className="flex items-center gap-2.5">
                <Award className="text-indigo-400" size={18} />
                <h2 className="text-xl font-black text-white">{burndown.remainingStoryPoints || 0} pts</h2>
              </div>
              <p className="text-[10px] text-slate-500">Out of {burndown.totalStoryPoints || 0} total story points</p>
            </div>

            <div className="glass-card p-5 rounded-xl space-y-2 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sprint Velocity</span>
              <div className="flex items-center gap-2.5">
                <TrendingUp className="text-indigo-400" size={18} />
                <h2 className="text-xl font-black text-white">{burndown.teamVelocity || 0} SP/wk</h2>
              </div>
              <p className="text-[10px] text-slate-500">Average points completed weekly</p>
            </div>

            <div className="glass-card p-5 rounded-xl space-y-2 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Backlog</span>
              <div className="flex items-center gap-2.5">
                <Sparkles className="text-amber-400" size={18} />
                <h2 className="text-xl font-black text-white">{burndown.remainingCards || 0} cards</h2>
              </div>
              <p className="text-[10px] text-slate-500">Remaining items in board lanes</p>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Closed Tasks Burn-down (Count) */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-white">Sprint Task Progression</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Daily completed card counts over the past 14 days.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={burndown.closedTasksPerDay || []}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="count" name="Closed Cards" stroke="#6366F1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: True Burndown (Story Points Remaining) */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-white">Story Points Burndown Curve</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Cumulative points remaining vs. total sprint commitment.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="remaining" name="Story Points Remaining" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="completed" name="Completed Points" stroke="#22C55E" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Logged Daily Hours */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-white">Logged Work Duration (Daily)</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Time logged on active tasks in hours (past 7 days).</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeTracking.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="hours" name="Hours logged" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Logged Weekly Hours (Team Velocity) */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-white">Sprint Labor Velocity (Weekly)</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Cumulative hours logged weekly (past 4 weeks).</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeTracking.weekly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="week" stroke="#475569" fontSize={10} />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="hours" name="Hours logged" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
