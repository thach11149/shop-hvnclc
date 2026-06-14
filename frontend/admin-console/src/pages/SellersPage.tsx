import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Check, X, Eye, Ban, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS_VI: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm dừng',
  CLOSED: 'Đã đóng',
};

export default function SellersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ message: string; action: () => void } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (activeTab !== 'all') params.set('status', activeTab);
    if (search) params.set('search', search);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sellers', activeTab, search, page],
    queryFn: () => apiClient.get(`/admin/sellers?${buildQuery()}`).then(r => r.data.data),
  });

  const sellers: any[] = data?.data || [];
  const pagination = data?.pagination;

  const approve = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/sellers/${id}/approve`),
    onSuccess: () => {
      toast.success('Đã duyệt người bán');
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setSelected(new Set());
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi khi duyệt'),
  });

  const reject = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/sellers/${id}/reject`),
    onSuccess: () => {
      toast.success('Đã từ chối người bán');
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setSelected(new Set());
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi khi từ chối'),
  });

  const suspend = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/sellers/${id}/suspend`),
    onSuccess: () => {
      toast.success('Đã tạm dừng người bán');
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setSelected(new Set());
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi khi tạm dừng'),
  });

  const activate = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/sellers/${id}/approve`),
    onSuccess: () => {
      toast.success('Đã kích hoạt người bán');
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setSelected(new Set());
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi khi kích hoạt'),
  });

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'ACTIVE', label: 'Đang hoạt động' },
    { key: 'SUSPENDED', label: 'Bị tạm dừng' },
  ];

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      setSelected(new Set());
    }, 400);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    setSelected(new Set());
  };

  const allIds = sellers.map(s => s.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;
  const selectedIds = Array.from(selected);

  const handleBulkApprove = () => {
    setConfirm({
      message: `Duyệt ${selectedCount} người bán đã chọn?`,
      action: () => {
        selectedIds.forEach(id => approve.mutate(id));
      },
    });
  };

  const handleBulkSuspend = () => {
    setConfirm({
      message: `Tạm dừng ${selectedCount} người bán đã chọn?`,
      action: () => {
        selectedIds.forEach(id => suspend.mutate(id));
      },
    });
  };

  const handleApprove = (id: string, shopName: string) => {
    setConfirm({
      message: `Duyệt người bán "${shopName}"?`,
      action: () => approve.mutate(id),
    });
  };

  const handleReject = (id: string, shopName: string) => {
    setConfirm({
      message: `Từ chối người bán "${shopName}"? Hành động này không thể hoàn tác.`,
      action: () => reject.mutate(id),
    });
  };

  const handleSuspend = (id: string, shopName: string) => {
    setConfirm({
      message: `Tạm dừng người bán "${shopName}"?`,
      action: () => suspend.mutate(id),
    });
  };

  const handleActivate = (id: string, shopName: string) => {
    setConfirm({
      message: `Kích hoạt lại người bán "${shopName}"?`,
      action: () => activate.mutate(id),
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý người bán</h1>

      {/* Search + Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="input pl-9 w-full"
            placeholder="Tìm theo tên shop hoặc email..."
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="text-sm font-medium text-orange-700">Đã chọn {selectedCount} người bán</span>
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
          >
            <Check size={14} /> Duyệt tất cả
          </button>
          <button
            onClick={handleBulkSuspend}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600 transition-colors"
          >
            <Ban size={14} /> Tạm dừng tất cả
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700 px-3 py-1 border rounded"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-3 text-gray-500">Shop</th>
                <th className="text-left px-4 py-3 text-gray-500">Email</th>
                <th className="text-right px-4 py-3 text-gray-500">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày đăng ký</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Không có người bán nào</td>
                </tr>
              ) : (
                sellers.map((seller: any) => {
                  const shopStatus = seller.shop?.status || seller.status;
                  const shopName = seller.shop?.name || '-';
                  return (
                    <tr key={seller.id} className={`border-t hover:bg-gray-50 ${selected.has(seller.id) ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(seller.id)}
                          onChange={() => toggleOne(seller.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {seller.shop?.logo && (
                            <img src={seller.shop.logo} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                          )}
                          <span className="font-medium truncate max-w-[140px]">{shopName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{seller.user?.email || seller.email || '-'}</td>
                      <td className="px-4 py-3 text-right">{seller.shop?._count?.products ?? seller._count?.products ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[shopStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS_VI[shopStatus] || shopStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(seller.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {shopStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(seller.id, shopName)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 transition-colors"
                              >
                                <Check size={12} /> Duyệt
                              </button>
                              <button
                                onClick={() => handleReject(seller.id, shopName)}
                                className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-colors"
                              >
                                <X size={12} /> Từ chối
                              </button>
                            </>
                          )}
                          {shopStatus === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => handleSuspend(seller.id, shopName)}
                                className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs hover:bg-yellow-100 transition-colors"
                              >
                                <Ban size={12} /> Tạm dừng
                              </button>
                              <Link
                                to={`/sellers/${seller.id}`}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors"
                              >
                                <Eye size={12} /> Chi tiết
                              </Link>
                            </>
                          )}
                          {shopStatus === 'SUSPENDED' && (
                            <>
                              <button
                                onClick={() => handleActivate(seller.id, shopName)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 transition-colors"
                              >
                                <CheckCircle size={12} /> Kích hoạt
                              </button>
                              <Link
                                to={`/sellers/${seller.id}`}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors"
                              >
                                <Eye size={12} /> Chi tiết
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {pagination && (
          <div className="p-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Tổng {pagination.total} người bán</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1">Trang {page} / {pagination.totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.totalPages}
                className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-bold mb-2">Xác nhận</h3>
            <p className="text-gray-600 text-sm mb-4">{confirm.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => { confirm.action(); setConfirm(null); }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
