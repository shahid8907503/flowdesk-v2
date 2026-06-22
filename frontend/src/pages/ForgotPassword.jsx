import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../features/auth/authApi';
import { Mail, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await forgotPassword({ email }).unwrap();
      setSuccessMsg(res.message);
    } catch (err) {
      setErrorMsg(err.data?.message || 'Password reset request failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBg px-6 relative">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative border border-darkBorder shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Password</h2>
          <p className="text-sm text-slate-500 mt-1">We will send you instructions to reset your password</p>
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
            <h3 className="font-bold text-white text-sm">Check your Email</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{successMsg}</p>
            <Link to="/login" className="glass-button-secondary w-full mt-4">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-600" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full glass-input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full glass-button-primary mt-6 py-2.5"
            >
              {isLoading ? 'Sending Request...' : 'Send Reset Link'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
