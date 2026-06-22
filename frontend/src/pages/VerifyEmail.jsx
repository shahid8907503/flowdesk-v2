import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLazyVerifyEmailQuery } from '../features/auth/authApi';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [triggerVerify, { data, error, isFetching }] = useLazyVerifyEmailQuery();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (token) {
      triggerVerify(token)
        .unwrap()
        .then((res) => {
          setStatus('success');
          setMsg(res.message);
        })
        .catch((err) => {
          setStatus('error');
          setMsg(err.data?.message || 'Email verification failed.');
        });
    } else {
      setStatus('error');
      setMsg('Invalid or missing verification token.');
    }
  }, [token, triggerVerify]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBg px-6 relative">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative border border-darkBorder shadow-2xl text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <h2 className="text-xl font-bold text-white">Verifying Account</h2>
            <p className="text-sm text-slate-500">Please wait while we activate your account...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Account Verified!</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{msg}</p>
            <Link to="/login" className="glass-button-primary w-full mt-4">
              Proceed to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Verification Failed</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{msg}</p>
            <Link to="/signup" className="glass-button-secondary w-full mt-4">
              Return to Signup
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
