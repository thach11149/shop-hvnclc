import { useState } from 'react';
import { Mail, Eye, Code, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const TEMPLATES = [
  {
    id: 'order_confirmed',
    name: 'Xác nhận đơn hàng',
    subject: 'Đơn hàng #{{orderCode}} đã được xác nhận',
    trigger: 'Khi đơn hàng được xác nhận',
    body: `<h2>Xin chào {{buyerName}}!</h2>
<p>Đơn hàng <strong>#{{orderCode}}</strong> của bạn đã được xác nhận.</p>
<p><strong>Tổng tiền:</strong> {{total}}</p>
<p>Cảm ơn bạn đã mua sắm tại Shop HVNCLC!</p>`,
  },
  {
    id: 'order_shipped',
    name: 'Đơn hàng đang vận chuyển',
    subject: 'Đơn hàng #{{orderCode}} đang được giao',
    trigger: 'Khi đơn hàng bàn giao vận chuyển',
    body: `<h2>Xin chào {{buyerName}}!</h2>
<p>Đơn hàng <strong>#{{orderCode}}</strong> đã được bàn giao cho đơn vị vận chuyển.</p>
<p><strong>Mã vận đơn:</strong> {{trackingCode}}</p>`,
  },
  {
    id: 'dispute_update',
    name: 'Cập nhật tranh chấp',
    subject: 'Cập nhật tranh chấp đơn hàng #{{orderCode}}',
    trigger: 'Khi trạng thái tranh chấp thay đổi',
    body: `<h2>Xin chào {{buyerName}}!</h2>
<p>Tranh chấp liên quan đến đơn hàng <strong>#{{orderCode}}</strong> đã được cập nhật.</p>
<p><strong>Trạng thái:</strong> {{status}}</p>`,
  },
  {
    id: 'welcome',
    name: 'Chào mừng thành viên mới',
    subject: 'Chào mừng đến với Shop HVNCLC!',
    trigger: 'Khi đăng ký tài khoản',
    body: `<h2>Xin chào {{name}}!</h2>
<p>Bạn đã đăng ký tài khoản thành công tại <strong>Shop HVNCLC</strong>.</p>
<p>Hãy bắt đầu mua sắm ngay hôm nay!</p>`,
  },
  {
    id: 'password_reset',
    name: 'Đặt lại mật khẩu',
    subject: 'Đặt lại mật khẩu',
    trigger: 'Khi yêu cầu đặt lại mật khẩu',
    body: `<h2>Xin chào {{name}}!</h2>
<p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu:</p>
<a href="{{resetLink}}">Đặt lại mật khẩu</a>
<p>Liên kết có hiệu lực trong 30 phút.</p>`,
  },
];

export default function EmailTemplatesPage() {
  const [selected, setSelected] = useState(TEMPLATES[0].id);
  const [mode, setMode] = useState<'preview' | 'code'>('preview');
  const [editedBodies, setEditedBodies] = useState<Record<string, string>>({});
  const [editedSubjects, setEditedSubjects] = useState<Record<string, string>>({});

  const template = TEMPLATES.find((t) => t.id === selected)!;
  const body = editedBodies[selected] || template.body;
  const subject = editedSubjects[selected] || template.subject;

  const handleSave = () => {
    toast.success('Đã lưu template email');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail size={24} className="text-blue-500" />
            Template Email
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý nội dung email tự động gửi đến khách hàng</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save size={18} />
          Lưu thay đổi
        </button>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">Danh sách template</p>
            </div>
            <div className="divide-y divide-gray-100">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selected === t.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.trigger}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề email</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setEditedSubjects((p) => ({ ...p, [selected]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Nội dung email</label>
                <div className="flex gap-1 bg-gray-100 rounded p-0.5">
                  <button
                    onClick={() => setMode('preview')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs ${mode === 'preview' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                  >
                    <Eye size={12} />
                    Preview
                  </button>
                  <button
                    onClick={() => setMode('code')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs ${mode === 'code' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                  >
                    <Code size={12} />
                    HTML
                  </button>
                </div>
              </div>

              {mode === 'code' ? (
                <textarea
                  value={body}
                  onChange={(e) => setEditedBodies((p) => ({ ...p, [selected]: e.target.value }))}
                  rows={16}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              ) : (
                <div
                  className="border border-gray-200 rounded-lg p-4 min-h-[200px] text-sm"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Biến có thể dùng:</p>
            <div className="flex flex-wrap gap-2">
              {['{{orderCode}}', '{{buyerName}}', '{{total}}', '{{trackingCode}}', '{{status}}', '{{name}}', '{{resetLink}}'].map((v) => (
                <code key={v} className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-blue-700">
                  {v}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
