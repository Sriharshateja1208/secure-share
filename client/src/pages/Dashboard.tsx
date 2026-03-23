import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fileApi } from '../api';
import { useAuth } from '../hooks/useAuth';

const getFileMeta = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { icon: 'picture_as_pdf', bg: 'bg-red-100', text: 'text-red-600', type: 'Encrypted PDF' };
  if (ext === 'doc' || ext === 'docx') return { icon: 'description', bg: 'bg-blue-100', text: 'text-blue-600', type: 'Word Document' };
  if (ext === 'zip' || ext === 'rar') return { icon: 'folder_zip', bg: 'bg-purple-100', text: 'text-purple-600', type: 'Archive' };
  return { icon: 'insert_drive_file', bg: 'bg-slate-100', text: 'text-slate-600', type: 'Encrypted File' };
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSharedFiles();
  }, []);

  const loadSharedFiles = async () => {
    try {
      const { data } = await fileApi.getSharedFiles();
      setFiles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return files;
    return files.filter((file) => file.filename.toLowerCase().includes(query) || file.sender.toLowerCase().includes(query));
  }, [files, search]);

  const goToUpload = () => navigate('/upload');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 min-h-screen px-6 py-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">shield_lock</span>
            </div>
            <div>
              <div className="font-semibold text-lg">SecureShare</div>
              <div className="text-xs text-slate-500">Encrypted Vault</div>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold" type="button">
              <span className="material-symbols-outlined text-[20px]">share</span>
              Shared with Me
            </button>
            <button
              onClick={goToUpload}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100" type="button">
              <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
              Send File
            </button>
          </nav>

          <div className="space-y-2 pt-4 border-t border-slate-200">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Logout
            </button>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </div>
            <div>
              <div className="text-sm font-semibold">{user?.fullname || 'Secure User'}</div>
              <div className="text-xs text-slate-500 max-w-[140px] truncate" title={user?.email}>{user?.email || 'secure@company.com'}</div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3 w-full md:max-w-xl">
              <div className="relative flex-1">
                <span className="material-symbols-outlined text-[20px] text-slate-400 absolute left-4 top-1/2 -translate-y-1/2">search</span>
                <input
                  className="w-full h-11 pl-11 pr-4 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Search shared files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-3">
            </div>
          </header>

          <main className="px-6 py-6 space-y-6">
            <section className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-lg shadow-blue-500/20">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold mb-2">Shared with Me</h1>
                <p className="text-sm md:text-base text-blue-100">
                  Files securely shared with you by other users.
                </p>
              </div>
              <button
                onClick={goToUpload}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-blue-600 font-semibold shadow-md shadow-blue-700/20"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                Send a File
              </button>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold">Incoming Shares</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left font-medium px-6 py-3">File Name</th>
                      <th className="text-left font-medium px-6 py-3">Sent By</th>
                      <th className="text-left font-medium px-6 py-3">Date</th>
                      <th className="text-left font-medium px-6 py-3">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                          No shared files found.
                        </td>
                      </tr>
                    )}
                    {filteredFiles.map((file) => {
                      const meta = getFileMeta(file.filename);
                      const shareLink = `/s/${file.shareToken}`;
                      return (
                        <tr key={file.shareId} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-11 w-11 rounded-xl ${meta.bg} ${meta.text} flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{file.filename}</div>
                                <div className="text-xs text-slate-500">{meta.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-700">{file.sender}</div>
                            <div className="text-xs text-slate-500">{file.senderEmail}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{formatDate(file.sharedAt)}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Incoming
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={shareLink}
                              target="_blank"
                              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                            >
                              Open Check
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
