import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, ExternalLink, Phone, MapPin, Tag, Clock, FileText } from 'lucide-react';
import apiClient from '../api/client';

type ShopForm = {
  name: string;
  description: string;
  phone: string;
  address: string;
  returnPolicy: string;
  responsetime: string;
  categories: string;
};

export default function ShopPage() {
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { data: shop, isLoading } = useQuery({
    queryKey: ['seller-shop'],
    queryFn: () => apiClient.get('/seller/shop').then(r => r.data.data),
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ShopForm>({
    values: shop ? {
      name: shop.name || '',
      description: shop.description || '',
      phone: shop.phone || '',
      address: shop.address || '',
      returnPolicy: shop.returnPolicy || '',
      responsetime: shop.responseTime || '< 1 giờ',
      categories: shop.categories?.join(', ') || '',
    } : undefined,
  });

  const update = useMutation({
    mutationFn: (payload: any) => apiClient.patch('/seller/shop', payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin shop');
      queryClient.invalidateQueries({ queryKey: ['seller-shop'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi cập nhật'),
  });

  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    const reader = new FileReader();
    reader.onload = e => {
      if (type === 'logo') setLogoPreview(e.target?.result as string);
      else setBannerPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    const setter = type === 'logo' ? setUploadingLogo : setUploadingBanner;
    setter(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data?.url || res.data.url;
      await apiClient.patch('/seller/shop', type === 'logo' ? { logo: url } : { banner: url });
      toast.success(`Đã cập nhật ${type === 'logo' ? 'ảnh đại diện' : 'banner'}`);
      queryClient.invalidateQueries({ queryKey: ['seller-shop'] });
    } catch {
      toast.error('Không thể upload ảnh');
    } finally {
      setter(false);
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    ACTIVE: 'Đang hoạt động',
    SUSPENDED: 'Bị tạm dừng',
    CLOSED: 'Đã đóng',
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>;

  const logoSrc = logoPreview || shop?.logo;
  const bannerSrc = bannerPreview || shop?.banner;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Thông tin Shop</h1>
        {shop?.slug && (
          <a
            href={`/shops/${shop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            <ExternalLink size={14} />
            Xem shop
          </a>
        )}
      </div>

      {/* Banner & Logo Upload */}
      <div className="card overflow-hidden">
        {/* Banner */}
        <div
          className="relative h-36 bg-gradient-to-r from-blue-100 to-blue-50 cursor-pointer group"
          onClick={() => bannerInputRef.current?.click()}
        >
          {bannerSrc ? (
            <img src={bannerSrc} alt="banner" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Camera size={24} />
              <span className="ml-2 text-sm">Thêm banner</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-lg px-3 py-1.5 text-sm text-gray-700 flex items-center gap-1.5">
              {uploadingBanner ? 'Đang tải...' : <><Camera size={14} /> Thay đổi banner</>}
            </div>
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
          />
        </div>

        {/* Logo & Info */}
        <div className="p-4 flex items-end gap-4">
          <div
            className="relative -mt-10 cursor-pointer group flex-shrink-0"
            onClick={() => logoInputRef.current?.click()}
          >
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
              {logoSrc ? (
                <img src={logoSrc} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                  {shop?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Camera size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
            />
          </div>
          <div className="flex-1 pb-1">
            <h2 className="font-bold text-lg text-gray-800">{shop?.name}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span>⭐ {Number(shop?.rating || 0).toFixed(1)}</span>
              <span>{shop?._count?.products || 0} sản phẩm</span>
              <span className={`px-2 py-0.5 rounded-full ${shop?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {STATUS_LABELS[shop?.status] || shop?.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(d => update.mutate(d))} className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-700 border-b pb-3">Chỉnh sửa thông tin</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên shop *</label>
          <input {...register('name', { required: true })} className="input w-full" placeholder="Tên hiển thị của shop" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FileText size={14} className="inline mr-1" />
            Mô tả shop
          </label>
          <textarea {...register('description')} rows={3} className="input w-full resize-none" placeholder="Giới thiệu về shop, sản phẩm chuyên bán..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone size={14} className="inline mr-1" />
              Số điện thoại
            </label>
            <input {...register('phone')} className="input w-full" placeholder="0912345678" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={14} className="inline mr-1" />
              Thời gian phản hồi chat
            </label>
            <select {...register('responsetime')} className="input w-full">
              <option value="< 1 giờ">Trong vòng 1 giờ</option>
              <option value="< 3 giờ">Trong vòng 3 giờ</option>
              <option value="< 12 giờ">Trong vòng 12 giờ</option>
              <option value="1 ngày">Trong vòng 1 ngày</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin size={14} className="inline mr-1" />
            Địa chỉ kho hàng
          </label>
          <input {...register('address')} className="input w-full" placeholder="Địa chỉ lấy hàng / kho hàng" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Tag size={14} className="inline mr-1" />
            Danh mục kinh doanh
          </label>
          <input {...register('categories')} className="input w-full" placeholder="VD: Thời trang, Điện tử, Mỹ phẩm (cách nhau bằng dấu phẩy)" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chính sách hoàn trả
          </label>
          <textarea
            {...register('returnPolicy')}
            rows={4}
            className="input w-full resize-none"
            placeholder="Mô tả chính sách đổi trả của shop (thời hạn, điều kiện, quy trình...)"
          />
          <p className="text-xs text-gray-400 mt-1">Chính sách rõ ràng giúp tăng tỷ lệ chuyển đổi</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || update.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {update.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          {shop?.slug && (
            <a
              href={`/shops/${shop.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <ExternalLink size={14} />
              Xem trước shop
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
