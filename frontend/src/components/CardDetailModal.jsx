import React, { useState, useEffect } from 'react';
import { 
  useGetCardByIdQuery,
  useUpdateCardMutation,
  useStartTimerMutation,
  useStopTimerMutation,
  useAddCommentMutation,
  useAddAttachmentMutation
} from '../features/cards/cardApi';
import { useGetMembersQuery } from '../features/workspaces/workspaceApi';
import { useSocket } from '../context/SocketContext';
import { useGenerateSubtasks } from '../features/analyticsAndOthersApi';
import { 
  X, 
  Clock, 
  Play, 
  Square, 
  MessageSquare, 
  Paperclip, 
  User, 
  Award, 
  AlignLeft, 
  AlertCircle,
  Plus,
  Loader2,
  Sparkles
} from 'lucide-react';

const CardDetailModal = ({ cardId, boardId, onClose, typingUsers = [] }) => {
  const { socket } = useSocket();
  const { data, isLoading, refetch } = useGetCardByIdQuery(cardId);
  const card = data?.card;
  const comments = data?.comments || [];
  const attachments = data?.attachments || [];
  const timeLogs = data?.timeLogs || [];

  const { data: membersData } = useGetMembersQuery(card?.boardId?.workspaceId || card?.boardId, { 
    skip: !card 
  });
  const members = membersData?.members || [];

  const [updateCard] = useUpdateCardMutation();
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();
  const [addComment] = useAddCommentMutation();
  const [addAttachment] = useAddAttachmentMutation();
  const [generateSubtasks, { isLoading: aiGenerating }] = useGenerateSubtasks();

  const [desc, setDesc] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Attachment inputs
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);

  // Ticker for active timer
  const [activeTimerDuration, setActiveTimerDuration] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (card) {
      setDesc(card.description || '');
    }
  }, [card]);

  // Find running timer for current user
  const activeLog = timeLogs.find(log => !log.endTime);

  // Sum up completed sessions durations (seconds)
  const completedSeconds = timeLogs
    .filter(log => log.endTime)
    .reduce((sum, log) => sum + (log.duration || 0), 0);

  useEffect(() => {
    let interval;
    if (activeLog) {
      setIsTimerRunning(true);
      const startMs = new Date(activeLog.startTime).getTime();
      
      const tick = () => {
        const elapsedSeconds = Math.max(0, Math.round((Date.now() - startMs) / 1000));
        setActiveTimerDuration(elapsedSeconds);
      };
      tick(); // run initial
      interval = setInterval(tick, 1000);
    } else {
      setIsTimerRunning(false);
      setActiveTimerDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeLog, timeLogs]);

  const handleDescSave = async () => {
    try {
      await updateCard({ id: cardId, description: desc }).unwrap();
      setIsEditingDesc(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTimerAction = async () => {
    try {
      if (isTimerRunning) {
        await stopTimer({ id: cardId, boardId }).unwrap();
      } else {
        await startTimer({ id: cardId, boardId }).unwrap();
      }
      refetch();
    } catch (err) {
      alert(err.data?.message || 'Timer operation failed.');
    }
  };

  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
    if (socket && boardId && cardId) {
      if (e.target.value.trim().length > 0) {
        socket.emit('typing:start', { boardId, cardId });
      } else {
        socket.emit('typing:stop', { boardId, cardId });
      }
    }
  };

  const handleCommentBlur = () => {
    if (socket && boardId && cardId) {
      socket.emit('typing:stop', { boardId, cardId });
    }
  };

  useEffect(() => {
    return () => {
      if (socket && boardId && cardId) {
        socket.emit('typing:stop', { boardId, cardId });
      }
    };
  }, [socket, boardId, cardId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      if (socket && boardId && cardId) {
        socket.emit('typing:stop', { boardId, cardId });
      }
      await addComment({ cardId, text: commentText }).unwrap();
      setCommentText('');
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiGenerateChecklist = async () => {
    try {
      const res = await generateSubtasks({ cardId }).unwrap();
      const subtasks = res.subtasks || [];
      if (subtasks.length === 0) return;

      const checklistMarkdown = "\n\n### AI Subtasks Checklist:\n" + 
        subtasks.map(s => `- [ ] ${s.title} (${s.storyPoints} SP) - ${s.description}`).join('\n');

      const updatedDesc = (desc ? desc + "\n" : "") + checklistMarkdown;
      await updateCard({ id: cardId, description: updatedDesc }).unwrap();
      setDesc(updatedDesc);
      refetch();
    } catch (err) {
      alert('AI Checklist Generation failed.');
      console.error(err);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      
      await addAttachment({ cardId, data: formData }).unwrap();
      refetch();
    } catch (err) {
      alert('Failed to upload file: ' + (err?.data?.message || err.message));
      console.error(err);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleAssigneeChange = async (memberUserId) => {
    const cardAssignees = card.assignees || [];
    const isAssigned = cardAssignees.some(a => a._id === memberUserId);
    let newAssignees;
    if (isAssigned) {
      newAssignees = cardAssignees.filter(a => a._id !== memberUserId).map(a => a._id);
    } else {
      newAssignees = [...cardAssignees.map(a => a._id), memberUserId];
    }

    try {
      await updateCard({ id: cardId, assignees: newAssignees }).unwrap();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !card) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-4xl glass-card rounded-2xl border border-darkBorder flex flex-col max-h-[90vh] overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header bar */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 flex-shrink-0">
          <h2 className="text-lg font-bold text-white leading-normal truncate max-w-[80%]">{card.title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Modal body scrolling content split to two columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Span 2): Description, Timer, Comments */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Time Tracker Timer Section */}
            <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isTimerRunning ? 'bg-red-500/10 text-red-400 animate-pulse border border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Time logged</h4>
                  <p className="text-lg font-mono font-bold mt-0.5">
                    {formatDuration(completedSeconds + (isTimerRunning ? activeTimerDuration : 0))}
                  </p>
                </div>
              </div>
              <button
                onClick={handleTimerAction}
                className={`py-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  isTimerRunning
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                }`}
              >
                {isTimerRunning ? <Square size={13} fill="white" /> : <Play size={13} fill="white" />}
                {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
              </button>
            </div>

            {/* Description editing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <AlignLeft size={16} />
                  <h3>Description</h3>
                </div>
                <button
                  type="button"
                  disabled={aiGenerating}
                  onClick={handleAiGenerateChecklist}
                  className="flex items-center gap-1.5 text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded px-2.5 py-1 font-bold transition-all cursor-pointer"
                >
                  {aiGenerating ? <Loader2 className="animate-spin" size={10} /> : <Sparkles size={10} />}
                  {aiGenerating ? 'AI Checklist Writing...' : 'AI Subtasks'}
                </button>
              </div>
              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full glass-input h-32 focus:border-indigo-500"
                    placeholder="Write detailed specifications here..."
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsEditingDesc(false)} 
                      className="px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 rounded-md"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDescSave} 
                      className="glass-button-primary py-1.5 px-3.5 text-xs rounded-md"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingDesc(true)}
                  className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-slate-300 text-sm cursor-pointer hover:bg-white/5 min-h-[80px] leading-relaxed transition-all"
                >
                  {desc || <span className="text-slate-600 italic">No description details. Click here to edit.</span>}
                </div>
              )}
            </div>

            {/* Comments block */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-white/5 pb-2 text-sm">
                <MessageSquare size={16} />
                <h3>Comments ({comments.length})</h3>
              </div>

              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  required
                  value={commentText}
                  onChange={handleCommentChange}
                  onBlur={handleCommentBlur}
                  placeholder="Ask a question or write feedback..."
                  className="flex-1 glass-input py-1.5 text-xs"
                />
                <button type="submit" className="glass-button-primary text-xs py-1.5 px-4">
                  Comment
                </button>
              </form>

              {/* Typing indicators */}
              {typingUsers && typingUsers.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 mt-1 italic pl-1">
                  <span className="flex gap-0.5 items-center">
                    <span className="h-1 w-1 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                    <span className="h-1 w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                  </span>
                  <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}

              <div className="space-y-3 mt-4 max-h-60 overflow-y-auto pr-1">
                {comments.map(c => (
                  <div key={c._id} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.userId?.name}</span>
                        <span className="text-slate-500 font-medium">({c.userId?.email})</span>
                      </div>
                      <span className="text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-slate-600 italic pl-1">No comments posted yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Span 1): Settings & Side properties */}
          <div className="space-y-6">
            {/* Assignees panel */}
            <div className="glass-card p-5 rounded-xl space-y-3.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Assignees</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {members.map(m => {
                  const cardAssignees = card.assignees || [];
                  const isAssigned = cardAssignees.some(a => a._id === m.user.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleAssigneeChange(m.user.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left ${
                        isAssigned 
                          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                          : 'hover:bg-white/5 text-slate-400 border border-transparent'
                      }`}
                    >
                      <span className="font-medium truncate">{m.user.name}</span>
                      {isAssigned && <span className="text-[9px] font-bold uppercase">Assigned</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* General card stats */}
            <div className="glass-card p-5 rounded-xl space-y-3.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Properties</h4>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Priority</span>
                  <select
                    value={card.priority}
                    onChange={async (e) => {
                      await updateCard({ id: cardId, priority: e.target.value });
                      refetch();
                    }}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white w-full"
                  >
                    <option value="Low" className="bg-[#12101a]">Low</option>
                    <option value="Medium" className="bg-[#12101a]">Medium</option>
                    <option value="High" className="bg-[#12101a]">High</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Story Points</span>
                  <input
                    type="number"
                    min={0}
                    value={card.storyPoints}
                    onChange={async (e) => {
                      await updateCard({ id: cardId, storyPoints: Number(e.target.value) });
                      refetch();
                    }}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white w-full text-center"
                  />
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="glass-card p-5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Attachments ({attachments.length})</h4>
              
              <div className="space-y-2">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="card-file-upload"
                  disabled={uploadingFile}
                />
                <label 
                  htmlFor="card-file-upload" 
                  className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 border border-dashed border-white/10 hover:border-indigo-500/40 hover:bg-white/10 rounded-xl cursor-pointer transition-all text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="animate-spin text-indigo-500" size={13} />
                      Uploading Attachment...
                    </>
                  ) : (
                    <>
                      <Paperclip size={13} />
                      Choose file to upload
                    </>
                  )}
                </label>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {attachments.map(att => (
                  <div key={att._id} className="p-2 bg-white/5 border border-white/5 rounded-lg space-y-2">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Paperclip size={12} className="shrink-0" />
                      <span className="truncate font-semibold">{att.filename}</span>
                    </a>
                    
                    {/* Render Image Previews inside the card details */}
                    {att.mimeType?.startsWith('image/') && (
                      <div className="rounded overflow-hidden border border-white/5 max-w-[150px] relative group">
                        <img 
                          src={att.url} 
                          alt={att.filename} 
                          className="w-full h-auto object-cover max-h-[100px] rounded transition-transform group-hover:scale-105" 
                        />
                      </div>
                    )}
                    
                    {/* Render PDF indications */}
                    {att.mimeType?.includes('pdf') && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pl-4 font-mono bg-white/[0.01] py-1 rounded">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                        PDF Document
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
