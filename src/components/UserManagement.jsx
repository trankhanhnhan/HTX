import React, { useState, useEffect } from 'react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userRole = JSON.parse(localStorage.getItem('user'))?.role;

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://192.168.5.119:3001/api/users', {
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user'))?.token || ''}`,
            'x-role': JSON.parse(localStorage.getItem('user'))?.role || 'user'
          }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Không thể tải danh sách người dùng');
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://192.168.5.119:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          'x-role': JSON.parse(localStorage.getItem('user')).role
        },
        body: JSON.stringify(newUser)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUsers([...users, data.user]);
        setNewUser({ username: '', password: '', role: 'user' });
        setSuccess('Tạo tài khoản thành công');
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi khi tạo tài khoản');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Quản lý người dùng</h2>
      
      {/* Form tạo user mới */}
      {userRole === 'admin' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Tạo tài khoản mới</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleCreateUser}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Tên đăng nhập</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Mật khẩu</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Quyền</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Tạo tài khoản
            </button>
          </form>
        </div>
      )}

      {/* Danh sách users */}
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-gray-500">ID</th>
              <th className="px-6 py-3 text-left text-gray-500">Tên đăng nhập</th>
              <th className="px-6 py-3 text-left text-gray-500">Vai trò</th>
              <th className="px-6 py-3 text-left text-gray-500">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id || user._id || user.username}>
                <td className="px-6 py-4">{user.id}</td>
                <td className="px-6 py-4">{user.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;
