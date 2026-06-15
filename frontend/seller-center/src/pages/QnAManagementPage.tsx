import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { MessageSquare, CheckCircle, Clock, Send, Search, Filter, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function QnAManagementPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'unanswered' | 'answered' | 'all'>('unanswered');
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['seller-qna', filter, search, productFilter, page],
    queryFn: () =>
      apiClient
        .get('/seller/qna', {
          params: {
            answered: filter === 'answered' ? true : filter === 'unanswered' ? false : undefined,
            search: search || undefined,
            productId: productFilter || undefined,
            limit: LIMIT,
            offset: (page - 1) * LIMIT,
          },
        })
        .then((r) => r.data.data),
  });

  const { data: products } = useQuery({
    queryKey: ['seller-products-minimal'],
    queryFn: () => apiClient.get('/seller/products', { params: { limit: 100, status: 'ACTIVE' } }).then((r) => r.data.data),
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      apiClient.patch(`/qna/${id}/answer`, { answer }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-qna'] });
      setAnsweringId(null);
      setAnswerText('');
      toast.success('Đã gửi câu trả lời');
    },
    onError: () => toast.error('Không thể gửi câu trả lời'),
  });

  const items: any[] = data?.items || [];
  const total: number = data?.total || 0;
  const unansweredCount: number = data?.unansweredCount || 0;
  const productList: any[] = products?.items || [];
  const totalPages = Math.ceil(total / LIMIT);

  const FILTER_TABS = [
    { key: 'unanswered', label: 'Chưa trả lời', badge: unansweredCount },
    { key: 'answered', label: 'Đã trả lời' },
    { key: 'all', label: 'Tất cả' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hỏi đáp sản phẩm</h1>
          <p className="text-gray-500 text-sm mt-1">Trả lời câu hỏi từ khách hàng về sản phẩm của bạn</p>
        </div>
      </div>

      {/* Summary */}
      {unansweredCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <Clock size={20} className="text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-800">
            Bạn có <strong>{unansweredCount}</strong> câu hỏi chưa được trả lời. Trả lời sớm giúp tăng tỷ lệ chuyển đổi!
          </p>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {FILTER_TABS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
              {'badge' in f && f.badge > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {f.badge > 9 ? '9+' : f.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm kiếm câu hỏi..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        {/* Product filter */}
        {productList.length > 0 && (
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={productFilter}
              onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
              className="pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none appearance-none bg-white"
            >
              <option value="">Tất cả sản phẩm</option>
              {productList.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {filter === 'unanswered' ? 'Không có câu hỏi nào cần trả lời 🎉' : 'Không có câu hỏi nào'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {item.answer ? (
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock size={16} className="text-orange-500 flex-shrink-0" />
                  )}
                  <a
                    href={`/products/${item.product?.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-gray-600 hover:text-orange-600"
                  >
                    {item.product?.name}
                  </a>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              {/* Question */}
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-3">
                <p className="text-xs text-orange-600 font-medium mb-1">
                  {item.asker?.buyerProfile?.fullName || 'Khách hàng'} hỏi:
                </p>
                <p className="text-sm text-gray-800">{item.question}</p>
              </div>

              {/* Answer */}
              {item.answer ? (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <p className="text-xs text-green-700 font-medium mb-1">Câu trả lời của bạn:</p>
                  <p className="text-sm text-gray-700">{item.answer}</p>
                  {item.answeredAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.answeredAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              ) : answeringId === item.id ? (
                <div>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    rows={3}
                    autoFocus
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => answerMutation.mutate({ id: item.id, answer: answerText })}
                      disabled={!answerText.trim() || answerMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
                    >
                      <Send size={13} />
                      {answerMutation.isPending ? 'Đang gửi...' : 'Gửi trả lời'}
                    </button>
                    <button
                      onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                      className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAnsweringId(item.id)}
                  className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-800 font-medium"
                >
                  <MessageSquare size={14} />
                  Trả lời câu hỏi này
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Trước
          </button>
          <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
