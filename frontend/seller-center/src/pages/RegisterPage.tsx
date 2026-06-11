import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  shopName: string;
  shopDescription: string;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await apiClient.post('/auth/register', { email: data.email, password: data.password, fullName: data.fullName, role: 'SELLER_OWNER' });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🏪</div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng ký bán hàng</h1>
          <p className="text-gray-500 text-sm mt-1">Tạo tài khoản người bán mới</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
            <input {...register('fullName', { required: true })} className="input w-full" placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input {...register('email', { required: true })} type="email" className="input w-full" placeholder="seller@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input {...register('password', { required: true, minLength: 6 })} type="password" className="input w-full" placeholder="Tối thiểu 6 ký tự" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input
              {...register('confirmPassword', { validate: v => v === watch('password') || 'Mật khẩu không khớp' })}
              type="password" className="input w-full" placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
