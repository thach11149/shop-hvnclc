import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, Eye, Code, Save, Send, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const TEMPLATES = [
  {
    id: 'order_confirmed',
    name: 'Xác nhận đơn hàng',
    subject: 'Đơn hàng #{{orderCode}} đã được xác nhận',
    trigger: 'Khi đơn hàng được xác nhận',
    category: 'Đơn hàng',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #e5352c;">Xác nhận đơn hàng</h2>
<p>Xin chào <strong>{{buyerName}}</strong>!</p>
<p>Đơn hàng <strong>#{{orderCode}}</strong> của bạn đã được xác nhận thành công.</p>
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
<tr><td style="padding: 8px; background: #f9f9f9;"><strong>Tổng tiền:</strong></td><td style="padding: 8px;">{{total}}</td></tr>
<tr><td style="padding: 8px;"><strong>Địa chỉ giao:</strong></td><td style="padding: 8px;">{{shippingAddress}}</td></tr>
</table>
<p>Cảm ơn bạn đã mua sắm tại <strong>Shop HVNCLC</strong>! 🎉</p>
</div>`,
  },
  {
    id: 'order_shipped',
    name: 'Đơn hàng đang vận chuyển',
    subject: 'Đơn hàng #{{orderCode}} đang được giao',
    trigger: 'Khi bàn giao vận chuyển',
    category: 'Đơn hàng',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #2563eb;">Đơn hàng đang trên đường giao đến bạn!</h2>
<p>Xin chào <strong>{{buyerName}}</strong>!</p>
<p>Đơn hàng <strong>#{{orderCode}}</strong> đã được bàn giao cho đơn vị vận chuyển.</p>
<p><strong>Mã vận đơn:</strong> <code>{{trackingCode}}</code></p>
<p><strong>Đơn vị vận chuyển:</strong> {{carrier}}</p>
<p>Dự kiến giao hàng: <strong>{{estimatedDelivery}}</strong></p>
</div>`,
  },
  {
    id: 'order_delivered',
    name: 'Giao hàng thành công',
    subject: 'Đơn hàng #{{orderCode}} đã được giao thành công',
    trigger: 'Khi xác nhận giao hàng thành công',
    category: 'Đơn hàng',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #16a34a;">Đơn hàng đã giao thành công! ✅</h2>
<p>Xin chào <strong>{{buyerName}}</strong>!</p>
<p>Đơn hàng <strong>#{{orderCode}}</strong> đã được giao đến bạn.</p>
<p>Hãy để lại đánh giá để giúp người bán cải thiện dịch vụ nhé!</p>
<a href="{{reviewLink}}" style="display: inline-block; background: #e5352c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">Viết đánh giá</a>
</div>`,
  },
  {
    id: 'dispute_update',
    name: 'Cập nhật tranh chấp',
    subject: 'Cập nhật tranh chấp đơn hàng #{{orderCode}}',
    trigger: 'Khi trạng thái tranh chấp thay đổi',
    category: 'Tranh chấp',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #d97706;">Cập nhật tranh chấp</h2>
<p>Xin chào <strong>{{buyerName}}</strong>!</p>
<p>Tranh chấp liên quan đến đơn hàng <strong>#{{orderCode}}</strong> đã được cập nhật.</p>
<p><strong>Trạng thái mới:</strong> {{status}}</p>
<p><strong>Ghi chú:</strong> {{note}}</p>
</div>`,
  },
  {
    id: 'welcome',
    name: 'Chào mừng thành viên mới',
    subject: 'Chào mừng đến với Shop HVNCLC!',
    trigger: 'Khi đăng ký tài khoản',
    category: 'Tài khoản',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #7c3aed;">Chào mừng bạn đến với Shop HVNCLC! 🎊</h2>
<p>Xin chào <strong>{{name}}</strong>!</p>
<p>Bạn đã đăng ký tài khoản thành công. Hãy bắt đầu khám phá hàng nghìn sản phẩm chất lượng!</p>
<a href="{{shopLink}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">Mua sắm ngay</a>
</div>`,
  },
  {
    id: 'password_reset',
    name: 'Đặt lại mật khẩu',
    subject: 'Yêu cầu đặt lại mật khẩu',
    trigger: 'Khi yêu cầu đặt lại mật khẩu',
    category: 'Tài khoản',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2>Đặt lại mật khẩu</h2>
<p>Xin chào <strong>{{name}}</strong>!</p>
<p>Nhấn vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
<a href="{{resetLink}}" style="display: inline-block; background: #e5352c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">Đặt lại mật khẩu</a>
<p style="color: #999; font-size: 12px; margin-top: 16px;">Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
</div>`,
  },
  {
    id: 'seller_approved',
    name: 'Duyệt tài khoản seller',
    subject: 'Tài khoản bán hàng đã được duyệt!',
    trigger: 'Khi admin duyệt seller',
    category: 'Seller',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #16a34a;">Shop của bạn đã được duyệt! 🎉</h2>
<p>Xin chào <strong>{{sellerName}}</strong>!</p>
<p>Shop <strong>{{shopName}}</strong> đã được xác minh và có thể bắt đầu bán hàng.</p>
<a href="{{sellerLink}}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">Vào Seller Center</a>
</div>`,
  },
];

const VARIABLES: Record<string, string[]> = {
  Đơn hàng: ['{{orderCode}}', '{{buyerName}}', '{{total}}', '{{shippingAddress}}', '{{trackingCode}}', '{{carrier}}', '{{estimatedDelivery}}', '{{reviewLink}}'],
  Tài khoản: ['{{name}}', '{{email}}', '{{resetLink}}', '{{shopLink}}'],
  Tranh chấp: ['{{orderCode}}', '{{buyerName}}', '{{status}}', '{{note}}'],
  Seller: ['{{sellerName}}', '{{shopName}}', '{{sellerLink}}'],
};

function SendTestModal({ templateId, onClose }: { templateId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => apiClient.post('/admin/email-templates/test', { templateId, email }),
    onSuccess: () => setSent(true),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể gửi email test'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">Gửi email thử nghiệm</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        {sent ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
            <p className="font-medium text-gray-900">Đã gửi email thành công!</p>
            <p className="text-sm text-gray-500 mt-1">Kiểm tra hộp thư của <strong>{email}</strong></p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-gray-100 rounded-xl text-sm">Đóng</button>
          </div>
        ) : (
          <>
            <div className="p-5">
              <label className="block text-sm font-medium mb-2">Email nhận *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">Email sẽ được gửi với dữ liệu mẫu để xem trước giao diện</p>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={onClose} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
              <button
                onClick={() => mutation.mutate()}
                disabled={!email || mutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Send size={14} />
                {mutation.isPending ? 'Đang gửi...' : 'Gửi test'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  const [selected, setSelected] = useState(TEMPLATES[0].id);
  const [mode, setMode] = useState<'preview' | 'code'>('preview');
  const [editedBodies, setEditedBodies] = useState<Record<string, string>>({});
  const [editedSubjects, setEditedSubjects] = useState<Record<string, string>>({});
  const [showTest, setShowTest] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const template = TEMPLATES.find((t) => t.id === selected)!;
  const body = editedBodies[selected] || template.body;
  const subject = editedSubjects[selected] || template.subject;

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/admin/email-templates/${selected}`, { subject, body }),
    onSuccess: () => toast.success('Đã lưu template email'),
    onError: () => toast.error('Lỗi lưu template'),
  });

  const categories = ['ALL', ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];
  const filteredTemplates = categoryFilter === 'ALL' ? TEMPLATES : TEMPLATES.filter((t) => t.category === categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail size={22} className="text-blue-500" />
            Template Email
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý nội dung email tự động</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTest(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Send size={15} /> Gửi test
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={15} />
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          {/* Category filter */}
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'ALL' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredTemplates.map((t) => {
                const isEdited = !!(editedBodies[t.id] || editedSubjects[t.id]);
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selected === t.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{t.name}</p>
                      {isEdited && <span className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0 ml-1" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.trigger}</p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mt-1 inline-block">{t.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề email</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setEditedSubjects((p) => ({ ...p, [selected]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Body editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Nội dung email</label>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setMode('preview')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'preview' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button
                    onClick={() => setMode('code')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'code' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
                  >
                    <Code size={12} /> HTML
                  </button>
                </div>
              </div>

              {mode === 'code' ? (
                <textarea
                  value={body}
                  onChange={(e) => setEditedBodies((p) => ({ ...p, [selected]: e.target.value }))}
                  rows={18}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none bg-gray-900 text-green-400"
                />
              ) : (
                <div
                  className="border border-gray-200 rounded-lg p-4 min-h-[280px] text-sm bg-white overflow-auto"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              )}
            </div>
          </div>

          {/* Variables */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Biến có thể dùng trong template</p>
            <div className="space-y-2">
              {Object.entries(VARIABLES).map(([group, vars]) => (
                <div key={group}>
                  <p className="text-xs text-gray-500 font-medium mb-1">{group}:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vars.map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          const newBody = (editedBodies[selected] || template.body) + v;
                          setEditedBodies((p) => ({ ...p, [selected]: newBody }));
                          setMode('code');
                        }}
                        className="text-xs bg-white border border-blue-200 rounded px-2 py-1 text-blue-700 hover:bg-blue-50 font-mono"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showTest && <SendTestModal templateId={selected} onClose={() => setShowTest(false)} />}
    </div>
  );
}
