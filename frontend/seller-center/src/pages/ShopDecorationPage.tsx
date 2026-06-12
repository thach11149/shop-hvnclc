import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function ShopDecorationPage() {
  const queryClient = useQueryClient();
  const [bannerUrl, setBannerUrl] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [showAddCollection, setShowAddCollection] = useState(false);

  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ['shop-banners'],
    queryFn: () => apiClient.get('/seller/shop/banners').then(r => r.data.data),
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['shop-collections'],
    queryFn: () => apiClient.get('/seller/shop/collections').then(r => r.data.data),
  });

  const addBannerMutation = useMutation({
    mutationFn: (imageUrl: string) => apiClient.post('/seller/shop/banners', { imageUrl }),
    onSuccess: () => {
      toast.success('Đã thêm banner');
      queryClient.invalidateQueries({ queryKey: ['shop-banners'] });
      setBannerUrl('');
      setShowAddBanner(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi thêm banner'),
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/shop/banners/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa banner');
      queryClient.invalidateQueries({ queryKey: ['shop-banners'] });
    },
  });

  const addCollectionMutation = useMutation({
    mutationFn: (name: string) => apiClient.post('/seller/shop/collections', { name }),
    onSuccess: () => {
      toast.success('Đã tạo bộ sưu tập');
      queryClient.invalidateQueries({ queryKey: ['shop-collections'] });
      setCollectionName('');
      setShowAddCollection(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo bộ sưu tập'),
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Trang trí shop</h1>

      {/* Banners Section */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Banner shop</h2>
          <button onClick={() => setShowAddBanner(true)} className="text-sm text-primary-600 hover:underline">
            + Thêm banner
          </button>
        </div>
        {bannersLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2].map(i => <div key={i} className="aspect-[3/1] bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : !banners?.length ? (
          <div className="text-center py-8 text-gray-400">
            <p>🖼️ Chưa có banner</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {banners.map((banner: any) => (
              <div key={banner.id} className="relative rounded-lg overflow-hidden aspect-[3/1] bg-gray-100">
                <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                <button
                  onClick={() => window.confirm('Xóa banner?') && deleteBannerMutation.mutate(banner.id)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collections Section */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Bộ sưu tập shop</h2>
          <button onClick={() => setShowAddCollection(true)} className="text-sm text-primary-600 hover:underline">
            + Tạo bộ sưu tập
          </button>
        </div>
        {collectionsLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !collections?.length ? (
          <div className="text-center py-8 text-gray-400">
            <p>📂 Chưa có bộ sưu tập</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map((col: any) => (
              <div key={col.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium">{col.name}</p>
                  <p className="text-xs text-gray-400">{col.productCount || 0} sản phẩm</p>
                </div>
                <button className="text-xs text-blue-600 hover:underline">Quản lý</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Banner Modal */}
      {showAddBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Thêm Banner</h3>
            <div>
              <label className="block text-sm mb-1">URL hình ảnh *</label>
              <input type="url" className="w-full border rounded px-3 py-2 text-sm"
                placeholder="https://..."
                value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddBanner(false)} className="flex-1 border py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => addBannerMutation.mutate(bannerUrl)}
                disabled={!bannerUrl || addBannerMutation.isPending}
                className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {addBannerMutation.isPending ? 'Đang lưu...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Collection Modal */}
      {showAddCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Tạo bộ sưu tập</h3>
            <div>
              <label className="block text-sm mb-1">Tên bộ sưu tập *</label>
              <input type="text" className="w-full border rounded px-3 py-2 text-sm"
                value={collectionName} onChange={e => setCollectionName(e.target.value)} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddCollection(false)} className="flex-1 border py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => addCollectionMutation.mutate(collectionName)}
                disabled={!collectionName || addCollectionMutation.isPending}
                className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {addCollectionMutation.isPending ? 'Đang lưu...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
