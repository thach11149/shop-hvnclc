import { useEffect, useState } from 'react';
import { Bot, TrendingUp, AlertCircle, CheckCircle, RefreshCw, Megaphone } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

interface AdSuggestion {
  type: string;
  action: string;
  value: string | number;
  expectedCTRImprovement?: string;
  expectedConversionImprovement?: string;
  expectedROIImprovement?: string;
  confidence: number;
}

interface CampaignOptimization {
  campaignId: string;
  campaignName: string;
  currentBudget: number | null;
  performanceScore: number;
  suggestions: AdSuggestion[];
}

export default function AdsOptimizationPage() {
  const { token } = useAuthStore();
  const [campaigns, setCampaigns] = useState<CampaignOptimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/seller/ai/ads-optimization', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setCampaigns(d.data ?? []); })
      .finally(() => setLoading(false));
  }, [token]);

  const applySuggestion = async (campaignId: string, idx: number) => {
    setApplying(`${campaignId}-${idx}`);
    await new Promise(r => setTimeout(r, 800));
    setApplying(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSuggestionIcon = (type: string) => {
    if (type === 'KEYWORD') return '🔑';
    if (type === 'BID') return '💰';
    if (type === 'SCHEDULE') return '⏰';
    return '💡';
  };

  const getImprovementText = (s: AdSuggestion) => {
    return s.expectedCTRImprovement ?? s.expectedConversionImprovement ?? s.expectedROIImprovement ?? '';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Bot className="text-purple-600" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tối ưu quảng cáo AI</h1>
          <p className="text-sm text-gray-500">Gợi ý thông minh để cải thiện hiệu quả chiến dịch</p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Megaphone size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Chưa có chiến dịch quảng cáo nào để tối ưu.</p>
          <p className="text-sm text-gray-400 mt-1">Tạo chiến dịch quảng cáo trước tại mục Quảng cáo.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {campaigns.map(campaign => (
            <div key={campaign.campaignId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{campaign.campaignName}</h2>
                  {campaign.currentBudget && (
                    <p className="text-sm text-gray-500">Ngân sách: {Number(campaign.currentBudget).toLocaleString('vi-VN')}₫/ngày</p>
                  )}
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${getScoreColor(campaign.performanceScore)}`}>
                  Điểm: {campaign.performanceScore}/100
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <TrendingUp size={15} className="text-blue-500" />
                  Gợi ý tối ưu ({campaign.suggestions.length})
                </div>
                <div className="space-y-3">
                  {campaign.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{getSuggestionIcon(suggestion.type)}</span>
                          <span className="text-sm font-medium text-gray-800">
                            {suggestion.type === 'KEYWORD' && 'Thêm từ khóa'}
                            {suggestion.type === 'BID' && 'Điều chỉnh giá thầu'}
                            {suggestion.type === 'SCHEDULE' && 'Tối ưu lịch chạy'}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            suggestion.action === 'ADD' || suggestion.action === 'INCREASE' || suggestion.action === 'FOCUS'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {suggestion.action}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Giá trị: <span className="font-medium">{String(suggestion.value)}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {getImprovementText(suggestion) && (
                            <span className="text-green-600 font-medium">{getImprovementText(suggestion)}</span>
                          )}
                          <span>Độ tin cậy: {Math.round(suggestion.confidence * 100)}%</span>
                        </div>
                      </div>
                      <button
                        onClick={() => applySuggestion(campaign.campaignId, idx)}
                        disabled={applying === `${campaign.campaignId}-${idx}`}
                        className="ml-4 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {applying === `${campaign.campaignId}-${idx}` ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        Áp dụng
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Các gợi ý từ AI dựa trên dữ liệu hiệu suất chiến dịch. Hãy xem xét kỹ trước khi áp dụng để phù hợp với ngân sách và mục tiêu của bạn.
          </p>
        </div>
      </div>
    </div>
  );
}
