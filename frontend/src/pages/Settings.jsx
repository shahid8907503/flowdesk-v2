import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  useEnable2faMutation, 
  useDisable2faMutation, 
  useGetSessionsQuery, 
  useRevokeSessionMutation 
} from '../features/auth/authApi';
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

  const [copied, setCopied] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  
  const [enable2fa, { isLoading: enabling }] = useEnable2faMutation();
  const [disable2fa, { isLoading: disabling }] = useDisable2faMutation();
  
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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Workspace Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure profile details, two-factor authentication (2FA), and active device sessions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left menu selection */}
        <div className="md:col-span-1 space-y-1">
          <button className="w-full text-left text-xs font-semibold py-2 px-3 bg-white/5 rounded-lg text-white border-l-2 border-indigo-500">
            Account & Security
          </button>
        </div>

        {/* Right content panels */}
        <div className="md:col-span-2 space-y-8">
          
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

        </div>
      </div>
    </div>
  );
};

export default Settings;
