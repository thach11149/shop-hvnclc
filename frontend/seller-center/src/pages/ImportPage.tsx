import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: jobs, isLoading: jobsLoading, refetch } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: () => apiClient.get('/seller/import-jobs').then(r => r.data.data),
    refetchInterval: 5000,
  });

  const downloadTemplate = async () => {
    try {
      const res = await apiClient.get('/seller/products/import-template', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-import-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không thể tải template');
    }
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/seller/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('File đã được tải lên, đang xử lý...');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      refetch();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Upload thất bại'),
  });

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    COMPLETED: 'Hoàn thành',
    FAILED: 'Thất bại',
    PARTIAL: 'Hoàn thành một phần',
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Nhập hàng loạt sản phẩm</h1>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Tải lên file sản phẩm</h2>

        <div className="flex gap-3 mb-4">
          <button onClick={downloadTemplate} className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            ⬇️ Tải template Excel
          </button>
          <a href="#guide" className="text-sm text-blue-600 hover:underline flex items-center">Hướng dẫn điền</a>
        </div>

        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) setSelectedFile(file);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
          />
          <p className="text-3xl mb-2">📁</p>
          {selectedFile ? (
            <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">Kéo thả file vào đây hoặc click để chọn</p>
              <p className="text-xs text-gray-400 mt-1">Hỗ trợ: .xlsx, .xls, .csv</p>
            </>
          )}
        </div>

        <button
          onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
          disabled={!selectedFile || uploadMutation.isPending}
          className="mt-4 w-full bg-primary-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadMutation.isPending ? 'Đang tải lên...' : 'Tải lên và xử lý'}
        </button>
      </div>

      {/* Import Jobs */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-700 mb-4">Lịch sử import</h2>
        {jobsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : !jobs?.length ? (
          <p className="text-center text-gray-400 py-6">Chưa có lịch sử import</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2 text-left">File</th>
                  <th className="pb-2 text-center">Trạng thái</th>
                  <th className="pb-2 text-center">Tổng dòng</th>
                  <th className="pb-2 text-center">Thành công</th>
                  <th className="pb-2 text-center">Lỗi</th>
                  <th className="pb-2 text-right">Thành phần</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job: any) => (
                  <tr key={job.id} className="border-b last:border-0">
                    <td className="py-2">
                      <p className="font-medium">{job.fileName}</p>
                      <p className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[job.status] || ''}`}>
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
                    </td>
                    <td className="py-2 text-center">{job.totalRows || '-'}</td>
                    <td className="py-2 text-center text-green-600">{job.successRows || 0}</td>
                    <td className="py-2 text-center text-red-500">{job.errorRows || 0}</td>
                    <td className="py-2 text-right">
                      {job.errorRows > 0 && (
                        <button
                          onClick={() => apiClient.get(`/seller/import-jobs/${job.id}/errors`, { responseType: 'blob' })
                            .then(res => {
                              const url = URL.createObjectURL(new Blob([res.data]));
                              const a = document.createElement('a');
                              a.href = url; a.download = `errors-${job.id}.xlsx`; a.click();
                              URL.revokeObjectURL(url);
                            })}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Tải file lỗi
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guide */}
      <div id="guide" className="bg-white rounded-xl border p-4 mt-6">
        <h2 className="font-semibold text-gray-700 mb-3">📖 Hướng dẫn import</h2>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Tải template về, điền đầy đủ thông tin sản phẩm</li>
          <li>Các cột có dấu (*) là bắt buộc</li>
          <li>Mã danh mục phải tồn tại trong hệ thống</li>
          <li>Giá nhập bằng VND, không có dấu phẩy</li>
          <li>Tồn kho tối thiểu là 0</li>
          <li>Hình ảnh: URL trực tiếp, cách nhau bằng dấu phẩy</li>
          <li>Sau khi upload, chờ hệ thống xử lý (vài phút)</li>
        </ul>
      </div>
    </div>
  );
}
