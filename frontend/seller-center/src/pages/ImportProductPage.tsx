import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function ImportProductPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const uploadFile = useMutation({
    mutationFn: (formData: FormData) => apiClient.post('/seller/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: (res) => {
      toast.success(`Import thành công ${res.data.data?.imported || 0} sản phẩm`);
      setFile(null);
      setPreview([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi khi import'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    // Mock preview for CSV
    if (selected.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(0, 6);
        const headers = lines[0]?.split(',') || [];
        const rows = lines.slice(1).map(line => {
          const values = line.split(',');
          return headers.reduce((acc, h, i) => ({ ...acc, [h.trim()]: values[i]?.trim() }), {});
        }).filter((r: any) => Object.values(r).some(v => v));
        setPreview(rows);
      };
      reader.readAsText(selected);
    }
  };

  const handleSubmit = () => {
    if (!file) { toast.error('Vui lòng chọn file'); return; }
    const formData = new FormData();
    formData.append('file', file);
    uploadFile.mutate(formData);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/products" className="text-gray-500 hover:text-gray-700">
          &larr; Danh sách sản phẩm
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Import sản phẩm hàng loạt</h1>
      </div>

      {/* Instructions */}
      <div className="card p-4 mb-6 bg-blue-50 border border-blue-200">
        <h2 className="font-semibold text-blue-800 mb-2">Hướng dẫn</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Tải file mẫu CSV/Excel theo định dạng quy định</li>
          <li>Điền thông tin sản phẩm vào file mẫu</li>
          <li>Upload file và xem trước dữ liệu</li>
          <li>Xác nhận import</li>
        </ol>
        <a
          href="/templates/product-import-template.csv"
          className="inline-block mt-3 text-sm text-blue-600 hover:underline"
        >
          Tải file mẫu (CSV)
        </a>
      </div>

      {/* File Format */}
      <div className="card p-4 mb-6">
        <h2 className="font-semibold mb-3">Định dạng file</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {['name', 'description', 'categoryId', 'price', 'stock', 'sku', 'weight'].map(col => (
                  <th key={col} className="border px-3 py-2 text-left text-gray-600">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {['Tên SP', 'Mô tả', 'ID Danh mục', 'Giá (VND)', 'Số lượng', 'Mã SKU', 'Cân nặng (g)'].map((val, i) => (
                  <td key={i} className="border px-3 py-2 text-gray-500 italic">{val}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card p-6 mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary-400'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = e.dataTransfer.files[0];
            if (dropped) {
              const synth = { target: { files: [dropped] } } as any;
              handleFileChange(synth);
            }
          }}
        >
          {file ? (
            <div>
              <p className="text-green-600 font-medium text-lg mb-2">✓ {file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={() => { setFile(null); setPreview([]); }}
                className="mt-3 text-sm text-red-500 hover:underline"
              >
                Xóa file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-4xl mb-3">📁</p>
              <p className="text-gray-600 mb-2">Kéo thả file vào đây hoặc</p>
              <label className="cursor-pointer">
                <span className="btn-primary text-sm px-4 py-2">Chọn file</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">Hỗ trợ: CSV, Excel (.xlsx, .xls) - Tối đa 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Xem trước dữ liệu ({preview.length} dòng đầu)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0] || {}).map(key => (
                    <th key={key} className="text-left px-4 py-2 text-gray-500 font-medium">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-4 py-2 text-gray-700">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!file || uploadFile.isPending}
          className="btn-primary disabled:opacity-50"
        >
          {uploadFile.isPending ? 'Đang import...' : 'Bắt đầu import'}
        </button>
        <Link to="/products" className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
          Hủy
        </Link>
      </div>
    </div>
  );
}
