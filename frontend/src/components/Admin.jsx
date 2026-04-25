import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

export default function Admin() {
  const [logs, setLogs] = useState({ suspiciousLogins: [], breachAlerts: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-ghost-bg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-ghost-bg pb-24 overflow-y-auto">
      <div className="p-4 border-b border-ghost-border sticky top-0 bg-ghost-bg/90 backdrop-blur-md z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="text-ghost-muted hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-ghost-panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h1 className="text-xl font-mono text-red-500 tracking-tight flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            SECURITY_LOGS
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6 animate-slide-up">
        <div className="glass rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden">
          <div className="p-4 border-b border-red-500/20 bg-red-500/10">
            <h2 className="text-sm font-mono text-red-400 flex items-center gap-2 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Active Breach Alerts
            </h2>
          </div>
          <div className="p-0">
            {logs.breachAlerts.length === 0 ? (
              <div className="p-6 text-center text-ghost-muted font-mono text-sm">
                [ NO_ACTIVE_ALERTS ]
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-red-500/20 text-ghost-muted text-[10px] font-mono uppercase tracking-wider bg-black/20">
                      <th className="py-3 px-4 font-normal">Target Node</th>
                      <th className="py-3 px-4 font-normal">Failed Attempts</th>
                      <th className="py-3 px-4 font-normal">Lockout Period</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-mono">
                    {logs.breachAlerts.map(user => (
                      <tr key={user._id} className="border-b border-red-500/10 hover:bg-red-500/10 transition-colors">
                        <td className="py-3 px-4 text-white">{user.username}</td>
                        <td className="py-3 px-4 text-red-400">
                          <span className="bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                            {user.failedLoginAttempts}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-ghost-muted text-xs">
                          {format(new Date(user.lockoutUntil), 'HH:mm:ss · MMM dd')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
          <div className="p-4 border-b border-yellow-500/20 bg-yellow-500/10">
            <h2 className="text-sm font-mono text-yellow-500 flex items-center gap-2 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Suspicious Activity
            </h2>
          </div>
          <div className="p-0">
            {logs.suspiciousLogins.filter(u => !u.lockoutUntil || new Date(u.lockoutUntil) < new Date()).length === 0 ? (
              <div className="p-6 text-center text-ghost-muted font-mono text-sm">
                [ ALL_SYSTEMS_NORMAL ]
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-yellow-500/20 text-ghost-muted text-[10px] font-mono uppercase tracking-wider bg-black/20">
                      <th className="py-3 px-4 font-normal">Target Node</th>
                      <th className="py-3 px-4 font-normal">Warning Level</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-mono">
                    {logs.suspiciousLogins.filter(u => !u.lockoutUntil || new Date(u.lockoutUntil) < new Date()).map(user => (
                      <tr key={user._id} className="border-b border-yellow-500/10 hover:bg-yellow-500/10 transition-colors">
                        <td className="py-3 px-4 text-white">{user.username}</td>
                        <td className="py-3 px-4 text-yellow-500">
                          <span className="bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/30">
                            {user.failedLoginAttempts} / 5
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
