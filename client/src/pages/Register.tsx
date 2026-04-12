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
    aadhaar: '',
    personal_q1: '',
    personal_a1: '',
    personal_q2: '',
    personal_a2: '',
    formulaOp: 'shift',
    formulaNum: 3
  });

  const PERSONAL_QUESTIONS = [
    "What is your favorite color?",
    "What is your favorite movie?",
    "What is your childhood nickname?",
    "What is your favorite food?"
  ];
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

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
      const resp = await authApi.register(dataToSend);
      if (resp.data.qrCodeUrl) {
        setQrCodeUrl(resp.data.qrCodeUrl);
      } else {
        navigate('/login');
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

      setError('Registration failed');
    }
  };

  const applyFormulaPreview = (str: string, op: string, num: number) => {
    if (op === 'reverse') return str.split('').reverse().join('');
    if (op === 'shift') {
      return str.split('').map(c => {
        if (c >= 'A' && c <= 'Z') return String.fromCharCode(((c.charCodeAt(0) - 65 + num) % 26) + 65);
        if (c >= 'a' && c <= 'z') return String.fromCharCode(((c.charCodeAt(0) - 97 + num) % 26) + 97);
        if (c >= '0' && c <= '9') return String((parseInt(c) + num) % 10);
        return c;
      }).join('');
    }
    if (op === 'sum') {
      const s = str.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return String((s + num) % 100).padStart(2, '0');
    }
    if (op === 'count') {
      return String(str.length + num);
    }
    return str;
  };

  const getOpDescription = () => {
    const { formulaOp: op, formulaNum: num } = formData;
    if (op === 'reverse') return 'reverse the characters';
    if (op === 'shift') return `shift each character forward by ${num} position${num > 1 ? 's' : ''}`;
    if (op === 'sum') return `sum the ASCII values, add ${num}, take last 2 digits`;
    if (op === 'count') return `count the characters and add ${num}`;
    return '';
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
            {qrCodeUrl ? (
                <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
                    <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-[28px]">check_circle</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Scan with Google Authenticator</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-center text-sm px-4">
                        Scan this QR code using Google Authenticator, Authy, or any supported app to set up your 2FA. You will need it to log in.
                    </p>
                    <img src={qrCodeUrl} alt="Google Authenticator QR Code" className="w-56 h-56 border border-slate-200 rounded-xl shadow-sm p-2 bg-white" />
                    <button 
                        onClick={() => navigate('/login')}
                        className="mt-4 px-8 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        I have scanned the code
                    </button>
                </div>
            ) : (
                <>
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

              {/* Security Questions */}
              <div className="sm:col-span-2 mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Security Questions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Question 1</label>
                    <select name="personal_q1" required value={formData.personal_q1} onChange={handleChange as any} className="input">
                      <option value="">Select a question</option>
                      {PERSONAL_QUESTIONS.map(q => (
                        <option key={q} value={q} disabled={q === formData.personal_q2}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Answer 1</label>
                    <input name="personal_a1" required className="input" placeholder="Your answer" onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Question 2</label>
                    <select name="personal_q2" required value={formData.personal_q2} onChange={handleChange as any} className="input">
                      <option value="">Select a question</option>
                      {PERSONAL_QUESTIONS.map(q => (
                        <option key={q} value={q} disabled={q === formData.personal_q1}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Answer 2</label>
                    <input name="personal_a2" required className="input" placeholder="Your answer" onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Secret Formula Section */}
              <div className="sm:col-span-2 mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">calculate</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-0.5">Set Your Secret Formula</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">This adds a second lock only you can solve — even if someone knows all your personal data, they cannot access your files without this.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Choose Operation</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'reverse', icon: 'swap_horiz', label: 'Reverse' },
                        { id: 'shift', icon: 'arrow_forward', label: 'Shift' },
                        { id: 'sum', icon: 'add', label: 'Sum' },
                        { id: 'count', icon: 'pin', label: 'Count' }
                      ].map(op => (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => setFormData({...formData, formulaOp: op.id})}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                            formData.formulaOp === op.id 
                              ? 'bg-primary/10 border-primary text-primary dark:text-primary-light' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{op.icon}</span> {op.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`flex flex-col gap-2 transition-opacity ${formData.formulaOp === 'reverse' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Your Secret Number</label>
                    <div className="flex flex-wrap gap-2">
                      {[1,2,3,4,5,6,7,8,9].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFormData({...formData, formulaNum: num})}
                          className={`w-9 h-9 rounded-lg border flex flex-col items-center justify-center font-bold text-sm transition-all ${
                            formData.formulaNum === num
                              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <strong>Your formula preview:</strong> Take the expected characters and <strong>{getOpDescription()}</strong>.<br/>
                  <div className="mt-1.5 p-1.5 bg-primary/10 text-primary dark:text-primary-light rounded font-mono break-all inline-block border border-primary/20 bg-white dark:bg-slate-900 shadow-sm">
                    Example: "ABC" → "{applyFormulaPreview('ABC', formData.formulaOp, formData.formulaNum)}"
                  </div>
                </div>

                <div className="flex gap-2 items-start text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20 shadow-sm">
                  <span className="material-symbols-outlined text-[16px] shrink-0">warning</span>
                  <p>This formula acts as a cognitive pin. You will need to apply it manually in your head every time you type your challenge answer.</p>
                </div>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-sm shadow-primary/30 transition-all">
                  Create Account
                </button>
              </div>
            </form>
            </>
          )}
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
