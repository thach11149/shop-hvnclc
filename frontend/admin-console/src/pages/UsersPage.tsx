import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Ban, CheckCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const ROLE_LABELS: Record<string, string> = {
  BUYER: 'Người mua',
  SELLER_OWNER: 'Người bán',
  SELLER_STAFF: 'Nhân viên bán',
  ADMIN_OPERATOR: 'Admin',
  ADMIN_FINANCE: 'Admin TC',
  ADMIN_CONTENT: 'Admin ND',
  SUPER_ADMIN: 'Super Admin',
};

const ROLE_BADGE: Record<string, string> = {
  BUYER: 'bg-blue-50 text-blue-700',
  SELLER_OWNER: 'bg-green-50 text-green-700',
  SELLER_STAFF: 'bg-teal-50 text-teal-700',
  ADMIN_OPERATOR: 'bg-purple-50 text-purple-700',
  ADMIN_FINANCE: 'bg-indigo-50 text-indigo-700',
  ADMIN_CONTENT: 'bg-pink-50 text-pink-700',
  SUPER_ADMIN: 'bg-red-50 text-red-700',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  BANNED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS_VI: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  BANNED: 'Bị cấm',
  SUSPENDED: 'Tạm dừng',
  INACTIVE: 'Không hoạt động',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ message: string; action: () => void } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, role],
    queryFn: () => apiClient.get(`/admin/users?${buildQuery()}`).then(r => r.data.data),
  });

  const users: any[] = data?.data || [];
  const pagination = data?.pagination;

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái người dùng');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelected(new Set());
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi cập nhật'),
  });

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      setSelected(new Set());
    }, 400);
  };

  const handleRoleChange = (val: string) => {
    setRole(val);
    setPage(1);
    setSelected(new Set());
  };

  const allIds = users.map(u => u.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;
  const selectedIds = Array.from(selected);

  const handleBulkBan = () => {
    setConfirm({
      message: `Cấm ${selectedCount} người dùng đã chọn? Họ sẽ không thể đăng nhập.`,
      action: () => {
        selectedIds.forEach(id => updateStatus.mutate({ id, status: 'BANNED' }));
      },
    });
  };

  const handleBulkActivate = () => {
    setConfirm({
      message: `Kích hoạt ${selectedCount} người dùng đã chọn?`,
      action: () => {
        selectedIds.forEach(id => updateStatus.mutate({ id, status: 'ACTIVE' }));
      },
    });
  };

  const handleBan = (id: string, email: string) => {
    setConfirm({
      message: `Cấm người dùng "${email}"? Họ sẽ không thể đăng nhập.`,
      action: () => updateStatus.mutate({ id, status: 'BANNED' }),
    });
  };

  const handleActivate = (id: string, email: string) => {
    setConfirm({
      message: `Kích hoạt lại tài khoản "${email}"?`,
      action: () => updateStatus.mutate({ id, status: 'ACTIVE' }),
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý người dùng</h1>

      {/* Search + Role Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="input pl-9 w-full"
            placeholder="Tìm theo email..."
          />
        </div>
        <select
          value={role}
          onChange={e => handleRoleChange(e.target.value)}
          className="input min-w-[180px]"
        >
          <option value="">Tất cả vai trò</option>
          <option value="BUYER">Người mua</option>
          <option value="SELLER_OWNER">Người bán</option>
          <option value="ADMIN_OPERATOR">Admin</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="text-sm font-medium text-orange-700">Đã chọn {selectedCount} người dùng</span>
          <button
            onClick={handleBulkBan}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
          >
            <Ban size={14} /> Cấm tất cả
          </button>
          <button
            onClick={handleBulkActivate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
          >
            <CheckCircle size={14} /> Kích hoạt tất cả
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700 px-3 py-1 border rounded"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-3 text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-gray-500">Họ tên</th>
                <th className="text-left px-4 py-3 text-gray-500">Vai trò</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày tạo</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Không có người dùng nào</td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.id} className={`border-t hover:bg-gray-50 ${selected.has(user.id) ? 'bg-orange-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleOne(user.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 max-w-[160px] truncate">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{user.fullName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role] || 'bg-gray-50 text-gray-700'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[user.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS_VI[user.status] || user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleBan(user.id, user.email)}
                            className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-colors"
                          >
                            <Ban size={12} /> Cấm
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id, user.email)}
                            className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle size={12} /> Kích hoạt
                          </button>
                        )}
                        <Link
                          to={`/users/${user.id}`}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors"
                        >
                          <Eye size={12} /> Profile
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {pagination && (
          <div className="p-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Tổng {pagination.total} người dùng</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1">Trang {page} / {pagination.totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.totalPages}
                className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-bold mb-2">Xác nhận</h3>
            <p className="text-gray-600 text-sm mb-4">{confirm.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => { confirm.action(); setConfirm(null); }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
