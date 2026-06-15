import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Send, Bot, User, ShoppingCart, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface ProductCard {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  rating?: number;
  soldCount?: number;
  shop?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: ProductCard[];
  typing?: boolean;
}

function ProductCardView({ product }: { product: ProductCard }) {
  const addToCartMutation = useMutation({
    mutationFn: () => apiClient.post('/cart/items', { skuId: product.id, quantity: 1 }),
    onSuccess: () => toast.success('Đã thêm vào giỏ hàng'),
    onError: () => toast.error('Không thể thêm vào giỏ'),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <Link to={`/products/${product.slug}`}>
        <div className="aspect-square overflow-hidden">
          <img
            src={product.image || 'https://via.placeholder.com/200'}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
        <div className="p-2">
          <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1">{product.name}</p>
          {product.shop && <p className="text-xs text-gray-400 mb-1">{product.shop}</p>}
          <p className="text-sm font-bold text-red-500">
            {product.price?.toLocaleString('vi-VN')}đ
          </p>
          {product.rating && (
            <p className="text-xs text-gray-400">⭐ {product.rating.toFixed(1)} · {product.soldCount?.toLocaleString()} đã bán</p>
          )}
        </div>
      </Link>
      <div className="px-2 pb-2">
        <button
          onClick={() => addToCartMutation.mutate()}
          className="w-full py-1 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          <ShoppingCart size={11} /> Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'Tìm áo thể thao nam giá dưới 300k',
  'So sánh tai nghe không dây tốt nhất',
  'Sản phẩm chăm sóc da cho da dầu',
  'Gợi ý quà tặng sinh nhật dưới 500k',
  'Laptop học sinh giá tốt nhất',
  'Đồ gia dụng bếp nấu hằng ngày',
];

export default function AIShoppingAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! 👋 Tôi là trợ lý mua sắm AI của Shop HVNCLC. Tôi có thể giúp bạn:\n• Tìm kiếm sản phẩm phù hợp\n• So sánh giá và chất lượng\n• Gợi ý quà tặng\n• Tư vấn mua sắm thông minh\n\nBạn đang cần tìm gì?',
    },
  ]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = useMutation({
    mutationFn: (userMessage: string) =>
      apiClient
        .post('/ai/shopping-assistant', {
          message: userMessage,
          sessionId,
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        })
        .then((r) => r.data.data),
    onSuccess: (data: { reply: string; products?: ProductCard[] }) => {
      setMessages((prev) => [
        ...prev.filter((m) => !m.typing),
        { role: 'assistant', content: data.reply, products: data.products },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev.filter((m) => !m.typing),
        { role: 'assistant', content: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.' },
      ]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || chatMutation.isPending) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: msg },
      { role: 'assistant', content: '', typing: true },
    ]);
    setInput('');
    chatMutation.mutate(msg);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const clearConversation = () => {
    setMessages([{
      role: 'assistant',
      content: 'Cuộc trò chuyện đã được làm mới. Bạn cần tôi giúp gì?',
    }]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Trợ lý mua sắm AI</h1>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              Đang hoạt động
            </p>
          </div>
        </div>
        <button
          onClick={clearConversation}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          title="Xóa cuộc trò chuyện"
        >
          <X size={14} /> Xóa hội thoại
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-white" />
              </div>
            )}

            <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              {msg.typing ? (
                <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : (
                <div
                  className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              )}

              {/* Product cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {msg.products.map((p) => (
                    <ProductCardView key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-gray-500" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips (show when only 1 message or idle) */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          placeholder="Nhập câu hỏi hoặc tìm kiếm sản phẩm..."
          disabled={chatMutation.isPending}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || chatMutation.isPending}
          className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
