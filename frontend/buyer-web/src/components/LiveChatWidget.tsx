import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuthStore } from '../store/auth.store';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface Props {
  shopId?: string;
  shopName?: string;
  shopLogo?: string;
}

export default function LiveChatWidget({ shopId, shopName = 'Người bán', shopLogo }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuthStore();
  const qc = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', threadId],
    queryFn: () => apiClient.get(`/chat/threads/${threadId}/messages`).then((r) => r.data.data?.items || []),
    enabled: !!threadId && isOpen,
    refetchInterval: 5000,
  });

  const startChatMutation = useMutation({
    mutationFn: () => apiClient.post('/chat/threads', { shopId }),
    onSuccess: (res) => {
      const tid = res.data.data?.id || res.data.data?.threadId;
      setThreadId(tid);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/chat/threads/${threadId}/messages`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-messages', threadId] });
      setMessage('');
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (shopId && !threadId && isAuthenticated) {
      startChatMutation.mutate();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !threadId) return;
    sendMutation.mutate(message.trim());
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && !isMinimized && (
        <div className="w-80 h-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-red-500 px-4 py-3 flex items-center gap-3">
            {shopLogo ? (
              <img src={shopLogo} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-sm">
                {shopName[0]}
              </div>
            )}
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{shopName}</p>
              <p className="text-red-100 text-xs">Thường phản hồi trong vài phút</p>
            </div>
            <button onClick={() => setIsMinimized(true)} className="text-white/80 hover:text-white">
              <Minimize2 size={16} />
            </button>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {isLoading || startChatMutation.isPending ? (
              <div className="flex items-center justify-center h-full">
                <Loader size={24} className="animate-spin text-gray-400" />
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p>Bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              messages.map((msg: Message) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-red-500 text-white rounded-br-sm'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
              disabled={!threadId}
            />
            <button
              type="submit"
              disabled={!message.trim() || !threadId || sendMutation.isPending}
              className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={handleOpen}
        className="w-14 h-14 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-110 flex items-center justify-center relative"
      >
        {isOpen && !isMinimized ? (
          <X size={24} onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
        ) : (
          <>
            <MessageCircle size={24} />
            {isMinimized && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-xs flex items-center justify-center">
                !
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
