import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: { id: string; slug: string; name: string; price: number; image: string }[];
}

export default function AIShoppingAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Xin chào! Tôi là trợ lý mua sắm AI. Tôi có thể giúp bạn tìm sản phẩm, so sánh giá và gợi ý phù hợp. Bạn đang cần tìm gì?' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: (userMessage: string) =>
      apiClient.post('/ai/shopping-assistant', {
        message: userMessage,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      }).then(r => r.data.data),
    onSuccess: (data: { reply: string; products?: Message['products'] }) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, products: data.products }]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    chatMutation.mutate(userMsg);
  };

  const SUGGESTIONS = [
    'Tìm áo thể thao nam giá dưới 300k',
    'So sánh tai nghe không dây tốt nhất',
    'Sản phẩm chăm sóc da cho da dầu',
    'Gợi ý quà tặng sinh nhật',
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <h1 className="text-xl font-bold mb-4">Trợ lý mua sắm AI</h1>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tl-2xl rounded-tr-sm rounded-bl-2xl'
                : 'bg-white shadow rounded-tr-2xl rounded-tl-sm rounded-br-2xl'
            } px-4 py-3`}>
              <p className="text-sm">{msg.content}</p>
              {msg.products?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.products.map(p => (
                    <Link key={p.id} to={`/products/${p.slug}`} className="flex items-center gap-2 bg-gray-50 rounded p-2 hover:bg-gray-100">
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-gray-800">{p.name}</p>
                        <p className="text-xs text-blue-600 font-bold">{p.price?.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white shadow rounded-tr-2xl rounded-tl-sm rounded-br-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setInput(s)} className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-3 py-1.5 hover:bg-blue-100">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Hỏi trợ lý..."
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || chatMutation.isPending}
          className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
        >
          →
        </button>
      </div>
    </div>
  );
}
