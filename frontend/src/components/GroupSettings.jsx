import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function GroupSettings() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchGroupInfo();
  }, [groupId]);

  const fetchGroupInfo = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/group/${groupId}/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(res.data);
    } catch (err) {
      console.error(err);
      navigate('/inbox');
    }
  };

  const updateVisibility = async (type) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/group/${groupId}/visibility`, { type }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGroupInfo();
    } catch (err) {
      console.error(err);
    }
  };

  const generateInvite = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/group/${groupId}/invite/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGroupInfo();
    } catch (err) {
      console.error(err);
    }
  };

  const revokeInvite = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/group/${groupId}/invite/revoke`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGroupInfo();
    } catch (err) {
      console.error(err);
    }
  };

  const copyInvite = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(`http://localhost:5173/join/${group.inviteCode}`);
      alert('Invite link copied to clipboard');
    }
  };

  const handleRemoveMember = (memberId) => {
    // UI only - Backend route not requested in spec
    alert('Member removal requires backend route /group/:id/remove-member (Not requested in blueprint)');
  };

  const handleDeleteGroup = () => {
    alert('Group deletion requires backend route DELETE /group/:id (Not requested in blueprint)');
  };

  if (!group) return null;

  return (
    <div className="flex flex-col min-h-full bg-ghost-bg pb-20 relative">
      <div className="p-4 border-b border-ghost-border sticky top-0 bg-ghost-bg/95 backdrop-blur-xl z-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/group/${groupId}`)} className="text-ghost-muted hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-ghost-panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h1 className="text-xl font-mono text-white tracking-tight">GROUP_CONFIG</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 animate-slide-up">
        
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-xs font-mono text-ghost-muted mb-4 flex items-center gap-2 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Visibility Protocol
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => updateVisibility('private')}
              className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${group.type === 'private' ? 'bg-ghost-panel border-ghost-muted text-white shadow-inner' : 'border-ghost-border text-ghost-muted hover:border-ghost-muted/50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <div className="font-mono text-sm">PRIVATE</div>
            </button>
            <button 
              onClick={() => updateVisibility('public')}
              className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${group.type === 'public' ? 'bg-ghost-green/10 border-ghost-green text-ghost-green shadow-inner' : 'border-ghost-border text-ghost-muted hover:border-ghost-border'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              <div className="font-mono text-sm">PUBLIC</div>
            </button>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-xs font-mono text-ghost-muted mb-4 flex items-center gap-2 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            Invitation Link
          </h3>
          {group.inviteEnabled && group.inviteCode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`http://localhost:5173/join/${group.inviteCode}`}
                  className="input-base font-mono text-xs text-ghost-green tracking-wide bg-ghost-green/5"
                />
                <button onClick={copyInvite} className="p-3 bg-ghost-panel border border-ghost-border rounded-xl text-white hover:border-ghost-green transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={generateInvite} className="flex-1 btn-outline text-xs py-2 border-ghost-muted">
                  REGENERATE
                </button>
                <button onClick={revokeInvite} className="flex-1 btn-outline text-xs py-2 border-red-500/50 text-red-500 hover:text-red-400 hover:border-red-400">
                  REVOKE LINK
                </button>
              </div>
            </div>
          ) : (
            <button onClick={generateInvite} className="btn-outline w-full text-sm font-mono tracking-wider border-ghost-green text-ghost-green hover:bg-ghost-green/10">
              GENERATE_INVITE_LINK
            </button>
          )}
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-xs font-mono text-ghost-muted mb-4 flex items-center gap-2 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Member Directory ({group.members.length})
          </h3>
          <div className="space-y-2">
            {group.members.map(member => (
              <div key={member._id} className="flex items-center justify-between p-3 border border-ghost-border bg-ghost-bg rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-ghost-border flex items-center justify-center bg-ghost-panel text-white font-mono text-xs">
                    {member.username[0].toUpperCase()}
                  </div>
                  <span className="font-mono text-sm text-white">{member.username}</span>
                  {group.admins.some(a => a._id === member._id) && (
                    <span className="text-[9px] font-mono bg-ghost-green/20 text-ghost-green px-1.5 py-0.5 rounded border border-ghost-green/30">ADMIN</span>
                  )}
                </div>
                {member._id !== currentUser.id && (
                  <button onClick={() => handleRemoveMember(member._id)} className="text-ghost-muted hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border-red-500/30 bg-red-500/5">
          <h3 className="text-xs font-mono text-red-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Danger Zone
          </h3>
          <button onClick={handleDeleteGroup} className="w-full p-4 border border-red-500/50 text-red-500 font-mono text-sm rounded-xl hover:bg-red-500/10 transition-colors">
            TERMINATE_GROUP
          </button>
        </div>

      </div>
    </div>
  );
}
