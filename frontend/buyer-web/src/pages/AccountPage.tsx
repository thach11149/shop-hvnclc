import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function AccountPage() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/account').then(r => r.data.data),
  });

  const { register, handleSubmit } = useForm({
    values: { fullName: profile?.buyerProfile?.fullName || '' },
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => apiClient.patch('/account', data),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => toast.error('Lỗi cập nhật'),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thông tin tài khoản</h1>

      <div className="card p-6">
        <form onSubmit={handleSubmit((data) => updateProfile.mutate(data))} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input value={profile?.email || ''} disabled className="input mt-1 bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Họ và tên</label>
            <input {...register('fullName')} className="input mt-1" placeholder="Nhập họ và tên" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
            <input value={profile?.phone || ''} disabled className="input mt-1 bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Tài khoản role</label>
            <input value={profile?.role || ''} disabled className="input mt-1 bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Điểm tích lũy</label>
            <input value={profile?.loyaltyAccount?.points || 0} disabled className="input mt-1 bg-gray-50" />
          </div>
          <button type="submit" disabled={updateProfile.isPending} className="btn-primary">
            {updateProfile.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}
