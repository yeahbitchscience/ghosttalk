import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { format } from 'date-fns';

export default function GroupChat() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [group, setGroup] = useState(null);
  const scrollRef = useRef();
  const socketRef = useRef();

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      auth: { token }
    });

    socketRef.current.on('receive_group_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    fetchGroupAndMessages();

    return () => socketRef.current.disconnect();
  }, [groupId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchGroupAndMessages = async () => {
    try {
      const resInfo = await axios.get(`${import.meta.env.VITE_API_URL}/api/group/${groupId}/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(resInfo.data);

      const resMsg = await axios.get(`${import.meta.env.VITE_API_URL}/api/group/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(resMsg.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/inbox');
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    let attachmentData = null;
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const resUpload = await axios.post(`${import.meta.env.VITE_API_URL}/api/messages/upload`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        attachmentData = resUpload.data;
      } catch (err) {
        alert(err.response?.data?.error || 'File upload failed');
        return;
      }
    }

    socketRef.current.emit('group-message', {
      groupId,
      content: input.trim(),
      attachment: attachmentData
    });

    setInput('');
    setFile(null);
  };

  const isAdmin = group?.admins.some(a => a._id === currentUser.id);

  return (
    <div className="flex flex-col h-full bg-ghost-bg pb-safe relative">
      <div className="p-4 border-b border-ghost-border sticky top-0 bg-ghost-bg/95 backdrop-blur-xl z-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/inbox')} className="text-ghost-muted hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-ghost-panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-ghost-border flex items-center justify-center bg-ghost-panel text-white font-mono shadow-inner">
              {group?.type === 'private' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ghost-muted"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ghost-green"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              )}
            </div>
            <div>
              <h2 className="font-mono text-white leading-tight">{group?.name}</h2>
              <span className="text-[10px] font-mono text-ghost-muted flex items-center gap-1">
                {group?.members?.length || 0} MEMBERS · SERVER ENCRYPTED
              </span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <Link to={`/group/${groupId}/settings`} className="text-ghost-muted hover:text-white transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-ghost-muted mx-auto mb-4 opacity-50"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <p className="text-ghost-muted font-mono text-sm">[ GROUP_ENCRYPTED_AT_REST ]</p>
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => {
          const isMine = msg.sender._id === currentUser.id;
          return (
            <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
              <div className={`max-w-[85%] relative flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && (
                  <span className="text-[10px] font-mono text-ghost-muted mb-1 ml-1">{msg.sender.username}</span>
                )}
                <div 
                  className={`p-3.5 shadow-sm text-[15px] leading-relaxed ${
                    isMine 
                      ? 'bg-ghost-panel border border-ghost-border text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-ghost-bg border border-ghost-border text-white rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {msg.attachment && (
                    <div className="mb-2">
                      {msg.attachment.mimeType.startsWith('image/') ? (
                        <img src={`${import.meta.env.VITE_API_URL}${msg.attachment.url}`} alt="attachment" className="rounded-xl max-h-60 border border-ghost-border" />
                      ) : (
                        <a href={`${import.meta.env.VITE_API_URL}${msg.attachment.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ghost-green bg-ghost-green/10 p-2 rounded-xl border border-ghost-green/20 font-mono text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                          {msg.attachment.filename}
                        </a>
                      )}
                    </div>
                  )}
                  {msg.content && <p className="break-words">{msg.content}</p>}
                </div>
                
                <div className={`text-[10px] font-mono mt-1 flex items-center gap-1 opacity-60 ${isMine ? 'text-ghost-muted' : 'text-ghost-muted'}`}>
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={scrollRef} className="h-2" />
      </div>

      <div className="p-4 bg-ghost-bg/95 backdrop-blur-xl border-t border-ghost-border z-20">
        {file && (
          <div className="mb-3 flex items-center justify-between bg-ghost-panel border border-ghost-border p-2 rounded-xl">
            <span className="text-xs font-mono text-ghost-green truncate pl-2">{file.name}</span>
            <button onClick={() => setFile(null)} className="p-1 text-ghost-muted hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 items-center bg-ghost-panel border border-ghost-border rounded-full p-1.5 focus-within:border-ghost-green transition-colors shadow-inner">
          <label className="cursor-pointer p-2.5 text-ghost-muted hover:text-ghost-text transition-colors rounded-full hover:bg-ghost-bg">
            <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </label>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Secure message..."
            className="flex-1 bg-transparent px-2 py-2 focus:outline-none text-white text-[15px]"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" disabled={!input.trim() && !file} className="p-2.5 bg-ghost-green hover:bg-ghost-greenHover text-black rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
