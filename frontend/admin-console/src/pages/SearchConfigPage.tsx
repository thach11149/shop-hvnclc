import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function SearchConfigPage() {
  const queryClient = useQueryClient();
  const [newSynonym, setNewSynonym] = useState({ keyword: '', synonyms: '' });
  const [newKeyword, setNewKeyword] = useState({ keyword: '', weight: '1' });

  const { data: synonyms, isLoading: synonymsLoading } = useQuery({
    queryKey: ['search-synonyms'],
    queryFn: () => apiClient.get('/admin/search/synonyms').then(r => r.data.data),
  });

  const { data: boostedKeywords, isLoading: keywordsLoading } = useQuery({
    queryKey: ['search-keywords'],
    queryFn: () => apiClient.get('/admin/search/keywords').then(r => r.data.data),
  });

  const addSynonymMutation = useMutation({
    mutationFn: (data: { keyword: string; synonyms: string[] }) =>
      apiClient.post('/admin/search/synonyms', data),
    onSuccess: () => {
      toast.success('Đã thêm synonym');
      queryClient.invalidateQueries({ queryKey: ['search-synonyms'] });
      setNewSynonym({ keyword: '', synonyms: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi thêm synonym'),
  });

  const addKeywordMutation = useMutation({
    mutationFn: (data: { keyword: string; weight: number }) =>
      apiClient.post('/admin/search/keywords', data),
    onSuccess: () => {
      toast.success('Đã thêm keyword');
      queryClient.invalidateQueries({ queryKey: ['search-keywords'] });
      setNewKeyword({ keyword: '', weight: '1' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi thêm keyword'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ type, id }: { type: 'synonym' | 'keyword'; id: string }) =>
      apiClient.delete(`/admin/search/${type}s/${id}`),
    onSuccess: (_data, variables) => {
      toast.success('Đã xóa');
      queryClient.invalidateQueries({ queryKey: [variables.type === 'synonym' ? 'search-synonyms' : 'search-keywords'] });
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Cấu hình Search</h1>

      {/* Synonyms */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-1">Từ đồng nghĩa (Synonyms)</h2>
        <p className="text-xs text-gray-500 mb-4">Khi người dùng tìm từ này, cũng hiển thị kết quả của các từ đồng nghĩa</p>

        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Từ khóa"
            className="border rounded px-3 py-2 text-sm flex-1"
            value={newSynonym.keyword}
            onChange={e => setNewSynonym(s => ({ ...s, keyword: e.target.value }))} />
          <input type="text" placeholder="Từ đồng nghĩa (cách nhau bằng dấu phẩy)"
            className="border rounded px-3 py-2 text-sm flex-[2]"
            value={newSynonym.synonyms}
            onChange={e => setNewSynonym(s => ({ ...s, synonyms: e.target.value }))} />
          <button
            onClick={() => addSynonymMutation.mutate({ keyword: newSynonym.keyword, synonyms: newSynonym.synonyms.split(',').map(s => s.trim()).filter(Boolean) })}
            disabled={!newSynonym.keyword || !newSynonym.synonyms || addSynonymMutation.isPending}
            className="bg-primary-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            Thêm
          </button>
        </div>

        {synonymsLoading ? (
          <div className="space-y-1">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !synonyms?.length ? (
          <p className="text-gray-400 text-sm">Chưa có synonym nào</p>
        ) : (
          <div className="space-y-2">
            {synonyms.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between border rounded px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{s.keyword}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-gray-600">{Array.isArray(s.synonyms) ? s.synonyms.join(', ') : s.synonyms}</span>
                </div>
                <button onClick={() => deleteItemMutation.mutate({ type: 'synonym', id: s.id })} className="text-red-400 hover:text-red-600 text-xs">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boosted Keywords */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-700 mb-1">Từ khóa ưu tiên</h2>
        <p className="text-xs text-gray-500 mb-4">Tăng trọng số cho từ khóa quan trọng</p>

        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Từ khóa"
            className="border rounded px-3 py-2 text-sm flex-1"
            value={newKeyword.keyword}
            onChange={e => setNewKeyword(k => ({ ...k, keyword: e.target.value }))} />
          <input type="number" min="1" max="10" placeholder="Trọng số (1-10)"
            className="border rounded px-3 py-2 text-sm w-32"
            value={newKeyword.weight}
            onChange={e => setNewKeyword(k => ({ ...k, weight: e.target.value }))} />
          <button
            onClick={() => addKeywordMutation.mutate({ keyword: newKeyword.keyword, weight: Number(newKeyword.weight) })}
            disabled={!newKeyword.keyword || addKeywordMutation.isPending}
            className="bg-primary-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            Thêm
          </button>
        </div>

        {keywordsLoading ? (
          <div className="space-y-1">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !boostedKeywords?.length ? (
          <p className="text-gray-400 text-sm">Chưa có keyword nào</p>
        ) : (
          <div className="space-y-2">
            {boostedKeywords.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between border rounded px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{k.keyword}</span>
                  <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">trọng số: {k.weight}</span>
                </div>
                <button onClick={() => deleteItemMutation.mutate({ type: 'keyword', id: k.id })} className="text-red-400 hover:text-red-600 text-xs">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
