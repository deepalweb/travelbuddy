
import React, { useState, useEffect } from 'react';
import { Colors } from '../../constants.ts';
import { withApiBase } from '../../services/config';
import { useAuth } from '../../contexts/AuthContext.tsx';

interface User {
  _id: string;
  username: string;
  email: string;
  subscriptionStatus: string;
  createdAt: string;
  isAdmin?: boolean;
}

const AdminUserManagementView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { getIdToken } = useAuth();

  // Admin creation form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');
  const [createAdminLoading, setCreateAdminLoading] = useState(false);
  const [createAdminMessage, setCreateAdminMessage] = useState<string | null>(null);

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground,
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: Colors.boxShadow,
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
  const response = await fetch(withApiBase('/api/users'));
      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrPromoteAdmin = async () => {
    setCreateAdminMessage(null);
    if (!newAdminEmail.trim()) {
      setCreateAdminMessage('Email is required.');
      return;
    }
    setCreateAdminLoading(true);
    try {
      const token = await getIdToken();
      if (!token) {
        setCreateAdminMessage('You must be signed in to perform this action.');
        setCreateAdminLoading(false);
        return;
      }
  const res = await fetch(withApiBase('/api/admin/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newAdminEmail.trim(),
          password: newAdminPassword.trim() || undefined,
          displayName: newAdminDisplayName.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data?.detail || data?.error || 'Unknown error';
        setCreateAdminMessage(`Failed: ${detail}`);
      } else {
        setCreateAdminMessage(`Admin set: ${data.email || newAdminEmail}`);
        // Clear inputs lightly
        setNewAdminPassword('');
        if (data.email) setNewAdminEmail(data.email);
      }
    } catch (e: any) {
      setCreateAdminMessage(`Error: ${e?.message || String(e)}`);
    } finally {
      setCreateAdminLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
  await fetch(withApiBase(`/api/users/${userId}`), {
        method: 'DELETE'
      });
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-fadeInUp flex justify-center items-center h-64">
        <div className="text-lg" style={{ color: Colors.text }}>Loading users...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>User Management</h1>
      {/* Admin creation/promote panel */}
      <div className="mb-6" style={cardStyle}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: Colors.text }}>Create/Promote Admin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="email"
            placeholder="Admin email (required)"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2"
            style={{
              color: Colors.text,
              backgroundColor: Colors.inputBackground,
              boxShadow: Colors.boxShadowSoft,
              borderColor: Colors.cardBorder,
            }}
          />
          <input
            type="password"
            placeholder="Password (required for new user)"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            className="px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2"
            style={{
              color: Colors.text,
              backgroundColor: Colors.inputBackground,
              boxShadow: Colors.boxShadowSoft,
              borderColor: Colors.cardBorder,
            }}
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={newAdminDisplayName}
            onChange={(e) => setNewAdminDisplayName(e.target.value)}
            className="px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2"
            style={{
              color: Colors.text,
              backgroundColor: Colors.inputBackground,
              boxShadow: Colors.boxShadowSoft,
              borderColor: Colors.cardBorder,
            }}
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleCreateOrPromoteAdmin}
            disabled={createAdminLoading}
            className="text-sm font-semibold py-2 px-4 rounded-xl transition-all duration-300 active:scale-95 focus:outline-none"
            style={{ color: 'white', backgroundColor: Colors.primary }}
          >
            {createAdminLoading ? 'Submitting…' : 'Create/Promote'}
          </button>
          {createAdminMessage && (
            <span className="text-sm" style={{ color: Colors.text_secondary }}>{createAdminMessage}</span>
          )}
        </div>
      </div>
      
      <div style={cardStyle}>
        <div className="flex justify-between items-center mb-4">
          <input 
            type="text" 
            placeholder="Search users by name, email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2 w-1/2"
            style={{ 
              color: Colors.text,
              backgroundColor: Colors.inputBackground,
              boxShadow: Colors.boxShadowSoft,
              borderColor: Colors.cardBorder,
            }}
          />
          <div className="text-sm" style={{ color: Colors.text_secondary }}>
            Total Users: {filteredUsers.length}
          </div>
        </div>

  <div className="overflow-x-auto rounded-lg" style={{border: `1px solid ${Colors.cardBorder}`}}>
          <table className="min-w-full divide-y" style={{borderColor: Colors.cardBorder}}>
            <thead style={{backgroundColor: Colors.inputBackground}}>
              <tr>
                {['Username', 'Email', 'Subscription', 'Joined', 'Actions'].map(header => (
                  <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: Colors.text_secondary}}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{backgroundColor: Colors.cardBackground, borderColor: Colors.cardBorder}} className="divide-y">
              {filteredUsers.map(user => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium" style={{color: Colors.text}}>
                    {user.username}
                    {user.isAdmin && <span className="ml-2 text-xs px-2 py-1 rounded" style={{backgroundColor: `${Colors.primary}20`, color: Colors.primary}}>Admin</span>}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm" style={{color: Colors.text_secondary}}>{user.email}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                    <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}
                        style={user.subscriptionStatus === 'active' ? {backgroundColor: `${Colors.accentSuccess}20`, color: Colors.accentSuccess} : {backgroundColor: `${Colors.accentWarning}20`, color: Colors.accentWarning}}
                    >
                        {user.subscriptionStatus || 'free'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm" style={{color: Colors.text_secondary}}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => deleteUser(user._id)}
                      className="text-xs px-2 py-1 rounded" 
                      style={{color: Colors.accentError, backgroundColor: `${Colors.accentError}10`}}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
         <p className="mt-4 text-xs text-right" style={{color: Colors.text_secondary}}>
            Real user data from database. Use search to filter users.
        </p>
      </div>
    </div>
  );
};

export default AdminUserManagementView;
