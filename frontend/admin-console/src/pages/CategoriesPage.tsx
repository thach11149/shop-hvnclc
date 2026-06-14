import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, GripVertical, Check, X, Image, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image: string | null;
  icon?: string;
  isActive: boolean;
  position: number;
  children: Category[];
  _count?: { products: number };
};

type CategoryForm = { name: string; slug: string; parentId: string; image: string };

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd').replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function CategoryRow({
  cat,
  depth,
  allCategories,
  onEdit,
  onDelete,
  onToggle,
  dragState,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  cat: Category;
  depth: number;
  allCategories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onToggle: (cat: Category) => void;
  dragState: { dragging: string | null };
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = cat.children && cat.children.length > 0;

  return (
    <>
      <tr
        draggable
        onDragStart={() => onDragStart(cat.id)}
        onDragOver={onDragOver}
        onDrop={() => onDrop(cat.id)}
        className={`border-t hover:bg-gray-50 transition-colors ${dragState.dragging === cat.id ? 'opacity-40' : ''}`}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
            <GripVertical size={14} className="text-gray-300 mr-1.5 cursor-grab flex-shrink-0" />
            {hasChildren ? (
              <button onClick={() => setExpanded(!expanded)} className="mr-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span className="w-5 mr-1.5 flex-shrink-0" />
            )}
            {cat.image ? (
              <img src={cat.image} alt="" className="w-6 h-6 rounded object-cover mr-2 flex-shrink-0" />
            ) : (
              <span className="w-6 h-6 mr-2 flex items-center justify-center text-gray-300 flex-shrink-0">
                <Image size={14} />
              </span>
            )}
            <span className="font-medium text-gray-800">{cat.name}</span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-gray-400 text-xs">{cat.slug}</td>
        <td className="px-4 py-2.5 text-center">
          <span className={`inline-block w-2 h-2 rounded-full ${cat.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
        </td>
        <td className="px-4 py-2.5 text-center text-sm text-gray-500">{cat._count?.products || 0}</td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(cat)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Sửa">
              <Edit2 size={14} />
            </button>
            <button onClick={() => onToggle(cat)} className={`p-1 rounded hover:bg-gray-50 ${cat.isActive ? 'text-orange-500' : 'text-green-500'}`} title={cat.isActive ? 'Ẩn' : 'Hiện'}>
              {cat.isActive ? <X size={14} /> : <Check size={14} />}
            </button>
            <button
              onClick={() => onDelete(cat)}
              className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 disabled:opacity-30"
              disabled={(cat._count?.products || 0) > 0 || (cat.children?.length || 0) > 0}
              title={(cat._count?.products || 0) > 0 ? 'Có sản phẩm, không thể xóa' : (cat.children?.length || 0) > 0 ? 'Có danh mục con, không thể xóa' : 'Xóa'}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && hasChildren && cat.children.map(child => (
        <CategoryRow
          key={child.id}
          cat={child}
          depth={depth + 1}
          allCategories={allCategories}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
          dragState={dragState}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />
      ))}
    </>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: '', slug: '', parentId: '', image: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: tree, isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories-tree'],
    queryFn: () => apiClient.get('/categories/tree').then(r => r.data.data || []),
  });

  const { data: flatList } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => apiClient.get('/categories').then(r => r.data.data?.data || r.data.data || []),
  });

  const create = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admin/categories', payload),
    onSuccess: () => {
      toast.success('Đã tạo danh mục');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: any) => apiClient.patch(`/admin/categories/${id}`, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa danh mục');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      setDeleteConfirm(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => apiClient.patch('/admin/categories/reorder', { ids }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditCategory(null);
    setForm({ name: '', slug: '', parentId: '', image: '' });
    setImageFile(null);
    setImagePreview('');
  };

  const openEdit = (cat: Category) => {
    setEditCategory(cat);
    setForm({ name: cat.name, slug: cat.slug, parentId: cat.parentId || '', image: cat.image || '' });
    setImagePreview(cat.image || '');
    setImageFile(null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = form.image;

    if (imageFile) {
      const fd = new FormData();
      fd.append('file', imageFile);
      try {
        const res = await apiClient.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = res.data.data?.url || imageUrl;
      } catch {
        toast.error('Lỗi upload ảnh, dùng URL trực tiếp');
      }
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      parentId: form.parentId || undefined,
      image: imageUrl || undefined,
    };

    if (editCategory) {
      update.mutate({ id: editCategory.id, ...payload });
    } else {
      create.mutate(payload);
    }
  };

  const handleToggle = (cat: Category) => {
    update.mutate({ id: cat.id, isActive: !cat.isActive });
  };

  // Flatten tree to get ordered IDs for drag reorder
  const flattenTree = (items: Category[]): string[] => {
    const ids: string[] = [];
    items.forEach(item => {
      ids.push(item.id);
      if (item.children) ids.push(...flattenTree(item.children));
    });
    return ids;
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId || !tree) return;
    const allIds = flattenTree(tree);
    const fromIdx = allIds.indexOf(draggingId);
    const toIdx = allIds.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newIds = [...allIds];
    newIds.splice(fromIdx, 1);
    newIds.splice(toIdx, 0, draggingId);
    reorder.mutate(newIds);
    setDraggingId(null);
  };

  const flatCategories: Category[] = flatList || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Danh mục</h1>
        <button
          onClick={() => { setShowForm(true); setEditCategory(null); setForm({ name: '', slug: '', parentId: '', image: '' }); setImagePreview(''); setImageFile(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-lg mb-4">{editCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tên *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Slug *</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm({ ...form, slug: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Danh mục cha</label>
                <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className="input w-full">
                  <option value="">-- Danh mục gốc --</option>
                  {flatCategories.filter(c => c.id !== editCategory?.id).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ảnh danh mục</label>
                <div className="flex gap-3 items-start">
                  {imagePreview && (
                    <img src={imagePreview} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-sm mb-2 w-full">
                      Chọn ảnh
                    </button>
                    <input
                      value={form.image}
                      onChange={e => { setForm({ ...form, image: e.target.value }); setImagePreview(e.target.value); }}
                      className="input w-full text-xs"
                      placeholder="Hoặc nhập URL ảnh..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary disabled:opacity-50">
                  {editCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
              <h3 className="font-bold">Xóa danh mục?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">Xóa danh mục <strong>{deleteConfirm.name}</strong>? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => remove.mutate(deleteConfirm.id)} disabled={remove.isPending} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
                {remove.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b text-xs text-gray-500">
          Kéo thả để sắp xếp thứ tự. Click icon chỉnh sửa để thay đổi thông tin.
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Danh mục</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Slug</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">SP</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(tree || []).map(cat => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  depth={0}
                  allCategories={flatCategories}
                  onEdit={openEdit}
                  onDelete={setDeleteConfirm}
                  onToggle={handleToggle}
                  dragState={{ dragging: draggingId }}
                  onDragStart={setDraggingId}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
