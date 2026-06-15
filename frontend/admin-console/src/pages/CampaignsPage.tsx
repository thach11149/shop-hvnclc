import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Search, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  ENDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-orange-100 text-orange-600',
};

const TYPE_LABELS: Record<string, string> = {
  GENERAL: 'Chung', FLASH_SALE: 'Flash Sale',
  SEASONAL: 'Theo mùa', CATEGORY_FOCUS: 'Theo danh mục',
};

const STATUS_TAB_LABELS: Record<string, string> = {
  all: 'Tất cả', DRAFT: 'Nháp', ACTIVE: 'Đang chạy', ENDED: 'Kết thúc',
};

interface CampaignForm {
  name: string;
  slug: string;
  type: string;
  description: string;
  bannerUrl: string;
  startAt: string;
  endAt: string;
}

const emptyForm: CampaignForm = {
  name: '', slug: '', type: 'GENERAL', description: '', bannerUrl: '', startAt: '', endAt: '',
};

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-campaigns', statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      return apiClient.get(`/campaigns?${params}`).then(r => r.data.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignForm) => apiClient.post('/admin/campaigns', data),
    onSuccess: () => {
      toast.success('Đã tạo chiến dịch');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.patch(`/admin/campaigns/${id}`, data),
    onSuccess: () => {
      toast.success('Đã cập nhật chiến dịch');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/campaigns/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa chiến dịch');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      setDeleteConfirm(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi xóa'),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (campaign: any) => {
    setEditId(campaign.id);
    setForm({
      name: campaign.name,
      slug: campaign.slug,
      type: campaign.type,
      description: campaign.description || '',
      bannerUrl: campaign.bannerUrl || '',
      startAt: campaign.startAt ? campaign.startAt.slice(0, 16) : '',
      endAt: campaign.endAt ? campaign.endAt.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.name || !form.slug || !form.startAt || !form.endAt) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  const campaigns: any[] = data?.data || data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý chiến dịch</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Tạo chiến dịch
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm chiến dịch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {Object.entries(STATUS_TAB_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                statusFilter === key ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !campaigns.length ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-3xl mb-3">🎪</p>
          <p>Chưa có chiến dịch nào</p>
          <button onClick={openCreate} className="btn-primary mt-3">Tạo chiến dịch đầu tiên</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign: any) => {
            const isActive = campaign.status === 'ACTIVE';
            return (
              <div key={campaign.id} className={`card overflow-hidden ${isActive ? 'ring-2 ring-green-300' : ''}`}>
                {campaign.bannerUrl && (
                  <div className="h-28 overflow-hidden">
                    <img src={campaign.bannerUrl} alt={campaign.name}
                      className="w-full h-full object-cover" />
                  </div>
                )}
                {!campaign.bannerUrl && (
                  <div className="h-16 bg-gradient-to-r from-primary-500 to-primary-700 flex items-center justify-center">
                    <Image size={24} className="text-white opacity-50" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 truncate">{campaign.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[campaign.status] || 'bg-gray-100'}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">/{campaign.slug}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">
                      {TYPE_LABELS[campaign.type] || campaign.type}
                    </span>
                  </div>

                  {campaign.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{campaign.description}</p>
                  )}

                  <p className="text-xs text-gray-400 mb-3">
                    {new Date(campaign.startAt).toLocaleDateString('vi-VN')} — {new Date(campaign.endAt).toLocaleDateString('vi-VN')}
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => openEdit(campaign)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <Edit size={12} /> Sửa
                    </button>
                    {campaign.status === 'DRAFT' && (
                      <button
                        onClick={() => updateMutation.mutate({ id: campaign.id, data: { status: 'ACTIVE' } })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                      >
                        <ToggleRight size={12} /> Kích hoạt
                      </button>
                    )}
                    {campaign.status === 'ACTIVE' && (
                      <button
                        onClick={() => updateMutation.mutate({ id: campaign.id, data: { status: 'DRAFT' } })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 text-xs text-orange-500 hover:underline"
                      >
                        <ToggleLeft size={12} /> Tạm dừng
                      </button>
                    )}
                    {campaign.status === 'DRAFT' && (
                      <button
                        onClick={() => setDeleteConfirm(campaign.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:underline ml-auto"
                      >
                        <Trash2 size={12} /> Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-5">{editId ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên chiến dịch *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editId ? f.slug : slugify(e.target.value) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Siêu sale 6.6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="sieu-sale-6-6"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại chiến dịch *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="GENERAL">Chung</option>
                  <option value="FLASH_SALE">Flash Sale</option>
                  <option value="SEASONAL">Theo mùa</option>
                  <option value="CATEGORY_FOCUS">Theo danh mục</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    min={form.startAt}
                    onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Mô tả chiến dịch..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Banner</label>
                <input
                  type="url"
                  value={form.bannerUrl}
                  onChange={e => setForm(f => ({ ...f, bannerUrl: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="https://cdn.example.com/banner.jpg"
                />
                {form.bannerUrl && (
                  <img src={form.bannerUrl} alt="banner preview"
                    className="mt-2 h-20 object-cover rounded-lg w-full"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={closeForm}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Tạo chiến dịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg mb-2">Xóa chiến dịch?</h3>
            <p className="text-sm text-gray-600 mb-4">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
