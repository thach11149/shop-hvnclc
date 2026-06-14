import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertCircle, Package, Home, RefreshCw, Clock } from 'lucide-react';
import apiClient from '../api/client';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const status = params.get('status');
  const orderId = params.get('orderId');
  const orderCode = params.get('orderCode');
  const method = params.get('method');
  const transactionId = params.get('transactionId') || params.get('vnp_TransactionNo') || params.get('requestId');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: order } = useQuery({
    queryKey: ['order-result', orderId],
    queryFn: () => apiClient.get(`/orders/${orderId}`).then((r) => r.data.data),
    enabled: !!orderId,
  });

  const isSuccess = status === 'success' || params.get('vnp_ResponseCode') === '00' || params.get('resultCode') === '0';
  const isCancelled = status === 'cancelled';
  const isError = !isSuccess && !isCancelled;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {isSuccess ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
              <p className="text-gray-500 mb-6">
                Đơn hàng của bạn đã được thanh toán và đang được xử lý.
              </p>
            </>
          ) : isCancelled ? (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={40} className="text-yellow-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Đã hủy thanh toán</h1>
              <p className="text-gray-500 mb-6">Bạn đã hủy thanh toán. Đơn hàng vẫn được giữ trong 24 giờ.</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle size={40} className="text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
              <p className="text-gray-500 mb-6">Giao dịch không thành công. Vui lòng thử lại.</p>
            </>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            {(orderCode || order?.code) && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mã đơn hàng</span>
                <span className="font-medium">#{orderCode || order?.code}</span>
              </div>
            )}
            {method && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phương thức</span>
                <span className="font-medium capitalize">{method}</span>
              </div>
            )}
            {transactionId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mã giao dịch</span>
                <span className="font-medium text-xs">{transactionId}</span>
              </div>
            )}
            {order?.totalAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số tiền</span>
                <span className="font-bold text-red-600">
                  {Number(order.totalAmount).toLocaleString('vi-VN')}đ
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Thời gian</span>
              <span className="font-medium flex items-center gap-1">
                <Clock size={12} />
                {new Date().toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {orderId && (
              <Link
                to={`/orders/${orderId}`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                <Package size={18} />
                Xem đơn hàng
              </Link>
            )}
            {!isSuccess && orderId && (
              <Link
                to={`/orders/${orderId}`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                <RefreshCw size={18} />
                Thử thanh toán lại
              </Link>
            )}
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <Home size={18} />
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
