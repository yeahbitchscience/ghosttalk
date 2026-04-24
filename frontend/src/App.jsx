import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Signup from './components/Signup';
import Login from './components/Login';
import Inbox from './components/Inbox';
import Chat from './components/Chat';
import Search from './components/Search';
import Profile from './components/Profile';
import Admin from './components/Admin';
import BottomNav from './components/BottomNav';
import GroupChat from './components/GroupChat';
import GroupSettings from './components/GroupSettings';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  useEffect(() => {
    const handleStorage = () => setToken(localStorage.getItem('token'));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />;
  };

  const JoinGroup = () => {
    const { inviteCode } = useParams();
    useEffect(() => {
      if (!token) return;
      axios.get(`http://localhost:5000/api/group/join/${inviteCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        window.location.href = `/group/${res.data.groupId}`;
      }).catch(err => {
        alert(err.response?.data?.error || 'Failed to join group');
        window.location.href = '/inbox';
      });
    }, [inviteCode]);
    return <div className="flex justify-center items-center h-[100dvh] bg-[#050505] text-ghost-green font-mono">JOINING_SECURE_GROUP...</div>;
  };

  return (
    <Router>
      <div className="min-h-[100dvh] bg-[#050505] flex justify-center items-center selection:bg-ghost-green selection:text-black">
        <div className="w-full h-[100dvh] sm:h-[calc(100dvh-4rem)] max-w-md bg-ghost-bg text-ghost-text relative shadow-2xl sm:border sm:border-ghost-border sm:rounded-2xl overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={token ? <Navigate to="/inbox" /> : <Navigate to="/login" />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/group/:groupId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
            <Route path="/group/:groupId/settings" element={<ProtectedRoute><GroupSettings /></ProtectedRoute>} />
            <Route path="/join/:inviteCode" element={<ProtectedRoute><JoinGroup /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          </Routes>
          {token && <BottomNav />}
        </div>
      </div>
    </Router>
  );
}

export default App;
