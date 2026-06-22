import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useGetWorkspacesQuery, 
  useCreateWorkspaceMutation,
  useGetMembersQuery,
  useInviteMemberMutation
} from '../features/workspaces/workspaceApi';
import { 
  useGetBoardsQuery, 
  useCreateBoardMutation,
  useGetBoardByIdQuery 
} from '../features/boards/boardApi';
import { useCreateCardMutation } from '../features/cards/cardApi';
import { 
  useGetBurndown, 
  useGetTimeTracking, 
  useGetAuditLogs 
} from '../features/analyticsAndOthersApi';
import { useSocket } from '../context/SocketContext';
import { 
  Plus, 
  Trello, 
  Users, 
  Activity, 
  Clock, 
  PlusCircle, 
  FolderPlus, 
  Loader2,
  Mail,
  UserPlus,
  Folder,
  Zap,
  TrendingUp,
  Sparkles,
  Search,
  MessageSquare,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { workspaceId } = params;
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();

  // Create Workspace Form States
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  
  // Create Board Form States
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('#6366F1');

  // Quick Card Creator States
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedColId, setSelectedColId] = useState('');
  const [quickCardTitle, setQuickCardTitle] = useState('');
  const [quickCardPoints, setQuickCardPoints] = useState(1);
  const [quickCardPriority, setQuickCardPriority] = useState('Medium');

  // Invite States
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');

  // Local real-time socket activity logger
  const [localActivities, setLocalActivities] = useState([
    { id: 'l1', action: 'system.ready', user: { name: 'System' }, details: { message: 'FlowDesk Socket.IO listening for changes...' }, timestamp: new Date().toISOString() }
  ]);

  // API Queries
  const { data: wsData, isLoading: wsLoading, refetch: refetchWorkspaces } = useGetWorkspacesQuery();
  const workspaces = wsData?.workspaces || [];

  const activeWs = workspaces.find(w => w._id === workspaceId) || workspaces[0];

  const { data: boardsData, isLoading: boardsLoading } = useGetBoardsQuery(activeWs?._id, { skip: !activeWs });
  const boards = boardsData?.boards || [];

  const { data: membersData } = useGetMembersQuery(activeWs?._id, { skip: !activeWs });
  const members = membersData?.members || [];

  // Determine user role in current workspace
  const myMemberObject = members.find(m => m.user?._id === user?._id);
  const myRole = myMemberObject?.role || activeWs?.myRole || 'Viewer';
  const isAdmin = myRole === 'Super Admin' || myRole === 'Workspace Admin';

  // Load metrics of the first board to populate the dashboard metrics with real data
  const firstBoardId = boards[0]?._id;
  const { data: burndownData } = useGetBurndown(firstBoardId, { skip: !firstBoardId });
  const { data: timeData } = useGetTimeTracking(firstBoardId, { skip: !firstBoardId });

  // Load audit logs if user is an admin
  const { data: auditData } = useGetAuditLogs(
    { workspaceId: activeWs?._id, limit: 10 },
    { skip: !activeWs?._id || !isAdmin }
  );
  const serverLogs = auditData?.logs || [];

  // Fetch details of selected board for quick card creation
  const { data: quickBoardData } = useGetBoardByIdQuery(selectedBoardId, { skip: !selectedBoardId });
  const quickBoardColumns = quickBoardData?.columns || [];

  // Mutations
  const [createWorkspace, { isLoading: wsCreating }] = useCreateWorkspaceMutation();
  const [createBoard, { isLoading: boardCreating }] = useCreateBoardMutation();
  const [createCard, { isLoading: cardCreating }] = useCreateCardMutation();
  const [inviteMember, { isLoading: inviting }] = useInviteMemberMutation();

  // Watch for board selection in Quick Card Form to auto-select first column
  useEffect(() => {
    if (quickBoardColumns.length > 0) {
      setSelectedColId(quickBoardColumns[0]._id);
    } else {
      setSelectedColId('');
    }
  }, [quickBoardColumns]);

  // Set default selected board in Quick Card Form
  useEffect(() => {
    if (boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0]._id);
    }
  }, [boards, selectedBoardId]);

  // Real-time socket events logger
  useEffect(() => {
    if (socket) {
      const handleSocketEvent = (data) => {
        setLocalActivities(prev => [
          {
            id: Math.random().toString(),
            action: 'board.change',
            user: { name: 'Teammate' },
            details: { message: `Live collaborative action trigger: ${data.type || 'board content updated'}` },
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 8)
        ]);
      };
      socket.on('board_change', handleSocketEvent);
      return () => {
        socket.off('board_change', handleSocketEvent);
      };
    }
  }, [socket]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      const res = await createWorkspace({ name: newWsName, description: newWsDesc }).unwrap();
      setNewWsName('');
      setNewWsDesc('');
      refetchWorkspaces();
      navigate(`/workspaces/${res.workspace._id}/dashboard`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim() || !activeWs) return;
    try {
      await createBoard({
        workspaceId: activeWs._id,
        name: newBoardName,
        color: newBoardColor
      }).unwrap();
      setNewBoardName('');
      setLocalActivities(prev => [
        {
          id: Math.random().toString(),
          action: 'board.create',
          user: { name: user?.name || 'Me' },
          details: { message: `Created a new board: ${newBoardName}` },
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickCardSubmit = async (e) => {
    e.preventDefault();
    if (!quickCardTitle.trim() || !selectedBoardId || !selectedColId) return;
    try {
      await createCard({
        boardId: selectedBoardId,
        columnId: selectedColId,
        title: quickCardTitle,
        storyPoints: Number(quickCardPoints),
        priority: quickCardPriority
      }).unwrap();
      setQuickCardTitle('');
      setLocalActivities(prev => [
        {
          id: Math.random().toString(),
          action: 'card.create',
          user: { name: user?.name || 'Me' },
          details: { message: `Created card "${quickCardTitle}" via dashboard` },
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
      alert('Card created successfully!');
    } catch (err) {
      alert(err.data?.message || 'Quick Card creation failed.');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWs) return;
    try {
      await inviteMember({
        workspaceId: activeWs._id,
        data: { email: inviteEmail, role: inviteRole }
      }).unwrap();
      setInviteEmail('');
      setLocalActivities(prev => [
        {
          id: Math.random().toString(),
          action: 'member.invite',
          user: { name: user?.name || 'Me' },
          details: { message: `Invited user ${inviteEmail} as ${inviteRole}` },
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
      alert('Teammate invitation dispatched!');
    } catch (err) {
      alert(err.data?.message || 'Teammate invitation failed.');
    }
  };

  const formatShortDuration = (seconds) => {
    if (!seconds) return '0 hrs';
    const hrs = Math.round((seconds / 3600) * 10) / 10;
    return `${hrs} hrs`;
  };

  // If loading workspaces
  if (wsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  // 1. Onboarding Mode: No workspaces exist
  if (workspaces.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-8 border border-indigo-500/20">
          <FolderPlus size={32} />
        </div>
        <h1 className="text-3xl font-extrabold mb-4">Create Your First Workspace</h1>
        <p className="text-slate-400 mb-10">Workspaces are shared areas where you can invite your team and create Kanban sprint boards.</p>
        
        <form onSubmit={handleCreateWorkspace} className="glass-card p-8 rounded-2xl border border-darkBorder text-left space-y-6">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Workspace Name</label>
            <input
              type="text"
              required
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="e.g. Engineering Team"
              className="w-full glass-input"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Description (Optional)</label>
            <textarea
              value={newWsDesc}
              onChange={(e) => setNewWsDesc(e.target.value)}
              placeholder="What does this workspace do?"
              className="w-full glass-input h-24"
            />
          </div>
          <button type="submit" disabled={wsCreating} className="glass-button-primary w-full py-2.5">
            {wsCreating ? 'Creating Workspace...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    );
  }

  // Redirect if workspace mismatch
  if (!workspaceId && activeWs) {
    setTimeout(() => {
      navigate(`/workspaces/${activeWs._id}/dashboard`);
    }, 10);
    return null;
  }

  // Aggregated data values for top metrics
  const burndown = burndownData?.burndown || {};
  const dailyTime = timeData?.timeTracking?.daily || [];
  const totalHoursLogged = dailyTime.reduce((sum, item) => sum + item.hours, 0);

  const topMetrics = [
    { name: 'Boards', value: boards.length, change: 'Active Projects', icon: Folder, color: 'text-indigo-400' },
    { name: 'Sprint Tasks', value: burndown.totalCards || 0, change: `${burndown.remainingCards || 0} remaining`, icon: Trello, color: 'text-blue-400' },
    { name: 'Hours Tracked', value: `${Math.round(totalHoursLogged * 10) / 10} h`, change: 'Logged past 7d', icon: Clock, color: 'text-emerald-400' },
    { name: 'Weekly Velocity', value: `${burndown.teamVelocity || 0} SP`, change: 'Story pts / week', icon: Zap, color: 'text-violet-400' },
    { name: 'Completion Rate', value: `${burndown.completionPercentage || 0}%`, change: 'Sprints completion', icon: TrendingUp, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      
      {/* Workspace Headline info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-wider">
              {myRole}
            </span>
            <span className="text-slate-600 text-xs">•</span>
            <span className="text-slate-400 text-xs flex items-center gap-1"><Users size={12} /> {members.length} members</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mt-1.5">{activeWs?.name}</h1>
          <p className="text-sm text-slate-400 mt-1">{activeWs?.description || 'Manage project boards, view real-time operations, and configure webhooks.'}</p>
        </div>
      </div>

      {/* 1. TOP METRICS PANEL */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {topMetrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              whileHover={{ scale: 1.02 }}
              key={idx}
              className="glass-card p-4 rounded-xl border border-white/5 flex flex-col justify-between h-28 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{metric.name}</span>
                <Icon size={16} className={metric.color} />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-white">{metric.value}</div>
                <div className="text-[10px] text-slate-500 mt-1">{metric.change}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2. MAIN LAYOUT COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Boards List Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trello size={18} className="text-indigo-400" />
              Active Project Boards
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {boards.map(b => (
                <Link 
                  key={b._id} 
                  to={`/workspaces/${activeWs._id}/boards/${b._id}`}
                  className="glass-card p-5 rounded-xl hover:border-white/20 hover:bg-white/[0.03] transition-all flex flex-col justify-between group relative overflow-hidden h-36 border border-white/5"
                >
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: b.color }}></div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm">{b.name}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{b.description || 'Sprint planner board.'}</p>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span>Sprint Active</span>
                  </div>
                </Link>
              ))}

              {/* Create Board Inline Card */}
              {myRole !== 'Viewer' && (
                <form onSubmit={handleCreateBoard} className="glass-card p-5 rounded-xl border border-dashed border-white/10 flex flex-col justify-between h-36">
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      required
                      placeholder="Board Name..." 
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      className="bg-transparent border-b border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 w-full pb-1 placeholder:text-slate-600"
                    />
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">Theme:</span>
                      {['#6366F1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewBoardColor(c)}
                          className={`h-3 w-3 rounded-full border ${newBoardColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={boardCreating || !newBoardName.trim()}
                    className="glass-button-primary py-1 px-3 self-end text-[10px] font-bold gap-1 rounded-md"
                  >
                    <Plus size={10} />
                    Create Board
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick Actions & Creators Panel */}
          {myRole !== 'Viewer' && boards.length > 0 && (
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <PlusCircle size={15} className="text-indigo-400" />
                Quick Actions
              </h2>

              <form onSubmit={handleQuickCardSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Target Board</label>
                  <select 
                    value={selectedBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white"
                  >
                    {boards.map(b => (
                      <option key={b._id} value={b._id} className="bg-[#12101a]">{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Target Column</label>
                  <select 
                    value={selectedColId}
                    onChange={(e) => setSelectedColId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white"
                    disabled={quickBoardColumns.length === 0}
                  >
                    {quickBoardColumns.map(col => (
                      <option key={col._id} value={col._id} className="bg-[#12101a]">{col.name}</option>
                    ))}
                    {quickBoardColumns.length === 0 && (
                      <option className="bg-[#12101a]">No Columns</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Task Title</label>
                  <input
                    type="text"
                    required
                    value={quickCardTitle}
                    onChange={(e) => setQuickCardTitle(e.target.value)}
                    placeholder="Brief task details..."
                    className="w-full glass-input py-1 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Story Points</label>
                  <select 
                    value={quickCardPoints}
                    onChange={(e) => setQuickCardPoints(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white"
                  >
                    {[1, 2, 3, 5, 8, 13].map(pt => (
                      <option key={pt} value={pt} className="bg-[#12101a]">{pt} pts</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Priority</label>
                  <select 
                    value={quickCardPriority}
                    onChange={(e) => setQuickCardPriority(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white"
                  >
                    <option value="Low" className="bg-[#12101a]">Low</option>
                    <option value="Medium" className="bg-[#12101a]">Medium</option>
                    <option value="High" className="bg-[#12101a]">High</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={cardCreating || !quickCardTitle.trim()}
                  className="glass-button-primary py-2 px-3 text-xs font-bold w-full"
                >
                  {cardCreating ? 'Adding Task...' : 'Quick Create Card'}
                </button>
              </form>
            </div>
          )}

          {/* Activity Feed Section */}
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" />
              Live Workspace Activity Feed
            </h2>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              
              {/* If admin, load server side audit logs */}
              {isAdmin && serverLogs.length > 0 && (
                <div className="space-y-3">
                  {serverLogs.map(log => (
                    <div key={log._id} className="flex justify-between items-start gap-3 text-xs border-b border-white/5 pb-2.5">
                      <div className="flex gap-2.5 items-center">
                        <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-300 font-bold uppercase text-[9px] border border-indigo-500/20">
                          {log.userId?.name ? log.userId.name[0] : 'U'}
                        </div>
                        <div>
                          <p className="text-slate-200">
                            <span className="font-semibold">{log.userId?.name || 'Someone'}</span>
                            {' '}performed action:{' '}
                            <code className="text-indigo-400 font-mono text-[10px] bg-white/5 px-1 rounded">{log.action}</code>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {log.details?.title ? `Target card: "${log.details.title}"` : log.details?.message || 'Operation audit logging logged'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-600 shrink-0 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Local socket collaborative feed (visible/active for everyone) */}
              <div className="space-y-3">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Real-time Sockets Activity</div>
                {localActivities.map(act => (
                  <div key={act.id} className="flex justify-between items-start gap-3 text-xs border-b border-white/5 pb-2.5">
                    <div className="flex gap-2.5 items-center">
                      <div className="h-6 w-6 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-300 font-bold uppercase text-[9px] border border-violet-500/20">
                        {act.user.name[0]}
                      </div>
                      <div>
                        <p className="text-slate-300">
                          <span className="font-semibold text-slate-200">{act.user.name}</span>
                          {' '}{act.details.message}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-600 shrink-0">{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* Right Column (1/3 width): Member Settings */}
        <div className="space-y-6">
          
          {/* Invite workspace member (Only accessible to managers) */}
          {myRole !== 'Viewer' && (
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-3">
                <UserPlus size={16} className="text-indigo-400" />
                Invite Workspace Teammate
              </h3>
              <form onSubmit={handleInvite} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-600" size={15} />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@domain.com"
                    className="w-full glass-input pl-9 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Editor" className="bg-[#12101a]">Editor</option>
                    <option value="Viewer" className="bg-[#12101a]">Viewer</option>
                    <option value="Workspace Admin" className="bg-[#12101a]">Workspace Admin</option>
                  </select>
                  <button 
                    type="submit" 
                    disabled={inviting}
                    className="glass-button-primary py-1.5 px-3 text-xs font-bold"
                  >
                    {inviting ? 'Sending...' : 'Invite'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Members lists */}
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-3">
              <Users size={16} className="text-indigo-400" />
              Active Workspace Members ({members.length})
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {members.map(m => (
                <div key={m.id} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold uppercase text-[10px]">
                      {m.user?.name ? m.user.name[0] : 'U'}
                    </div>
                    <div className="truncate max-w-[130px]">
                      <p className="text-xs font-semibold text-white truncate">{m.user?.name || 'Pending Invitation'}</p>
                      <p className="text-[9px] text-slate-500 truncate">{m.user?.email || m.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5 font-semibold">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
