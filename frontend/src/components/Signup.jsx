import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { generateKeyPair, encryptPrivateKey } from '../crypto';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { publicKeyJwk, privateKeyJwk } = await generateKeyPair();
      const encryptedPrivateKey = await encryptPrivateKey(privateKeyJwk, password, username);
      
      const res = await axios.post('http://localhost:5000/api/auth/signup', {
        username,
        password,
        publicKey: JSON.stringify(publicKeyJwk),
        encryptedPrivateKey
      });

      // Download recovery token
      const element = document.createElement("a");
      const file = new Blob([res.data.recoveryToken], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${username}_recovery_token.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      alert("CRITICAL: Your recovery file has been downloaded. Store it securely. It is the ONLY way to recover your account.");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full bg-ghost-bg px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-ghost-panel border border-ghost-border rounded-xl shadow-[0_0_15px_rgba(0,255,159,0.1)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ghost-green"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 className="text-2xl font-mono text-white mb-2 tracking-tight">INITIALIZE_IDENTITY</h2>
          <p className="text-ghost-muted text-sm">Secure anonymous communication protocol</p>
        </div>

        <div className="glass p-8 rounded-2xl animate-slide-up">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-mono flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>}
          
          <form onSubmit={handleSignup} className="space-y-5">
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
              <label className="block text-xs font-mono text-ghost-muted mb-2 uppercase tracking-wider">Master Password</label>
              <input 
                type="password" 
                className="input-base" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
                placeholder="••••••••••••"
              />
            </div>
            
            <div className="bg-ghost-panel/50 border border-ghost-border rounded-xl p-4 my-2">
              <h4 className="text-ghost-text text-sm font-medium mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Recovery Protocol
              </h4>
              <p className="text-xs text-ghost-muted leading-relaxed">
                A key file will be downloaded upon creation. If you lose your password, this file is the <strong className="text-white">only way</strong> to recover your account.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-4">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  GENERATING KEYS...
                </span>
              ) : 'GENERATE IDENTITY'}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-ghost-muted font-mono">
          STATUS: EXISTING_USER? <Link to="/login" className="text-ghost-text hover:text-ghost-green transition-colors underline decoration-ghost-border underline-offset-4">AUTHENTICATE</Link>
        </p>
      </div>
    </div>
  );
}
