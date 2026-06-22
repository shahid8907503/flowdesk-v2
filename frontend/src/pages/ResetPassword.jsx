import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useResetPasswordMutation } from '../features/auth/authApi';
import { Lock, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token) {
      setErrorMsg('Invalid or missing password reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      const res = await resetPassword({ token, password }).unwrap();
      setSuccessMsg(res.message);
    } catch (err) {
      setErrorMsg(err.data?.message || 'Password reset failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBg px-6 relative">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative border border-darkBorder shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">Choose New Password</h2>
          <p className="text-sm text-slate-500 mt-1">Please enter a new strong password below</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs">
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center text-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-white text-sm">Reset Successful</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{successMsg}</p>
            <Link to="/login" className="glass-button-primary w-full mt-4">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-600" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (Min. 8 characters)"
                  className="w-full glass-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-600" size={16} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass-input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full glass-button-primary mt-6 py-2.5"
            >
              {isLoading ? 'Resetting Password...' : 'Save Password'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
