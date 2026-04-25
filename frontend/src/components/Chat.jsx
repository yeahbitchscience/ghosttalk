import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { encryptMessage, decryptMessage } from '../crypto';
import { format } from 'date-fns';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [myPublicKey, setMyPublicKey] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const scrollRef = useRef();
  const socketRef = useRef();

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_conversation', conversationId);
    });

    socketRef.current.on('receive_message', async (msg) => {
      const contentToDecrypt = msg.sender._id === currentUser.id ? msg.senderEncryptedContent : msg.encryptedContent;
      if (contentToDecrypt) {
        msg.decrypted = await decryptMessage(contentToDecrypt);
      } else if (msg.attachment) {
        msg.decrypted = 'Attachment';
      }
      setMessages(prev => [...prev, msg]);
      
      if (msg.sender._id !== currentUser.id) {
        socketRef.current.emit('mark_read', { messageId: msg._id, conversationId });
      }
    });

    socketRef.current.on('message_read', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'read' } : m));
    });

    fetchConversationAndMessages();

    return () => socketRef.current.disconnect();
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversationAndMessages = async () => {
    const resMsg = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const processed = await Promise.all(resMsg.data.map(async (msg) => {
      if (msg.status !== 'read' && msg.sender._id !== currentUser.id && socketRef.current) {
        socketRef.current.emit('mark_read', { messageId: msg._id, conversationId });
      }

      const contentToDecrypt = msg.sender._id === currentUser.id ? msg.senderEncryptedContent : msg.encryptedContent;
      if (contentToDecrypt) {
        msg.decrypted = await decryptMessage(contentToDecrypt);
      }
      return msg;
    }));
    setMessages(processed);
    
    const resConvList = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/conversations`, { headers: { Authorization: `Bearer ${token}` } });
    const conv = resConvList.data.find(c => c._id === conversationId);
    if (conv) {
      const other = conv.participants.find(p => p._id !== currentUser.id);
      setOtherUser(other);
      const me = conv.participants.find(p => p._id === currentUser.id);
      if (me) setMyPublicKey(me.publicKey);
      
      const resBlocked = await axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL}/api/users/blocked`, { headers: { Authorization: `Bearer ${token}` } });
      if (resBlocked.data.some(u => u._id === other._id)) {
        setIsBlocked(true);
      }
    }
  };

  const handleBlockToggle = async () => {
    if (!otherUser) return;
    try {
      if (isBlocked) {
        await axios.post(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL}/api/users/unblock/${otherUser._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setIsBlocked(false);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL}/api/users/block/${otherUser._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setIsBlocked(true);
      }
    } catch (err) {
      console.error(err);
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

    let encryptedContent = '';
    let senderEncryptedContent = '';
    if (input.trim()) {
      try {
        encryptedContent = await encryptMessage(input, JSON.parse(otherUser.publicKey));
        if (myPublicKey) {
          senderEncryptedContent = await encryptMessage(input, JSON.parse(myPublicKey));
        }
      } catch (err) {
        console.error(err);
      }
    }

    socketRef.current.emit('send_message', {
      conversationId,
      receiverId: otherUser._id,
      encryptedContent,
      senderEncryptedContent,
      attachment: attachmentData
    });

    setInput('');
    setFile(null);
  };

  const handleDelete = async (messageId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ghost-bg pb-safe relative">
      <div className="p-4 border-b border-ghost-border sticky top-0 bg-ghost-bg/95 backdrop-blur-xl z-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/inbox')} className="text-ghost-muted hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-ghost-panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-ghost-border flex items-center justify-center bg-ghost-panel text-white font-mono shadow-inner">
              {otherUser?.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-mono text-white leading-tight">{otherUser?.username}</h2>
              <span className="text-[10px] font-mono text-ghost-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ghost-green animate-pulse"></span> SECURE_LINK
              </span>
            </div>
          </div>
          {otherUser && (
            <button onClick={handleBlockToggle} className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${isBlocked ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-ghost-muted border-ghost-border hover:text-white hover:bg-ghost-panel'}`}>
              {isBlocked ? '[ UNBLOCK ]' : '[ BLOCK ]'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-ghost-muted mx-auto mb-4 opacity-50"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <p className="text-ghost-muted font-mono text-sm">[ E2E_ENCRYPTION_ACTIVE ]</p>
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => {
          const isMine = msg.sender._id === currentUser.id || msg.sender === currentUser.id;
          return (
            <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
              <div className={`max-w-[85%] relative flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
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
                  {msg.decrypted && <p className="break-words">{msg.decrypted}</p>}
                </div>
                
                <div className={`text-[10px] font-mono mt-1 flex items-center gap-1 opacity-60 ${isMine ? 'text-ghost-muted' : 'text-ghost-muted'}`}>
                  {format(new Date(msg.createdAt), 'HH:mm')}
                  {isMine && (
                    <span className={`ml-1 flex ${msg.status === 'read' ? 'text-ghost-green' : 'text-ghost-muted'}`}>
                      {msg.status === 'read' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L7 17l-5-5"/><path d="M22 10l-6.5 6.5"/></svg>
                      ) : msg.status === 'delivered' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L7 17l-5-5"/><path d="M22 10l-6.5 6.5"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      )}
                    </span>
                  )}
                </div>

                <button onClick={() => handleDelete(msg._id)} className={`absolute top-3 ${isMine ? '-left-10' : '-right-10'} text-ghost-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            </div>
          )
        })}
        
        <div className="w-full pt-8 pb-2 flex justify-center">
          <div className="text-[10px] text-ghost-muted font-mono">
            created with ❤️ by <a href="https://github.com/yeahbitchscience" target="_blank" rel="noreferrer" className="text-ghost-green hover:underline">sanskar</a>
          </div>
        </div>

        <div ref={scrollRef} className="h-2" />
      </div>

      <div className="p-4 bg-ghost-bg/95 backdrop-blur-xl border-t border-ghost-border z-20">
        {isBlocked ? (
          <div className="text-center text-red-500 font-mono text-sm py-2">
            [ COMMUNICATIONS BLOCKED ]
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
