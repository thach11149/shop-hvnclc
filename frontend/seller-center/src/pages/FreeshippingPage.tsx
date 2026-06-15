import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Truck, Plus, Edit2, Trash2, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const EMPTY_FORM = {
  name: '',
  minOrderAmount: '',
  maxShippingDiscount: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  isActive: true,
};

function RuleModal({
  onClose,
  editing,
}: {
  onClose: () => void;
  editing?: any;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(
    editing
      ? {
          name: editing.name,
          minOrderAmount: String(editing.minOrderAmount || ''),
          maxShippingDiscount: String(editing.maxShippingDiscount || '0'),
          startDate: editing.startDate ? editing.startDate.slice(0, 10) : '',
          endDate: editing.endDate ? editing.endDate.slice(0, 10) : '',
          usageLimit: String(editing.usageLimit || ''),
          isActive: editing.isActive ?? true,
        }
      : { ...EMPTY_FORM }
  );

  const mutation = useMutation({
    mutationFn: (data: any) =>
      editing
        ? apiClient.patch(`/seller/freeship-rules/${editing.id}`, data)
        : apiClient.post('/seller/freeship-rules', data),
    onSuccess: () => {
      toast.success(editing ? 'Đã cập nhật quy tắc' : 'Đã tạo quy tắc miễn phí ship');
      qc.invalidateQueries({ queryKey: ['freeship-rules'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi lưu quy tắc'),
  });

  const handleSubmit = () => {
    mutation.mutate({
      name: form.name,
      minOrderAmount: Number(form.minOrderAmount),
      maxShippingDiscount: Number(form.maxShippingDiscount || 0),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">
            {editing ? 'Sửa quy tắc miễn phí ship' : 'Tạo quy tắc miễn phí ship'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên quy tắc *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Miễn ship đơn từ 200K"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Đơn hàng tối thiểu (VND) *</label>
            <input
              type="number"
              value={form.minOrderAmount}
              onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
              placeholder="200000"
              min="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Giảm phí ship tối đa (VND)
              <span className="text-gray-400 font-normal ml-1">— 0 = miễn toàn bộ</span>
            </label>
            <input
              type="number"
              value={form.maxShippingDiscount}
              onChange={(e) => setForm((f) => ({ ...f, maxShippingDiscount: e.target.value }))}
              placeholder="0"
              min="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Giới hạn sử dụng
              <span className="text-gray-400 font-normal ml-1">— để trống = không giới hạn</span>
            </label>
            <input
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
              placeholder="Không giới hạn"
              min="1"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="accent-primary-500"
            />
            <span className="text-sm font-medium">Kích hoạt ngay</span>
          </label>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.minOrderAmount || mutation.isPending}
            className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo quy tắc'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FreeshippingPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['freeship-rules'],
    queryFn: () => apiClient.get('/seller/freeship-rules').then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/seller/freeship-rules/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['freeship-rules'] }),
    onError: () => toast.error('Lỗi cập nhật trạng thái'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/freeship-rules/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa quy tắc');
      queryClient.invalidateQueries({ queryKey: ['freeship-rules'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi xóa quy tắc'),
  });

  const ruleList: any[] = rules?.items || rules || [];
  const activeCount = ruleList.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck size={24} className="text-primary-500" />
            Miễn phí vận chuyển
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeCount} quy tắc đang hoạt động
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-600"
        >
          <Plus size={16} /> Tạo quy tắc
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          Miễn phí ship giúp tăng tỷ lệ chuyển đổi. Đặt ngưỡng đơn hàng hợp lý để khuyến khích khách mua thêm.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : ruleList.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <Truck size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-3">Chưa có quy tắc miễn ship nào</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary-500 hover:underline"
          >
            + Tạo quy tắc đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ruleList.map((rule: any) => {
            const now = new Date();
            const isExpired = rule.endDate && new Date(rule.endDate) < now;
            const isNotStarted = rule.startDate && new Date(rule.startDate) > now;

            return (
              <div
                key={rule.id}
                className={`bg-white rounded-xl border p-5 transition-all ${
                  rule.isActive && !isExpired ? 'border-green-200' : 'border-gray-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">{rule.name}</p>
                      {rule.isActive && !isExpired && !isNotStarted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đang hoạt động</span>
                      )}
                      {isExpired && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Hết hạn</span>
                      )}
                      {isNotStarted && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Chưa bắt đầu</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Đơn từ <strong>{Number(rule.minOrderAmount).toLocaleString('vi-VN')}₫</strong></span>
                      {rule.maxShippingDiscount > 0 && (
                        <span>Giảm tối đa <strong>{Number(rule.maxShippingDiscount).toLocaleString('vi-VN')}₫</strong></span>
                      )}
                      {rule.maxShippingDiscount === 0 && (
                        <span className="text-green-600 font-medium">Miễn toàn bộ phí ship</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      {(rule.startDate || rule.endDate) && (
                        <span>
                          {rule.startDate && new Date(rule.startDate).toLocaleDateString('vi-VN')}
                          {' — '}
                          {rule.endDate ? new Date(rule.endDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                        </span>
                      )}
                      {rule.usageLimit && (
                        <span>
                          Đã dùng: {rule.usageCount || 0}/{rule.usageLimit}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        rule.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        rule.isActive ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>

                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50"
                      title="Sửa"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => window.confirm('Xóa quy tắc này?') && deleteMutation.mutate(rule.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showForm || editingRule) && (
        <RuleModal
          editing={editingRule}
          onClose={() => { setShowForm(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}
