import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { useGetBoardByIdQuery, useUpdateBoardMutation, useDeleteBoardMutation } from '../features/boards/boardApi';
import { useCreateCardMutation, useMoveCardMutation } from '../features/cards/cardApi';
import { useSocket } from '../context/SocketContext';
import { useGenerateSprintPlan } from '../features/analyticsAndOthersApi';
import CardDetailModal from '../components/CardDetailModal';
import { 
  Trello, 
  Plus, 
  Calendar, 
  Award, 
  Clock, 
  User, 
  Search, 
  Filter, 
  Loader2,
  ChevronLeft,
  Settings,
  Sparkles,
  X,
  Trash2
} from 'lucide-react';

const formatShortDuration = (seconds) => {
  if (!seconds) return '0s';
  const hrs = Math.max(0, Math.floor(seconds / 3600));
  const mins = Math.max(0, Math.floor((seconds % 3600) / 60));
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m`;
  }
  return `${seconds}s`;
};

const triggerConfetti = () => {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
  const particles = Array.from({ length: 120 }).map(() => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 100,
    r: Math.random() * 6 + 4,
    d: Math.random() * colors.length,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: Math.random() * 6 - 3,
    vy: Math.random() * 5 + 4,
    rotation: Math.random() * 360,
    rotationSpeed: Math.random() * 8 - 4
  }));

  const renderConfetti = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      if (p.y < canvas.height) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      }
    });

    if (active) {
      requestAnimationFrame(renderConfetti);
    } else {
      document.body.removeChild(canvas);
    }
  };

  renderConfetti();
};

const BoardView = () => {
  const params = useParams();
  const { boardId, workspaceId } = params;
  const { socket, joinBoard, leaveBoard } = useSocket();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const [deleteBoard, { isLoading: isDeleting }] = useDeleteBoardMutation();

  const handleDeleteBoard = async () => {
    if (!window.confirm('Are you sure you want to delete this board? All columns and cards inside will be permanently deleted.')) return;
    try {
      await deleteBoard(boardId).unwrap();
      navigate(`/workspaces/${workspaceId}/dashboard`);
    } catch (err) {
      alert(err.data?.message || 'Failed to delete board.');
    }
  };

  const [activeCardId, setActiveCardId] = useState(null);
  
  // Real-time collaboration states
  const [activeMembers, setActiveMembers] = useState([]);
  const [peerCursors, setPeerCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  // AI Sprint Planner States
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [sprintPlanText, setSprintPlanText] = useState('');
  const [generateSprintPlan, { isLoading: isPlanning }] = useGenerateSprintPlan();

  const handleGenerateSprintPlan = async () => {
    try {
      setIsSprintModalOpen(true);
      setSprintPlanText('');
      const res = await generateSprintPlan({ boardId }).unwrap();
      setSprintPlanText(res.sprintPlan || '');
    } catch (err) {
      alert('Failed to generate AI Sprint Plan');
      setIsSprintModalOpen(false);
    }
  };

  // Socket rooms & presence/collaborative event listeners
  useEffect(() => {
    if (socket) {
      const handlePresenceUpdate = (users) => {
        setActiveMembers(users);
      };
      socket.on('presence:update', handlePresenceUpdate);

      const handleCursorUpdate = (data) => {
        const { userId, name, x, y } = data;
        setPeerCursors(prev => ({
          ...prev,
          [userId]: { name, x, y, lastActive: Date.now() }
        }));
      };
      socket.on('cursor:update', handleCursorUpdate);

      const handleTypingUpdate = (data) => {
        const { cardId, name, isTyping } = data;
        setTypingUsers(prev => {
          const currentList = prev[cardId] || [];
          let newList;
          if (isTyping) {
            newList = currentList.includes(name) ? currentList : [...currentList, name];
          } else {
            newList = currentList.filter(n => n !== name);
          }
          return { ...prev, [cardId]: newList };
        });
      };
      socket.on('typing:update', handleTypingUpdate);

      const cursorInterval = setInterval(() => {
        const now = Date.now();
        setPeerCursors(prev => {
          const clean = {};
          Object.keys(prev).forEach(k => {
            if (now - prev[k].lastActive < 4000) {
              clean[k] = prev[k];
            }
          });
          return clean;
        });
      }, 2000);

      return () => {
        socket.off('presence:update', handlePresenceUpdate);
        socket.off('cursor:update', handleCursorUpdate);
        socket.off('typing:update', handleTypingUpdate);
        clearInterval(cursorInterval);
      };
    }
  }, [socket]);

  const handleMouseMove = (e) => {
    if (socket && boardId) {
      const boardContainer = document.getElementById('kanban-board-container');
      if (boardContainer) {
        const rect = boardContainer.getBoundingClientRect();
        const relativeX = (e.clientX - rect.left) / rect.width;
        const relativeY = (e.clientY - rect.top) / rect.height;
        socket.emit('cursor:move', { boardId, x: relativeX, y: relativeY });
      }
    }
  };

  // Adding cards states
  const [addingCardColId, setAddingCardColId] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  // Fetch Board details
  const { data, isLoading, refetch: refetchBoard } = useGetBoardByIdQuery(boardId);
  const board = data?.board;
  const columns = data?.columns || [];

  const [moveCard] = useMoveCardMutation();
  const [createCard] = useCreateCardMutation();

  // Socket rooms listener
  useEffect(() => {
    if (boardId) {
      joinBoard(boardId);
    }
    return () => {
      if (boardId) {
        leaveBoard(boardId);
      }
    };
  }, [boardId, joinBoard, leaveBoard]);

  // Live Socket Board reload
  useEffect(() => {
    if (socket) {
      const handleSocketEvent = (event) => {
        refetchBoard();
      };
      socket.on('board_change', handleSocketEvent);
      return () => {
        socket.off('board_change', handleSocketEvent);
      };
    }
  }, [socket, refetchBoard]);

  // Handle Drag drop reorder logic
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    try {
      // Optimistic move
      await moveCard({
        id: draggableId,
        columnId: destination.droppableId,
        position: destination.index
      }).unwrap();

      // Check if entering a "Done" column to fire confetti
      const destCol = columns.find(col => col._id === destination.droppableId);
      if (destCol && (destCol.name.toLowerCase().includes('done') || destCol.name.toLowerCase().includes('completed') || destCol.name.toLowerCase().includes('finish'))) {
        triggerConfetti();
      }

      refetchBoard();
    } catch (err) {
      console.error('Failed to move card:', err);
    }
  };

  const handleCreateCardSubmit = async (e, columnId) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    try {
      await createCard({
        columnId,
        boardId,
        title: newCardTitle,
        priority: 'Medium',
        storyPoints: 1
      }).unwrap();
      setNewCardTitle('');
      setAddingCardColId(null);
      refetchBoard();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter logic
  const filteredColumns = columns.map(col => {
    const cards = col.cards.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
    return { ...col, cards };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-red-400">Board not found</h2>
        <Link to={`/workspaces/${workspaceId}/dashboard`} className="text-indigo-400 hover:underline mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div id="kanban-board-container" onMouseMove={handleMouseMove} className="flex flex-col h-[calc(100vh-100px)] overflow-hidden space-y-6 relative">
      {/* Board Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/workspaces/${workspaceId}/dashboard`} className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </Link>
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: board.color }} />
          <h1 className="text-2xl font-bold text-white">{board.name}</h1>

          {/* Active Presence Users Bubble List */}
          {activeMembers.length > 0 && (
            <div className="flex items-center gap-1.5 ml-4 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex -space-x-1.5 overflow-hidden">
                {activeMembers.map(m => (
                  <div
                    key={m.socketId}
                    title={`${m.name} is viewing this board`}
                    className="h-5 w-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 border border-[#09090B] flex items-center justify-center text-[8px] font-black uppercase text-white shadow-sm"
                  >
                    {m.name[0]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search & Filter tools */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 text-slate-600" size={14} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-9 text-xs w-full sm:w-48 py-1.5"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
            >
              <option value="All" className="bg-[#12101a]">All Priorities</option>
              <option value="Low" className="bg-[#12101a]">Low</option>
              <option value="Medium" className="bg-[#12101a]">Medium</option>
              <option value="High" className="bg-[#12101a]">High</option>
            </select>
          </div>

          <button
            onClick={handleGenerateSprintPlan}
            className="flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg py-1.5 px-3 font-bold transition-all cursor-pointer shrink-0"
          >
            <Sparkles size={13} />
            AI Plan Sprint
          </button>

          <button
            onClick={handleDeleteBoard}
            disabled={isDeleting}
            className="flex items-center gap-1.5 text-xs bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg py-1.5 px-3 font-bold transition-all cursor-pointer shrink-0"
          >
            {isDeleting ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
            Delete Board
          </button>
        </div>
      </div>

      {/* Columns & Drag context */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4 flex gap-4 items-start select-none">
          {filteredColumns.map((col) => (
            <div key={col._id} className="kanban-column">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3.5 px-1 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">{col.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-500 font-medium">
                    {col.cards.length}
                  </span>
                </div>
                {board.workspaceId?.myRole !== 'Viewer' && (
                  <button 
                    onClick={() => setAddingCardColId(addingCardColId === col._id ? null : col._id)}
                    className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Add card field inline */}
              {addingCardColId === col._id && (
                <form onSubmit={(e) => handleCreateCardSubmit(e, col._id)} className="mb-3">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Task title..."
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    className="w-full glass-input py-1.5 text-xs mb-2"
                  />
                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button" 
                      onClick={() => setAddingCardColId(null)}
                      className="px-2.5 py-1 rounded text-[10px] text-slate-400 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="glass-button-primary py-1 px-2.5 text-[10px]"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {/* Cards List Droppable container */}
              <Droppable droppableId={col._id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[100px]"
                  >
                    {col.cards.map((card, index) => {
                      const priorityColor = {
                        High: 'text-red-400 bg-red-400/10 border border-red-500/20',
                        Medium: 'text-amber-400 bg-amber-400/10 border border-amber-500/20',
                        Low: 'text-slate-400 bg-slate-400/10 border border-slate-500/20'
                      }[card.priority] || 'text-slate-400';

                      return (
                        <Draggable key={card._id} draggableId={card._id} index={index}>
                          {(provided, snapshot) => (
                            <motion.div
                              layout
                              layoutId={card._id}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 40,
                                mass: 0.8
                              }}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setActiveCardId(card._id)}
                              className={`p-3.5 rounded-lg border bg-[#12101a]/70 hover:bg-[#12101a] transition-all cursor-pointer select-none space-y-3 ${
                                snapshot.isDragging 
                                  ? 'border-indigo-500 shadow-2xl rotate-1 scale-102 bg-[#12101a]' 
                                  : 'border-white/5'
                              }`}
                            >
                              {/* Title */}
                              <h4 className="text-xs font-semibold leading-normal text-white group-hover:text-indigo-400">{card.title}</h4>

                              {/* Badges bar */}
                              <div className="flex flex-wrap gap-2 items-center text-[9px] text-slate-500 font-medium">
                                <span className={`px-2 py-0.5 rounded ${priorityColor}`}>
                                  {card.priority}
                                </span>
                                {card.storyPoints > 0 && (
                                  <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    <Award size={10} />
                                    {card.storyPoints} pt
                                  </span>
                                )}
                                {card.dueDate && (
                                  <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    <Calendar size={10} />
                                    {new Date(card.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                {(card.totalDuration > 0 || card.isTimerRunning) && (
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${
                                    card.isTimerRunning 
                                      ? 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse font-bold' 
                                      : 'bg-white/5 border-white/5 text-slate-400'
                                  }`}>
                                    <Clock size={10} className={card.isTimerRunning ? 'animate-spin' : ''} />
                                    <span>{card.isTimerRunning ? 'Running' : formatShortDuration(card.totalDuration)}</span>
                                  </span>
                                )}
                              </div>

                              {/* Assignees list & Timers */}
                              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                                <div className="flex -space-x-1.5 overflow-hidden">
                                  {(card.assignees || []).map(a => (
                                    <div 
                                      key={a._id} 
                                      title={a.name}
                                      className="h-5 w-5 rounded-full bg-violet-600 border border-[#12101a] flex items-center justify-center text-[9px] font-bold uppercase text-white"
                                    >
                                      {a.name[0]}
                                    </div>
                                  ))}
                                  {(card.assignees || []).length === 0 && (
                                    <span className="text-[9px] text-slate-700 italic">Unassigned</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Card detail view modal Overlay */}
      {activeCardId && (
        <CardDetailModal 
          cardId={activeCardId} 
          boardId={boardId}
          onClose={() => {
            setActiveCardId(null);
            refetchBoard();
          }} 
          typingUsers={typingUsers[activeCardId] || []}
        />
      )}

      {/* AI Sprint Planner Modal */}
      {isSprintModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-card rounded-2xl border border-white/10 flex flex-col max-h-[80vh] shadow-2xl p-6 relative">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                FlowDesk AI Sprint Planner
              </h2>
              <button 
                onClick={() => setIsSprintModalOpen(false)}
                className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 text-slate-300 text-xs leading-relaxed space-y-4">
              {isPlanning ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                  <span className="text-slate-500 font-semibold italic">Gemini AI is analyzing sprint backlogs...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-sans prose prose-invert max-w-none">
                  {sprintPlanText || 'No sprint information generated.'}
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4 border-t border-white/5 mt-4">
              <button 
                onClick={() => setIsSprintModalOpen(false)}
                className="glass-button-secondary py-1.5 px-4 text-xs font-semibold"
              >
                Close Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Peer Cursors */}
      {Object.keys(peerCursors).map(peerId => {
        const peer = peerCursors[peerId];
        const boardContainer = document.getElementById('kanban-board-container');
        if (!boardContainer) return null;
        const rect = boardContainer.getBoundingClientRect();
        const pixelX = peer.x * rect.width;
        const pixelY = peer.y * rect.height;

        return (
          <div 
            key={peerId}
            className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
            style={{ left: `${pixelX}px`, top: `${pixelY}px` }}
          >
            <svg className="h-4 w-4 text-indigo-500 fill-current drop-shadow-md" viewBox="0 0 24 24">
              <path d="M4.5 3V17.5L9.2 13L13.8 21.5L16.8 19.8L12.2 11.5L18.5 11.5L4.5 3Z" />
            </svg>
            <span className="absolute left-3 top-3 px-1.5 py-0.5 bg-indigo-600/90 text-[8px] font-bold text-white rounded border border-indigo-400/30 whitespace-nowrap shadow-md">
              {peer.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BoardView;
