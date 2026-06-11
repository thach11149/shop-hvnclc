import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

type CategoryForm = { name: string; slug: string; parentId: string; icon: string };

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [form, setForm] = useState<CategoryForm>({ name: '', slug: '', parentId: '', icon: '' });

  const { data } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiClient.get('/categories').then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admin/categories', payload),
    onSuccess: () => { toast.success('Đã tạo danh mục'); queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); setShowForm(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: any) => apiClient.patch(`/admin/categories/${id}`, payload),
    onSuccess: () => { toast.success('Đã cập nhật'); queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); setEditCategory(null); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, parentId: form.parentId || undefined };
    if (editCategory) update.mutate({ id: editCategory.id, ...payload });
    else create.mutate(payload);
  };

  const openEdit = (cat: any) => {
    setEditCategory(cat);
    setForm({ name: cat.name, slug: cat.slug, parentId: cat.parentId || '', icon: cat.icon || '' });
  };

  const categories: any[] = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Danh mục</h1>
        <button onClick={() => { setShowForm(true); setEditCategory(null); setForm({ name: '', slug: '', parentId: '', icon: '' }); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      {(showForm || editCategory) && (
        <div className="card p-4 mb-6">
          <h3 className="font-semibold mb-3">{editCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input w-full" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug *</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="input w-full" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Danh mục cha</label>
              <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className="input w-full">
                <option value="">-- Không có --</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Icon (emoji)</label>
              <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="input w-full" placeholder="📱" />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary disabled:opacity-50">
                {editCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditCategory(null); }} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500">Danh mục</th>
              <th className="text-left px-4 py-3 text-gray-500">Slug</th>
              <th className="text-left px-4 py-3 text-gray-500">Cha</th>
              <th className="text-right px-4 py-3 text-gray-500">SP</th>
              <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat: any) => (
              <tr key={cat.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="mr-2">{cat.icon}</span>
                  <span className="font-medium">{cat.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-500">{cat.parent?.name || '-'}</td>
                <td className="px-4 py-3 text-right">{cat._count?.products || 0}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(cat)} className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                    <Edit size={12} /> Sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
