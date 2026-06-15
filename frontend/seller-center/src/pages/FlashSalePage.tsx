import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Search, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối',
  ACTIVE: 'Đang diễn ra', ENDED: 'Đã kết thúc',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-orange-100 text-orange-700',
  ENDED: 'bg-gray-100 text-gray-600',
};

interface SkuItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  productName: string;
  productImage?: string;
}

export default function FlashSalePage() {
  const queryClient = useQueryClient();
  const [showRegister, setShowRegister] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedSku, setSelectedSku] = useState<SkuItem | null>(null);
  const [flashPrice, setFlashPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['flash-sale-slots'],
    queryFn: () => apiClient.get('/flash-sale-slots').then(r => r.data.data),
  });

  const { data: myItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['my-flash-sale-items', statusFilter],
    queryFn: () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      return apiClient.get(`/seller/flash-sale-items${params}`).then(r => r.data.data);
    },
  });

  const { data: allProducts } = useQuery({
    queryKey: ['seller-skus-for-flash'],
    queryFn: () => apiClient.get('/seller/products?limit=100&status=ACTIVE').then(r => {
      const products = r.data.data?.data || r.data.data || [];
      return products.flatMap((p: any) =>
        (p.skus || []).map((s: any) => ({
          id: s.id,
          name: s.name || 'Mặc định',
          price: Number(s.price),
          stock: s.stock || 0,
          productName: p.name,
          productImage: p.images?.[0]?.url,
        }))
      );
    }),
    enabled: showRegister,
  });

  const filteredSkus = useMemo(() => {
    if (!allProducts || !productSearch) return allProducts || [];
    const q = productSearch.toLowerCase();
    return allProducts.filter((s: SkuItem) =>
      s.productName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [allProducts, productSearch]);

  const registerMutation = useMutation({
    mutationFn: () => apiClient.post('/seller/flash-sale-items', {
      skuId: selectedSku?.id,
      flashSaleSlotId: selectedSlotId,
      salePrice: Number(flashPrice),
      quantity: Number(quantity),
    }),
    onSuccess: () => {
      toast.success('Đã đăng ký flash sale, chờ admin duyệt');
      queryClient.invalidateQueries({ queryKey: ['my-flash-sale-items'] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi đăng ký'),
  });

  const cancelItemMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/flash-sale-items/${id}`),
    onSuccess: () => {
      toast.success('Đã hủy đăng ký');
      queryClient.invalidateQueries({ queryKey: ['my-flash-sale-items'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const resetForm = () => {
    setShowRegister(false);
    setSelectedSku(null);
    setFlashPrice('');
    setQuantity('');
    setSelectedSlotId('');
    setProductSearch('');
  };

  const discountPercent = selectedSku && flashPrice
    ? Math.round((1 - Number(flashPrice) / selectedSku.price) * 100)
    : 0;

  const isValid = !!selectedSku && !!selectedSlotId && !!flashPrice && !!quantity &&
    Number(flashPrice) > 0 && Number(flashPrice) < (selectedSku?.price || 0) &&
    Number(quantity) > 0 && Number(quantity) <= (selectedSku?.stock || 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Zap size={20} className="text-orange-500" /> Flash Sale
        </h1>
        <button
          onClick={() => setShowRegister(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 flex items-center gap-2"
        >
          <Zap size={16} /> Đăng ký Flash Sale
        </button>
      </div>

      {/* Flash Sale Slots */}
      <div className="card p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">⏰ Khung giờ sắp tới</h2>
        {slotsLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !slots?.length ? (
          <p className="text-gray-400 text-center py-6 text-sm">Không có khung giờ nào</p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot: any) => {
              const start = new Date(slot.startTime);
              const end = new Date(slot.endTime);
              const now = new Date();
              const isActive = now >= start && now <= end;
              const isUpcoming = now < start;
              return (
                <div key={slot.id} className={`flex items-center justify-between border rounded-xl p-3 ${
                  isActive ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {isActive && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                    <div>
                      <p className="font-medium text-sm">{slot.name}</p>
                      <p className="text-xs text-gray-500">
                        {start.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        {' - '}
                        {end.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {isActive && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Đang diễn ra</span>}
                    {isUpcoming && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Sắp diễn ra</span>}
                  </div>
                  <button
                    onClick={() => { setSelectedSlotId(slot.id); setShowRegister(true); }}
                    className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 font-medium"
                  >
                    Đăng ký
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Registered Items */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Sản phẩm đã đăng ký</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'PENDING', label: 'Chờ duyệt' },
              { key: 'APPROVED', label: 'Đã duyệt' },
              { key: 'ACTIVE', label: 'Đang chạy' },
            ].map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1 rounded-md text-xs transition-colors ${
                  statusFilter === f.key ? 'bg-white shadow-sm font-medium' : 'text-gray-500'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {itemsLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !myItems?.length ? (
          <p className="text-gray-400 text-center py-8 text-sm">Chưa có sản phẩm đăng ký</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 text-xs">
                <th className="pb-2 text-left">Sản phẩm</th>
                <th className="pb-2 text-left">Khung giờ</th>
                <th className="pb-2 text-right">Giá gốc</th>
                <th className="pb-2 text-right">Giá flash</th>
                <th className="pb-2 text-right">Giảm</th>
                <th className="pb-2 text-center">SL</th>
                <th className="pb-2 text-center">Trạng thái</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {myItems.map((item: any) => {
                const discount = item.sku?.price > 0
                  ? Math.round((1 - item.salePrice / item.sku.price) * 100)
                  : 0;
                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {item.sku?.product?.images?.[0]?.url && (
                          <img src={item.sku.product.images[0].url} alt="" className="w-8 h-8 object-cover rounded" />
                        )}
                        <div>
                          <p className="font-medium text-xs">{item.sku?.product?.name || item.skuId}</p>
                          <p className="text-xs text-gray-400">{item.sku?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-xs text-gray-500">{item.flashSaleSlot?.name}</td>
                    <td className="py-2 text-right text-xs text-gray-400 line-through">
                      {item.sku?.price ? Number(item.sku.price).toLocaleString('vi-VN') + '₫' : '-'}
                    </td>
                    <td className="py-2 text-right text-orange-600 font-bold text-sm">
                      {Number(item.salePrice).toLocaleString('vi-VN')}₫
                    </td>
                    <td className="py-2 text-right">
                      {discount > 0 && (
                        <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-bold">-{discount}%</span>
                      )}
                    </td>
                    <td className="py-2 text-center text-xs">{item.quantity}</td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => { if (window.confirm('Hủy đăng ký?')) cancelItemMutation.mutate(item.id); }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Đăng ký Flash Sale</h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Step 1: Choose slot */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">1. Chọn khung giờ Flash Sale *</label>
                <div className="space-y-2">
                  {slots?.map((slot: any) => (
                    <label key={slot.id} className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedSlotId === slot.id ? 'border-orange-400 bg-orange-50' : 'hover:border-gray-300'
                    }`}>
                      <input type="radio" name="slot" value={slot.id} checked={selectedSlotId === slot.id}
                        onChange={() => setSelectedSlotId(slot.id)} />
                      <div>
                        <p className="text-sm font-medium">{slot.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(slot.startTime).toLocaleString('vi-VN')} — {new Date(slot.endTime).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose product */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">2. Chọn sản phẩm *</label>
                <div className="relative mb-2">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên sản phẩm..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                {selectedSku && (
                  <div className="mb-2 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    {selectedSku.productImage && (
                      <img src={selectedSku.productImage} alt="" className="w-10 h-10 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedSku.productName}</p>
                      <p className="text-xs text-gray-500">{selectedSku.name} • Tồn: {selectedSku.stock} • Giá: {selectedSku.price.toLocaleString('vi-VN')}₫</p>
                    </div>
                    <button onClick={() => setSelectedSku(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                )}

                {!selectedSku && (
                  <div className="border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                    {filteredSkus.length === 0 ? (
                      <p className="p-4 text-center text-gray-400 text-sm">Không tìm thấy sản phẩm</p>
                    ) : (
                      filteredSkus.map((sku: SkuItem) => (
                        <div
                          key={sku.id}
                          onClick={() => setSelectedSku(sku)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                        >
                          {sku.productImage && (
                            <img src={sku.productImage} alt="" className="w-8 h-8 object-cover rounded" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{sku.productName}</p>
                            <p className="text-xs text-gray-500">{sku.name} • Giá: {sku.price.toLocaleString('vi-VN')}₫ • Tồn: {sku.stock}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Price & Qty */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">3. Giá flash & số lượng *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Giá flash sale (₫) *</label>
                    <input
                      type="number"
                      value={flashPrice}
                      onChange={e => setFlashPrice(e.target.value)}
                      placeholder="VD: 150000"
                      className={`w-full border rounded-lg px-3 py-2 text-sm ${
                        flashPrice && selectedSku && Number(flashPrice) >= selectedSku.price ? 'border-red-300' : ''
                      }`}
                    />
                    {flashPrice && selectedSku && Number(flashPrice) >= selectedSku.price && (
                      <p className="text-xs text-red-500 mt-1">Giá flash phải thấp hơn giá gốc</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Số lượng *{selectedSku ? ` (tối đa ${selectedSku.stock})` : ''}</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      min={1}
                      max={selectedSku?.stock}
                      placeholder="VD: 50"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Preview */}
                {selectedSku && flashPrice && discountPercent > 0 && (
                  <div className="mt-3 bg-orange-50 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 line-through">{selectedSku.price.toLocaleString('vi-VN')}₫</span>
                        <span className="text-orange-600 font-bold text-lg">{Number(flashPrice).toLocaleString('vi-VN')}₫</span>
                      </div>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">-{discountPercent}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Tiết kiệm: {(selectedSku.price - Number(flashPrice)).toLocaleString('vi-VN')}₫/sản phẩm
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button onClick={resetForm} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => registerMutation.mutate()}
                disabled={!isValid || registerMutation.isPending}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap size={15} />
                {registerMutation.isPending ? 'Đang gửi...' : 'Đăng ký Flash Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
