import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

type TabType = 'publishers' | 'commissions' | 'payouts';

interface Publisher {
  id: string;
  name: string;
  email: string;
  status: string;
  totalClicks: number;
  totalOrders: number;
  totalEarned: number;
  pendingPayout: number;
  joinedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

export default function AffiliateManagementPage() {
  const [tab, setTab] = useState<TabType>('publishers');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý Affiliate</h1>

      <div className="flex gap-1 mb-6 border-b">
        {(['publishers', 'commissions', 'payouts'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'publishers' ? 'Publishers' : t === 'commissions' ? 'Hoa hồng' : 'Thanh toán'}
          </button>
        ))}
      </div>

      {tab === 'publishers' && <PublishersTab statusColors={STATUS_COLORS} />}
      {tab === 'commissions' && <CommissionsTab />}
      {tab === 'payouts' && <PayoutsTab />}
    </div>
  );
}

function PublishersTab({ statusColors }: { statusColors: Record<string, string> }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ data: Publisher[] }>({
    queryKey: ['admin-affiliate-publishers'],
    queryFn: () => apiClient.get('/admin/affiliate/publishers').then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/affiliate/publishers/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-affiliate-publishers'] }),
  });

  const publishers = data?.data ?? [];

  return isLoading ? <p>Đang tải...</p> : (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Publisher', 'Email', 'Clicks', 'Đơn hàng', 'Đã kiếm', 'Chờ thanh toán', 'Trạng thái', 'Thao tác'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {publishers.map(p => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3 text-gray-600">{p.email}</td>
              <td className="px-4 py-3">{p.totalClicks?.toLocaleString()}</td>
              <td className="px-4 py-3">{p.totalOrders}</td>
              <td className="px-4 py-3 text-green-600">{p.totalEarned?.toLocaleString('vi-VN')}đ</td>
              <td className="px-4 py-3 text-orange-600">{p.pendingPayout?.toLocaleString('vi-VN')}đ</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {p.status === 'PENDING' && (
                  <button onClick={() => approveMutation.mutate(p.id)} className="text-green-600 hover:underline text-xs">Duyệt</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommissionsTab() {
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['admin-affiliate-commissions'],
    queryFn: () => apiClient.get('/admin/affiliate/commissions').then(r => r.data),
  });

  const items = data?.data ?? [];

  return isLoading ? <p>Đang tải...</p> : (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Publisher', 'Đơn hàng', 'Giá trị', 'Tỉ lệ', 'Hoa hồng', 'Trạng thái', 'Ngày'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((c, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3">{c.publisherName}</td>
              <td className="px-4 py-3 font-mono text-xs">{c.orderId?.slice(0, 8)}</td>
              <td className="px-4 py-3">{c.orderValue?.toLocaleString('vi-VN')}đ</td>
              <td className="px-4 py-3">{c.rate}%</td>
              <td className="px-4 py-3 text-green-600 font-medium">{c.commission?.toLocaleString('vi-VN')}đ</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  c.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{c.status}</span>
              </td>
              <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayoutsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['admin-affiliate-payouts'],
    queryFn: () => apiClient.get('/admin/affiliate/payouts?status=PENDING').then(r => r.data),
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/affiliate/payouts/${id}/process`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-affiliate-payouts'] }),
  });

  const payouts = data?.data ?? [];

  return isLoading ? <p>Đang tải...</p> : (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Publisher', 'Số tiền', 'Phương thức', 'Ngân hàng/Ví', 'Yêu cầu lúc', 'Thao tác'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {payouts.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{p.publisherName}</td>
              <td className="px-4 py-3 text-green-600 font-bold">{p.amount?.toLocaleString('vi-VN')}đ</td>
              <td className="px-4 py-3">{p.method}</td>
              <td className="px-4 py-3 text-gray-600">{p.accountInfo}</td>
              <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
              <td className="px-4 py-3">
                <button onClick={() => processMutation.mutate(p.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                  Xử lý
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
