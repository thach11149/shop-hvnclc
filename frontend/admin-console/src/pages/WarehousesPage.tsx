import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Warehouse, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Package, MapPin, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  address: string;
  district: string;
  province: string;
  phone?: string;
  managerName?: string;
  isActive: boolean;
  totalSkus: number;
  totalStock: number;
  createdAt: string;
}

const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

const EMPTY_FORM = { name: '', code: '', address: '', district: '', province: '', phone: '', managerName: '' };

interface WarehouseModalProps {
  initial?: Partial<typeof EMPTY_FORM>;
  title: string;
  onSave: (form: typeof EMPTY_FORM) => void;
  onClose: () => void;
  isPending: boolean;
}

function WarehouseModal({ initial, title, onSave, onClose, isPending }: WarehouseModalProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên kho <span className="text-red-500">*</span></label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="VD: Kho Miền Nam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã kho <span className="text-red-500">*</span></label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono uppercase"
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="VD: WH-HCM-01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ <span className="text-red-500">*</span></label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Số nhà, tên đường, phường/xã"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.district}
                onChange={e => set('district', e.target.value)}
                placeholder="VD: Quận 7"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.province}
                onChange={e => set('province', e.target.value)}
              >
                <option value="">-- Chọn tỉnh/TP --</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SĐT kho</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="0xxx xxx xxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người quản lý</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.managerName}
                onChange={e => set('managerName', e.target.value)}
                placeholder="Tên người phụ trách"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isPending || !form.name || !form.code || !form.address || !form.province}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WarehousesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const { data, isLoading } = useQuery<{ data: WarehouseItem[] }>({
    queryKey: ['admin-warehouses'],
    queryFn: () => apiClient.get('/admin/warehouses').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof EMPTY_FORM) => apiClient.post('/admin/warehouses', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-warehouses'] });
      setShowCreate(false);
      toast.success('Tạo kho thành công');
    },
    onError: () => toast.error('Không thể tạo kho'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & typeof EMPTY_FORM) =>
      apiClient.patch(`/admin/warehouses/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-warehouses'] });
      setEditingWarehouse(null);
      toast.success('Cập nhật kho thành công');
    },
    onError: () => toast.error('Không thể cập nhật kho'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/warehouses/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-warehouses'] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: () => toast.error('Không thể thay đổi trạng thái'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/warehouses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-warehouses'] });
      setDeletingId(null);
      toast.success('Đã xóa kho hàng');
    },
    onError: () => toast.error('Không thể xóa kho — kho có thể đang chứa hàng'),
  });

  const warehouses = (data?.data ?? []).filter(w => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.code.toLowerCase().includes(search.toLowerCase()) || w.province.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? w.isActive : !w.isActive);
    return matchSearch && matchStatus;
  });

  const totalActive = (data?.data ?? []).filter(w => w.isActive).length;
  const totalSkus = (data?.data ?? []).reduce((s, w) => s + (w.totalSkus || 0), 0);
  const totalStock = (data?.data ?? []).reduce((s, w) => s + (w.totalStock || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý kho hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý các kho lưu trữ hàng hóa trên hệ thống</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} /> Thêm kho
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng kho', value: data?.data?.length ?? 0, icon: <Warehouse size={20} className="text-blue-500" />, color: 'bg-blue-50' },
          { label: 'Đang hoạt động', value: totalActive, icon: <ToggleRight size={20} className="text-green-500" />, color: 'bg-green-50' },
          { label: 'Tổng SKU', value: totalSkus.toLocaleString(), icon: <Hash size={20} className="text-purple-500" />, color: 'bg-purple-50' },
          { label: 'Tổng tồn kho', value: totalStock.toLocaleString(), icon: <Package size={20} className="text-orange-500" />, color: 'bg-orange-50' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center`}>{c.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-xl font-bold text-gray-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-64"
          placeholder="Tìm theo tên, mã, tỉnh/TP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex bg-gray-100 rounded-xl p-1 text-sm">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${filterStatus === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {s === 'all' ? 'Tất cả' : s === 'active' ? 'Hoạt động' : 'Tạm dừng'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <Warehouse size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">Không tìm thấy kho hàng</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Mã kho', 'Tên kho', 'Tỉnh/TP', 'Địa chỉ', 'Người quản lý', 'SKU / Tồn', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {warehouses.map(w => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{w.code}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{w.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                      {w.province}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate" title={w.address}>{w.address}</td>
                  <td className="px-4 py-3 text-gray-600">{w.managerName || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900 font-medium">{(w.totalSkus || 0).toLocaleString()} SKU</div>
                    <div className="text-xs text-gray-400">{(w.totalStock || 0).toLocaleString()} sản phẩm</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${w.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {w.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingWarehouse(w)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(w.id)}
                        disabled={toggleMutation.isPending}
                        className={`p-1.5 rounded-lg transition-colors ${w.isActive ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                        title={w.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                      >
                        {w.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                      </button>
                      <button
                        onClick={() => setDeletingId(w.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa kho"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <WarehouseModal
          title="Tạo kho mới"
          onSave={form => createMutation.mutate(form)}
          onClose={() => setShowCreate(false)}
          isPending={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {editingWarehouse && (
        <WarehouseModal
          title="Chỉnh sửa kho hàng"
          initial={{
            name: editingWarehouse.name,
            code: editingWarehouse.code,
            address: editingWarehouse.address,
            district: editingWarehouse.district,
            province: editingWarehouse.province,
            phone: editingWarehouse.phone,
            managerName: editingWarehouse.managerName,
          }}
          onSave={form => updateMutation.mutate({ id: editingWarehouse.id, ...form })}
          onClose={() => setEditingWarehouse(null)}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete Confirm */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Xóa kho hàng?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Hành động này không thể hoàn tác. Kho chứa hàng sẽ không thể xóa.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700">
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
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
