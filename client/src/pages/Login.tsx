import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';

export default function Login() {
    const { setAuth } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@secure.com');
    const [password, setPassword] = useState('password123');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [requiresOtp, setRequiresOtp] = useState(false);
    const [userId, setUserId] = useState('');
    const [debugOtp, setDebugOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (requiresOtp && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [requiresOtp, timer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const { data } = await authApi.login({ email, password });

            if (data.requiresOtp) {
                setRequiresOtp(true);
                setUserId(data.userId);
                setDebugOtp(data.otp || '');
                setError('');
            } else {
                setAuth(data.user, data.token);
                navigate('/');
            }
        } catch (err: any) {
            const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
            if (apiMsg) {
                setError(apiMsg);
                return;
            }

            const isNetworkError = err?.code === 'ERR_NETWORK' || String(err?.message || '').toLowerCase().includes('network');
            if (isNetworkError) {
                setError('API server not reachable. Start the server at http://localhost:3000 and try again.');
                return;
            }

            setError('Login failed. Check credentials.');
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const { data } = await authApi.verifyOtp({ userId, otp });
            setAuth(data.user, data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid or expired OTP');
        }
    };

    const handleResendOtp = async () => {
        setCanResend(false);
        setTimer(60);
        setDebugOtp('');
        setError('');

        try {
            const { data } = await authApi.login({ email, password });
            if (data.otp) setDebugOtp(data.otp);
        } catch (err: any) {
            setError('Failed to resend OTP');
            setCanResend(true);
        }
    };

    const step = requiresOtp ? 2 : 1;
    const progressClass = requiresOtp ? 'w-full' : 'w-1/2';

    return (
        <div className="min-h-screen w-full bg-background-light text-slate-900 dark:bg-background-dark dark:text-slate-100 flex flex-col font-display antialiased">
            <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 text-primary flex items-center justify-center bg-primary/10 rounded-lg">
                        <span className="material-symbols-outlined text-2xl">shield_lock</span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight">SecureShare</h2>
                </div>
                <div className="hidden sm:flex gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Don't have an account?</span>
                    <Link className="font-semibold text-primary hover:underline" to="/register">Sign up</Link>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div
                        className="h-32 w-full bg-cover bg-center relative"
                        style={{
                            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCTdmzzlihtEg9GHWvAzgMt5DzqplPSz513dXHqAov1I_CN-0eXGVufg6va42LhJfU7Q59aXjAL_oEpHpwg6IgXA6OGevNK0whX2arXCCmvWjLOOYOnagBc1xZ7bFrE0fTGnqAOZjCTy7nqmrd0GgMs1oC1zjvDu5tX2p9pvfwiCpdf1b0XFCPCBPxUzkgvLy6YVW6h_B_iyyvrO45d8EsJPfvHk3wpmCXnrfy9zYeaMjwUBaf8CA0mbod4taMKk-WuzqxXfmAAnJuT')"
                        }}
                        aria-label="Abstract blue gradient geometric pattern"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                            <h1 className="text-white text-2xl font-bold tracking-tight">
                                {requiresOtp ? 'Verify access' : 'Welcome back'}
                            </h1>
                            <p className="text-white/90 text-sm font-medium">
                                {requiresOtp ? 'Enter your one-time passcode' : 'Securely access your documents'}
                            </p>
                        </div>
                    </div>

                    <div className="px-6 pt-6 pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {requiresOtp ? 'Verify OTP' : 'Sign in'}
                            </span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Step {step} of 2</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-primary ${progressClass} rounded-full`}></div>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col gap-5">
                        {!requiresOtp ? (
                            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/30 p-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 material-symbols-outlined text-[20px]">mail</span>
                                        <input
                                            className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            id="email"
                                            placeholder="name@company.com"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                                            Password
                                        </label>
                                        <a className="text-xs font-medium text-primary hover:text-primary/80 transition-colors" href="#">
                                            Forgot password?
                                        </a>
                                    </div>
                                    <div className="relative group">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 material-symbols-outlined text-[20px]">lock</span>
                                        <input
                                            className="w-full h-12 pl-10 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            id="password"
                                            placeholder="Enter your password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-col gap-4">
                                    <button className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all flex items-center justify-center gap-2 group" type="submit">
                                        Next
                                        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form className="flex flex-col gap-5" onSubmit={handleOtpSubmit}>
                                {error && (
                                    <div className="bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/30 p-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        A 6-digit OTP has been sent to <strong className="text-primary">{email}</strong>
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Valid for 2 minutes</p>
                                    {debugOtp && (
                                        <p className="text-xs text-amber-500 dark:text-amber-300 mt-2">
                                            Debug OTP: <strong>{debugOtp}</strong>
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="otp">
                                        Enter OTP
                                    </label>
                                    <input
                                        className="w-full h-12 text-center text-2xl tracking-widest rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        id="otp"
                                        placeholder="000000"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        autoFocus
                                    />
                                </div>

                                <button
                                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                    type="submit"
                                    disabled={otp.length !== 6}
                                >
                                    Verify OTP
                                </button>

                                <div className="text-center mt-2">
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            className="text-sm text-primary font-semibold hover:underline"
                                        >
                                            Resend OTP
                                        </button>
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            Resend OTP in <span className="font-medium text-slate-700">{timer}s</span>
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setRequiresOtp(false);
                                        setOtp('');
                                        setDebugOtp('');
                                        setError('');
                                    }}
                                    className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                                >
                                    &larr; Back to Login
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="sm:hidden px-6 pb-6 text-center">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Don't have an account?</span>
                        <Link className="text-sm font-semibold text-primary ml-1" to="/register">Sign up</Link>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 text-center border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <span className="material-symbols-outlined text-[14px]">lock</span>
                            <span>Your data is end-to-end encrypted</span>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-6 text-center">
                <div className="flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <a className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors" href="#">Privacy Policy</a>
                    <a className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors" href="#">Terms of Service</a>
                    <a className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors" href="#">Help Center</a>
                </div>
                <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-600">
                    © 2024 SecureShare Inc. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
