import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, X, Eye, EyeOff } from 'lucide-react';
import apiClient from '../api/client';

interface ProductImage { url: string; file?: File; uploading?: boolean }
interface Attribute { name: string; values: string[] }
interface Variant { combination: Record<string, string>; sku: string; price: string; stock: string; key: string }

function generateVariants(attributes: Attribute[]): Variant[] {
  if (!attributes.length) return [];
  const combinations: Record<string, string>[][] = [[]];
  for (const attr of attributes) {
    const newCombos: Record<string, string>[][] = [];
    for (const existing of combinations) {
      for (const val of attr.values.filter(v => v.trim())) {
        newCombos.push([...existing, { [attr.name]: val }]);
      }
    }
    combinations.length = 0;
    combinations.push(...newCombos);
  }
  return combinations.map(combo => {
    const combined: Record<string, string> = {};
    combo.forEach(pair => Object.assign(combined, pair));
    const key = Object.values(combined).join('-');
    return { combination: combined, sku: '', price: '', stock: '', key };
  });
}

export default function NewProductPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState({ l: '', w: '', h: '' });
  const [processingTime, setProcessingTime] = useState('1-2');
  const [simplePrice, setSimplePrice] = useState('');
  const [simpleStock, setSimpleStock] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then(r => r.data.data),
  });

  const createProduct = useMutation({
    mutationFn: (payload: any) => apiClient.post('/seller/products', payload),
    onSuccess: () => { toast.success('Đã tạo sản phẩm'); navigate('/products'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo sản phẩm'),
  });

  const uploadImage = async (file: File) => {
    const tmp: ProductImage = { url: URL.createObjectURL(file), file, uploading: true };
    setImages(prev => [...prev, tmp]);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.url || res.data.data?.url;
      setImages(prev => prev.map(img => img.file === file ? { url, uploading: false } : img));
    } catch {
      toast.error('Upload ảnh thất bại');
      setImages(prev => prev.filter(img => img.file !== file));
    }
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const addAttribute = () => setAttributes(prev => [...prev, { name: '', values: [''] }]);
  const removeAttribute = (idx: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== idx));
    setVariants([]);
  };
  const updateAttrName = (idx: number, name: string) => {
    setAttributes(prev => prev.map((a, i) => i === idx ? { ...a, name } : a));
  };
  const updateAttrValues = (idx: number, raw: string) => {
    setAttributes(prev => prev.map((a, i) => i === idx ? { ...a, values: raw.split(',').map(v => v.trim()) } : a));
  };

  const regenVariants = () => {
    const newVariants = generateVariants(attributes.filter(a => a.name && a.values.some(v => v)));
    setVariants(newVariants);
  };

  const updateVariant = (key: string, field: keyof Variant, value: string) => {
    setVariants(prev => prev.map(v => v.key === key ? { ...v, [field]: value } : v));
  };

  const applyBulkFill = () => {
    setVariants(prev => prev.map(v => ({
      ...v,
      price: bulkPrice || v.price,
      stock: bulkStock || v.stock,
    })));
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('Vui lòng nhập tên sản phẩm'); return; }
    if (!categoryId) { toast.error('Vui lòng chọn danh mục'); return; }
    if (images.length === 0) { toast.error('Vui lòng thêm ít nhất 1 ảnh'); return; }
    if (images.some(i => i.uploading)) { toast.error('Đang upload ảnh, vui lòng đợi'); return; }

    const skus = variants.length > 0
      ? variants.map(v => ({
          name: Object.values(v.combination).join(' / '),
          attributes: v.combination,
          price: Number(v.price),
          stock: Number(v.stock),
          sku: v.sku || undefined,
        }))
      : [{ name: 'Mặc định', attributes: {}, price: Number(simplePrice), stock: Number(simpleStock) }];

    if (skus.some(s => !s.price || s.price <= 0)) { toast.error('Giá không hợp lệ'); return; }

    createProduct.mutate({
      name: name.trim(),
      description,
      categoryId,
      images: images.map((img, i) => ({ url: img.url, order: i })),
      skus,
      shipping: {
        weight: weight ? Number(weight) : undefined,
        dimensions: (dimensions.l && dimensions.w && dimensions.h)
          ? { length: Number(dimensions.l), width: Number(dimensions.w), height: Number(dimensions.h) }
          : undefined,
        processingTime,
      },
    });
  };

  const catList = categories?.data || categories || [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Thêm sản phẩm mới</h1>
        <button onClick={() => navigate('/products')} className="text-sm text-gray-500 hover:text-gray-700">← Quay lại</button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Thông tin cơ bản</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="input w-full"
              placeholder="Tên sản phẩm..."
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Mô tả</label>
              <button onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700">
                {showPreview ? <><EyeOff size={12} /> Chỉnh sửa</> : <><Eye size={12} /> Xem trước</>}
              </button>
            </div>
            {showPreview ? (
              <div className="border rounded-lg p-3 min-h-24 text-sm text-gray-700 prose prose-sm max-w-none whitespace-pre-wrap">
                {description || <span className="text-gray-400">Chưa có mô tả</span>}
              </div>
            ) : (
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                className="input w-full resize-none font-mono text-sm"
                placeholder="Mô tả sản phẩm (hỗ trợ Markdown)..."
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input w-full">
              <option value="">-- Chọn danh mục --</option>
              {catList.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Images */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-700 mb-3">Hình ảnh sản phẩm <span className="text-red-400">*</span></h2>
          <p className="text-xs text-gray-500 mb-3">Tối đa 8 ảnh. Ảnh đầu tiên là ảnh đại diện.</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {img.uploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-xs text-center py-0.5">Ảnh chính</span>
                )}
              </div>
            ))}
            {images.length < 8 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-400 transition-colors"
              >
                <Upload size={20} />
                <span className="text-xs mt-1">Thêm ảnh</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef} type="file" multiple accept="image/*" className="hidden"
            onChange={e => {
              Array.from(e.target.files || []).slice(0, 8 - images.length).forEach(uploadImage);
              e.target.value = '';
            }}
          />
        </div>

        {/* Variants */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Phân loại hàng</h2>
            <button onClick={addAttribute}
              className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              <Plus size={12} /> Thêm thuộc tính
            </button>
          </div>

          {attributes.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Sản phẩm không có phân loại (1 biến thể mặc định)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Giá (₫) *</label>
                  <input
                    type="number"
                    value={simplePrice}
                    onChange={e => setSimplePrice(e.target.value)}
                    className="input w-full"
                    placeholder="VD: 250000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tồn kho *</label>
                  <input
                    type="number"
                    value={simpleStock}
                    onChange={e => setSimpleStock(e.target.value)}
                    className="input w-full"
                    placeholder="VD: 100"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {attributes.map((attr, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={attr.name}
                      onChange={e => updateAttrName(i, e.target.value)}
                      className="input flex-1 text-sm"
                      placeholder="Tên thuộc tính (VD: Màu sắc, Size)"
                    />
                    <button onClick={() => removeAttribute(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input
                    value={attr.values.join(', ')}
                    onChange={e => updateAttrValues(i, e.target.value)}
                    className="input w-full text-sm"
                    placeholder="Giá trị (VD: Đỏ, Xanh, Vàng)"
                  />
                  <p className="text-xs text-gray-400 mt-1">Nhập các giá trị cách nhau bởi dấu phẩy</p>
                </div>
              ))}

              <button
                onClick={regenVariants}
                className="text-sm bg-primary-50 text-primary-700 border border-primary-200 px-4 py-2 rounded-lg hover:bg-primary-100"
              >
                Tạo tổ hợp biến thể ({generateVariants(attributes.filter(a => a.name && a.values.some(v => v))).length})
              </button>

              {variants.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-gray-500">Áp dụng hàng loạt:</span>
                    <input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)}
                      placeholder="Giá" className="border rounded px-2 py-1 text-xs w-24" />
                    <input type="number" value={bulkStock} onChange={e => setBulkStock(e.target.value)}
                      placeholder="Tồn kho" className="border rounded px-2 py-1 text-xs w-24" />
                    <button onClick={applyBulkFill}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                      Áp dụng
                    </button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs text-gray-500">Phân loại</th>
                          <th className="text-left px-3 py-2 text-xs text-gray-500">SKU</th>
                          <th className="text-right px-3 py-2 text-xs text-gray-500">Giá (₫) *</th>
                          <th className="text-right px-3 py-2 text-xs text-gray-500">Tồn kho *</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {variants.map(v => (
                          <tr key={v.key}>
                            <td className="px-3 py-2 text-xs">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(v.combination).map(([k, val]) => (
                                  <span key={k} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                                    {val}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={v.sku}
                                onChange={e => updateVariant(v.key, 'sku', e.target.value)}
                                className="border rounded px-2 py-1 text-xs w-24"
                                placeholder="SKU"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={v.price}
                                onChange={e => updateVariant(v.key, 'price', e.target.value)}
                                className="border rounded px-2 py-1 text-xs w-24 text-right ml-auto block"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={v.stock}
                                onChange={e => updateVariant(v.key, 'stock', e.target.value)}
                                className="border rounded px-2 py-1 text-xs w-20 text-right ml-auto block"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shipping */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Thông tin vận chuyển</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cân nặng (gram)</label>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="input w-full"
                placeholder="VD: 500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian xử lý</label>
              <select value={processingTime} onChange={e => setProcessingTime(e.target.value)} className="input w-full">
                <option value="same-day">Trong ngày</option>
                <option value="1">1 ngày</option>
                <option value="1-2">1-2 ngày</option>
                <option value="2-3">2-3 ngày</option>
                <option value="3-5">3-5 ngày</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Kích thước (cm)</label>
            <div className="flex items-center gap-2">
              <input type="number" value={dimensions.l} onChange={e => setDimensions(d => ({ ...d, l: e.target.value }))}
                className="input flex-1" placeholder="Dài" />
              <span className="text-gray-400 text-sm">×</span>
              <input type="number" value={dimensions.w} onChange={e => setDimensions(d => ({ ...d, w: e.target.value }))}
                className="input flex-1" placeholder="Rộng" />
              <span className="text-gray-400 text-sm">×</span>
              <input type="number" value={dimensions.h} onChange={e => setDimensions(d => ({ ...d, h: e.target.value }))}
                className="input flex-1" placeholder="Cao" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={handleSubmit}
            disabled={createProduct.isPending || images.some(i => i.uploading)}
            className="btn-primary disabled:opacity-50 px-8"
          >
            {createProduct.isPending ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </button>
          <button onClick={() => navigate('/products')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
