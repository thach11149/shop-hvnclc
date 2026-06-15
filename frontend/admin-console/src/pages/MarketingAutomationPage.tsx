import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, X, ChevronRight, Zap, Mail, Bell, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const TRIGGERS = [
  { value: 'USER_REGISTERED', label: 'Đăng ký mới', icon: '👤' },
  { value: 'CART_ABANDONED', label: 'Bỏ giỏ hàng', icon: '🛒' },
  { value: 'ORDER_COMPLETED', label: 'Đơn hoàn thành', icon: '✅' },
  { value: 'USER_INACTIVE_7D', label: 'Không HĐ 7 ngày', icon: '💤' },
  { value: 'BIRTHDAY', label: 'Sinh nhật', icon: '🎂' },
  { value: 'POINTS_MILESTONE', label: 'Đạt mốc điểm', icon: '⭐' },
  { value: 'FIRST_PURCHASE', label: 'Mua lần đầu', icon: '🎁' },
];

const CHANNELS = [
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'PUSH', label: 'Push notification', icon: Bell },
  { value: 'SMS', label: 'SMS', icon: MessageSquare },
  { value: 'IN_APP', label: 'In-app', icon: Zap },
];

const ACTIONS = [
  { value: 'SEND_MESSAGE', label: 'Gửi tin nhắn' },
  { value: 'APPLY_COUPON', label: 'Tặng mã giảm giá' },
  { value: 'ADD_POINTS', label: 'Tặng điểm' },
  { value: 'ADD_TAG', label: 'Gắn tag' },
];

const emptyWizard = {
  step: 1,
  name: '',
  trigger: 'USER_REGISTERED',
  segmentId: '',
  delay: '0',
  channel: 'EMAIL',
  actionType: 'SEND_MESSAGE',
  subject: '',
  content: '',
};

