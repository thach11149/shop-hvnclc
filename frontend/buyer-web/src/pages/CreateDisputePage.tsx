import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

const DISPUTE_REASONS = [
  'Hàng không đúng mô tả',
  'Hàng bị lỗi/hư hỏng',
  'Không nhận được hàng',
  'Hàng thiếu phụ kiện',
  'Hàng bị giả mạo',
  'Sản phẩm khác với ảnh',
  'Shop giao sai hàng',
  'Khác',
];

export default function CreateDisputePage() {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) { setError('Vui lòng chọn lý do tranh chấp'); return; }
    if (!description.trim()) { setError('Vui lòng mô tả chi tiết'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi tạo tranh chấp');
      navigate(`/disputes/${data.data.id}`, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/orders/${orderId}`} className="flex items-center gap-2 text-blue-600 hover:underline text-sm mb-6">
        <ArrowLeft size={14} />
        Quay lại đơn hàng
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <AlertTriangle className="text-red-600" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mở tranh chấp</h1>
          <p className="text-sm text-gray-500">Mã đơn: #{orderId?.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do tranh chấp <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DISPUTE_REASONS.map(r => (
              <label key={r} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                reason === r ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="text-red-600"
                />
                <span className="text-sm text-gray-700">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            rows={4}
            placeholder="Mô tả cụ thể vấn đề bạn gặp phải với đơn hàng này..."
            maxLength={1000}
          />
          <p className="text-xs text-gray-400 mt-1">{description.length}/1000 ký tự</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-700">
          <strong>Lưu ý:</strong> Tranh chấp chỉ nên được mở khi bạn có vấn đề nghiêm trọng với đơn hàng.
          Hãy thử liên hệ shop trực tiếp qua chat trước khi mở tranh chấp.
        </div>

        <div className="flex gap-3 justify-end">
          <Link to={`/orders/${orderId}`} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            Quay lại
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            <Send size={14} />
            {submitting ? 'Đang gửi...' : 'Mở tranh chấp'}
          </button>
        </div>
      </form>
    </div>
  );
}
