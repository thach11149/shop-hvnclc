import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Lock, MapPin, ShoppingBag, Camera, Plus, Edit2, Trash2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

type Tab = 'profile' | 'security' | 'addresses' | 'orders';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  SHIPPING: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  RETURNED: { label: 'Hoàn trả', color: 'bg-gray-100 text-gray-700' },
};

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['account-profile'],
    queryFn: () => apiClient.get('/account').then(r => r.data.data),
  });

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    values: {
      fullName: profile?.buyerProfile?.fullName || '',
      phone: profile?.phone || '',
      gender: profile?.buyerProfile?.gender || '',
      birthday: profile?.buyerProfile?.birthday
        ? profile.buyerProfile.birthday.slice(0, 10)
        : '',
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => apiClient.patch('/account', data),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['account-profile'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi cập nhật'),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post('/upload/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        await apiClient.patch('/account', { avatar: url });
        queryClient.invalidateQueries({ queryKey: ['account-profile'] });
        toast.success('Cập nhật ảnh đại diện thành công');
      }
    } catch {
      toast.error('Không thể tải ảnh lên');
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const currentAvatar = avatarPreview || profile?.buyerProfile?.avatar || profile?.avatar;

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 bg-white border border-gray-300 rounded-full p-1.5 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="font-medium text-gray-800">{profile?.buyerProfile?.fullName || profile?.email}</p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          {uploading && <p className="text-xs text-blue-500 mt-1">Đang tải ảnh...</p>}
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit((data) => updateProfile.mutate(data))} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
          <input value={profile?.email || ''} disabled className="input bg-gray-50 text-gray-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Họ và tên</label>
          <input
            {...register('fullName')}
            className="input"
            placeholder="Nhập họ và tên"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Số điện thoại</label>
          <input
            {...register('phone')}
            className="input"
            placeholder="Nhập số điện thoại"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Giới tính</label>
            <select {...register('gender')} className="input">
              <option value="">-- Chọn --</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Ngày sinh</label>
            <input
              type="date"
              {...register('birthday')}
              className="input"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={updateProfile.isPending || (!isDirty)}
          className="btn-primary disabled:opacity-50"
        >
          {updateProfile.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>();

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.post('/account/change-password', data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công');
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Đổi mật khẩu thất bại'),
  });

  const newPw = watch('newPassword');

  const onSubmit = (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    changePassword.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword });
  };

  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-gray-600 mb-4">Để bảo mật tài khoản, hãy sử dụng mật khẩu có ít nhất 8 ký tự.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            {...register('currentPassword', { required: 'Bắt buộc nhập' })}
            className="input"
            placeholder="••••••••"
          />
          {errors.currentPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Mật khẩu mới</label>
          <input
            type="password"
            {...register('newPassword', {
              required: 'Bắt buộc nhập',
              minLength: { value: 8, message: 'Tối thiểu 8 ký tự' },
            })}
            className="input"
            placeholder="••••••••"
          />
          {errors.newPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Bắt buộc nhập',
              validate: val => val === newPw || 'Mật khẩu không khớp',
            })}
            className="input"
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={changePassword.isPending}
          className="btn-primary disabled:opacity-50"
        >
          {changePassword.isPending ? 'Đang xử lý...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}

// ─── Address Tab ──────────────────────────────────────────────────────────────

type AddressForm = {
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
};

function AddressTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['account-addresses'],
    queryFn: () => apiClient.get('/account/addresses').then(r => r.data.data),
  });

  const { register, handleSubmit, reset, setValue } = useForm<AddressForm>({
    defaultValues: { fullName: '', phone: '', address: '', ward: '', district: '', province: '', isDefault: false },
  });

  const createAddress = useMutation({
    mutationFn: (data: AddressForm) => apiClient.post('/account/addresses', data),
    onSuccess: () => {
      toast.success('Thêm địa chỉ thành công');
      queryClient.invalidateQueries({ queryKey: ['account-addresses'] });
      setShowForm(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi thêm địa chỉ'),
  });

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressForm }) =>
      apiClient.put(`/account/addresses/${id}`, data),
    onSuccess: () => {
      toast.success('Cập nhật địa chỉ thành công');
      queryClient.invalidateQueries({ queryKey: ['account-addresses'] });
      setEditingId(null);
      setShowForm(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi cập nhật địa chỉ'),
  });

  const deleteAddress = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/account/addresses/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['account-addresses'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi xóa địa chỉ'),
  });

  const handleEdit = (addr: any) => {
    setEditingId(addr.id);
    setValue('fullName', addr.fullName || '');
    setValue('phone', addr.phone || '');
    setValue('address', addr.address || '');
    setValue('ward', addr.ward || '');
    setValue('district', addr.district || '');
    setValue('province', addr.province || '');
    setValue('isDefault', addr.isDefault || false);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: AddressForm) => {
    if (editingId) {
      updateAddress.mutate({ id: editingId, data });
    } else {
      createAddress.mutate(data);
    }
  };

  const isMutating = createAddress.isPending || updateAddress.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Quản lý địa chỉ giao hàng của bạn.</p>
        {!showForm && (
          <button
            onClick={() => { setEditingId(null); reset(); setShowForm(true); }}
            className="flex items-center gap-1.5 btn-primary text-sm px-3 py-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm địa chỉ
          </button>
        )}
      </div>

      {/* Address form */}
      {showForm && (
        <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 space-y-3">
          <h3 className="font-medium text-gray-800 mb-2">
            {editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Họ tên người nhận</label>
                <input
                  {...register('fullName', { required: true })}
                  className="input text-sm"
                  placeholder="Họ và tên"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Số điện thoại</label>
                <input
                  {...register('phone', { required: true })}
                  className="input text-sm"
                  placeholder="Số điện thoại"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Địa chỉ cụ thể</label>
              <input
                {...register('address', { required: true })}
                className="input text-sm"
                placeholder="Số nhà, tên đường..."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Phường/Xã</label>
                <input {...register('ward')} className="input text-sm" placeholder="Phường/Xã" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Quận/Huyện</label>
                <input {...register('district')} className="input text-sm" placeholder="Quận/Huyện" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Tỉnh/Thành phố</label>
                <input {...register('province')} className="input text-sm" placeholder="Tỉnh/Thành phố" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isDefault')} className="rounded" />
              <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isMutating} className="btn-primary text-sm disabled:opacity-50">
                {isMutating ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm địa chỉ')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address list */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Đang tải...</div>
      ) : (addresses?.length ?? 0) === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có địa chỉ nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(addresses || []).map((addr: any) => (
            <div
              key={addr.id}
              className={`border rounded-xl p-4 flex items-start justify-between ${
                addr.isDefault ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-800">{addr.fullName}</p>
                  {addr.isDefault && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{addr.phone}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {[addr.address, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                <button
                  onClick={() => handleEdit(addr)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Xóa địa chỉ này?')) deleteAddress.mutate(addr.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab() {
  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['account-recent-orders'],
    queryFn: () => apiClient.get('/orders?limit=5').then(r => r.data.data),
  });

  const orders: any[] = ordersRes?.data || ordersRes || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">5 đơn hàng gần nhất</p>
        <Link to="/orders" className="text-sm text-blue-600 hover:underline font-medium">
          Xem tất cả →
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Mã đơn</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ngày đặt</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => {
                const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
                return (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      #{order.orderNumber || order.id?.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {Number(order.total || order.totalAmount || 0).toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'profile', label: 'Hồ sơ', Icon: User },
  { id: 'security', label: 'Bảo mật', Icon: Lock },
  { id: 'addresses', label: 'Địa chỉ', Icon: MapPin },
  { id: 'orders', label: 'Đơn hàng', Icon: ShoppingBag },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tài khoản của tôi</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="card p-6">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'addresses' && <AddressTab />}
        {activeTab === 'orders' && <OrdersTab />}
      </div>
    </div>
  );
}
