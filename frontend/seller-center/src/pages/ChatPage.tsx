import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/auth.store';

export default function ChatPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads } = useQuery({
    queryKey: ['seller-chat-threads'],
    queryFn: () => apiClient.get('/chat/threads').then(r => r.data.data),
    refetchInterval: 10000,
  });

  const { data: messages } = useQuery({
    queryKey: ['chat-messages', activeThreadId],
    queryFn: () => apiClient.get(`/chat/threads/${activeThreadId}/messages`).then(r => r.data.data),
    enabled: !!activeThreadId,
    refetchInterval: 5000,
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) => apiClient.post(`/chat/threads/${activeThreadId}/messages`, { content }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeThreadId] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Chat với khách hàng</h1>

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Thread list */}
        <div className="w-72 card overflow-y-auto">
          {!threads?.data?.length ? (
            <div className="p-6 text-center text-gray-500 text-sm">Chưa có cuộc trò chuyện</div>
          ) : (
            threads.data.map((thread: any) => (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`w-full text-left p-3 border-b hover:bg-gray-50 ${activeThreadId === thread.id ? 'bg-blue-50' : ''}`}
              >
                <p className="font-medium text-sm truncate">
                  {thread.buyer?.email || 'Khách hàng'}
                </p>
                <p className="text-xs text-gray-400 truncate">{thread.lastMessage || 'Chưa có tin nhắn'}</p>
              </button>
            ))
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 card flex flex-col">
          {!activeThreadId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Chọn cuộc trò chuyện để xem
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages?.data?.map((msg: any) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t flex gap-2">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && message.trim() && sendMessage.mutate(message)}
                  className="flex-1 input text-sm"
                  placeholder="Nhập tin nhắn..."
                />
                <button
                  onClick={() => message.trim() && sendMessage.mutate(message)}
                  disabled={!message.trim() || sendMessage.isPending}
                  className="btn-primary px-3 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
