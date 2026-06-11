import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({ email: data.email, password: data.password, phone: data.phone });
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">🛍️ Marketplace</h1>
          <p className="text-gray-500 mt-1">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email *</label>
            <input
              {...register('email', { required: 'Email là bắt buộc', pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' } })}
              type="email"
              className="input mt-1"
              placeholder="example@email.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
            <input {...register('phone')} type="tel" className="input mt-1" placeholder="0901234567" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Mật khẩu *</label>
            <input
              {...register('password', { required: 'Mật khẩu là bắt buộc', minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } })}
              type="password"
              className="input mt-1"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu *</label>
            <input
              {...register('confirmPassword', {
                required: 'Vui lòng xác nhận mật khẩu',
                validate: value => value === password || 'Mật khẩu không khớp',
              })}
              type="password"
              className="input mt-1"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
