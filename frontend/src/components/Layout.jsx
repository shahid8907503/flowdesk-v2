import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { logOut } from '../features/auth/authSlice';
import { useGetWorkspacesQuery } from '../features/workspaces/workspaceApi';
import { 
  useGetBoardsQuery, 
  useCreateBoardMutation, 
  useGetBoardByIdQuery 
} from '../features/boards/boardApi';
import { useCreateCardMutation } from '../features/cards/cardApi';
import { 
  LayoutDashboard, 
  Trello, 
  BarChart3, 
  Settings, 
  ShieldAlert, 
  Webhook, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Plus, 
  Folder,
  Bell,
  Search,
  PlusCircle,
  Loader2
} from 'lucide-react';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  
  // Quick Creation Dialog States
  const [isQuickCardOpen, setIsQuickCardOpen] = useState(false);
  const [isQuickBoardOpen, setIsQuickBoardOpen] = useState(false);
  const [quickBoardName, setQuickBoardName] = useState('');
  const [quickBoardColor, setQuickBoardColor] = useState('#6366F1');
  const [quickCardTitle, setQuickCardTitle] = useState('');
  const [quickCardPoints, setQuickCardPoints] = useState(1);
  const [quickCardPriority, setQuickCardPriority] = useState('Medium');
  
  const [selectedQuickBoardId, setSelectedQuickBoardId] = useState('');
  const [selectedQuickColId, setSelectedQuickColId] = useState('');

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const params = useParams();

  const currentWorkspaceId = params.workspaceId || localStorage.getItem('lastWorkspaceId');

  const { data: wsData } = useGetWorkspacesQuery(undefined, { skip: !user });
  const workspaces = wsData?.workspaces || [];
  const activeWorkspace = workspaces.find(w => w._id === currentWorkspaceId) || workspaces[0];

  const { data: boardsData } = useGetBoardsQuery(activeWorkspace?._id, { skip: !activeWorkspace });
  const boards = boardsData?.boards || [];

  // Mutations
  const [createBoard, { isLoading: boardCreating }] = useCreateBoardMutation();
  const [createCard, { isLoading: cardCreating }] = useCreateCardMutation();

  // Fetch details of selected board for quick card creation
  const { data: quickBoardDetails } = useGetBoardByIdQuery(selectedQuickBoardId, { skip: !selectedQuickBoardId });
  const quickBoardColumns = quickBoardDetails?.columns || [];

  // Keyboard hotkeys listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement;
      if (
        activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.tagName === 'SELECT' ||
          activeElement.isContentEditable
        )
      ) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsQuickCardOpen(true);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsQuickBoardOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update default selected board/column for quick creation
  useEffect(() => {
    if (params.boardId) {
      setSelectedQuickBoardId(params.boardId);
    } else if (boards.length > 0 && !selectedQuickBoardId) {
      setSelectedQuickBoardId(boards[0]._id);
    }
  }, [boards, params.boardId]);

  useEffect(() => {
    if (quickBoardColumns.length > 0) {
      setSelectedQuickColId(quickBoardColumns[0]._id);
    } else {
      setSelectedQuickColId('');
    }
  }, [quickBoardColumns]);

  const handleLogout = () => {
    dispatch(logOut());
    navigate('/');
  };

  const handleWorkspaceChange = (e) => {
    const wsId = e.target.value;
    localStorage.setItem('lastWorkspaceId', wsId);
    navigate(`/workspaces/${wsId}/dashboard`);
  };

  const handleQuickBoardSubmit = async (e) => {
    e.preventDefault();
    if (!quickBoardName.trim() || !activeWorkspace) return;
    try {
      const res = await createBoard({
        workspaceId: activeWorkspace._id,
        name: quickBoardName,
        color: quickBoardColor
      }).unwrap();
      setQuickBoardName('');
      setIsQuickBoardOpen(false);
      // Auto navigate to the newly created board
      navigate(`/workspaces/${activeWorkspace._id}/boards/${res.board._id}`);
    } catch (err) {
      alert('Failed to create board: ' + (err?.data?.message || err.message));
    }
  };

  const handleQuickCardSubmit = async (e) => {
    e.preventDefault();
    if (!quickCardTitle.trim() || !selectedQuickBoardId || !selectedQuickColId) return;
    try {
      await createCard({
        boardId: selectedQuickBoardId,
        columnId: selectedQuickColId,
        title: quickCardTitle,
        storyPoints: Number(quickCardPoints),
        priority: quickCardPriority
      }).unwrap();
      setQuickCardTitle('');
      setIsQuickCardOpen(false);
    } catch (err) {
      alert('Failed to create task: ' + (err?.data?.message || err.message));
    }
  };

  const menuItems = activeWorkspace ? [
    { name: 'Dashboard', path: `/workspaces/${activeWorkspace._id}/dashboard`, icon: LayoutDashboard },
    { name: 'Analytics', path: `/workspaces/${activeWorkspace._id}/analytics`, icon: BarChart3 },
    { name: 'Webhooks', path: `/workspaces/${activeWorkspace._id}/webhooks`, icon: Webhook },
    { name: 'Audit Logs', path: `/workspaces/${activeWorkspace._id}/audit-logs`, icon: ShieldAlert },
    { name: 'Settings', path: `/workspaces/${activeWorkspace._id}/settings`, icon: Settings },
  ] : [];

  const allCommands = [
    { name: 'Go to Dashboard', action: () => navigate(`/workspaces/${activeWorkspace?._id}/dashboard`), category: 'Navigation', icon: LayoutDashboard },
    { name: 'Go to Analytics', action: () => navigate(`/workspaces/${activeWorkspace?._id}/analytics`), category: 'Navigation', icon: BarChart3 },
    { name: 'Go to Webhooks', action: () => navigate(`/workspaces/${activeWorkspace?._id}/webhooks`), category: 'Navigation', icon: Webhook },
    { name: 'Go to Audit Logs', action: () => navigate(`/workspaces/${activeWorkspace?._id}/audit-logs`), category: 'Navigation', icon: ShieldAlert },
    { name: 'Go to Settings', action: () => navigate(`/workspaces/${activeWorkspace?._id}/settings`), category: 'Navigation', icon: Settings },
    { name: 'Create Card/Task (Hotkey: C)', action: () => setIsQuickCardOpen(true), category: 'Actions', icon: PlusCircle },
    { name: 'Create Board (Hotkey: B)', action: () => setIsQuickBoardOpen(true), category: 'Actions', icon: Trello },
    { name: 'Log Out', action: handleLogout, category: 'Actions', icon: LogOut }
  ];

  const boardCommands = boards.map(b => ({
    name: `Open Board: ${b.name}`,
    action: () => navigate(`/workspaces/${activeWorkspace?._id}/boards/${b._id}`),
    category: 'Boards',
    icon: Trello,
    color: b.color
  }));

  const filteredCommands = [...allCommands, ...boardCommands].filter(cmd => 
    cmd.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
    cmd.category.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const NavigationContent = () => (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <span className="font-extrabold text-white text-lg">F</span>
        </div>
        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FlowDesk</span>
      </div>

      {/* Workspace Selector */}
      {workspaces.length > 0 && (
        <div className="mb-6 px-2">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Workspace</label>
          <select 
            value={activeWorkspace?._id || ''}
            onChange={handleWorkspaceChange}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {workspaces.map(ws => (
              <option key={ws._id} value={ws._id} className="bg-[#12101a]">{ws.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Main Nav Items */}
      <nav className="space-y-1 mb-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Board List */}
      {activeWorkspace && (
        <div className="flex-1 overflow-y-auto px-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Boards</span>
            <button onClick={() => setIsQuickBoardOpen(true)} className="text-slate-400 hover:text-white transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {boards.map(b => {
              const isActive = location.pathname.includes(`/boards/${b._id}`);
              return (
                <Link
                  key={b._id}
                  to={`/workspaces/${activeWorkspace._id}/boards/${b._id}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive 
                      ? 'bg-violet-600/15 text-violet-400 border-l-2 border-violet-500' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Trello size={15} style={{ color: b.color }} />
                  <span className="truncate">{b.name}</span>
                </Link>
              );
            })}
            {boards.length === 0 && (
              <span className="text-xs text-slate-600 italic block pl-1">No active boards.</span>
            )}
          </div>
        </div>
      )}

      {/* Footer User Info */}
      <div className="border-t border-white/5 pt-4 mt-auto">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold uppercase text-xs">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="max-w-[120px]">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-darkBg overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 glass-card border-r border-darkBorder flex-shrink-0 h-screen sticky top-0">
        <NavigationContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <div className="relative w-64 bg-[#0e0c14] h-full shadow-2xl">
            <button 
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <NavigationContent />
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)}></div>
        </div>
      )}

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 flex-shrink-0 border-b border-darkBorder flex items-center justify-between px-6 bg-darkBg/30 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Folder size={14} />
              <span>Workspace</span>
              <span>/</span>
              <span className="text-slate-300 font-bold">{activeWorkspace?.name || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Command Palette Trigger Button */}
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer min-w-[200px]"
            >
              <Search size={13} />
              <span className="text-left flex-1 text-[11px]">Search or jump to...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] font-mono text-slate-300 select-none">Ctrl+K</kbd>
            </button>

            {/* Notification Trigger Mock */}
            <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-indigo-500 rounded-full"></span>
            </button>

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs uppercase cursor-pointer border border-white/10"
              >
                {user?.name ? user.name[0] : 'U'}
              </button>
              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 rounded-xl glass-card py-2 shadow-xl z-50 border border-darkBorder">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                    </div>
                    <Link 
                      to={`/workspaces/${activeWorkspace?._id}/settings`}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
                    >
                      <User size={13} />
                      Profile Settings
                    </Link>
                    <button 
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-white/5 text-left border-t border-white/5"
                    >
                      <LogOut size={13} />
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Command Palette Overlay */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg glass-card rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[50vh]"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-[#12101a]/30">
                <Search className="text-slate-500 shrink-0" size={18} />
                <input 
                  type="text"
                  autoFocus
                  placeholder="Search actions, pages, and boards..."
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-600"
                />
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 shrink-0">ESC</kbd>
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd, idx) => {
                    const CmdIcon = cmd.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          cmd.action();
                          setIsCommandPaletteOpen(false);
                          setCommandSearch('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-indigo-600/20 hover:text-white transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 text-xs">
                          <CmdIcon size={14} style={{ color: cmd.color }} className={!cmd.color ? 'text-slate-400' : ''} />
                          <span>{cmd.name}</span>
                        </div>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wider">{cmd.category}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500 italic">No commands found.</div>
                )}
              </div>

              {/* Footer Tip */}
              <div className="px-4 py-2 border-t border-white/5 bg-[#12101a]/10 flex justify-between text-[9px] text-slate-500">
                <span>Tip: Press <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-slate-400 select-none">C</kbd> to quick-create card, <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-slate-400 select-none">B</kbd> to create board</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-slate-400 select-none">/</kbd> to search</span>
              </div>
            </motion.div>
            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={() => setIsCommandPaletteOpen(false)}></div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Board Creator Modal */}
      <AnimatePresence>
        {isQuickBoardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md glass-card rounded-xl border border-white/10 shadow-2xl p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Trello size={16} className="text-indigo-400" />
                  Quick Create Board
                </h3>
                <button onClick={() => setIsQuickBoardOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleQuickBoardSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Board Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="E.g. Marketing Launch, Q3 Sprint..."
                    value={quickBoardName}
                    onChange={(e) => setQuickBoardName(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Accent Theme</label>
                  <div className="flex gap-3 items-center">
                    {['#6366F1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setQuickBoardColor(c)}
                        className={`h-5 w-5 rounded-full border-2 transition-all ${
                          quickBoardColor === c ? 'border-white scale-110 shadow-md shadow-white/20' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsQuickBoardOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-white/5 border border-transparent hover:border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={boardCreating || !quickBoardName.trim()}
                    className="glass-button-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    {boardCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    Create Board
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Task Creator Modal */}
      <AnimatePresence>
        {isQuickCardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md glass-card rounded-xl border border-white/10 shadow-2xl p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <PlusCircle size={16} className="text-indigo-400" />
                  Quick Create Task
                </h3>
                <button onClick={() => setIsQuickCardOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
                  <X size={16} />
                </button>
              </div>

              {boards.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 italic">No boards found in this workspace. Please create a board first.</p>
                </div>
              ) : (
                <form onSubmit={handleQuickCardSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target Board</label>
                      <select
                        value={selectedQuickBoardId}
                        onChange={(e) => setSelectedQuickBoardId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {boards.map(b => (
                          <option key={b._id} value={b._id} className="bg-[#12101a]">{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target Column</label>
                      <select
                        value={selectedQuickColId}
                        onChange={(e) => setSelectedQuickColId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Task Title</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Enter task name..."
                      value={quickCardTitle}
                      onChange={(e) => setQuickCardTitle(e.target.value)}
                      className="w-full glass-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Story Points</label>
                      <select
                        value={quickCardPoints}
                        onChange={(e) => setQuickCardPoints(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {[1, 2, 3, 5, 8, 13].map(pt => (
                          <option key={pt} value={pt} className="bg-[#12101a]">{pt} pts</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                      <select
                        value={quickCardPriority}
                        onChange={(e) => setQuickCardPriority(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Low" className="bg-[#12101a]">Low</option>
                        <option value="Medium" className="bg-[#12101a]">Medium</option>
                        <option value="High" className="bg-[#12101a]">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsQuickCardOpen(false)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-white/5 border border-transparent hover:border-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={cardCreating || !quickCardTitle.trim() || !selectedQuickColId}
                      className="glass-button-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                    >
                      {cardCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Create Task
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
