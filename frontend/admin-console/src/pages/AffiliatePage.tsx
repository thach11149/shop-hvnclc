import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function AffiliatePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-affiliate-partners', activeTab],
    queryFn: () => apiClient.get(`/admin/affiliate/partners${activeTab !== 'all' ? `?status=${activeTab}` : ''}`).then(r => r.data.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/affiliate/partners/${id}/approve`),
    onSuccess: () => {
      toast.success('Đã duyệt đối tác affiliate');
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-partners'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reject = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/affiliate/partners/${id}/reject`),
    onSuccess: () => {
      toast.success('Đã từ chối');
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-partners'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'REJECTED', label: 'Từ chối' },
  ];

  const totalPartners = data?.data?.length || 0;
  const pendingCount = data?.data?.filter((p: any) => p.status === 'PENDING').length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý Affiliate</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Tổng đối tác</p>
          <p className="text-2xl font-bold">{totalPartners}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Chờ duyệt</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Đã duyệt</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.data?.filter((p: any) => p.status === 'APPROVED').length || 0}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm ${activeTab === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">Chưa có đối tác affiliate nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Đối tác</th>
                <th className="text-left px-4 py-3 text-gray-500">Email</th>
                <th className="text-right px-4 py-3 text-gray-500">Hoa hồng</th>
                <th className="text-right px-4 py-3 text-gray-500">Links</th>
                <th className="text-right px-4 py-3 text-gray-500">Hoa hồng tích lũy</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((partner: any) => (
                <tr key={partner.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{partner.name}</td>
                  <td className="px-4 py-3 text-gray-500">{partner.user?.email}</td>
                  <td className="px-4 py-3 text-right">{partner.commissionRate}%</td>
                  <td className="px-4 py-3 text-right">{partner._count?.links || 0}</td>
                  <td className="px-4 py-3 text-right">{partner._count?.commissions || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[partner.status] || 'bg-gray-100'}`}>
                      {partner.status === 'PENDING' ? 'Chờ duyệt' : partner.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {partner.status === 'PENDING' && (
                        <>
                          <button onClick={() => approve.mutate(partner.id)} className="text-green-600 text-xs hover:underline">
                            Duyệt
                          </button>
                          <button onClick={() => reject.mutate(partner.id)} className="text-red-500 text-xs hover:underline">
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
