import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileApi } from '../api';

export default function Upload() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sharing State
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setError('');
    setSuccess(false);
    setUploadedFileId(null);
    setShareSuccess('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const { data } = await fileApi.upload(formData);
      setUploadedFileId(data.id);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async () => {
    if (!shareEmail || !uploadedFileId) return;

    setSharing(true);
    setError('');
    setShareSuccess('');

    try {
      await fileApi.createShare(uploadedFileId, shareEmail);
      setShareSuccess(`Link sent to ${shareEmail}!`);
      setShareEmail('');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to send share link.';
      setError(msg);
    } finally {
      setSharing(false);
    }
  };

  const uploadInputId = 'upload-secure-file';
  const isActionDisabled = uploading || !selectedFile;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="w-full border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">shield_lock</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">SecureShare</h2>
        </div>

      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-3xl w-full">
          <div className="flex items-center gap-6 mb-6 text-sm text-slate-500">
            <div className={`flex items-center gap-2 ${success ? 'text-slate-500' : 'text-primary font-semibold'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${success ? 'bg-slate-200' : 'bg-primary text-white'}`}>1</div>
              Upload
            </div>
            <div className={`flex items-center gap-2 ${success ? 'text-primary font-semibold' : ''}`}>
              <div className={`h-7 w-7 rounded-full border flex items-center justify-center text-xs ${success ? 'bg-primary text-white border-primary' : 'border-slate-300'}`}>2</div>
              Share
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-300"></div>
            <div className="p-8">
              <h1 className="text-2xl md:text-3xl font-semibold text-center">
                {success ? 'File Uploaded!' : 'Upload Secure File'}
              </h1>
              <p className="text-slate-500 text-center mt-2">
                {success ? 'Now share it securely or upload another.' : 'End-to-end encrypted sharing made simple.'}
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm mt-6 break-words">
                  <strong>Error:</strong> {error}
                  {!success && (
                    <div className="mt-1 text-xs">
                      If this persists, check if the backend server is running and the encryption key is configured.
                    </div>
                  )}
                </div>
              )}

              {shareSuccess && (
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-3 rounded-lg text-sm mt-6">
                  {shareSuccess}
                </div>
              )}

              {!success ? (
                <>
                  <div
                    onClick={() => document.getElementById(uploadInputId)?.click()}
                    className="mt-8 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        AES-256 Encrypted
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                      </div>
                      <span className="text-base font-semibold">
                        Click to upload or drag and drop
                      </span>
                      <p className="text-sm text-slate-500">SVG, PNG, JPG or GIF (max. 2GB)</p>
                      {selectedFile && (
                        <p className="text-xs text-slate-500">Selected: {selectedFile.name}</p>
                      )}
                    </div>
                    <input id={uploadInputId} type="file" className="hidden" onChange={handleFileChange} />
                  </div>

                  <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700">Client-side Encryption</div>
                      <p className="text-sm text-slate-500">
                        Your file will be encrypted locally before it leaves your browser. We never see the content of your files.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      type="button"
                      onClick={() => navigate('/')}
                    >
                      Cancel
                    </button>
                    <button
                      className={`px-6 py-3 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 ${isActionDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary/90'}`}
                      type="button"
                      onClick={handleUpload}
                      disabled={isActionDisabled}
                    >
                      <span className="material-symbols-outlined text-[18px]">enhanced_encryption</span>
                      {uploading ? 'Encrypting...' : 'Encrypt & Generate Secure Link'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-8">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-semibold text-lg mb-4">Share with a User</h3>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Receiver's Email</label>
                        <input
                          type="email"
                          className="input w-full"
                          placeholder="Enter the email address of the registered user"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">The user must have a SecureShare account to receive files.</p>
                      </div>
                      <button
                        onClick={handleShare}
                        disabled={sharing || !shareEmail}
                        className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {sharing ? 'Sending...' : 'Send Secure Link'}
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => { setSuccess(false); setSelectedFile(null); setUploadedFileId(null); setShareSuccess(''); }}
                      className="text-primary font-semibold hover:underline"
                    >
                      Upload another file
                    </button>
                    <span className="mx-2 text-slate-300">|</span>
                    <button
                      onClick={() => navigate('/')}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <button className="hover:text-slate-700" type="button">Terms of Service</button>
            <button className="hover:text-slate-700" type="button">Privacy Policy</button>
            <button className="hover:text-slate-700" type="button">Security Overview</button>
          </div>
        </div>
      </main>
    </div>
  );
}
