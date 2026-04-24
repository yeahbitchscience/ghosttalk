import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { decryptPrivateKey, setPrivateKeyIdb } from '../crypto';

export default function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [requiresTotp, setRequiresTotp] = useState(false);
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryFile, setRecoveryFile] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        username, password, totpToken
      });
      
      const privateKeyJwk = await decryptPrivateKey(res.data.encryptedPrivateKey, password, username);
      await setPrivateKeyIdb(JSON.stringify(privateKeyJwk));
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      navigate('/inbox');
    } catch (err) {
      if (err.response?.data?.requiresTotp) {
        setRequiresTotp(true);
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    if (!recoveryFile) return setError("Please upload your recovery file");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const tokenStr = event.target.result;
        await axios.post('http://localhost:5000/api/auth/recover', {
          username, recoveryToken: tokenStr, newPassword
        });
        alert('Password reset successfully. You can now login.');
        setIsRecovering(false);
        setPassword('');
        setRequiresTotp(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Recovery failed');
      }
    };
    reader.readAsText(recoveryFile);
  };

  return (
    <div className="flex items-center justify-center min-h-full bg-ghost-bg px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-ghost-panel border border-ghost-border rounded-xl shadow-[0_0_15px_rgba(0,255,159,0.1)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ghost-green"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-2xl font-mono text-white mb-2 tracking-tight">
            {isRecovering ? 'RECOVERY_PROTOCOL' : 'SECURE_LOGIN'}
          </h2>
          <p className="text-ghost-muted text-sm">
            {isRecovering ? 'Restore access via key file' : 'Authenticate to access network'}
          </p>
        </div>
        
        <div className="glass p-8 rounded-2xl animate-slide-up">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-mono flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>}
          
          {!isRecovering ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-ghost-muted mb-2 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  className="input-base font-mono" 
                  value={username} 
                  onChange={e=>setUsername(e.target.value)} 
                  required 
                  placeholder="system_user"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-ghost-muted mb-2 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  className="input-base" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••••••"
                />
              </div>
              {requiresTotp && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-mono text-ghost-muted mb-2 uppercase tracking-wider">2FA Code (TOTP)</label>
                  <input 
                    type="text" 
                    className="input-base font-mono tracking-[0.5em] text-center" 
                    value={totpToken} 
                    onChange={e=>setTotpToken(e.target.value)} 
                    required 
                    placeholder="000000"
                    maxLength="6"
                  />
                </div>
              )}
              
              <button type="submit" className="btn-primary mt-6">
                AUTHENTICATE
              </button>
              
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-ghost-border">
                <button type="button" onClick={() => setIsRecovering(true)} className="text-xs font-mono text-ghost-muted hover:text-ghost-text transition-colors">
                  [ LOST PASSWORD? ]
                </button>
                <Link to="/signup" className="text-xs font-mono text-ghost-green hover:text-ghost-greenHover transition-colors">
                  [ CREATE ACCOUNT ]
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecover} className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-ghost-muted mb-2 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  className="input-base font-mono" 
                  value={username} 
                  onChange={e=>setUsername(e.target.value)} 
                  required 
                  placeholder="system_user"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-ghost-muted mb-2 uppercase tracking-wider">Recovery File (.txt)</label>
                <label className="flex items-center justify-center w-full min-h-[100px] border-2 border-dashed border-ghost-border rounded-xl cursor-pointer hover:border-ghost-green transition-colors bg-ghost-bg overflow-hidden relative">
                  <input type="file" accept=".txt" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e=>setRecoveryFile(e.target.files[0])} required />
                  <div className="text-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-ghost-muted"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    <span className="text-sm font-mono text-ghost-muted block truncate max-w-[200px]">
                      {recoveryFile ? recoveryFile.name : "Select key file"}
                    </span>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-xs font-mono text-ghost-muted mb-2 uppercase tracking-wider">New Password</label>
                <input 
                  type="password" 
                  className="input-base" 
                  value={newPassword} 
                  onChange={e=>setNewPassword(e.target.value)} 
                  required 
                  placeholder="••••••••••••"
                />
              </div>
              
              <button type="submit" className="btn-primary mt-6">
                OVERRIDE PASSWORD
              </button>
              
              <button type="button" onClick={() => setIsRecovering(false)} className="btn-outline mt-3">
                CANCEL RECOVERY
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
