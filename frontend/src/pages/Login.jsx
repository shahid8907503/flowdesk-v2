import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useGoogleLoginMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await login({ email, password }).unwrap();

      if (res.twoFactorRequired) {
        // Redirect to 2FA page, passing email context
        navigate('/verify-2fa', { state: { email } });
      } else {
        // Standard login success
        dispatch(setCredentials({ user: res.user, token: res.accessToken }));
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.data?.message || 'Login failed. Please check credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const res = await googleLogin(idToken).unwrap();
      
      dispatch(setCredentials({ user: res.user, token: res.accessToken }));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.data?.message || err.message || 'Google Sign-In failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBg px-6 relative">
      {/* Glow effect */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-accentColor/5 blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative border border-darkBorder shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-10 w-10 rounded-xl bg-gradient-to-tr from-accentColor to-accentViolet items-center justify-center shadow-md mb-4">
            <span className="font-extrabold text-white text-base">F</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage your FlowDesk boards</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs leading-relaxed">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-400">Password</label>
              <Link to="/forgot-password" className="text-xs text-accentColor hover:text-accentColor/80">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-600" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full glass-button-primary mt-6 py-2.5"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative px-3 text-[10px] uppercase font-bold text-slate-500 bg-[#0E1015] rounded-full">Or continue with</span>
        </div>

        <button
          type="button"
          disabled={isLoading || isGoogleLoading}
          onClick={handleGoogleSignIn}
          className="w-full glass-button-secondary py-2.5 flex items-center justify-center gap-2 text-xs font-semibold"
        >
          {isGoogleLoading ? (
            <span className="text-slate-400">Connecting Google...</span>
          ) : (
            <>
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#D97706"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#D97706" opacity="0.8"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#D97706" opacity="0.6"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#D97706" opacity="0.9"/>
              </svg>
              <span>Google Account</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accentColor hover:text-accentColor/80 font-semibold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
