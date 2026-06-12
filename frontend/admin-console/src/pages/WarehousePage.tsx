import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function WarehousePage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-warehouses'],
    queryFn: () => apiClient.get('/admin/warehouses').then(r => r.data.data),
  });

  const { data: warehouseDetail } = useQuery({
    queryKey: ['warehouse-detail', selectedWarehouse],
    queryFn: () => apiClient.get(`/admin/warehouses/${selectedWarehouse}`).then(r => r.data.data),
    enabled: !!selectedWarehouse,
  });

  const createWarehouse = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/warehouses', data),
    onSuccess: () => {
      toast.success('Kho hàng đã được tạo');
      queryClient.invalidateQueries({ queryKey: ['admin-warehouses'] });
      setShowForm(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo kho'),
  });

  const updateWarehouse = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.patch(`/admin/warehouses/${id}`, data),
    onSuccess: () => {
      toast.success('Đã cập nhật kho');
      queryClient.invalidateQueries({ queryKey: ['admin-warehouses'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý kho hàng</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2">
          + Thêm kho
        </button>
      </div>

      {showForm && (
        <div className="card p-4 mb-6">
          <h2 className="font-semibold mb-4">Thêm kho hàng mới</h2>
          <form onSubmit={handleSubmit((data) => createWarehouse.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tên kho *</label>
                <input {...register('name', { required: true })} className="input mt-1" placeholder="Kho Hà Nội" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mã kho *</label>
                <input {...register('code', { required: true })} className="input mt-1" placeholder="WH-HN-001" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Địa chỉ *</label>
              <input {...register('addressLine', { required: true })} className="input mt-1" placeholder="Số nhà, tên đường" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Quận/Huyện *</label>
                <input {...register('district', { required: true })} className="input mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tỉnh/TP *</label>
                <input {...register('province', { required: true })} className="input mt-1" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createWarehouse.isPending} className="btn-primary disabled:opacity-50">
                {createWarehouse.isPending ? 'Đang tạo...' : 'Tạo kho'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouses list */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm">Danh sách kho ({data?.data?.length || 0})</h2>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Đang tải...</div>
            ) : !data?.data?.length ? (
              <div className="p-8 text-center text-gray-500 text-sm">Chưa có kho nào</div>
            ) : (
              <div className="divide-y">
                {data.data.map((wh: any) => (
                  <button
                    key={wh.id}
                    onClick={() => setSelectedWarehouse(wh.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 ${selectedWarehouse === wh.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{wh.name}</p>
                        <p className="text-xs text-gray-500">{wh.code}</p>
                        <p className="text-xs text-gray-400">{wh.district}, {wh.province}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{wh._count?.inventoryLevels || 0}</p>
                        <p className="text-xs text-gray-400">SKUs</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${wh.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {wh.isActive !== false ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Warehouse Detail */}
        <div className="lg:col-span-2">
          {!selectedWarehouse ? (
            <div className="card p-12 text-center text-gray-500">
              <p className="text-4xl mb-3">🏭</p>
              <p>Chọn một kho để xem chi tiết</p>
            </div>
          ) : warehouseDetail ? (
            <div className="card overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{warehouseDetail.name}</h2>
                  <p className="text-sm text-gray-500">{warehouseDetail.addressLine}, {warehouseDetail.district}, {warehouseDetail.province}</p>
                </div>
                <button
                  onClick={() => updateWarehouse.mutate({ id: warehouseDetail.id, data: { isActive: !warehouseDetail.isActive } })}
                  className={`text-xs px-3 py-1 rounded border ${warehouseDetail.isActive !== false ? 'border-orange-500 text-orange-500 hover:bg-orange-50' : 'border-green-500 text-green-500 hover:bg-green-50'}`}
                >
                  {warehouseDetail.isActive !== false ? 'Tạm dừng' : 'Kích hoạt'}
                </button>
              </div>
              <div className="p-4 border-b">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Tồn kho tại kho ({warehouseDetail.inventoryLevels?.length || 0} SKU)</h3>
                {warehouseDetail.inventoryLevels?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500">Sản phẩm</th>
                          <th className="text-right px-3 py-2 text-gray-500">Số lượng</th>
                          <th className="text-right px-3 py-2 text-gray-500">Đặt trước</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouseDetail.inventoryLevels.map((level: any) => (
                          <tr key={level.id} className="border-t">
                            <td className="px-3 py-2">
                              <p className="font-medium text-xs">{level.sku?.product?.name}</p>
                              <p className="text-xs text-gray-500">{level.sku?.name}</p>
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${level.quantity < 10 ? 'text-red-600' : ''}`}>
                              {level.quantity}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-500">{level.reservedQuantity || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Kho trống</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
