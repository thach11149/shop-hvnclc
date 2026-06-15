import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Image, Package, Bell, Palette, Plus, Trash2, X, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const THEME_COLORS = [
  { name: 'Đỏ cam', primary: '#e5352c', secondary: '#ff6b35' },
  { name: 'Xanh dương', primary: '#2563eb', secondary: '#3b82f6' },
  { name: 'Tím', primary: '#7c3aed', secondary: '#8b5cf6' },
  { name: 'Hồng', primary: '#db2777', secondary: '#ec4899' },
  { name: 'Xanh lá', primary: '#16a34a', secondary: '#22c55e' },
  { name: 'Vàng cam', primary: '#d97706', secondary: '#f59e0b' },
  { name: 'Tùy chỉnh', primary: '', secondary: '' },
];

type SectionTab = 'banners' | 'products' | 'announcement' | 'theme';

export default function ShopDecorationPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<SectionTab>('banners');
  const [previewSlide, setPreviewSlide] = useState(0);

  // Banner state
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [showAddBanner, setShowAddBanner] = useState(false);

  // Featured products
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Announcement
  const [announcement, setAnnouncement] = useState({ text: '', bgColor: '#fef3c7', textColor: '#92400e', isActive: true });

  // Theme
  const [selectedTheme, setSelectedTheme] = useState(THEME_COLORS[0]);
  const [customColor, setCustomColor] = useState('#e5352c');

  const { data: banners } = useQuery({
    queryKey: ['shop-banners'],
    queryFn: () => apiClient.get('/seller/shop/banners').then((r) => r.data.data),
  });

  const { data: featuredProducts } = useQuery({
    queryKey: ['shop-featured-products'],
    queryFn: () => apiClient.get('/seller/shop/featured-products').then((r) => r.data.data),
  });

  const { data: shopAnnouncement } = useQuery({
    queryKey: ['shop-announcement'],
    queryFn: () => apiClient.get('/seller/shop/announcement').then((r) => r.data.data),
    onSuccess: (data) => { if (data) setAnnouncement(data); },
  } as any);

  const { data: searchProducts } = useQuery({
    queryKey: ['product-search-decoration', productSearch],
    queryFn: () =>
      apiClient.get('/seller/products', { params: { search: productSearch, limit: 20, status: 'ACTIVE' } }).then((r) => r.data.data),
    enabled: showProductPicker && productSearch.length > 0,
  });

  const addBannerMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/shop/banners', data),
    onSuccess: () => {
      toast.success('Đã thêm banner');
      qc.invalidateQueries({ queryKey: ['shop-banners'] });
      setNewBannerUrl('');
      setNewBannerLink('');
      setShowAddBanner(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi thêm banner'),
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/shop/banners/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa banner');
      qc.invalidateQueries({ queryKey: ['shop-banners'] });
    },
  });

  const addFeaturedMutation = useMutation({
    mutationFn: (productId: string) => apiClient.post('/seller/shop/featured-products', { productId }),
    onSuccess: () => {
      toast.success('Đã thêm sản phẩm nổi bật');
      qc.invalidateQueries({ queryKey: ['shop-featured-products'] });
      setShowProductPicker(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi thêm sản phẩm'),
  });

  const removeFeaturedMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/shop/featured-products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-featured-products'] });
    },
  });

  const saveAnnouncementMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/seller/shop/announcement', data),
    onSuccess: () => {
      toast.success('Đã lưu thông báo shop');
      qc.invalidateQueries({ queryKey: ['shop-announcement'] });
    },
  });

  const saveThemeMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/seller/shop/theme', data),
    onSuccess: () => toast.success('Đã lưu màu chủ đề shop'),
  });

  const bannerList: any[] = banners?.items || banners || [];
  const featuredList: any[] = featuredProducts?.items || featuredProducts || [];
  const searchProductList: any[] = searchProducts?.items || [];

  const TABS = [
    { key: 'banners', label: 'Banner slider', icon: <Image size={16} /> },
    { key: 'products', label: 'Sản phẩm nổi bật', icon: <Package size={16} /> },
    { key: 'announcement', label: 'Thông báo shop', icon: <Bell size={16} /> },
    { key: 'theme', label: 'Màu chủ đề', icon: <Palette size={16} /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trang trí shop</h1>
        <p className="text-gray-500 text-sm mt-1">Tùy chỉnh giao diện cửa hàng để thu hút khách hàng</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banner Slider */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          {/* Preview */}
          {bannerList.length > 0 && (
            <div className="relative rounded-2xl overflow-hidden bg-gray-200" style={{ aspectRatio: '3/1', maxHeight: 280 }}>
              <img
                src={bannerList[previewSlide]?.imageUrl}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              {bannerList.length > 1 && (
                <>
                  <button
                    onClick={() => setPreviewSlide((p) => (p - 1 + bannerList.length) % bannerList.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPreviewSlide((p) => (p + 1) % bannerList.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {bannerList.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPreviewSlide(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === previewSlide ? 'bg-white w-4' : 'bg-white/60'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Danh sách banner ({bannerList.length}/5)</p>
              <button
                onClick={() => setShowAddBanner(true)}
                disabled={bannerList.length >= 5}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 disabled:opacity-40"
              >
                <Plus size={14} /> Thêm banner
              </button>
            </div>

            {bannerList.length === 0 ? (
              <div className="py-12 text-center">
                <Image size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Chưa có banner nào</p>
                <button onClick={() => setShowAddBanner(true)} className="mt-2 text-sm text-primary-500 hover:underline">
                  + Thêm banner đầu tiên
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bannerList.map((banner: any, idx: number) => (
                  <div key={banner.id} className="flex items-center gap-3 p-4">
                    <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
                    <img
                      src={banner.imageUrl}
                      alt={`Banner ${idx + 1}`}
                      className="w-24 h-8 object-cover rounded bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">{banner.imageUrl}</p>
                      {banner.link && <p className="text-xs text-blue-500 truncate">{banner.link}</p>}
                    </div>
                    <button
                      onClick={() => window.confirm('Xóa banner này?') && deleteBannerMutation.mutate(banner.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showAddBanner && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b">
                  <h3 className="font-bold">Thêm banner</h3>
                  <button onClick={() => setShowAddBanner(false)}><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">URL hình ảnh *</label>
                    <input
                      type="url"
                      value={newBannerUrl}
                      onChange={(e) => setNewBannerUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                    {newBannerUrl && (
                      <img src={newBannerUrl} alt="preview" className="mt-2 w-full h-24 object-cover rounded-lg bg-gray-100" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Liên kết khi click (tùy chọn)</label>
                    <input
                      type="url"
                      value={newBannerLink}
                      onChange={(e) => setNewBannerLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 p-5 pt-0">
                  <button onClick={() => setShowAddBanner(false)} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
                  <button
                    onClick={() => addBannerMutation.mutate({ imageUrl: newBannerUrl, link: newBannerLink || undefined })}
                    disabled={!newBannerUrl || addBannerMutation.isPending}
                    className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                  >
                    {addBannerMutation.isPending ? 'Đang lưu...' : 'Thêm banner'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Featured Products */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            💡 Chọn tối đa 8 sản phẩm nổi bật hiển thị trên trang shop của bạn.
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Sản phẩm nổi bật ({featuredList.length}/8)</p>
              <button
                onClick={() => setShowProductPicker(true)}
                disabled={featuredList.length >= 8}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 disabled:opacity-40"
              >
                <Plus size={14} /> Chọn sản phẩm
              </button>
            </div>

            {featuredList.length === 0 ? (
              <div className="py-12 text-center">
                <Package size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Chưa có sản phẩm nổi bật</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                {featuredList.map((fp: any) => (
                  <div key={fp.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      <img
                        src={fp.product?.images?.[0]?.url || '/placeholder.jpg'}
                        alt={fp.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium mt-1 line-clamp-2">{fp.product?.name}</p>
                    <button
                      onClick={() => removeFeaturedMutation.mutate(fp.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showProductPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b">
                  <h3 className="font-bold">Chọn sản phẩm nổi bật</h3>
                  <button onClick={() => setShowProductPicker(false)}><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="p-4">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
                  {searchProductList.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-primary-300 cursor-pointer"
                      onClick={() => addFeaturedMutation.mutate(p.id)}
                    >
                      <img
                        src={p.images?.[0]?.url || '/placeholder.jpg'}
                        alt={p.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-500">{Number(p.skus?.[0]?.price || 0).toLocaleString('vi-VN')}đ</p>
                      </div>
                      <Plus size={16} className="text-primary-500 flex-shrink-0" />
                    </div>
                  ))}
                  {productSearch && searchProductList.length === 0 && (
                    <p className="text-center text-gray-400 py-8 text-sm">Không tìm thấy sản phẩm</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Announcement Bar */}
      {activeTab === 'announcement' && (
        <div className="space-y-4">
          {/* Preview */}
          {announcement.text && (
            <div
              className="rounded-xl p-3 text-center text-sm font-medium"
              style={{ backgroundColor: announcement.bgColor, color: announcement.textColor }}
            >
              {announcement.text}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nội dung thông báo</label>
              <textarea
                value={announcement.text}
                onChange={(e) => setAnnouncement((a) => ({ ...a, text: e.target.value }))}
                rows={3}
                placeholder="VD: 🎉 SALE 50% tất cả sản phẩm — Chỉ trong hôm nay!"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Màu nền</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={announcement.bgColor}
                    onChange={(e) => setAnnouncement((a) => ({ ...a, bgColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={announcement.bgColor}
                    onChange={(e) => setAnnouncement((a) => ({ ...a, bgColor: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Màu chữ</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={announcement.textColor}
                    onChange={(e) => setAnnouncement((a) => ({ ...a, textColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={announcement.textColor}
                    onChange={(e) => setAnnouncement((a) => ({ ...a, textColor: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcement.isActive}
                  onChange={(e) => setAnnouncement((a) => ({ ...a, isActive: e.target.checked }))}
                  className="accent-primary-500"
                />
                <span className="text-sm">Hiển thị thông báo</span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => saveAnnouncementMutation.mutate(announcement)}
                disabled={saveAnnouncementMutation.isPending}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {saveAnnouncementMutation.isPending ? 'Đang lưu...' : 'Lưu thông báo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Color */}
      {activeTab === 'theme' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-800 mb-4">Chọn màu chủ đề shop</h2>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {THEME_COLORS.slice(0, -1).map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedTheme.name === theme.name ? 'border-gray-800' : 'border-transparent'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="flex-1 h-6 rounded" style={{ backgroundColor: theme.primary }} />
                    <div className="flex-1 h-6 rounded" style={{ backgroundColor: theme.secondary }} />
                  </div>
                  <p className="text-xs font-medium text-gray-700">{theme.name}</p>
                </button>
              ))}

              {/* Custom */}
              <button
                onClick={() => setSelectedTheme({ ...THEME_COLORS[THEME_COLORS.length - 1], primary: customColor, secondary: customColor + '99' })}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedTheme.name === 'Tùy chỉnh' ? 'border-gray-800' : 'border-transparent'
                }`}
              >
                <div className="flex gap-1 mb-2 items-center justify-center h-6">
                  <input
                    type="color"
                    value={customColor}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setSelectedTheme({ name: 'Tùy chỉnh', primary: e.target.value, secondary: e.target.value + '99' });
                    }}
                    className="w-8 h-6 rounded cursor-pointer border-0"
                  />
                </div>
                <p className="text-xs font-medium text-gray-700">Tùy chỉnh</p>
              </button>
            </div>

            {/* Preview */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 mb-4">
              <p className="text-xs text-gray-500 mb-3">Xem trước:</p>
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: selectedTheme.primary }}
                >
                  Mua ngay
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium border-2"
                  style={{ color: selectedTheme.primary, borderColor: selectedTheme.primary }}
                >
                  Theo dõi
                </button>
                <span
                  className="text-sm font-bold"
                  style={{ color: selectedTheme.primary }}
                >
                  {Number(129000).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <button
              onClick={() => saveThemeMutation.mutate({ primaryColor: selectedTheme.primary, secondaryColor: selectedTheme.secondary })}
              disabled={!selectedTheme.primary || saveThemeMutation.isPending}
              className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
            >
              {saveThemeMutation.isPending ? 'Đang lưu...' : 'Áp dụng màu chủ đề'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
