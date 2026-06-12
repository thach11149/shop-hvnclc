import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const ROLE_LABELS: Record<string, string> = {
  BUYER: 'Người mua', SELLER_OWNER: 'Người bán', SELLER_STAFF: 'Nhân viên bán',
  ADMIN_OPERATOR: 'Admin', ADMIN_FINANCE: 'Admin TC', ADMIN_CONTENT: 'Admin ND', SUPER_ADMIN: 'Super Admin',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => apiClient.get(`/admin/users?page=${page}&limit=20${search ? `&search=${search}` : ''}`).then(r => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => { toast.success('Đã cập nhật'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý người dùng</h1>

      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="input max-w-sm"
          placeholder="Tìm theo email..."
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-gray-500">Họ tên</th>
                <th className="text-left px-4 py-3 text-gray-500">Vai trò</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày tạo</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((user: any) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{user.fullName || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {user.status === 'ACTIVE' ? (
                      <button onClick={() => updateStatus.mutate({ id: user.id, status: 'BANNED' })} className="text-red-500 text-xs hover:underline">
                        Cấm
                      </button>
                    ) : (
                      <button onClick={() => updateStatus.mutate({ id: user.id, status: 'ACTIVE' })} className="text-green-600 text-xs hover:underline">
                        Kích hoạt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data?.pagination && (
          <div className="p-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Tổng {data.pagination.total} người dùng</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-40">Trước</button>
              <span className="px-3 py-1">Trang {page}/{data.pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages} className="px-3 py-1 border rounded disabled:opacity-40">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
