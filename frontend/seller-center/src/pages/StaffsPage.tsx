import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const PERMISSION_LABELS: Record<string, string> = {
  'product.create': 'Tạo sản phẩm',
  'product.update': 'Sửa sản phẩm',
  'order.view': 'Xem đơn hàng',
  'order.update': 'Cập nhật đơn',
  'finance.view': 'Xem tài chính',
  'promotion.create': 'Tạo khuyến mãi',
  'chat.respond': 'Trả lời chat',
};

export default function StaffsPage() {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['order.view', 'chat.respond']);

  const { data: staffs, isLoading } = useQuery({
    queryKey: ['shop-staffs'],
    queryFn: () => apiClient.get('/seller/staffs').then(r => r.data.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; permissions: string[] }) =>
      apiClient.post('/seller/staffs/invite', data),
    onSuccess: () => {
      toast.success('Lời mời đã được gửi');
      queryClient.invalidateQueries({ queryKey: ['shop-staffs'] });
      setShowInvite(false);
      setEmail('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi gửi lời mời'),
  });

  const removeMutation = useMutation({
    mutationFn: (staffId: string) => apiClient.delete(`/seller/staffs/${staffId}`),
    onSuccess: () => {
      toast.success('Đã xóa nhân viên');
      queryClient.invalidateQueries({ queryKey: ['shop-staffs'] });
    },
  });

  const togglePermission = (perm: string) => {
    setPermissions(p => p.includes(perm) ? p.filter(x => x !== perm) : [...p, perm]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Nhân viên shop</h1>
        <button onClick={() => setShowInvite(true)} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm">
          + Mời nhân viên
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4">
        {isLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !staffs?.length ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p>Chưa có nhân viên nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staffs.map((staff: any) => (
              <div key={staff.id} className="border rounded-lg p-3 flex items-start justify-between">
                <div>
                  <p className="font-medium">{staff.user?.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Gia nhập: {new Date(staff.createdAt).toLocaleDateString('vi-VN')}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {staff.permissions?.map((perm: string) => (
                      <span key={perm} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {PERMISSION_LABELS[perm] || perm}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => window.confirm('Xóa nhân viên này?') && removeMutation.mutate(staff.id)}
                  className="text-xs text-red-500 hover:underline ml-4"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Mời nhân viên</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Email *</label>
                <input type="email" className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="email@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-2">Phân quyền</label>
                <div className="space-y-2">
                  {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowInvite(false)} className="flex-1 border py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => inviteMutation.mutate({ email, permissions })}
                disabled={!email || inviteMutation.isPending}
                className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {inviteMutation.isPending ? 'Đang gửi...' : 'Gửi lời mời'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
