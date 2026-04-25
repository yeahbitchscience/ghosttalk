import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { decryptMessage } from '../crypto';
import CreateGroup from './CreateGroup';
import { io } from 'socket.io-client';

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchConversationsAndGroups();
    
    const socket = io(import.meta.env.VITE_API_URL, { auth: { token } });
    socket.on('new_message_alert', () => fetchConversationsAndGroups());
    socket.on('receive_group_message', () => fetchConversationsAndGroups());
    
    return () => socket.disconnect();
  }, []);

  const fetchConversationsAndGroups = async () => {
    try {
      const resConv = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const processed = await Promise.all(resConv.data.map(async (conv) => {
        if (conv.lastMessage) {
          const contentToDecrypt = conv.lastMessage.sender === currentUser.id ? conv.lastMessage.senderEncryptedContent : conv.lastMessage.encryptedContent;
          if (contentToDecrypt) {
            conv.lastMessage.decrypted = await decryptMessage(contentToDecrypt);
          } else if (conv.lastMessage.attachment) {
            conv.lastMessage.decrypted = 'Attachment';
          }
        }
        return conv;
      }));
      setConversations(processed);

      const resGroups = await axios.get(`${import.meta.env.VITE_API_URL}/api/group/user/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(resGroups.data);

    } catch (err) {
      console.error(err);
    }
  };

  const deleteConversation = async (e, convId) => {
    e.stopPropagation();
    alert("Delete conversation action triggered");
  };

  return (
    <div className="flex flex-col h-full bg-ghost-bg pb-20">
      <div className="p-4 border-b border-ghost-border sticky top-0 bg-ghost-bg/90 backdrop-blur-md z-10 flex justify-between items-center">
        <h1 className="text-xl font-mono text-white tracking-tight flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ghost-green"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ACTIVE_COMMS
        </h1>
        <button onClick={() => setShowCreateGroup(true)} className="p-2 border border-ghost-border bg-ghost-panel rounded-lg text-ghost-green hover:bg-ghost-green/10 transition-colors flex items-center gap-1.5 font-mono text-xs shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          GROUP
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {groups.length > 0 && (
          <div className="mb-6">
            <h2 className="px-4 pt-4 pb-2 text-[10px] font-mono text-ghost-muted uppercase tracking-widest bg-ghost-bg sticky top-0 z-0">
              [ SECURE_GROUPS ]
            </h2>
            <div className="divide-y divide-ghost-border border-y border-ghost-border bg-ghost-panel/20">
              {groups.map((group, i) => (
                <div 
                  key={group._id} 
                  onClick={() => navigate(`/group/${group._id}`)} 
                  className="p-4 cursor-pointer hover:bg-ghost-panel/50 transition-colors flex justify-between items-center group animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 rounded-full border border-ghost-border flex items-center justify-center bg-ghost-panel text-ghost-green font-mono shadow-inner group-hover:border-ghost-green transition-colors shrink-0 relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      {group.type === 'private' ? (
                        <div className="absolute -bottom-1 -right-1 bg-ghost-bg rounded-full p-0.5 border border-ghost-border text-ghost-muted">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 bg-ghost-bg rounded-full p-0.5 border border-ghost-border text-ghost-green">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-mono text-white text-base truncate flex items-center gap-2">
                          {group.name}
                        </h3>
                        <span className="text-[10px] font-mono text-ghost-muted whitespace-nowrap shrink-0 ml-2">
                          {group.lastMessage ? formatDistanceToNow(new Date(group.lastMessage.createdAt), { addSuffix: true }).replace('about ', '') : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm truncate pr-2 text-ghost-muted">
                          <span className="font-mono text-[10px] mr-1 opacity-70">[{group.members.length} USERS]</span>
                          {group.lastMessage ? (group.lastMessage.content || 'Attachment') : 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="px-4 pt-4 pb-2 text-[10px] font-mono text-ghost-muted uppercase tracking-widest bg-ghost-bg sticky top-0 z-0">
          [ DIRECT_MESSAGES ]
        </h2>
        {conversations.length === 0 ? (
          <div className="text-center text-ghost-muted mt-10 font-mono text-sm px-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="12" y1="10" x2="12" y2="14"/></svg>
            [ NO_ACTIVE_CONVERSATIONS ]<br/>
            <span className="text-xs opacity-50 mt-2 block">Use Search to initiate contact.</span>
          </div>
        ) : (
          <div className="divide-y divide-ghost-border">
            {conversations.map((conv, i) => {
              const otherUser = conv.participants.find(p => p._id !== currentUser.id) || conv.participants[0];
              return (
                <div 
                  key={conv._id} 
                  onClick={() => navigate(`/chat/${conv._id}`)} 
                  className="p-4 cursor-pointer hover:bg-ghost-panel/50 transition-colors flex justify-between items-center group relative overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Swipe to delete simulation visually */}
                  <div className="absolute inset-y-0 right-0 w-20 bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-full group-hover:translate-x-0 cursor-pointer" onClick={(e) => deleteConversation(e, conv._id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </div>
                  
                  <div className="flex items-center gap-4 group-hover:-translate-x-20 transition-transform duration-300 w-full">
                    <div className="w-12 h-12 rounded-full border border-ghost-border flex items-center justify-center bg-ghost-panel text-white font-mono shadow-inner group-hover:border-ghost-green transition-colors shrink-0">
                      {otherUser.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-mono text-white text-base truncate">{otherUser.username}</h3>
                        <span className="text-[10px] font-mono text-ghost-muted whitespace-nowrap shrink-0 ml-2">
                          {conv.lastMessage ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true }).replace('about ', '') : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm truncate pr-2 ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-ghost-muted'}`}>
                          {conv.lastMessage?.decrypted || 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-ghost-green text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,255,159,0.5)]">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreateGroup && (
        <CreateGroup onClose={() => {
          setShowCreateGroup(false);
          fetchConversationsAndGroups();
        }} />
      )}
    </div>
  );
}
