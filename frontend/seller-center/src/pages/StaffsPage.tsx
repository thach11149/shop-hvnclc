import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, X, Shield, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const PERMISSIONS: Record<string, { label: string; desc: string; group: string }> = {
  'product.view':    { label: 'Xem sản phẩm', desc: 'Xem danh sách và chi tiết sản phẩm', group: 'Sản phẩm' },
  'product.create':  { label: 'Tạo sản phẩm', desc: 'Thêm sản phẩm mới', group: 'Sản phẩm' },
  'product.update':  { label: 'Sửa sản phẩm', desc: 'Chỉnh sửa thông tin sản phẩm', group: 'Sản phẩm' },
  'order.view':      { label: 'Xem đơn hàng', desc: 'Xem danh sách đơn hàng', group: 'Đơn hàng' },
  'order.update':    { label: 'Cập nhật đơn', desc: 'Xác nhận, đóng gói đơn hàng', group: 'Đơn hàng' },
  'order.cancel':    { label: 'Hủy đơn hàng', desc: 'Hủy đơn hàng của khách', group: 'Đơn hàng' },
  'finance.view':    { label: 'Xem tài chính', desc: 'Xem doanh thu và số dư', group: 'Tài chính' },
  'promotion.create':{ label: 'Tạo khuyến mãi', desc: 'Tạo và quản lý mã giảm giá', group: 'Marketing' },
  'chat.respond':    { label: 'Trả lời chat', desc: 'Nhắn tin với khách hàng', group: 'Chăm sóc KH' },
  'review.reply':    { label: 'Phản hồi đánh giá', desc: 'Trả lời đánh giá từ khách', group: 'Chăm sóc KH' },
  'qna.reply':       { label: 'Trả lời Q&A', desc: 'Trả lời câu hỏi về sản phẩm', group: 'Chăm sóc KH' },
};

const ROLE_PRESETS: Record<string, { label: string; color: string; permissions: string[] }> = {
  MANAGER: {
    label: 'Quản lý',
    color: 'bg-purple-100 text-purple-700',
    permissions: Object.keys(PERMISSIONS),
  },
  WAREHOUSE: {
    label: 'Kho vận',
    color: 'bg-blue-100 text-blue-700',
    permissions: ['product.view', 'order.view', 'order.update'],
  },
  SUPPORT: {
    label: 'CSKH',
    color: 'bg-green-100 text-green-700',
    permissions: ['order.view', 'chat.respond', 'review.reply', 'qna.reply'],
  },
  CUSTOM: {
    label: 'Tùy chỉnh',
    color: 'bg-gray-100 text-gray-700',
    permissions: ['order.view', 'chat.respond'],
  },
};

