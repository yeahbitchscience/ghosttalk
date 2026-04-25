import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { clearPrivateKeyIdb } from '../crypto';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updatePrivacy = async (setting) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/privacy`, { privacySetting: setting }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser({ ...user, privacySetting: res.data.privacySetting });
      setMessage('PRIVACY_PROTOCOL_UPDATED');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const setup2FA = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/setup-2fa`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCode(`${res.data.secret}`);
    } catch (err) {
      console.error(err);
    }
  };

  const verify2FA = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-2fa`, { token: totpToken }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser({ ...user, totpEnabled: true });
      setQrCode('');
      setMessage('MFA_ENABLED_SUCCESSFULLY');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('INVALID_TOKEN');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleLogout = async () => {
    localStorage.clear();
    await clearPrivateKeyIdb();
    navigate('/login');
  };

  if (!user) return (
    <div className="flex justify-center items-center h-screen bg-ghost-bg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghost-green"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-ghost-bg pb-24 overflow-y-auto">
      <div className="p-4 border-b border-ghost-border sticky top-0 bg-ghost-bg/90 backdrop-blur-md z-10 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-mono text-white tracking-tight">SYSTEM_PROFILE</h1>
        <button onClick={handleLogout} className="text-xs font-mono text-red-500 hover:text-red-400 flex items-center gap-1 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          LOGOUT
        </button>
      </div>

      <div className="p-4 space-y-6 animate-slide-up">
        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full border-2 border-ghost-green flex items-center justify-center bg-ghost-panel text-3xl text-white font-mono shadow-[0_0_15px_rgba(0,255,159,0.2)] mb-4">
            {user.username[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-mono text-white">{user.username}</h2>
          <p className="text-ghost-muted text-xs font-mono mt-1 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ghost-green animate-pulse"></span>
            IDENTITY_VERIFIED
          </p>
        </div>

        {message && (
          <div className="bg-ghost-green/10 border border-ghost-green/30 text-ghost-green p-3 rounded-xl text-xs font-mono text-center flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {message}
          </div>
        )}

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-xs font-mono text-ghost-muted mb-4 flex items-center gap-2 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Visibility Protocol
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'Open', desc: 'Accept all inbound connections' },
              { id: 'Restricted', desc: 'Accept from verified nodes only' },
              { id: 'Ghost', desc: 'Hidden from directory search' }
            ].map(setting => (
              <button
                key={setting.id}
                onClick={() => updatePrivacy(setting.id)}
                className={`p-4 rounded-xl border text-left transition-all ${user.privacySetting === setting.id ? 'bg-ghost-green/10 border-ghost-green text-white shadow-[0_0_10px_rgba(0,255,159,0.1)]' : 'bg-ghost-bg border-ghost-border text-ghost-muted hover:border-ghost-muted'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-mono text-sm uppercase tracking-wide">{setting.id} MODE</div>
                  {user.privacySetting === setting.id && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ghost-green"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div className="text-[11px] font-sans opacity-70">
                  {setting.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-xs font-mono text-ghost-muted mb-4 flex items-center gap-2 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Multi-Factor Auth (MFA)
          </h3>
          
          {user.totpEnabled ? (
            <div className="flex items-center gap-3 text-ghost-green bg-ghost-green/10 p-4 rounded-xl border border-ghost-green/20 font-mono text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>MFA_STATUS: ACTIVE</span>
            </div>
          ) : (
            <div className="space-y-4">
              {!qrCode ? (
                <button onClick={setup2FA} className="btn-outline w-full text-sm font-mono tracking-wider">
                  INITIALIZE MFA
                </button>
              ) : (
                <div className="bg-ghost-bg p-4 rounded-xl space-y-4 border border-ghost-border animate-fade-in">
                  <div className="text-xs text-ghost-muted mb-2">Manual entry secret (Authy / Google Auth):</div>
                  <div className="font-mono text-sm text-ghost-green bg-ghost-panel p-3 rounded-lg text-center tracking-[0.2em] border border-ghost-green/30">
                    {qrCode}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="000000" 
                      value={totpToken}
                      onChange={e => setTotpToken(e.target.value)}
                      className="input-base font-mono text-center tracking-[0.5em] flex-1 min-w-0"
                      maxLength="6"
                    />
                    <button onClick={verify2FA} className="bg-ghost-green text-black px-6 rounded-xl font-mono text-sm hover:bg-ghost-greenHover transition-colors shrink-0 font-bold">
                      VERIFY
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 px-4">
         <Link to="/admin" className="glass p-4 rounded-xl flex items-center justify-between text-ghost-muted hover:text-white transition-colors group">
            <div className="flex items-center gap-3 font-mono text-sm uppercase">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 group-hover:text-red-400 transition-colors"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Security Logs & Admin
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
         </Link>
      </div>
    </div>
  );
}