export default function MarketingAutomationPage() {
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);
  const [wizard, setWizard] = useState({ ...emptyWizard });
  const [detailFlow, setDetailFlow] = useState<any>(null);

  const { data: segData } = useQuery({
    queryKey: ['admin-segments-list'],
    queryFn: () => apiClient.get('/marketing/segments?active=true').then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-marketing-flows'],
    queryFn: () => apiClient.get('/marketing/automations').then(r => r.data),
  });

  const flows: any[] = data?.data?.data || data?.data || [];
  const segments: any[] = segData?.data?.data || segData?.data || [];

  const create = useMutation({
    mutationFn: (payload: any) => apiClient.post('/marketing/automations', payload),
    onSuccess: () => {
      toast.success('Đã tạo luồng automation');
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-flows'] });
      setShowWizard(false);
      setWizard({ ...emptyWizard });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggle = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/marketing/automations/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-marketing-flows'] }),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const submitWizard = () => {
    const payload = {
      name: wizard.name,
      trigger: wizard.trigger,
      segmentId: wizard.segmentId || undefined,
      steps: [{
        order: 1,
        delay: Number(wizard.delay),
        actionType: wizard.actionType,
        channel: wizard.channel,
        subject: wizard.subject,
        content: wizard.content,
      }],
    };
    create.mutate(payload);
  };

  const getTriggerLabel = (trigger: string) => TRIGGERS.find(t => t.value === trigger)?.label || trigger;
  const getTriggerIcon = (trigger: string) => TRIGGERS.find(t => t.value === trigger)?.icon || '⚡';

  return (
    <div>
      {/* Create Wizard */}
      {showWizard && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-semibold text-lg">Tạo luồng automation</h3>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${wizard.step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                      {s < 3 && <div className={`w-8 h-0.5 ${wizard.step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                  <span className="text-xs text-gray-500 ml-2">
                    {wizard.step === 1 ? 'Cơ bản' : wizard.step === 2 ? 'Đối tượng' : 'Hành động'}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowWizard(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="p-5">
              {wizard.step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tên luồng *</label>
                    <input value={wizard.name} onChange={e => setWizard({ ...wizard, name: e.target.value })} className="input w-full" placeholder="VD: Chào mừng user mới" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Sự kiện kích hoạt *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TRIGGERS.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setWizard({ ...wizard, trigger: t.value })}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm ${wizard.trigger === t.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <span className="text-lg">{t.icon}</span>
                          <span className="text-xs">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {wizard.step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Segment đối tượng</label>
                    <select value={wizard.segmentId} onChange={e => setWizard({ ...wizard, segmentId: e.target.value })} className="input w-full">
                      <option value="">Tất cả người dùng</option>
                      {segments.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Độ trễ sau trigger (giờ)</label>
                    <input value={wizard.delay} onChange={e => setWizard({ ...wizard, delay: e.target.value })} type="number" min="0" className="input w-full" placeholder="0 = ngay lập tức" />
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                    <p className="font-medium">Tóm tắt:</p>
                    <p>Trigger: <strong>{getTriggerLabel(wizard.trigger)}</strong></p>
                    <p>Đối tượng: <strong>{wizard.segmentId ? segments.find(s => s.id === wizard.segmentId)?.name : 'Tất cả'}</strong></p>
                    <p>Sau: <strong>{wizard.delay || '0'} giờ</strong></p>
                  </div>
                </div>
              )}

              {wizard.step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Loại hành động</label>
                    <select value={wizard.actionType} onChange={e => setWizard({ ...wizard, actionType: e.target.value })} className="input w-full">
                      {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </div>
                  {wizard.actionType === 'SEND_MESSAGE' && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Kênh gửi</label>
                        <div className="grid grid-cols-2 gap-2">
                          {CHANNELS.map(c => {
                            const Icon = c.icon;
                            return (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setWizard({ ...wizard, channel: c.value })}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm ${wizard.channel === c.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                              >
                                <Icon size={14} />
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {wizard.channel === 'EMAIL' && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tiêu đề email</label>
                          <input value={wizard.subject} onChange={e => setWizard({ ...wizard, subject: e.target.value })} className="input w-full" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nội dung</label>
                        <textarea value={wizard.content} onChange={e => setWizard({ ...wizard, content: e.target.value })} rows={3} className="input w-full resize-none" />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t">
              {wizard.step > 1 && (
                <button onClick={() => setWizard({ ...wizard, step: wizard.step - 1 })} className="btn-secondary flex-1">
                  Quay lại
                </button>
              )}
              {wizard.step < 3 ? (
                <button
                  onClick={() => setWizard({ ...wizard, step: wizard.step + 1 })}
                  disabled={wizard.step === 1 && !wizard.name}
                  className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Tiếp theo <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={submitWizard}
                  disabled={create.isPending}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {create.isPending ? 'Đang tạo...' : 'Tạo luồng'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailFlow && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg">{detailFlow.name}</h3>
              <button onClick={() => setDetailFlow(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{getTriggerIcon(detailFlow.trigger)}</span>
                <div>
                  <p className="text-xs text-gray-400">Trigger</p>
                  <p className="font-medium">{getTriggerLabel(detailFlow.trigger)}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Zap size={14} />
                      </div>
                      <div className="w-0.5 h-4 bg-gray-200 mt-1" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">Trigger: {getTriggerLabel(detailFlow.trigger)}</p>
                      <p className="text-xs text-gray-400">{detailFlow.segmentName ? `Segment: ${detailFlow.segmentName}` : 'Tất cả người dùng'}</p>
                    </div>
                  </div>

                  {(detailFlow.steps || detailFlow.actions || []).map((step: any, idx: number) => {
                    const Icon = CHANNELS.find(c => c.value === (step.channel || step.type))?.icon || Mail;
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <Icon size={14} />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Bước {idx + 1}: {ACTIONS.find(a => a.value === step.actionType)?.label || step.type || 'Hành động'}</p>
                          <p className="text-xs text-gray-400">{CHANNELS.find(c => c.value === (step.channel || step.type))?.label || step.channel} {step.delay ? `· Sau ${step.delay}h` : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{(detailFlow.totalSent || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Đã gửi</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{((detailFlow.openRate || 0) * 100).toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Tỷ lệ mở</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{((detailFlow.conversionRate || 0) * 100).toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Chuyển đổi</p>
                </div>
              </div>
            </div>
            <div className="p-5 border-t">
              <button onClick={() => setDetailFlow(null)} className="btn-secondary w-full">Đóng</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tự động hóa Marketing</h1>
        <button onClick={() => setShowWizard(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo luồng mới
        </button>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">Đang tải...</div>
      ) : flows.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Zap size={40} className="mx-auto mb-3 text-gray-300" />
          <p>Chưa có luồng automation nào</p>
          <button onClick={() => setShowWizard(true)} className="mt-4 btn-primary text-sm">Tạo luồng đầu tiên</button>
        </div>
      ) : (
        <div className="space-y-3">
          {flows.map((flow: any) => (
            <div key={flow.id} className="card p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{getTriggerIcon(flow.trigger)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{flow.name}</h3>
                    <button
                      onClick={() => setDetailFlow(flow)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span>Trigger: <strong className="text-gray-700">{getTriggerLabel(flow.trigger)}</strong></span>
                    {flow.segmentName && <><span>·</span><span>Segment: <strong className="text-gray-700">{flow.segmentName}</strong></span></>}
                    {(flow.steps || flow.actions)?.length > 0 && (
                      <><span>·</span><span>{(flow.steps || flow.actions).length} bước</span></>
                    )}
                  </div>
                  {(flow.steps || flow.actions)?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {(flow.steps || flow.actions).map((s: any, i: number) => {
                        const Icon = CHANNELS.find(c => c.value === (s.channel || s.type))?.icon || Mail;
                        return (
                          <span key={i} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                            <Icon size={10} />
                            {ACTIONS.find(a => a.value === s.actionType)?.label || s.type || 'Gửi'} via {CHANNELS.find(c => c.value === (s.channel || s.type))?.label || s.channel}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs text-gray-400">Đã gửi</p>
                    <p className="font-bold text-sm">{(flow.totalSent || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Mở / CĐ</p>
                    <p className="font-bold text-sm text-blue-600">
                      {((flow.openRate || 0) * 100).toFixed(0)}% / {((flow.conversionRate || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <button
                    onClick={() => toggle.mutate(flow.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 cursor-pointer ${flow.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {flow.isActive ? 'Đang chạy' : 'Đã dừng'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
