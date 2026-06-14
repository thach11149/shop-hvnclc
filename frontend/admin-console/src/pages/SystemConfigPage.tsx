import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Settings, Save, Plus, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const GROUPS = ['general', 'payment', 'shipping', 'promotion', 'email', 'security', 'feature'];

export default function SystemConfigPage() {
  const qc = useQueryClient();
  const [group, setGroup] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newConfig, setNewConfig] = useState({ key: '', value: '', description: '', group: 'general' });

  const { data, isLoading } = useQuery({
    queryKey: ['system-configs', group],
    queryFn: () => apiClient.get('/admin/system/config', { params: { group: group || undefined } }).then((r) => r.data.data),
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: { key: string; value: any; description?: string; group?: string }) =>
      apiClient.put('/admin/system/config', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-configs'] });
      toast.success('Đã lưu cấu hình');
      setEditing({});
    },
    onError: () => toast.error('Không thể lưu'),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => apiClient.delete(`/admin/system/config/${key}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-configs'] });
      toast.success('Đã xóa');
    },
  });

  const configs = (data || []).filter((c: any) =>
    !search || c.key.toLowerCase().includes(search.toLowerCase()) || (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (config: any) => {
    const newVal = editing[config.key];
    if (newVal === undefined) return;
    let parsedVal: any = newVal;
    try { parsedVal = JSON.parse(newVal); } catch {}
    upsertMutation.mutate({ key: config.key, value: parsedVal, description: config.description, group: config.group });
  };

  const handleAdd = () => {
    let val: any = newConfig.value;
    try { val = JSON.parse(newConfig.value); } catch {}
    upsertMutation.mutate({ key: newConfig.key, value: val, description: newConfig.description, group: newConfig.group });
    setShowAdd(false);
    setNewConfig({ key: '', value: '', description: '', group: 'general' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings size={24} className="text-gray-500" />
            Cấu hình hệ thống
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý các tham số cấu hình hệ thống</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Thêm cấu hình
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Tất cả nhóm</option>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {showAdd && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h3 className="font-bold mb-4 text-blue-900">Thêm cấu hình mới</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Key *</label>
              <input
                type="text"
                value={newConfig.key}
                onChange={(e) => setNewConfig((p) => ({ ...p, key: e.target.value }))}
                placeholder="ví_dụ: max_file_size"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nhóm</label>
              <select
                value={newConfig.group}
                onChange={(e) => setNewConfig((p) => ({ ...p, group: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              >
                {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Giá trị *</label>
              <input
                type="text"
                value={newConfig.value}
                onChange={(e) => setNewConfig((p) => ({ ...p, value: e.target.value }))}
                placeholder="Chuỗi, số, JSON..."
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
              <input
                type="text"
                value={newConfig.description}
                onChange={(e) => setNewConfig((p) => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} disabled={!newConfig.key || !newConfig.value} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50">Lưu</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded text-sm">Hủy</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-48">Key</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Giá trị</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Nhóm</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mô tả</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-24">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map((c: any) => (
                <tr key={c.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-700">{c.key}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={editing[c.key] !== undefined ? editing[c.key] : JSON.stringify(c.value)}
                      onChange={(e) => setEditing((p) => ({ ...p, [c.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c.group}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.description || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {editing[c.key] !== undefined && (
                        <button onClick={() => handleSave(c)} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                          <Save size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteMutation.mutate(c.key)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {configs.length === 0 && (
            <div className="text-center py-12 text-gray-400">Không có cấu hình nào</div>
          )}
        </div>
      )}
    </div>
  );
}
