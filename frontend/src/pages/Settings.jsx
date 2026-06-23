import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useEnable2faMutation, 
  useDisable2faMutation, 
  useGetSessionsQuery, 
  useRevokeSessionMutation 
} from '../features/auth/authApi';
import { 
  useGetWorkspacesQuery, 
  useDeleteWorkspaceMutation 
} from '../features/workspaces/workspaceApi';
import { updateUser } from '../features/auth/authSlice';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  User, 
  Settings as SettingsIcon, 
  Clipboard, 
  Check, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Shield, 
  Loader2, 
  Trash2 
} from 'lucide-react';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account');
  const [copied, setCopied] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  
  const [enable2fa, { isLoading: enabling }] = useEnable2faMutation();
  const [disable2fa, { isLoading: disabling }] = useDisable2faMutation();
  
  // Workspaces queries for deletion
  const { data: wsData } = useGetWorkspacesQuery(undefined, { skip: !user });
  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation();

  const workspaces = wsData?.workspaces || [];
  const activeWs = workspaces.find(w => w._id === workspaceId);
  const isOwner = activeWs?.owner?._id === user?._id || activeWs?.owner === user?._id;

  // Device sessions API
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useGetSessionsQuery();
  const [revokeSession] = useRevokeSessionMutation();
  const [revokingId, setRevokingId] = useState(null);

  const [profileName, setProfileName] = useState(user?.name || '');

  const handleToggle2FA = async () => {
    try {
      if (user.isTwoFactorEnabled) {
        await disable2fa().unwrap();
        dispatch(updateUser({ isTwoFactorEnabled: false }));
        setBackupCodes([]);
      } else {
        const res = await enable2fa().unwrap();
        dispatch(updateUser({ isTwoFactorEnabled: true }));
        setBackupCodes(res.backupCodes || []);
      }
    } catch (err) {
      alert('Error updating 2FA settings.');
    }
  };

  const handleRevokeSession = async (id) => {
    try {
      setRevokingId(id);
      await revokeSession(id).unwrap();
    } catch (err) {
      alert('Failed to revoke session: ' + (err?.data?.message || err.message));
    } finally {
      setRevokingId(null);
    }
  };

  const copyCodes = () => {
    if (backupCodes.length === 0) return;
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'smartphone':
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'desktop':
        return Laptop;
      default:
        return Shield;
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWs) return;
    const confirmDelete = window.confirm(
      `WARNING: Are you sure you want to delete the workspace "${activeWs.name}"? This action is permanent and will delete all associated boards, tasks, comments, time logs, and members.`
    );
    if (!confirmDelete) return;

    try {
      await deleteWorkspace(activeWs._id).unwrap();
      alert('Workspace deleted successfully.');
      // Find another workspace to redirect to, or just go to /dashboard
      const remainingWorkspaces = workspaces.filter(w => w._id !== activeWs._id);
      if (remainingWorkspaces.length > 0) {
        localStorage.setItem('lastWorkspaceId', remainingWorkspaces[0]._id);
        navigate(`/workspaces/${remainingWorkspaces[0]._id}/dashboard`);
      } else {
        localStorage.removeItem('lastWorkspaceId');
        navigate('/dashboard');
      }
    } catch (err) {
      alert('Failed to delete workspace: ' + (err?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {activeTab === 'account' ? 'Settings' : 'Workspace Settings'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {activeTab === 'account' 
            ? 'Configure profile details, two-factor authentication (2FA), and active device sessions.'
            : `Manage details and administration for workspace "${activeWs?.name || ''}".`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left menu selection */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full text-left text-xs font-semibold py-2.5 px-3 rounded-lg border-l-2 transition-all ${
              activeTab === 'account' 
                ? 'bg-white/5 text-white border-indigo-500' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02] border-transparent'
            }`}
          >
            Account & Security
          </button>
          {activeWs && (
            <button 
              onClick={() => setActiveTab('workspace')}
              className={`w-full text-left text-xs font-semibold py-2.5 px-3 rounded-lg border-l-2 transition-all ${
                activeTab === 'workspace' 
                  ? 'bg-white/5 text-white border-indigo-500' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02] border-transparent'
              }`}
            >
              Workspace Administration
            </button>
          )}
        </div>

        {/* Right content panels */}
        <div className="md:col-span-2 space-y-8">
          
          {activeTab === 'account' && (
            <>
              {/* Panel 1: Profile Details */}
              <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
                <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
                  <User size={16} className="text-indigo-400" />
                  Profile Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full glass-input bg-white/[0.01] border-white/5 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Full Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="flex-1 glass-input"
                      />
                      <button 
                        onClick={() => {
                          dispatch(updateUser({ name: profileName }));
                          alert('Name updated (mocked local save)');
                        }}
                        className="glass-button-primary py-1.5 px-4"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 2: 2FA Authentication */}
              <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
                <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
                  <Key size={16} className="text-indigo-400" />
                  Two-Factor Authentication (2FA)
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white">Email One-Time Passwords (OTP)</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Require a 6-digit OTP code sent to your email during login</p>
                    </div>
                    <button
                      onClick={handleToggle2FA}
                      disabled={enabling || disabling}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        user?.isTwoFactorEnabled
                          ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                          : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/10'
                      }`}
                    >
                      {user?.isTwoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                  </div>

                  {/* Display Backup codes */}
                  {backupCodes.length > 0 && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck size={14} />
                          Backup Recovery Codes
                        </h4>
                        <button 
                          onClick={copyCodes}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Clipboard size={12} />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Save these backup codes in a safe place. You can use these codes if you lose access to your verification email.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/40 p-3 rounded-lg border border-white/5">
                        {backupCodes.map((code, idx) => (
                          <span key={idx} className="text-white text-center">{code}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Panel 3: Active Device Sessions */}
              <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Laptop size={16} className="text-indigo-400" />
                    Active Device Sessions
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Manage and revoke your active sessions on other browsers or devices.
                  </p>
                </div>

                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                    <span className="text-xs">Loading active sessions...</span>
                  </div>
                ) : sessionsError ? (
                  <div className="text-xs text-red-400 py-2">
                    Failed to load active device sessions.
                  </div>
                ) : sessionsData?.sessions?.length === 0 ? (
                  <div className="text-xs text-slate-500 py-2">
                    No active sessions found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessionsData.sessions.map((session) => {
                      const DeviceIcon = getDeviceIcon(session.deviceType);
                      return (
                        <div 
                          key={session._id} 
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            session.isCurrent 
                              ? 'bg-indigo-600/5 border-indigo-500/20' 
                              : 'bg-white/5 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-lg ${
                              session.isCurrent ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-slate-400'
                            }`}>
                              <DeviceIcon size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white font-sans">
                                  {session.browser} on {session.os}
                                </span>
                                {session.isCurrent && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-sans">
                                <span>IP: {session.ipAddress}</span>
                                <span>•</span>
                                <span>
                                  {session.isCurrent 
                                    ? 'Active now' 
                                    : `Last active: ${new Date(session.lastActive).toLocaleString()}`
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          {!session.isCurrent && (
                            <button
                              onClick={() => handleRevokeSession(session._id)}
                              disabled={revokingId === session._id}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
                              title="Revoke session"
                            >
                              {revokingId === session._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'workspace' && activeWs && (
            <div className="space-y-8">
              {/* Workspace General Info */}
              <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
                <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
                  <SettingsIcon size={16} className="text-indigo-400" />
                  Workspace Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Workspace Name</label>
                    <input
                      type="text"
                      disabled
                      value={activeWs.name}
                      className="w-full glass-input bg-white/[0.01] border-white/5 text-slate-300 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Description</label>
                    <textarea
                      disabled
                      value={activeWs.description || 'No description provided.'}
                      className="w-full glass-input bg-white/[0.01] border-white/5 text-slate-400 cursor-not-allowed h-24 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">My Role</span>
                      <span className="text-xs font-semibold text-white bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md inline-block">
                        {activeWs.myRole}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Owner</span>
                      <span className="text-xs text-slate-300 block font-medium mt-1">
                        {activeWs.owner?.name || 'Loading owner...'} ({activeWs.owner?.email || 'N/A'})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="glass-card p-6 rounded-xl border border-red-500/10 bg-red-950/5 space-y-6">
                <h3 className="font-bold text-sm text-red-400 flex items-center gap-2 border-b border-red-500/10 pb-3">
                  <ShieldAlert size={16} className="text-red-400" />
                  Danger Zone
                </h3>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">Delete Workspace</h4>
                      <p className="text-[10px] text-slate-400 leading-normal max-w-md">
                        Permanently delete this workspace and all its content, including boards, lists, tasks, comments, time logs, and files. This action cannot be undone.
                      </p>
                    </div>

                    <button
                      onClick={handleDeleteWorkspace}
                      disabled={!isOwner || isDeleting}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
                        isOwner
                          ? 'bg-red-600 border-red-500 text-white hover:bg-red-500 shadow-md shadow-red-600/10 cursor-pointer'
                          : 'bg-red-950/10 border-red-950/20 text-red-900 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Workspace'}
                    </button>
                  </div>
                  {!isOwner && (
                    <p className="text-[10px] text-amber-500/80 italic">
                      * You are not the owner of this workspace. Only the workspace owner ({activeWs.owner?.name || 'Owner'}) can perform this action.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