function groupPermissions(perms: string[]) {
  const grouped: Record<string, string[]> = {};
  perms.forEach((p) => {
    const meta = PERMISSIONS[p];
    if (!meta) return;
    if (!grouped[meta.group]) grouped[meta.group] = [];
    grouped[meta.group].push(p);
  });
  return grouped;
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('SUPPORT');
  const [permissions, setPermissions] = useState<string[]>(ROLE_PRESETS.SUPPORT.permissions);

  const handleRoleChange = (r: string) => {
    setRole(r);
    if (r !== 'CUSTOM') setPermissions(ROLE_PRESETS[r].permissions);
  };

  const togglePerm = (perm: string) => {
    setPermissions((p) => p.includes(perm) ? p.filter((x) => x !== perm) : [...p, perm]);
  };

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/staffs/invite', data),
    onSuccess: () => {
      toast.success('Lời mời đã được gửi');
      qc.invalidateQueries({ queryKey: ['shop-staffs'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi gửi lời mời'),
  });

  const groupedPerms = groupPermissions(Object.keys(PERMISSIONS));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">Mời nhân viên</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Email nhân viên *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhanvien@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Vai trò</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handleRoleChange(key)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-colors ${
                    role === key ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {key === 'MANAGER' ? <ShieldCheck size={16} className="text-purple-500" /> : <Shield size={16} className="text-gray-400" />}
                  <div>
                    <p className="text-sm font-medium">{preset.label}</p>
                    <p className="text-xs text-gray-500">{preset.permissions.length} quyền</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Phân quyền chi tiết</label>
              <span className="text-xs text-gray-400">{permissions.length} đã chọn</span>
            </div>
            <div className="space-y-3 border border-gray-200 rounded-xl p-3">
              {Object.entries(groupedPerms).map(([group, perms]) => (
                <div key={group}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group}</p>
                  <div className="space-y-1">
                    {perms.map((perm) => {
                      const meta = PERMISSIONS[perm];
                      return (
                        <label key={perm} className="flex items-start gap-2 cursor-pointer p-1.5 rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={permissions.includes(perm)}
                            onChange={() => { setRole('CUSTOM'); togglePerm(perm); }}
                            className="mt-0.5 accent-primary-500"
                          />
                          <div>
                            <span className="text-sm font-medium">{meta.label}</span>
                            <p className="text-xs text-gray-400">{meta.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
          <button
            onClick={() => mutation.mutate({ email, role, permissions })}
            disabled={!email || permissions.length === 0 || mutation.isPending}
            className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang gửi...' : 'Gửi lời mời'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPermissionsModal({ staff, onClose }: { staff: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [permissions, setPermissions] = useState<string[]>(staff.permissions || []);

  const togglePerm = (perm: string) => {
    setPermissions((p) => p.includes(perm) ? p.filter((x) => x !== perm) : [...p, perm]);
  };

  const mutation = useMutation({
    mutationFn: () => apiClient.patch(`/seller/staffs/${staff.id}`, { permissions }),
    onSuccess: () => {
      toast.success('Đã cập nhật quyền');
      qc.invalidateQueries({ queryKey: ['shop-staffs'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi cập nhật'),
  });

  const groupedPerms = groupPermissions(Object.keys(PERMISSIONS));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-bold">Chỉnh sửa quyền</h3>
            <p className="text-sm text-gray-500">{staff.user?.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {Object.entries(groupedPerms).map(([group, perms]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{group}</p>
              <div className="space-y-1">
                {perms.map((perm) => {
                  const meta = PERMISSIONS[perm];
                  return (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm)}
                        onChange={() => togglePerm(perm)}
                        className="accent-primary-500"
                      />
                      <span className="text-sm">{meta.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffsPage() {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  const { data: staffs, isLoading } = useQuery({
    queryKey: ['shop-staffs'],
    queryFn: () => apiClient.get('/seller/staffs').then((r) => r.data.data),
  });

  const removeMutation = useMutation({
    mutationFn: (staffId: string) => apiClient.delete(`/seller/staffs/${staffId}`),
    onSuccess: () => {
      toast.success('Đã xóa nhân viên');
      queryClient.invalidateQueries({ queryKey: ['shop-staffs'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi xóa nhân viên'),
  });

  const staffList: any[] = staffs?.items || staffs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-primary-500" />
            Nhân viên shop
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý quyền truy cập cho nhân viên</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-600"
        >
          <Plus size={16} /> Mời nhân viên
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">Chưa có nhân viên nào</p>
            <button
              onClick={() => setShowInvite(true)}
              className="text-sm text-primary-500 hover:underline"
            >
              Mời nhân viên đầu tiên
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nhân viên</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Vai trò</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Quyền</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Gia nhập</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffList.map((staff: any) => {
                const rolePreset = ROLE_PRESETS[staff.role] || ROLE_PRESETS.CUSTOM;
                return (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                          {(staff.user?.email || 'S')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{staff.user?.name || staff.user?.email}</p>
                          <p className="text-xs text-gray-500">{staff.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${rolePreset.color}`}>
                        {rolePreset.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(staff.permissions || []).slice(0, 3).map((perm: string) => (
                          <span key={perm} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                            {PERMISSIONS[perm]?.label || perm}
                          </span>
                        ))}
                        {(staff.permissions?.length || 0) > 3 && (
                          <span className="text-xs text-gray-400">+{staff.permissions.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingStaff(staff)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50"
                          title="Chỉnh sửa quyền"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => window.confirm('Xóa nhân viên này?') && removeMutation.mutate(staff.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {editingStaff && <EditPermissionsModal staff={editingStaff} onClose={() => setEditingStaff(null)} />}
    </div>
  );
}
