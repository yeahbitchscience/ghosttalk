import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    
    if (q.length > 2) {
      setIsSearching(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/search?username=${q}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resGroups = await axios.get(`${import.meta.env.VITE_API_URL}/api/group/search/public?q=${q}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const combined = [
          ...resGroups.data.map(g => ({ ...g, _searchType: 'group' })),
          ...res.data.map(u => ({ ...u, _searchType: 'user' }))
        ];
        setSearchResults(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const startChat = async (targetUserId) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/messages/conversations`, { targetUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/chat/${res.data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ghost-bg pb-20">
      <div className="p-4 border-b border-ghost-border sticky top-0 bg-ghost-bg/90 backdrop-blur-md z-10">
        <h1 className="text-xl font-mono text-white mb-4 tracking-tight">DIRECTORY_SEARCH</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ghost-muted"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input 
            type="text" 
            placeholder="Enter exact username..." 
            value={searchQuery}
            onChange={handleSearch}
            className="input-base pl-12 font-mono text-sm"
            autoComplete="off"
            spellCheck="false"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="animate-spin h-4 w-4 text-ghost-green" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto p-4">
        {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
          <div className="text-center text-ghost-muted mt-10 font-mono text-sm">
            [ NO_MATCHES_FOUND ]
          </div>
        )}
        
        {searchQuery.length <= 2 && (
          <div className="text-center text-ghost-muted mt-10 font-mono text-sm">
            [ ENTER_AT_LEAST_3_CHARS ]
          </div>
        )}

        <div className="space-y-2">
          {searchResults.map(item => {
            if (item._searchType === 'group') {
              return (
                <div key={`group-${item._id}`} onClick={() => navigate(`/group/${item._id}`)} className="glass p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-ghost-green transition-colors group animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-ghost-border flex items-center justify-center bg-ghost-bg text-ghost-green shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    </div>
                    <div>
                      <h3 className="font-mono text-white group-hover:text-ghost-green transition-colors leading-tight">{item.name}</h3>
                      <p className="text-[10px] font-mono text-ghost-muted">{item.members?.length || 0} MEMBERS</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-ghost-green bg-ghost-green/10 px-2 py-1 rounded border border-ghost-green/30">
                    [ PUBLIC ]
                  </span>
                </div>
              );
            }
            
            return (
              <div 
                key={`user-${item._id}`} 
                onClick={() => startChat(item._id)} 
                className="glass p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-ghost-green transition-colors group animate-fade-in"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-ghost-border flex items-center justify-center bg-ghost-panel text-white font-mono shadow-inner group-hover:border-ghost-green transition-colors">
                    {item.username[0].toUpperCase()}
                  </div>
                  <span className="font-mono text-white group-hover:text-ghost-green transition-colors">{item.username}</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-1 rounded-md border ${item.privacySetting === 'Open' ? 'text-ghost-green border-ghost-green/30 bg-ghost-green/10' : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'}`}>
                  {item.privacySetting.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full pt-8 pb-4 mt-auto flex justify-center">
          <div className="text-[10px] text-ghost-muted font-mono">
            created with ❤️ by <a href="https://github.com/yeahbitchscience" target="_blank" rel="noreferrer" className="text-ghost-green hover:underline">sanskar</a>
          </div>
        </div>
      </div>
    </div>
  );
}
