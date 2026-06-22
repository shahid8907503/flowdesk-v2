import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useVerify2faMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';

const Otp2fa = () => {
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [verify2fa, { isLoading }] = useVerify2faMutation();

  const email = location.state?.email;

  // Prevent direct entry without login redirection context
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg px-6">
        <div className="w-full max-w-md glass-card rounded-2xl p-8 text-center border border-darkBorder">
          <p className="text-red-400 font-bold mb-4">Direct Access Denied</p>
          <Link to="/login" className="glass-button-primary w-full">Go to Login</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await verify2fa({ email, otp }).unwrap();
      dispatch(setCredentials({ user: res.user, token: res.accessToken }));
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.data?.message || 'Invalid OTP code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBg px-6 relative">
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative border border-darkBorder shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-10 w-10 rounded-xl bg-indigo-500/15 items-center justify-center border border-indigo-500/20 text-indigo-400 mb-4 shadow-md">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Enter 2FA Code</h2>
          <p className="text-sm text-slate-500 mt-1">We emailed a 6-digit OTP code to {email}</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Verification Code</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              className="w-full glass-input text-center text-2xl tracking-[10px] py-3 font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full glass-button-primary mt-6 py-2.5"
          >
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Didn't receive code?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Try Resending from Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Otp2fa;
