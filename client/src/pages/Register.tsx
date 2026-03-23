import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    pan: '',
    aadhaar: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Exclude confirmPassword before sending to API
    const { confirmPassword, ...dataToSend } = formData;

    try {
      await authApi.register(dataToSend);
      navigate('/login');
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

      setError('Registration failed');
    }
  };

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
          <span>Already have an account?</span>
          <Link className="font-semibold text-primary hover:underline" to="/login">Sign in</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[560px] bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div
            className="h-28 w-full bg-cover bg-center relative"
            style={{
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCTdmzzlihtEg9GHWvAzgMt5DzqplPSz513dXHqAov1I_CN-0eXGVufg6va42LhJfU7Q59aXjAL_oEpHpwg6IgXA6OGevNK0whX2arXCCmvWjLOOYOnagBc1xZ7bFrE0fTGnqAOZjCTy7nqmrd0GgMs1oC1zjvDu5tX2p9pvfwiCpdf1b0XFCPCBPxUzkgvLy6YVW6h_B_iyyvrO45d8EsJPfvHk3wpmCXnrfy9zYeaMjwUBaf8CA0mbod4taMKk-WuzqxXfmAAnJuT')"
            }}
            aria-label="Abstract blue gradient geometric pattern"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <h1 className="text-white text-2xl font-bold tracking-tight">Create your vault</h1>
              <p className="text-white/90 text-sm font-medium">Set up secure access in minutes</p>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {error && (
              <div className="bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/30 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                <input name="fullname" required className="input" onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Surname</label>
                <input name="surname" required className="input" onChange={handleChange} />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input name="email" type="email" required className="input" onChange={handleChange} />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5 relative">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="input w-full pr-10"
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5 relative">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="input w-full pr-10"
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                <input name="dob" type="date" required className="input" onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">PAN Number</label>
                <input name="pan" required className="input" placeholder="ABCDE1234F" onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Aadhaar (12 digits)</label>
                <input name="aadhaar" required className="input" placeholder="123456789012" onChange={handleChange} />
              </div>

              <div className="sm:col-span-2 pt-2">
                <button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all">
                  Create Account
                </button>
              </div>
            </form>
          </div>

          <div className="sm:hidden px-6 pb-6 text-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Already have an account?</span>
            <Link className="text-sm font-semibold text-primary ml-1" to="/login">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
