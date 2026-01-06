import { useEffect, useState } from 'react';
import { getAllUsers, deleteUserAPI, promoteUserAPI, type UserDTO } from '../../services/userService';
import { Trash2, ShieldCheck, User, Search } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function UserManager() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  // Load data
  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý xóa
  const handleDelete = async (userId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác!")) return;

    const res = await deleteUserAPI(userId);
    if (res.success) {
      addToast(res.message, 'success');
      setUsers(prev => prev.filter(u => u.userId !== userId));
    } else {
      addToast(res.message, 'error');
    }
  };

  // Xử lý thăng cấp
  const handlePromote = async (userId: number, currentRole: string) => {
    if (currentRole === 'Admin') return;
    if (!window.confirm("Bạn có chắc muốn cấp quyền Admin cho người này?")) return;

    const res = await promoteUserAPI(userId);
    if (res.success) {
      addToast(res.message, 'success');
      // Cập nhật lại UI ngay lập tức
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, role: 'Admin' } : u));
    } else {
      addToast(res.message, 'error');
    }
  };

  // Lọc theo tìm kiếm
  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng ({users.length})</h1>
        
        {/* Ô tìm kiếm */}
        <div className="relative">
            <input 
                type="text" 
                placeholder="Tìm tên, email, sđt..." 
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
            <tr>
              <th className="p-4 border-b">ID</th>
              <th className="p-4 border-b">Khách hàng</th>
              <th className="p-4 border-b">Liên hệ</th>
              <th className="p-4 border-b">Vai trò</th>
              <th className="p-4 border-b text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Không tìm thấy người dùng nào.</td></tr>
            ) : (
                filteredUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-gray-50 transition border-b last:border-0">
                    <td className="p-4 font-mono text-gray-500">#{user.userId}</td>
                    <td className="p-4">
                        <div className="font-bold text-gray-900">{user.fullName || user.username}</div>
                        <div className="text-xs text-gray-500">Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="p-4">
                        <div className="text-gray-800">{user.email}</div>
                        <div className="text-gray-500">{user.phoneNumber || "---"}</div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit
                            ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {user.role === 'Admin' ? <ShieldCheck size={12}/> : <User size={12}/>}
                            {user.role}
                        </span>
                    </td>
                    <td className="p-4">
                        <div className="flex justify-center gap-2">
                            {/* Nút Thăng cấp (Chỉ hiện nếu chưa phải Admin) */}
                            {user.role !== 'Admin' && (
                                <button 
                                    onClick={() => handlePromote(user.userId, user.role)}
                                    className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
                                    title="Thăng cấp lên Admin"
                                >
                                    <ShieldCheck size={18} />
                                </button>
                            )}

                            {/* Nút Xóa */}
                            <button 
                                onClick={() => handleDelete(user.userId)}
                                className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100 transition"
                                title="Xóa người dùng"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}