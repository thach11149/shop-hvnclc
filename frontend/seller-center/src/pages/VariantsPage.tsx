import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface VariantGroup {
  id?: string;
  name: string;
  options: string[];
}

export default function VariantsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [groups, setGroups] = useState<VariantGroup[]>([{ name: '', options: [''] }]);

  const { data: product, isLoading } = useQuery({
    queryKey: ['seller-product', id],
    queryFn: () => apiClient.get(`/seller/products/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: (data: { variantGroups: VariantGroup[] }) =>
      apiClient.post(`/seller/products/${id}/variant-groups`, data),
    onSuccess: () => {
      toast.success('Đã lưu biến thể sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['seller-product', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi lưu biến thể'),
  });

  const addGroup = () => setGroups(g => [...g, { name: '', options: [''] }]);

  const removeGroup = (idx: number) => setGroups(g => g.filter((_, i) => i !== idx));

  const updateGroupName = (idx: number, name: string) =>
    setGroups(g => g.map((gr, i) => i === idx ? { ...gr, name } : gr));

  const addOption = (groupIdx: number) =>
    setGroups(g => g.map((gr, i) => i === groupIdx ? { ...gr, options: [...gr.options, ''] } : gr));

  const updateOption = (groupIdx: number, optIdx: number, value: string) =>
    setGroups(g => g.map((gr, i) => i === groupIdx ?
      { ...gr, options: gr.options.map((o, j) => j === optIdx ? value : o) } : gr));

  const removeOption = (groupIdx: number, optIdx: number) =>
    setGroups(g => g.map((gr, i) => i === groupIdx ?
      { ...gr, options: gr.options.filter((_, j) => j !== optIdx) } : gr));

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/products/${id}/edit`)} className="text-gray-500 hover:text-gray-700">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý biến thể</h1>
          <p className="text-sm text-gray-500">{product?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variant Groups Editor */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-700 mb-4">Nhóm biến thể</h2>
          <p className="text-xs text-gray-500 mb-4">VD: Màu sắc (xanh, đỏ, vàng), Kích thước (S, M, L, XL)</p>

          <div className="space-y-4">
            {groups.map((group, gIdx) => (
              <div key={gIdx} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder="Tên nhóm (VD: Màu sắc)"
                    value={group.name}
                    onChange={e => updateGroupName(gIdx, e.target.value)}
                  />
                  {groups.length > 1 && (
                    <button onClick={() => removeGroup(gIdx)} className="text-red-400 hover:text-red-600 text-sm">×</button>
                  )}
                </div>
                <div className="space-y-2">
                  {group.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        placeholder={`Tùy chọn ${oIdx + 1}`}
                        value={opt}
                        onChange={e => updateOption(gIdx, oIdx, e.target.value)}
                      />
                      {group.options.length > 1 && (
                        <button onClick={() => removeOption(gIdx, oIdx)} className="text-red-400 text-sm">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addOption(gIdx)} className="text-xs text-blue-600 hover:underline">
                    + Thêm tùy chọn
                  </button>
                </div>
              </div>
            ))}
          </div>

          {groups.length < 3 && (
            <button onClick={addGroup} className="w-full mt-3 border-2 border-dashed border-gray-200 rounded-lg py-2 text-sm text-gray-400 hover:border-gray-300">
              + Thêm nhóm biến thể
            </button>
          )}

          <button
            onClick={() => saveMutation.mutate({ variantGroups: groups })}
            disabled={saveMutation.isPending}
            className="w-full mt-4 bg-primary-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu biến thể'}
          </button>
        </div>

        {/* SKU Table Preview */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-700 mb-4">Danh sách SKU</h2>
          {product?.skus?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="pb-2 text-left">Tên SKU</th>
                    <th className="pb-2 text-right">Giá</th>
                    <th className="pb-2 text-right">Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {product.skus.map((sku: any) => (
                    <tr key={sku.id} className="border-b last:border-0">
                      <td className="py-2">{sku.name || sku.skuCode}</td>
                      <td className="py-2 text-right">{Number(sku.price).toLocaleString('vi-VN')}₫</td>
                      <td className="py-2 text-right">{sku.stock?.availableQuantity || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-6">Chưa có SKU nào</p>
          )}
        </div>
      </div>
    </div>
  );
}
