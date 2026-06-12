import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  isDefault: boolean;
}

interface AddressForm {
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  isDefault: boolean;
}

const defaultForm: AddressForm = {
  label: '',
  recipientName: '',
  phone: '',
  street: '',
  district: '',
  city: '',
  province: '',
  isDefault: false,
};

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/user/addresses').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: AddressForm) => apiClient.post('/user/addresses', data),
    onSuccess: () => {
      toast.success('Đã thêm địa chỉ mới');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể thêm địa chỉ'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressForm> }) =>
      apiClient.patch(`/user/addresses/${id}`, data),
    onSuccess: () => {
      toast.success('Đã cập nhật địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/user/addresses/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể xóa'),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/user/addresses/${id}`, { isDefault: true }),
    onSuccess: () => {
      toast.success('Đã đặt địa chỉ mặc định');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const resetForm = () => {
    setForm(defaultForm);
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (address: Address) => {
    setForm({
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      street: address.street,
      district: address.district,
      city: address.city,
      province: address.province,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Địa chỉ của tôi</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary text-sm"
        >
          + Thêm địa chỉ mới
        </button>
      </div>

      {/* Address Form */}
      {showForm && (
        <div className="card p-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4">
            {editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tên người nhận *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={form.recipientName}
                  onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  className="input w-full"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nhãn địa chỉ</label>
              <input
                type="text"
                className="input w-full"
                placeholder="VD: Nhà, Văn phòng..."
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Địa chỉ chi tiết *</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Số nhà, tên đường..."
                value={form.street}
                onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Quận/Huyện *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={form.district}
                  onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Thành phố *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tỉnh/Thành *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={form.province}
                  onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                  required
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
              />
              Đặt làm địa chỉ mặc định
            </label>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={resetForm} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Hủy</button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary text-sm"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm địa chỉ')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !data?.length ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📍</p>
          <p>Bạn chưa có địa chỉ nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((address: Address) => (
            <div key={address.id} className={`card p-4 ${address.isDefault ? 'border-primary-500 border-2' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{address.recipientName}</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-600">{address.phone}</span>
                    {address.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Mặc định</span>
                    )}
                    {address.label && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{address.label}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {address.street}, {address.district}, {address.city}, {address.province}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!address.isDefault && (
                    <button
                      onClick={() => setDefaultMutation.mutate(address.id)}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Mặc định
                    </button>
                  )}
                  <button onClick={() => startEdit(address)} className="text-xs text-blue-600 hover:underline">Sửa</button>
                  <button
                    onClick={() => {
                      if (window.confirm('Xóa địa chỉ này?')) deleteMutation.mutate(address.id);
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
