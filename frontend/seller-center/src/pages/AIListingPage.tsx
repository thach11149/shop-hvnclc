import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';

interface AIListingSuggestion {
  title: string;
  description: string;
  bulletPoints: string[];
  keywords: string[];
  suggestedCategory: string;
  suggestedPrice: number;
}

export default function AIListingPage() {
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [result, setResult] = useState<AIListingSuggestion | null>(null);

  const generateMutation = useMutation({
    mutationFn: (body: { productName: string; features: string }) =>
      apiClient.post('/seller/ai/listing', body).then(r => r.data.data),
    onSuccess: (data: AIListingSuggestion) => setResult(data),
  });

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">AI Tạo listing sản phẩm</h1>
      <p className="text-gray-500 text-sm mb-6">Nhập thông tin cơ bản, AI sẽ tạo tiêu đề, mô tả và từ khóa tối ưu.</p>

      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
          <input
            value={productName}
            onChange={e => setProductName(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Ví dụ: Áo sơ mi nam trắng form slim fit"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin/đặc điểm sản phẩm</label>
          <textarea
            value={features}
            onChange={e => setFeatures(e.target.value)}
            rows={4}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Chất liệu, màu sắc, kích thước, xuất xứ, tính năng..."
          />
        </div>
        <button
          onClick={() => generateMutation.mutate({ productName, features })}
          disabled={generateMutation.isPending || !productName}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {generateMutation.isPending ? 'Đang tạo...' : '✨ Tạo với AI'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Đề xuất từ AI</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Tiêu đề</label>
            <p className="text-sm font-medium">{result.title}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Mô tả</label>
            <p className="text-sm text-gray-700 whitespace-pre-line">{result.description}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Bullet points</label>
            <ul className="list-disc list-inside space-y-1">
              {result.bulletPoints?.map((bp, i) => <li key={i} className="text-sm">{bp}</li>)}
            </ul>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Từ khóa SEO</label>
            <div className="flex flex-wrap gap-2">
              {result.keywords?.map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">{kw}</span>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Danh mục gợi ý</label>
              <p className="text-sm">{result.suggestedCategory}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Giá gợi ý</label>
              <p className="text-sm font-medium text-green-600">{result.suggestedPrice?.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
