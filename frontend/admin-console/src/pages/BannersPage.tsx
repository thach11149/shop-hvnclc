import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [form, setForm] = useState({ title: '', imageUrl: '', linkUrl: '', position: 'HOME_TOP', sortOrder: '0', isActive: true });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => apiClient.get('/admin/banners').then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admin/banners', payload),
    onSuccess: () => { toast.success('Đã tạo banner'); queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); setShowForm(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: any) => apiClient.patch(`/admin/banners/${id}`, payload),
    onSuccess: () => { toast.success('Đã cập nhật banner'); queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); setEditBanner(null); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const deleteBanner = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/banners/${id}`),
    onSuccess: () => { toast.success('Đã xóa banner'); queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, sortOrder: Number(form.sortOrder) };
    if (editBanner) update.mutate({ id: editBanner.id, ...payload });
    else create.mutate(payload);
  };

  const openEdit = (banner: any) => {
    setEditBanner(banner);
    setForm({ title: banner.title, imageUrl: banner.imageUrl, linkUrl: banner.linkUrl || '', position: banner.position, sortOrder: String(banner.sortOrder), isActive: banner.isActive });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Banner</h1>
        <button onClick={() => { setShowForm(true); setEditBanner(null); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm Banner
        </button>
      </div>

      {(showForm || editBanner) && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">{editBanner ? 'Sửa banner' : 'Thêm banner mới'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tiêu đề</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vị trí</label>
                <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="input w-full">
                  <option value="HOME_TOP">Trang chủ - Trên cùng</option>
                  <option value="HOME_MIDDLE">Trang chủ - Giữa</option>
                  <option value="CATEGORY_TOP">Danh mục - Trên</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL hình ảnh *</label>
              <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="input w-full" required placeholder="https://..." />
            </div>
            {form.imageUrl && <img src={form.imageUrl} className="w-full max-h-40 object-cover rounded" alt="preview" />}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">URL liên kết</label>
                <input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} className="input w-full" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Thứ tự</label>
                <input value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} type="number" className="input w-full" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              Kích hoạt
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary disabled:opacity-50">
                {editBanner ? 'Lưu thay đổi' : 'Tạo banner'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditBanner(null); }} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 p-8 text-center text-gray-500">Đang tải...</div>
        ) : data?.data?.map((banner: any) => (
          <div key={banner.id} className="card overflow-hidden">
            <img src={banner.imageUrl} alt={banner.title} className="w-full h-32 object-cover" />
            <div className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{banner.title || 'Không có tiêu đề'}</p>
                  <p className="text-xs text-gray-400">{banner.position}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {banner.isActive ? 'Hiển thị' : 'Ẩn'}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => openEdit(banner)} className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                  <Edit size={12} /> Sửa
                </button>
                <button onClick={() => deleteBanner.mutate(banner.id)} className="text-red-500 text-xs hover:underline flex items-center gap-1">
                  <Trash2 size={12} /> Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
