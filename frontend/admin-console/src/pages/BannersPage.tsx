import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import ImageUpload from '../components/ImageUpload';

const POSITIONS = [
  { value: 'HOME_TOP', label: 'Trang chủ - Trên cùng' },
  { value: 'HOME_MIDDLE', label: 'Trang chủ - Giữa' },
  { value: 'HOME_BOTTOM', label: 'Trang chủ - Cuối' },
  { value: 'CATEGORY_TOP', label: 'Danh mục - Trên' },
  { value: 'FLASH_SALE', label: 'Flash Sale' },
  { value: 'SIDEBAR', label: 'Sidebar' },
];

const TARGET_PAGES = [
  { value: '', label: 'Không chọn' },
  { value: '/', label: 'Trang chủ' },
  { value: '/products', label: 'Sản phẩm' },
  { value: '/flash-sale', label: 'Flash Sale' },
  { value: '/campaigns', label: 'Chiến dịch' },
];

const emptyForm = { title: '', imageUrl: '', linkUrl: '', targetPage: '', position: 'HOME_TOP', sortOrder: '0', isActive: true, startAt: '', endAt: '' };

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => apiClient.get('/admin/banners/all').then(r => r.data),
  });

  const banners: any[] = (data?.data?.data || data?.data || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder);

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await apiClient.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data.url;
  };

  const create = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admin/banners', payload),
    onSuccess: () => { toast.success('Đã tạo banner'); queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); setShowModal(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: any) => apiClient.patch(`/admin/banners/${id}`, payload),
    onSuccess: () => { toast.success('Đã cập nhật banner'); queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); setShowModal(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const deleteBanner = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/banners/${id}`),
    onSuccess: () => { toast.success('Đã xóa banner'); queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiClient.patch(`/admin/banners/${id}`, { isActive: !isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => apiClient.patch('/admin/banners/reorder', { orderedIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const moveBanner = (idx: number, dir: -1 | 1) => {
    const newOrder = [...banners];
    const target = idx + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    reorder.mutate(newOrder.map((b: any) => b.id));
  };

  const openCreate = () => { setForm({ ...emptyForm }); setEditBanner(null); setShowModal(true); };
  const openEdit = (b: any) => {
    setEditBanner(b);
    setForm({
      title: b.title || '',
      imageUrl: b.imageUrl || '',
      linkUrl: b.linkUrl || b.link || '',
      targetPage: b.targetPage || '',
      position: b.position || 'HOME_TOP',
      sortOrder: String(b.sortOrder ?? 0),
      isActive: b.isActive,
      startAt: b.startAt ? b.startAt.slice(0, 16) : '',
      endAt: b.endAt ? b.endAt.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title || undefined,
      imageUrl: form.imageUrl,
      link: form.linkUrl || undefined,
      linkUrl: form.linkUrl || undefined,
      targetPage: form.targetPage || undefined,
      position: form.position,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
    };
    if (editBanner) update.mutate({ id: editBanner.id, ...payload });
    else create.mutate(payload);
  };

  return (
    <div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg">{editBanner ? 'Sửa banner' : 'Thêm banner mới'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Hình ảnh banner *</label>
                <ImageUpload
                  value={form.imageUrl ? [form.imageUrl] : []}
                  onChange={urls => setForm({ ...form, imageUrl: urls[0] || '' })}
                  maxFiles={1}
                  uploadFn={uploadImage}
                />
                {!form.imageUrl && (
                  <div className="mt-2">
                    <label className="block text-xs text-gray-400 mb-1">Hoặc nhập URL trực tiếp</label>
                    <input
                      value={form.imageUrl}
                      onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                      className="input w-full text-sm"
                      placeholder="https://example.com/banner.jpg"
                    />
                  </div>
                )}
              </div>

              {form.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={form.imageUrl} alt="preview" className="w-full h-40 object-cover" />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Tiêu đề</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input w-full" placeholder="Tiêu đề banner" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">URL liên kết</label>
                  <input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} className="input w-full" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Trang target</label>
                  <select value={form.targetPage} onChange={e => setForm({ ...form, targetPage: e.target.value })} className="input w-full">
                    {TARGET_PAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vị trí</label>
                  <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="input w-full">
                    {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Thứ tự ưu tiên</label>
                  <input value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} type="number" min="0" className="input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bắt đầu hiển thị</label>
                  <input value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} type="datetime-local" className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Kết thúc hiển thị</label>
                  <input value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })} type="datetime-local" className="input w-full" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                Kích hoạt ngay
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={!form.imageUrl || create.isPending || update.isPending} className="btn-primary flex-1 disabled:opacity-50">
                  {editBanner ? 'Lưu thay đổi' : 'Tạo banner'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Banner</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm Banner
        </button>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">Đang tải...</div>
      ) : banners.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">Chưa có banner nào. Nhấn "+ Thêm Banner" để bắt đầu.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {banners.map((banner: any, idx: number) => (
            <div key={banner.id} className="card overflow-hidden group">
              <div className="relative">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'banner'}
                  className="w-full h-36 object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x144?text=Banner'; }}
                />
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveBanner(idx, -1)} disabled={idx === 0} className="bg-white/90 p-1.5 rounded-lg shadow disabled:opacity-30 hover:bg-white">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moveBanner(idx, 1)} disabled={idx === banners.length - 1} className="bg-white/90 p-1.5 rounded-lg shadow disabled:opacity-30 hover:bg-white">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">#{idx + 1} · {banner.position}</span>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{banner.title || 'Không có tiêu đề'}</p>
                    {(banner.linkUrl || banner.link) && (
                      <a
                        href={banner.linkUrl || banner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 flex items-center gap-1 truncate hover:underline"
                      >
                        <ExternalLink size={10} />
                        {banner.linkUrl || banner.link}
                      </a>
                    )}
                    {(banner.startAt || banner.endAt) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {banner.startAt ? new Date(banner.startAt).toLocaleDateString('vi-VN') : '?'}
                        {' → '}
                        {banner.endAt ? new Date(banner.endAt).toLocaleDateString('vi-VN') : '∞'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleActive.mutate({ id: banner.id, isActive: banner.isActive })}
                    className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 cursor-pointer border ${banner.isActive ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                  >
                    {banner.isActive ? 'Hiện' : 'Ẩn'}
                  </button>
                </div>

                <div className="flex gap-2 mt-1">
                  <button onClick={() => openEdit(banner)} className="flex items-center gap-1 text-blue-600 text-xs hover:underline">
                    <Edit size={12} /> Sửa
                  </button>
                  <button
                    onClick={() => { if (confirm('Xóa banner này?')) deleteBanner.mutate(banner.id); }}
                    className="flex items-center gap-1 text-red-500 text-xs hover:underline"
                  >
                    <Trash2 size={12} /> Xóa
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
