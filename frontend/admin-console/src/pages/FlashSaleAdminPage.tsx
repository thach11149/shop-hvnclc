import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Zap, CheckCircle, XCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const SLOT_STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-orange-100 text-orange-700',
  ENDED: 'bg-gray-100 text-gray-500',
};

const ITEM_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-orange-100 text-orange-700',
  ENDED: 'bg-gray-100 text-gray-500',
};

export default function FlashSaleAdminPage() {
  const queryClient = useQueryClient();
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({ name: '', startTime: '', endTime: '' });
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [itemStatusFilter, setItemStatusFilter] = useState<'PENDING' | 'all'>('PENDING');
  const [slotSearch, setSlotSearch] = useState('');

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['admin-flash-sale-slots'],
    queryFn: () => apiClient.get('/admin/flash-sale-slots').then(r => r.data.data),
  });

  const { data: allPendingItems } = useQuery({
    queryKey: ['admin-flash-sale-items-pending'],
    queryFn: () => apiClient.get('/admin/flash-sale-items?status=PENDING').then(r => r.data.data),
  });

  const { data: allItems } = useQuery({
    queryKey: ['admin-flash-sale-items-all'],
    queryFn: () => apiClient.get('/admin/flash-sale-items').then(r => r.data.data),
    enabled: itemStatusFilter === 'all',
  });

  const createSlotMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/flash-sale-slots', data),
    onSuccess: () => {
      toast.success('Đã tạo khung giờ flash sale');
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-slots'] });
      setShowCreateSlot(false);
      setSlotForm({ name: '', startTime: '', endTime: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo'),
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/flash-sale-slots/${id}`, { status }),
    onSuccess: () => { toast.success('Đã cập nhật slot'); queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-slots'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const approveItemMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      apiClient.patch(`/admin/flash-sale-items/${id}/${approve ? 'approve' : 'reject'}`),
    onSuccess: (_, { approve }) => {
      toast.success(approve ? 'Đã duyệt sản phẩm' : 'Đã từ chối sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-items-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-items-all'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const pendingItems = allPendingItems || [];
  const filteredSlots = slots?.filter((s: any) =>
    !slotSearch || s.name.toLowerCase().includes(slotSearch.toLowerCase())
  ) || [];

  const displayItems = itemStatusFilter === 'PENDING' ? pendingItems : (allItems || []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Zap size={20} className="text-orange-500" /> Quản lý Flash Sale
        </h1>
        <button
          onClick={() => setShowCreateSlot(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600"
        >
          <Plus size={16} /> Tạo khung giờ
        </button>
      </div>

      {/* Pending Approvals */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">
            Duyệt đăng ký
            {pendingItems.length > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingItems.length}</span>
            )}
          </h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setItemStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-md text-xs ${itemStatusFilter === 'PENDING' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
            >
              Chờ duyệt ({pendingItems.length})
            </button>
            <button
              onClick={() => setItemStatusFilter('all')}
              className={`px-3 py-1 rounded-md text-xs ${itemStatusFilter === 'all' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {displayItems.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">
            {itemStatusFilter === 'PENDING' ? 'Không có sản phẩm chờ duyệt' : 'Không có dữ liệu'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Sản phẩm</th>
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Shop</th>
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Khung giờ</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Giá gốc</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Giá flash</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">SL</th>
                  <th className="text-center px-4 py-2.5 text-gray-500 font-medium">Trạng thái</th>
                  {itemStatusFilter === 'PENDING' && (
                    <th className="text-center px-4 py-2.5 text-gray-500 font-medium">Hành động</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item: any) => {
                  const discount = item.sku?.price > 0
                    ? Math.round((1 - item.salePrice / item.sku.price) * 100)
                    : 0;
                  return (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.sku?.product?.images?.[0]?.url && (
                            <img src={item.sku.product.images[0].url} alt="" className="w-8 h-8 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium text-xs line-clamp-1">{item.sku?.product?.name || item.skuId}</p>
                            <p className="text-xs text-gray-400">{item.sku?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{item.sku?.product?.shop?.name || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.flashSaleSlot?.name}</td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400 line-through">
                        {item.sku?.price ? Number(item.sku.price).toLocaleString('vi-VN') + '₫' : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-orange-600 font-bold">{Number(item.salePrice).toLocaleString('vi-VN')}₫</span>
                        {discount > 0 && (
                          <span className="ml-1 bg-red-100 text-red-600 text-xs px-1 rounded">-{discount}%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">{item.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${ITEM_STATUS_COLORS[item.status] || 'bg-gray-100'}`}>
                          {item.status}
                        </span>
                      </td>
                      {itemStatusFilter === 'PENDING' && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => approveItemMutation.mutate({ id: item.id, approve: true })}
                              disabled={approveItemMutation.isPending}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center gap-1"
                            >
                              <CheckCircle size={11} /> Duyệt
                            </button>
                            <button
                              onClick={() => approveItemMutation.mutate({ id: item.id, approve: false })}
                              disabled={approveItemMutation.isPending}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center gap-1"
                            >
                              <XCircle size={11} /> Từ chối
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flash Sale Slots */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Khung giờ Flash Sale</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm khung giờ..."
              value={slotSearch}
              onChange={e => setSlotSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-48"
            />
          </div>
        </div>

        {slotsLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !filteredSlots.length ? (
          <p className="text-center text-gray-400 py-8 text-sm">Chưa có khung giờ nào</p>
        ) : (
          <div className="space-y-3">
            {filteredSlots.map((slot: any) => {
              const isExpanded = expandedSlot === slot.id;
              const itemCount = slot.items?.length || 0;
              const approvedCount = slot.items?.filter((i: any) => i.status === 'APPROVED' || i.status === 'ACTIVE').length || 0;
              const now = new Date();
              const start = new Date(slot.startTime);
              const end = new Date(slot.endTime);
              const isActive = now >= start && now <= end;
              const isUpcoming = now < start;

              return (
                <div key={slot.id} className={`border rounded-xl overflow-hidden ${
                  isActive ? 'border-orange-300' : 'border-gray-200'
                }`}>
                  <div
                    className={`p-4 cursor-pointer ${isActive ? 'bg-orange-50' : 'hover:bg-gray-50'} transition-colors`}
                    onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isActive && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{slot.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${SLOT_STATUS_COLORS[slot.status] || 'bg-gray-100'}`}>
                              {isActive ? 'Đang diễn ra' : isUpcoming ? 'Sắp diễn ra' : slot.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {start.toLocaleString('vi-VN')} — {end.toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{approvedCount}/{itemCount} sp duyệt</p>
                        </div>
                        {slot.status === 'UPCOMING' && (
                          <button
                            onClick={e => { e.stopPropagation(); updateSlotMutation.mutate({ id: slot.id, status: 'CANCELLED' }); }}
                            className="text-xs text-red-500 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Hủy
                          </button>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && slot.items?.length > 0 && (
                    <div className="border-t">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs text-gray-500">Sản phẩm</th>
                            <th className="text-right px-4 py-2 text-xs text-gray-500">Giá flash</th>
                            <th className="text-center px-4 py-2 text-xs text-gray-500">SL</th>
                            <th className="text-center px-4 py-2 text-xs text-gray-500">Đã bán</th>
                            <th className="text-center px-4 py-2 text-xs text-gray-500">TT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {slot.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-xs">{item.sku?.name || item.skuId}</td>
                              <td className="px-4 py-2 text-right text-xs text-orange-600 font-medium">
                                {Number(item.salePrice).toLocaleString('vi-VN')}₫
                              </td>
                              <td className="px-4 py-2 text-center text-xs">{item.quantity}</td>
                              <td className="px-4 py-2 text-center text-xs">{item.soldCount || 0}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${ITEM_STATUS_COLORS[item.status] || 'bg-gray-100'}`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Slot Modal */}
      {showCreateSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Tạo khung giờ Flash Sale</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khung giờ *</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="VD: Flash Sale 12h trưa"
                  value={slotForm.name}
                  onChange={e => setSlotForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu *</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={slotForm.startTime}
                  onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc *</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={slotForm.endTime}
                  onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))}
                  min={slotForm.startTime}
                />
              </div>
              {slotForm.startTime && slotForm.endTime && slotForm.endTime > slotForm.startTime && (
                <p className="text-xs text-gray-500">
                  Thời lượng: {Math.round((new Date(slotForm.endTime).getTime() - new Date(slotForm.startTime).getTime()) / 3600000)} giờ
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreateSlot(false); setSlotForm({ name: '', startTime: '', endTime: '' }); }}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => createSlotMutation.mutate(slotForm)}
                disabled={!slotForm.name || !slotForm.startTime || !slotForm.endTime || createSlotMutation.isPending}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {createSlotMutation.isPending ? 'Đang tạo...' : 'Tạo khung giờ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
