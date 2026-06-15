import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Edit, Star, X, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const emptyForm = {
  name: '', code: '', logoUrl: '', trackingUrlTemplate: '', apiEndpoint: '', apiKey: '',
  codSupport: true, estimatedDays: '1-3', isActive: true,
  rates: [{ region: 'Nội thành', weight: '0-1kg', fee: '' }],
};

export default function ShippingCarriersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editCarrier, setEditCarrier] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data, isLoading } = useQuery({
    queryKey: ['shipping-carriers'],
    queryFn: () => apiClient.get('/admin/shipping-carriers').then(r => r.data),
  });

  const carriers: any[] = data?.data?.data || data?.data || [];

  const create = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admin/shipping-carriers', payload),
    onSuccess: () => { toast.success('Đã thêm đơn vị vận chuyển'); queryClient.invalidateQueries({ queryKey: ['shipping-carriers'] }); setShowModal(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: any) => apiClient.patch(`/admin/shipping-carriers/${id}`, payload),
    onSuccess: () => { toast.success('Đã cập nhật'); queryClient.invalidateQueries({ queryKey: ['shipping-carriers'] }); setShowModal(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: any) => apiClient.patch(`/admin/shipping-carriers/${id}`, { isActive: !isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping-carriers'] }),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/shipping-carriers/${id}`, { isDefault: true }),
    onSuccess: () => { toast.success('Đã đặt làm mặc định'); queryClient.invalidateQueries({ queryKey: ['shipping-carriers'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const openCreate = () => { setForm({ ...emptyForm }); setEditCarrier(null); setShowModal(true); };
  const openEdit = (c: any) => {
    setEditCarrier(c);
    setForm({
      name: c.name || '',
      code: c.code || '',
      logoUrl: c.logoUrl || c.logo || '',
      trackingUrlTemplate: c.trackingUrl || c.trackingUrlTemplate || '',
      apiEndpoint: c.apiEndpoint || '',
      apiKey: '',
      codSupport: c.codSupport ?? true,
      estimatedDays: c.estimatedDays || c.estimatedDelivery || '1-3',
      isActive: c.isActive,
      rates: c.rates || [{ region: 'Nội thành', weight: '0-1kg', fee: '' }],
    });
    setShowModal(true);
  };

  const addRate = () => setForm(f => ({ ...f, rates: [...f.rates, { region: '', weight: '', fee: '' }] }));
  const removeRate = (idx: number) => setForm(f => ({ ...f, rates: f.rates.filter((_, i) => i !== idx) }));
  const updateRate = (idx: number, field: string, val: string) =>
    setForm(f => ({ ...f, rates: f.rates.map((r, i) => i === idx ? { ...r, [field]: val } : r) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, rates: form.rates.filter(r => r.region || r.fee) };
    if (editCarrier) update.mutate({ id: editCarrier.id, ...payload });
    else create.mutate(payload);
  };

  return (
    <div>
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg">{editCarrier ? 'Sửa đơn vị vận chuyển' : 'Thêm đơn vị vận chuyển'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tên hãng *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mã *</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input w-full" placeholder="GHTK, GHN, VTP..." required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">URL Logo</label>
                <input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} className="input w-full" placeholder="https://..." />
                {form.logoUrl && <img src={form.logoUrl} className="mt-2 h-10 object-contain" alt="logo" />}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">URL Tracking (dùng {'{code}'} làm placeholder)</label>
                <input value={form.trackingUrlTemplate} onChange={e => setForm({ ...form, trackingUrlTemplate: e.target.value })} className="input w-full" placeholder="https://carrier.vn/tracking?code={code}" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Thời gian giao hàng</label>
                  <input value={form.estimatedDays} onChange={e => setForm({ ...form, estimatedDays: e.target.value })} className="input w-full" placeholder="1-3 ngày" />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.codSupport} onChange={e => setForm({ ...form, codSupport: e.target.checked })} />
                    Hỗ trợ COD
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                    Kích hoạt
                  </label>
                </div>
              </div>

              {/* Rate table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500">Bảng phí vận chuyển</label>
                  <button type="button" onClick={addRate} className="text-xs text-blue-600 hover:underline">+ Thêm dòng</button>
                </div>
                <div className="space-y-2">
                  {form.rates.map((rate, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input value={rate.region} onChange={e => updateRate(idx, 'region', e.target.value)} className="input text-xs flex-1" placeholder="Khu vực" />
                      <input value={rate.weight} onChange={e => updateRate(idx, 'weight', e.target.value)} className="input text-xs flex-1" placeholder="Cân nặng" />
                      <input value={rate.fee} onChange={e => updateRate(idx, 'fee', e.target.value)} type="number" className="input text-xs w-28" placeholder="Phí (₫)" />
                      <button type="button" onClick={() => removeRate(idx)} className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary flex-1 disabled:opacity-50">
                  {editCarrier ? 'Lưu thay đổi' : 'Thêm hãng vận chuyển'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Đơn vị vận chuyển</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm hãng VC
        </button>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">Đang tải...</div>
      ) : carriers.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Truck size={40} className="mx-auto mb-3 text-gray-300" />
          <p>Chưa có đơn vị vận chuyển nào</p>
          <button onClick={openCreate} className="mt-4 btn-primary text-sm">Thêm ngay</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Hãng vận chuyển</th>
                <th className="text-left px-4 py-3 text-gray-500">Mã</th>
                <th className="text-center px-4 py-3 text-gray-500">COD</th>
                <th className="text-left px-4 py-3 text-gray-500">Thời gian giao</th>
                <th className="text-left px-4 py-3 text-gray-500">URL Tracking</th>
                <th className="text-center px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {carriers.map((carrier: any) => (
                <tr key={carrier.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {(carrier.logoUrl || carrier.logo) ? (
                        <img src={carrier.logoUrl || carrier.logo} className="h-7 w-auto object-contain" alt={carrier.name} />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-400"><Truck size={14} /></div>
                      )}
                      <div>
                        <p className="font-medium">{carrier.name}</p>
                        {carrier.isDefault && <span className="text-xs text-yellow-600">⭐ Mặc định</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{carrier.code}</code></td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${carrier.codSupport ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {carrier.codSupport ? 'Có' : 'Không'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{carrier.estimatedDays || carrier.estimatedDelivery || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[180px] truncate">
                    {carrier.trackingUrl || carrier.trackingUrlTemplate || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive.mutate({ id: carrier.id, isActive: carrier.isActive })}
                      className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${carrier.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {carrier.isActive ? 'Hoạt động' : 'Tắt'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(carrier)} className="text-blue-600 hover:text-blue-700 p-1" title="Sửa">
                        <Edit size={15} />
                      </button>
                      {!carrier.isDefault && (
                        <button onClick={() => setDefault.mutate(carrier.id)} className="text-yellow-500 hover:text-yellow-600 p-1" title="Đặt mặc định">
                          <Star size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
