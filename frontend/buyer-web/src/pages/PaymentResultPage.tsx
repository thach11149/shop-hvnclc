import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const status = params.get('status');
  const orderId = params.get('orderId');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-600 mb-6">
              Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ xử lý và giao hàng sớm nhất có thể.
            </p>
          </>
        ) : status === 'error' ? (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h1>
            <p className="text-gray-600 mb-6">Không thể xử lý thanh toán. Vui lòng thử lại.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
            <p className="text-gray-600 mb-6">Giao dịch không thành công. Vui lòng thử lại.</p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Xem đơn hàng
            </Link>
          )}
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Về trang chủ
          </Link>
          {!isSuccess && (
            <Link
              to="/orders"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Đơn hàng của tôi
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
