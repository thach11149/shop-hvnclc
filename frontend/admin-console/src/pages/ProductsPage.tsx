import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle, XCircle, EyeOff, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  ACTIVE: 'Đang bán',
  REJECTED: 'Bị từ chối',
  INACTIVE: 'Ngừng bán',
  HIDDEN: 'Đang ẩn',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  INACTIVE: 'bg-orange-100 text-orange-600',
  HIDDEN: 'bg-purple-100 text-purple-700',
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING_APPROVAL');
  const [sellerSearch, setSellerSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [detailImgIdx, setDetailImgIdx] = useState(0);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', activeTab],
    queryFn: () => apiClient.get(`/admin/products?status=${activeTab}`).then(r => r.data),
  });

  const rawRows: any[] = data?.data?.data || data?.data || [];
  const rows = rawRows.filter((p: any) => {
    if (sellerSearch && !p.shop?.name?.toLowerCase().includes(sellerSearch.toLowerCase())) return false;
    return true;
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      apiClient.patch(`/admin/products/${id}/status`, { status, reason }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setRejectModal(null);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      apiClient.patch('/admin/products/bulk-status', { productIds: selected, status, reason }),
    onSuccess: () => {
      toast.success(`Đã ${bulkAction === 'ACTIVE' ? 'duyệt' : bulkAction === 'REJECTED' ? 'từ chối' : 'ẩn'} ${selected.length} sản phẩm`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setSelected([]);
      setShowBulkConfirm(false);
      setBulkReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === rows.length ? [] : rows.map((r: any) => r.id));

  const openBulk = (action: string) => { setBulkAction(action); setBulkReason(''); setShowBulkConfirm(true); };

  const tabs = [
    { key: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
    { key: 'ACTIVE', label: 'Đang bán' },
    { key: 'REJECTED', label: 'Bị từ chối' },
    { key: 'HIDDEN', label: 'Đang ẩn' },
    { key: '', label: 'Tất cả' },
  ];

  return (
    <div>
      {/* Bulk Confirm Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-2">
              {bulkAction === 'ACTIVE' ? 'Duyệt' : bulkAction === 'REJECTED' ? 'Từ chối' : 'Ẩn'} {selected.length} sản phẩm
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto text-sm">
              {rows.filter((r: any) => selected.includes(r.id)).map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <img src={p.images?.[0]?.url || 'https://placehold.co/32x32?text=P'} className="w-8 h-8 object-cover rounded" alt="" />
                  <span className="text-gray-700 truncate">{p.name}</span>
                  <span className="text-gray-400 text-xs ml-auto">{p.shop?.name}</span>
                </div>
              ))}
            </div>
            {(bulkAction === 'REJECTED' || bulkAction === 'HIDDEN') && (
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Lý do {bulkAction === 'REJECTED' ? '(bắt buộc)' : '(tùy chọn)'}</label>
                <textarea value={bulkReason} onChange={e => setBulkReason(e.target.value)} rows={2} className="input w-full resize-none" />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => bulkUpdateStatus.mutate({ status: bulkAction, reason: bulkReason })}
                disabled={bulkAction === 'REJECTED' && !bulkReason.trim() || bulkUpdateStatus.isPending}
                className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${bulkAction === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' : bulkAction === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
              >
                Xác nhận
              </button>
              <button onClick={() => setShowBulkConfirm(false)} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold mb-3">Từ chối sản phẩm</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} className="input w-full resize-none mb-4" placeholder="Nhập lý do từ chối..." />
            <div className="flex gap-3">
              <button
                onClick={() => updateStatus.mutate({ id: rejectModal.id, status: 'REJECTED', reason: rejectReason })}
                disabled={!rejectReason.trim() || updateStatus.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg flex-1 disabled:opacity-50 hover:bg-red-700"
              >
                Từ chối
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg">Chi tiết sản phẩm</h3>
              <button onClick={() => setDetailProduct(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5">
              {/* Image Gallery */}
              {detailProduct.images?.length > 0 && (
                <div className="mb-5">
                  <div className="relative">
                    <img
                      src={detailProduct.images[detailImgIdx]?.url}
                      className="w-full h-60 object-contain bg-gray-50 rounded-lg"
                      alt="product"
                    />
                    {detailProduct.images.length > 1 && (
                      <>
                        <button onClick={() => setDetailImgIdx(i => Math.max(0, i - 1))} disabled={detailImgIdx === 0}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow disabled:opacity-30">
                          <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setDetailImgIdx(i => Math.min(detailProduct.images.length - 1, i + 1))} disabled={detailImgIdx === detailProduct.images.length - 1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow disabled:opacity-30">
                          <ChevronRight size={18} />
                        </button>
                        <div className="flex gap-1 justify-center mt-2">
                          {detailProduct.images.map((_: any, i: number) => (
                            <button key={i} onClick={() => setDetailImgIdx(i)}
                              className={`w-2 h-2 rounded-full ${i === detailImgIdx ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {detailProduct.images.map((img: any, i: number) => (
                      <img key={i} src={img.url} onClick={() => setDetailImgIdx(i)}
                        className={`w-14 h-14 object-cover rounded cursor-pointer flex-shrink-0 border-2 ${i === detailImgIdx ? 'border-blue-500' : 'border-transparent'}`} alt="" />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div><span className="text-gray-400">Tên: </span><strong>{detailProduct.name}</strong></div>
                <div><span className="text-gray-400">Shop: </span><strong>{detailProduct.shop?.name}</strong></div>
                <div><span className="text-gray-400">Danh mục: </span><span>{detailProduct.category?.name}</span></div>
                <div><span className="text-gray-400">Trạng thái: </span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${STATUS_COLORS[detailProduct.status] || ''}`}>
                    {STATUS_LABELS[detailProduct.status] || detailProduct.status}
                  </span>
                </div>
                <div><span className="text-gray-400">Giá: </span>
                  <strong className="text-green-600">{Number(detailProduct.basePrice || detailProduct.price || 0).toLocaleString('vi-VN')}₫</strong>
                </div>
                <div><span className="text-gray-400">Ngày tạo: </span>
                  <span>{new Date(detailProduct.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {detailProduct.description && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Mô tả</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">{detailProduct.description}</p>
                </div>
              )}

              {detailProduct.variants?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Biến thể ({detailProduct.variants.length})</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500">SKU</th>
                          <th className="text-right px-3 py-2 text-gray-500">Giá</th>
                          <th className="text-right px-3 py-2 text-gray-500">Tồn kho</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailProduct.variants.map((v: any) => (
                          <tr key={v.id} className="border-t">
                            <td className="px-3 py-2 font-mono text-xs">{v.sku || '-'}</td>
                            <td className="px-3 py-2 text-right">{Number(v.price || 0).toLocaleString('vi-VN')}₫</td>
                            <td className="px-3 py-2 text-right">{v.stock ?? v.stockQuantity ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detailProduct.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-500 font-semibold">Lý do từ chối</p>
                  <p className="text-sm text-red-700 mt-0.5">{detailProduct.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t flex gap-2 flex-wrap">
              {detailProduct.status !== 'ACTIVE' && (
                <button
                  onClick={() => { updateStatus.mutate({ id: detailProduct.id, status: 'ACTIVE' }); setDetailProduct(null); }}
                  className="btn-primary text-sm"
                >
                  <CheckCircle size={14} className="inline mr-1" /> Duyệt
                </button>
              )}
              {!['REJECTED'].includes(detailProduct.status) && (
                <button
                  onClick={() => { setDetailProduct(null); setRejectModal({ id: detailProduct.id }); }}
                  className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200"
                >
                  <XCircle size={14} className="inline mr-1" /> Từ chối
                </button>
              )}
              {detailProduct.status !== 'HIDDEN' && (
                <button
                  onClick={() => { updateStatus.mutate({ id: detailProduct.id, status: 'HIDDEN' }); setDetailProduct(null); }}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"
                >
                  <EyeOff size={14} className="inline mr-1" /> Ẩn sản phẩm
                </button>
              )}
              <button onClick={() => setDetailProduct(null)} className="btn-secondary text-sm ml-auto">Đóng</button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Kiểm duyệt sản phẩm</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelected([]); }}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${activeTab === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters + Bulk */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          value={sellerSearch}
          onChange={e => setSellerSearch(e.target.value)}
          className="input text-sm flex-1 min-w-48"
          placeholder="Tìm theo tên shop..."
        />
        {selected.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
            <span className="text-sm text-blue-700">Đã chọn {selected.length}</span>
            <button onClick={() => openBulk('ACTIVE')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Duyệt</button>
            <button onClick={() => openBulk('REJECTED')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Từ chối</button>
            <button onClick={() => openBulk('HIDDEN')} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">Ẩn</button>
            <button onClick={() => setSelected([])} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có sản phẩm nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={toggleAll} />
                </th>
                <th className="text-left px-4 py-3 text-gray-500">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-gray-500">Shop</th>
                <th className="text-right px-4 py-3 text-gray-500">Giá</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày tạo</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product: any) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelect(product.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url || 'https://placehold.co/40x40?text=P'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=P'; }}
                      />
                      <button
                        onClick={() => { setDetailProduct(product); setDetailImgIdx(0); }}
                        className="font-medium line-clamp-2 text-left hover:text-blue-600 max-w-48"
                      >
                        {product.name}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{product.shop?.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {Number(product.basePrice || product.price || 0).toLocaleString('vi-VN')}₫
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[product.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[product.status] || product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(product.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {product.status !== 'ACTIVE' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: product.id, status: 'ACTIVE' })}
                          className="text-green-600 hover:text-green-700 p-1" title="Duyệt"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {product.status !== 'REJECTED' && (
                        <button
                          onClick={() => setRejectModal({ id: product.id })}
                          className="text-red-500 hover:text-red-600 p-1" title="Từ chối"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      {product.status !== 'HIDDEN' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: product.id, status: 'HIDDEN' })}
                          className="text-gray-400 hover:text-gray-600 p-1" title="Ẩn"
                        >
                          <EyeOff size={16} />
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
