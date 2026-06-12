import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  ENDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-orange-100 text-orange-600',
};

const TYPE_LABELS: Record<string, string> = {
  GENERAL: 'Chung',
  FLASH_SALE: 'Flash Sale',
  SEASONAL: 'Theo mùa',
  CATEGORY_FOCUS: 'Theo danh mục',
};

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => apiClient.get('/campaigns?limit=50').then(r => r.data.data),
  });

  const createCampaign = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/campaigns', data),
    onSuccess: () => {
      toast.success('Chiến dịch đã được tạo');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      setShowForm(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo chiến dịch'),
  });

  const updateCampaign = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.patch(`/admin/campaigns/${id}`, data),
    onSuccess: () => {
      toast.success('Đã cập nhật chiến dịch');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý chiến dịch</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2">
          + Tạo chiến dịch
        </button>
      </div>

      {showForm && (
        <div className="card p-4 mb-6">
          <h2 className="font-semibold mb-4">Tạo chiến dịch mới</h2>
          <form onSubmit={handleSubmit((data) => createCampaign.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tên chiến dịch *</label>
                <input {...register('name', { required: true })} className="input mt-1" placeholder="Tên chiến dịch" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Slug *</label>
                <input {...register('slug', { required: true })} className="input mt-1" placeholder="slug-chien-dich" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Loại chiến dịch *</label>
                <select {...register('type', { required: true })} className="input mt-1">
                  <option value="GENERAL">Chung</option>
                  <option value="FLASH_SALE">Flash Sale</option>
                  <option value="SEASONAL">Theo mùa</option>
                  <option value="CATEGORY_FOCUS">Theo danh mục</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ngày bắt đầu *</label>
                <input {...register('startAt', { required: true })} type="datetime-local" className="input mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ngày kết thúc *</label>
                <input {...register('endAt', { required: true })} type="datetime-local" className="input mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mô tả</label>
              <textarea {...register('description')} rows={2} className="input mt-1 resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">URL Banner</label>
              <input {...register('bannerUrl')} className="input mt-1" placeholder="https://..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createCampaign.isPending} className="btn-primary disabled:opacity-50">
                {createCampaign.isPending ? 'Đang tạo...' : 'Tạo chiến dịch'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">Chưa có chiến dịch nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Tên chiến dịch</th>
                <th className="text-left px-4 py-3 text-gray-500">Loại</th>
                <th className="text-left px-4 py-3 text-gray-500">Thời gian</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((campaign: any) => (
                <tr key={campaign.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-xs text-gray-400">/{campaign.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{TYPE_LABELS[campaign.type] || campaign.type}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(campaign.startAt).toLocaleDateString('vi-VN')} - {new Date(campaign.endAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[campaign.status] || 'bg-gray-100'}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {campaign.status === 'DRAFT' && (
                        <button
                          onClick={() => updateCampaign.mutate({ id: campaign.id, data: { status: 'ACTIVE' } })}
                          className="text-green-600 text-xs hover:underline"
                        >
                          Kích hoạt
                        </button>
                      )}
                      {campaign.status === 'ACTIVE' && (
                        <button
                          onClick={() => updateCampaign.mutate({ id: campaign.id, data: { status: 'ENDED' } })}
                          className="text-orange-500 text-xs hover:underline"
                        >
                          Kết thúc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
