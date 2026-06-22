import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignupMutation } from '../features/auth/authApi';
import { User, Mail, Lock, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [signup, { isLoading }] = useSignupMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      const res = await signup({ name, email, password, confirmPassword }).unwrap();
      setSuccessMsg(res.message);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.data?.message || 'Registration failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBg px-6 relative">
      <div className="absolute w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative border border-darkBorder shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 items-center justify-center shadow-md mb-4">
            <span className="font-extrabold text-white text-base">F</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Account</h2>
          <p className="text-sm text-slate-500 mt-1">Get started with your FlowDesk workspace</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center text-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-white text-sm">Verify your Email</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{successMsg}</p>
            <Link to="/login" className="glass-button-secondary w-full mt-4">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-600" size={16} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full glass-input pl-10"
                />
              </div>
            </div>

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

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Password</label>
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
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Confirm Password</label>
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
              {isLoading ? 'Creating Account...' : 'Get Started'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {!successMsg && (
          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Signup;
