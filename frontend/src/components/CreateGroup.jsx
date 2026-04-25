import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CreateGroup({ onClose }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('private');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim() || q.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/search?username=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMember = (user) => {
    if (selectedMembers.find(m => m._id === user._id)) {
      setSelectedMembers(prev => prev.filter(m => m._id !== user._id));
    } else {
      setSelectedMembers(prev => [...prev, user]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/group/create`, {
        name: name.trim(),
        type,
        members: selectedMembers.map(m => m._id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onClose) onClose();
      navigate(`/group/${res.data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-ghost-bg sm:border border-ghost-border sm:rounded-2xl shadow-2xl flex flex-col h-[90dvh] sm:h-[80dvh] animate-slide-up rounded-t-2xl overflow-hidden">
        
        <div className="p-4 border-b border-ghost-border flex justify-between items-center bg-ghost-panel/50">
          <h2 className="text-lg font-mono text-white tracking-tight">CREATE_GROUP</h2>
          <button onClick={onClose} className="p-2 text-ghost-muted hover:text-white rounded-lg hover:bg-ghost-panel transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-ghost-muted uppercase tracking-widest">Group Designation</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter group name..."
              className="input-base text-lg font-mono"
              maxLength={30}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-mono text-ghost-muted uppercase tracking-widest flex justify-between">
              Visibility Protocol
              <span className={type === 'private' ? 'text-ghost-muted' : 'text-ghost-green'}>
                {type === 'private' ? '[ PRIVATE ]' : '[ PUBLIC ]'}
              </span>
            </label>
            <div className="flex gap-2">
              <button 
                onClick={() => setType('private')}
                className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${type === 'private' ? 'bg-ghost-panel border-ghost-muted text-white shadow-inner' : 'border-ghost-border/50 text-ghost-muted hover:border-ghost-muted/50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span className="font-mono text-xs">PRIVATE</span>
              </button>
              <button 
                onClick={() => setType('public')}
                className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${type === 'public' ? 'bg-ghost-green/10 border-ghost-green text-ghost-green shadow-inner' : 'border-ghost-border/50 text-ghost-muted hover:border-ghost-border'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <span className="font-mono text-xs">PUBLIC</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-ghost-border">
            <label className="text-[10px] font-mono text-ghost-muted uppercase tracking-widest">Add Members ({selectedMembers.length})</label>
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by username..."
                className="input-base pl-9 text-sm"
                autoComplete="off"
                spellCheck="false"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost-muted"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>

            {searchResults.length > 0 && (
              <div className="border border-ghost-border rounded-xl bg-ghost-panel overflow-hidden max-h-40 overflow-y-auto no-scrollbar">
                {searchResults.map(user => {
                  const isSelected = selectedMembers.find(m => m._id === user._id);
                  return (
                    <div key={user._id} onClick={() => toggleMember(user)} className="p-3 border-b border-ghost-border last:border-0 flex justify-between items-center cursor-pointer hover:bg-ghost-bg transition-colors">
                      <span className="font-mono text-sm text-white">{user.username}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-ghost-green border-ghost-green text-black' : 'border-ghost-muted'}`}>
                        {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-ghost-border bg-ghost-bg">
          <button 
            onClick={handleCreate}
            disabled={!name.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            INITIALIZE_GROUP
          </button>
        </div>

      </div>
    </div>
  );
}
