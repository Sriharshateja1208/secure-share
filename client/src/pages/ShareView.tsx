import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../api';

export default function ShareView() {
  const { token } = useParams<{ token: string }>();
  const [challenge, setChallenge] = useState<{ question: string, challengeId: string, attemptsRemaining?: number } | null>(null);
  const [answer, setAnswer] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) loadChallenge(token);
  }, [token]);

  const loadChallenge = async (t: string) => {
    try {
      const { data } = await publicApi.getChallenge(t);
      setChallenge(data);
      if (data.attemptsRemaining !== undefined && data.attemptsRemaining <= 0) {
        setError('Max attempts exceeded. Access locked.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or Expired Link');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    try {
      const { data } = await publicApi.verifyChallenge({
        challengeId: challenge.challengeId,
        answer
      });
      const link = publicApi.download(data.downloadToken);
      setDownloadLink(link);
      setError('');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Incorrect Answer';
      setError(msg);
      setAnswer('');

      // Refresh challenge to get a new question (rotate)
      // logic: verify failure invalidates the current challengeId anyway
      if (token) {
        // Short delay to let user see "Incorrect Answer" before question flips? 
        // Or immediate. Immediate is better for security/flow.
        loadChallenge(token);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Security Challenge...</div>;
  }

  return (
    <div className="min-h-screen bg-background-light text-slate-900 flex flex-col">
      <header className="w-full border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 text-primary flex items-center justify-center bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-2xl">shield_lock</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">SecureShare</h2>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-semibold text-center">Secure File Access</h1>
            <p className="text-sm text-slate-500 text-center mt-2">
              Verify your identity to download the shared file.
            </p>
            {challenge?.attemptsRemaining !== undefined && (
              <p className={`text-xs text-center mt-1 font-medium ${challenge.attemptsRemaining < 3 ? 'text-red-500' : 'text-slate-400'}`}>
                Attempts remaining: {challenge.attemptsRemaining}
              </p>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm mt-5 text-center">
                {error}
              </div>
            )}

            {!downloadLink ? (
              <>
                <div className="bg-slate-50 p-4 rounded-lg mt-6 border border-slate-200">
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Security Question</p>
                  <p className="text-lg font-medium text-primary">{challenge?.question}</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4 mt-6">
                  <input
                    className="input"
                    placeholder="Enter your answer..."
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                  />
                  <button className="btn btn-primary w-full" type="submit">Verify Identity</button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-6 mt-6">
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-lg border border-emerald-200">
                  Identity Verified Successfully
                </div>
                <p className="text-slate-500">Your secure download is ready. This link is valid for one-time use.</p>
                <a
                  href={downloadLink}
                  className="btn btn-primary w-full block text-center"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
