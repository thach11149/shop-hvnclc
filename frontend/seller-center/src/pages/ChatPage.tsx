import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Search, Circle, CheckCheck, Check, Image } from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/auth.store';

export default function ChatPage() {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [searchThread, setSearchThread] = useState('');
  const [searchMsg, setSearchMsg] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<any>(null);

  const { data: threads } = useQuery({
    queryKey: ['seller-chat-threads'],
    queryFn: () => apiClient.get('/chat/threads').then(r => r.data.data),
    refetchInterval: 15000,
  });

  const { data: messagesData } = useQuery({
    queryKey: ['chat-messages', activeThreadId],
    queryFn: () => apiClient.get(`/chat/threads/${activeThreadId}/messages`).then(r => r.data.data),
    enabled: !!activeThreadId,
    refetchInterval: 8000,
  });

  const sendMessage = useMutation({
    mutationFn: (payload: { content: string; attachmentUrl?: string }) =>
      apiClient.post(`/chat/threads/${activeThreadId}/messages`, payload),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeThreadId] });
      queryClient.invalidateQueries({ queryKey: ['seller-chat-threads'] });
    },
  });

  const markRead = useMutation({
    mutationFn: (threadId: string) => apiClient.patch(`/chat/threads/${threadId}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-chat-threads'] }),
  });

  // Socket.io connection
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { io } = await import('socket.io-client' as any);
        const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
        const socket = io(API_URL, { auth: { token }, transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('new-message', (msg: any) => {
          if (msg.threadId === activeThreadId) {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', activeThreadId] });
          }
          queryClient.invalidateQueries({ queryKey: ['seller-chat-threads'] });
        });

        socket.on('typing', ({ threadId, userId }: any) => {
          if (threadId === activeThreadId && userId !== user?.id) {
            setTypingUsers(prev => new Set([...prev, userId]));
            setTimeout(() => {
              setTypingUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
            }, 3000);
          }
        });

        socket.on('user-online', ({ userId }: any) => {
          setOnlineUsers(prev => new Set([...prev, userId]));
        });

        socket.on('user-offline', ({ userId }: any) => {
          setOnlineUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
        });

        socket.on('message-read', ({ threadId, userId }: any) => {
          if (threadId === activeThreadId) {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', activeThreadId] });
          }
        });

        return () => { socket.disconnect(); socketRef.current = null; };
      } catch {
        // socket.io-client not installed
      }
    })();
  }, [token]);

  // Join/leave thread room
  useEffect(() => {
    if (activeThreadId && socketRef.current) {
      socketRef.current.emit('join-chat', { threadId: activeThreadId });
      markRead.mutate(activeThreadId);
    }
    return () => {
      if (activeThreadId && socketRef.current) {
        socketRef.current.emit('leave-chat', { threadId: activeThreadId });
      }
    };
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  const handleTyping = useCallback(() => {
    if (!activeThreadId || !socketRef.current) return;
    socketRef.current.emit('typing', { threadId: activeThreadId, userId: user?.id });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', { threadId: activeThreadId, userId: user?.id });
    }, 2000);
  }, [activeThreadId, user?.id]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate({ content: message.trim() });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketRef.current?.emit('stop-typing', { threadId: activeThreadId, userId: user?.id });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiClient.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data?.url;
      if (url) {
        sendMessage.mutate({ content: file.name, attachmentUrl: url });
      }
    } catch {
      sendMessage.mutate({ content: `[File: ${file.name}]` });
    }
    e.target.value = '';
  };

  const filteredThreads = (threads?.data || []).filter((t: any) =>
    !searchThread || (t.buyer?.email || '').toLowerCase().includes(searchThread.toLowerCase())
  );

  const msgList: any[] = messagesData?.data || messagesData || [];
  const filteredMsgs = searchMsg
    ? msgList.filter(m => m.content?.toLowerCase().includes(searchMsg.toLowerCase()))
    : msgList;

  const activeThread = (threads?.data || []).find((t: any) => t.id === activeThreadId);
  const otherUserId = activeThread?.buyerId || activeThread?.sellerId;
  const isOnline = otherUserId && onlineUsers.has(otherUserId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Chat với khách hàng</h1>

      <div className="flex gap-0 h-[calc(100vh-180px)] rounded-xl overflow-hidden border border-gray-200 bg-white">
        {/* Thread list */}
        <div className="w-72 flex-shrink-0 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchThread}
                onChange={e => setSearchThread(e.target.value)}
                placeholder="Tìm cuộc trò chuyện..."
                className="pl-8 pr-3 py-2 w-full border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">Chưa có cuộc trò chuyện</div>
            ) : (
              filteredThreads.map((thread: any) => {
                const buyerId = thread.buyerId;
                const isOnlineUser = buyerId && onlineUsers.has(buyerId);
                const unread = thread.unreadCount > 0;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${activeThreadId === thread.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(thread.buyer?.email || 'K')[0].toUpperCase()}
                        </div>
                        {isOnlineUser && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {thread.buyer?.email || 'Khách hàng'}
                        </p>
                        <p className={`text-xs truncate ${unread ? 'text-gray-700' : 'text-gray-400'}`}>
                          {thread.lastMessage || 'Chưa có tin nhắn'}
                        </p>
                      </div>
                      {unread && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 flex-shrink-0">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeThreadId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm flex-col gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Search size={28} className="text-gray-300" />
              </div>
              <p>Chọn cuộc trò chuyện để xem</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {(activeThread?.buyer?.email || 'K')[0].toUpperCase()}
                  </div>
                  {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{activeThread?.buyer?.email || 'Khách hàng'}</p>
                  <p className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                    {isOnline ? '● Đang online' : '○ Offline'}
                  </p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => setShowMsgSearch(!showMsgSearch)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="Tìm trong tin nhắn"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>

              {/* Message search bar */}
              {showMsgSearch && (
                <div className="px-4 py-2 border-b bg-gray-50">
                  <input
                    value={searchMsg}
                    onChange={e => setSearchMsg(e.target.value)}
                    placeholder="Tìm trong tin nhắn..."
                    className="w-full input text-sm"
                    autoFocus
                  />
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredMsgs.map((msg: any) => {
                  const isMine = msg.senderId === user?.id;
                  const isRead = msg.readAt && !isMine;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md group`}>
                        {msg.attachmentUrl ? (
                          <div className={`rounded-xl overflow-hidden ${isMine ? 'ml-auto' : ''}`}>
                            {msg.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                              <img src={msg.attachmentUrl} alt={msg.content} className="max-w-[200px] rounded-xl" />
                            ) : (
                              <a href={msg.attachmentUrl} target="_blank" rel="noreferrer"
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                <Paperclip size={14} />
                                {msg.content}
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                            {msg.content}
                          </div>
                        )}
                        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            msg.readAt ? (
                              <CheckCheck size={12} className="text-blue-500" title="Đã đọc" />
                            ) : (
                              <Check size={12} className="text-gray-400" title="Đã gửi" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-xl px-4 py-2 text-sm text-gray-500 flex items-center gap-1.5">
                      <span>Đang nhập</span>
                      <span className="flex gap-0.5">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-4 py-3 border-t bg-white">
                <div className="flex gap-2 items-end">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
                    title="Đính kèm file"
                  >
                    <Paperclip size={18} />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={message}
                      onChange={e => { setMessage(e.target.value); handleTyping(); }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                      rows={1}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none max-h-32"
                      style={{ overflowY: 'auto' }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessage.isPending}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
    </div>
  );
}
