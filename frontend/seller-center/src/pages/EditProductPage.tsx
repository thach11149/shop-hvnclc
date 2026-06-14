import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, GripVertical, Eye, EyeOff, Upload, X } from 'lucide-react';
import apiClient from '../api/client';

interface ProductImage { id?: string; url: string; file?: File; uploading?: boolean }
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
  return combinations.map((combo, i) => {
    const combined: Record<string, string> = {};
    combo.forEach(pair => Object.assign(combined, pair));
    const key = Object.values(combined).join('-');
    return { combination: combined, sku: '', price: '', stock: '', key };
  });
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState({ l: '', w: '', h: '' });
  const [processingTime, setProcessingTime] = useState('1-2');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.get(`/seller/products/${id}`).then(r => r.data.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then(r => r.data.data),
  });

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setCategoryId(product.categoryId || '');
      setWeight(product.weight || '');
      const imgs = product.images?.map((img: any) => ({ id: img.id, url: img.url })) || [];
      setImages(imgs);
    }
  }, [product]);

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiClient.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.data?.url || res.data.url;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 8 - images.length;
    const selected = Array.from(files).slice(0, remaining);
    const newImages: ProductImage[] = selected.map(f => ({ url: URL.createObjectURL(f), file: f, uploading: true }));
    setImages(prev => [...prev, ...newImages]);

    for (let i = 0; i < selected.length; i++) {
      try {
        const url = await uploadImage(selected[i]);
        setImages(prev => {
          const idx = prev.findIndex(img => img.file === selected[i]);
          if (idx < 0) return prev;
          const next = [...prev];
          next[idx] = { url, uploading: false };
          return next;
        });
      } catch {
        setImages(prev => prev.filter(img => img.file !== selected[i]));
        toast.error('Không thể upload ảnh');
      }
    }
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      setDragIdx(idx);
      return next;
    });
  };
  const handleDragEnd = () => setDragIdx(null);

  const addAttribute = () => setAttributes(prev => [...prev, { name: '', values: [''] }]);
  const updateAttrName = (i: number, name: string) => setAttributes(prev => { const a = [...prev]; a[i] = { ...a[i], name }; return a; });
  const addAttrValue = (i: number) => setAttributes(prev => { const a = [...prev]; a[i] = { ...a[i], values: [...a[i].values, ''] }; return a; });
  const updateAttrValue = (ai: number, vi: number, val: string) => setAttributes(prev => { const a = [...prev]; a[ai].values[vi] = val; return a; });
  const removeAttrValue = (ai: number, vi: number) => setAttributes(prev => { const a = [...prev]; a[ai].values = a[ai].values.filter((_, i) => i !== vi); return a; });
  const removeAttr = (i: number) => setAttributes(prev => prev.filter((_, j) => j !== i));

  const generateMatrix = () => {
    const generated = generateVariants(attributes);
    setVariants(prev => generated.map(g => {
      const existing = prev.find(p => p.key === g.key);
      return existing ? { ...g, sku: existing.sku, price: existing.price, stock: existing.stock } : g;
    }));
  };

  const updateVariant = (key: string, field: keyof Variant, value: string) => {
    setVariants(prev => prev.map(v => v.key === key ? { ...v, [field]: value } : v));
  };

  const bulkFill = () => {
    setVariants(prev => prev.map(v => ({
      ...v,
      price: bulkPrice || v.price,
      stock: bulkStock || v.stock,
    })));
  };

  const update = useMutation({
    mutationFn: (payload: any) => apiClient.patch(`/seller/products/${id}`, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      navigate('/products');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('Tên sản phẩm không được để trống'); return; }
    update.mutate({
      name,
      description,
      categoryId,
      images: images.filter(i => !i.uploading).map(i => i.url),
      weight: weight ? Number(weight) : undefined,
      dimensions: (dimensions.l || dimensions.w || dimensions.h) ? dimensions : undefined,
      processingTime,
      variants: variants.length > 0 ? variants.map(v => ({
        combination: v.combination,
        sku: v.sku,
        price: v.price ? Number(v.price) : undefined,
        stock: v.stock ? Number(v.stock) : undefined,
      })) : undefined,
    });
  };

  const categories: any[] = categoriesData?.data || categoriesData || [];

  const markdownToHtml = (md: string) =>
    md
      .replace(/^### (.+)/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
      .replace(/^## (.+)/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.+)/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br/>');

  if (isLoading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-3xl space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa sản phẩm</h1>
      </div>

      {/* Section 1: Images */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
          Hình ảnh sản phẩm
          <span className="text-xs text-gray-400">{images.length}/8 ảnh</span>
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-move transition-all ${
                dragIdx === idx ? 'border-blue-400 opacity-60 scale-95' : 'border-gray-200 hover:border-gray-300'
              } ${idx === 0 ? 'border-blue-300 ring-1 ring-blue-200' : ''}`}
            >
              {img.uploading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              )}
              {idx === 0 && !img.uploading && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-white text-xs text-center py-0.5">
                  Ảnh chính
                </div>
              )}
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✕
              </button>
              <div className="absolute top-1 left-1 text-gray-400">
                <GripVertical size={12} />
              </div>
            </div>
          ))}
          {images.length < 8 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Upload size={20} />
              <span className="text-xs mt-1">Thêm ảnh</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFileSelect(e.target.files)}
        />
        <p className="text-xs text-gray-400 mt-2">Kéo để sắp xếp. Ảnh đầu tiên là ảnh chính. Tối đa 8 ảnh.</p>
      </div>

      {/* Section 2: Basic Info */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">Thông tin cơ bản</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="input w-full"
            placeholder="Tên sản phẩm (tối đa 120 ký tự)"
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input w-full">
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Mô tả sản phẩm</label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? 'Chỉnh sửa' : 'Xem trước'}
            </button>
          </div>
          {showPreview ? (
            <div
              className="min-h-[160px] border border-gray-200 rounded-lg p-4 text-sm text-gray-700 bg-white prose prose-sm"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(description) }}
            />
          ) : (
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              className="input w-full resize-none font-mono text-sm"
              placeholder="Hỗ trợ Markdown: **đậm**, *nghiêng*, ## tiêu đề, - danh sách"
            />
          )}
          <p className="text-xs text-gray-400 mt-1">Hỗ trợ Markdown. Nhấn "Xem trước" để kiểm tra định dạng.</p>
        </div>
      </div>

      {/* Section 3: Variants */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">Phân loại sản phẩm</h2>
        <p className="text-xs text-gray-400">Thêm thuộc tính (màu sắc, kích thước...) để tạo ma trận biến thể tự động.</p>

        {attributes.map((attr, ai) => (
          <div key={ai} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <input
                value={attr.name}
                onChange={e => updateAttrName(ai, e.target.value)}
                className="input flex-1 text-sm"
                placeholder="Tên thuộc tính (VD: Màu sắc, Kích thước)"
              />
              <button onClick={() => removeAttr(ai)} className="text-gray-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attr.values.map((val, vi) => (
                <div key={vi} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                  <input
                    value={val}
                    onChange={e => updateAttrValue(ai, vi, e.target.value)}
                    className="text-sm outline-none w-20 min-w-[60px]"
                    placeholder="Giá trị"
                  />
                  <button onClick={() => removeAttrValue(ai, vi)} className="text-gray-300 hover:text-red-400">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addAttrValue(ai)}
                className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50"
              >
                <Plus size={12} /> Thêm giá trị
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button onClick={addAttribute} className="flex items-center gap-1 text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
            <Plus size={14} /> Thêm thuộc tính
          </button>
          {attributes.length > 0 && (
            <button
              onClick={generateMatrix}
              className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              Tạo ma trận
            </button>
          )}
        </div>

        {/* Variant Matrix */}
        {variants.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-xs font-medium text-blue-700 whitespace-nowrap">Điền hàng loạt:</span>
              <input
                type="number"
                placeholder="Giá (đ)"
                value={bulkPrice}
                onChange={e => setBulkPrice(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-xs w-28"
              />
              <input
                type="number"
                placeholder="Tồn kho"
                value={bulkStock}
                onChange={e => setBulkStock(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-xs w-24"
              />
              <button
                onClick={bulkFill}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Áp dụng
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {attributes.map(a => (
                      <th key={a.name} className="px-3 py-2 text-left text-xs font-medium text-gray-500 border border-gray-200">{a.name}</th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border border-gray-200">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border border-gray-200">Giá (đ)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border border-gray-200">Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(v => (
                    <tr key={v.key} className="hover:bg-gray-50">
                      {attributes.map(a => (
                        <td key={a.name} className="px-3 py-2 text-gray-600 border border-gray-200 text-xs">{v.combination[a.name]}</td>
                      ))}
                      <td className="px-2 py-1.5 border border-gray-200">
                        <input
                          value={v.sku}
                          onChange={e => updateVariant(v.key, 'sku', e.target.value)}
                          className="border-0 outline-none text-xs w-full font-mono"
                          placeholder="AUTO"
                        />
                      </td>
                      <td className="px-2 py-1.5 border border-gray-200">
                        <input
                          type="number"
                          value={v.price}
                          onChange={e => updateVariant(v.key, 'price', e.target.value)}
                          className="border-0 outline-none text-xs w-full"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-1.5 border border-gray-200">
                        <input
                          type="number"
                          value={v.stock}
                          onChange={e => updateVariant(v.key, 'stock', e.target.value)}
                          className="border-0 outline-none text-xs w-full"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Existing SKUs if no variant matrix */}
        {variants.length === 0 && product?.skus?.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Phân loại hiện tại</h3>
            <div className="space-y-2">
              {product.skus.map((sku: any) => (
                <div key={sku.id} className="flex items-center gap-4 text-sm border border-gray-200 rounded px-3 py-2 bg-gray-50">
                  <span className="text-gray-500 font-mono text-xs">SKU: {sku.sku}</span>
                  <span className="font-medium">{Number(sku.price).toLocaleString('vi-VN')}₫</span>
                  <span className="text-gray-500">Kho: {sku.stock?.totalQuantity || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Shipping */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">Thông tin vận chuyển</h2>
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
              <option value="1-2">1-2 ngày</option>
              <option value="3-5">3-5 ngày</option>
              <option value="5-7">5-7 ngày</option>
              <option value="7-14">7-14 ngày</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kích thước (cm) — Dài × Rộng × Cao</label>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              value={dimensions.l}
              onChange={e => setDimensions(p => ({ ...p, l: e.target.value }))}
              className="input w-full"
              placeholder="Dài"
            />
            <input
              type="number"
              value={dimensions.w}
              onChange={e => setDimensions(p => ({ ...p, w: e.target.value }))}
              className="input w-full"
              placeholder="Rộng"
            />
            <input
              type="number"
              value={dimensions.h}
              onChange={e => setDimensions(p => ({ ...p, h: e.target.value }))}
              className="input w-full"
              placeholder="Cao"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={update.isPending || images.some(i => i.uploading)}
          className="btn-primary disabled:opacity-50"
        >
          {update.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
