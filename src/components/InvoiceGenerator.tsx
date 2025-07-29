import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentTextIcon, 
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  SparklesIcon,
  DocumentMagnifyingGlassIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface InvoiceData {
  id: string;
  flowId: string;
  merchant: string;
  amount: number;
  date: string;
  department: string;
  category: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  status: 'pending' | 'generated' | 'approved' | 'rejected';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvalDate?: string;
  notes?: string;
}

const InvoiceGenerator: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const generationSteps = [
    '데이터 수집 중...',
    '전표 형식 생성 중...',
    '부서 정보 매칭 중...',
    '승인 워크플로우 설정 중...',
    '국세청 연동 중...',
    '전표 생성 완료!'
  ];

  // 초기 데이터 로드
  useEffect(() => {
    const mockInvoices: InvoiceData[] = [
      {
        id: 'INV-2024-001',
        flowId: 'XK8P2M',
        merchant: '스타벅스 강남점',
        amount: 4500,
        date: '2024-01-15',
        department: '영업팀',
        category: '식비',
        items: [
          { name: '아메리카노', quantity: 1, price: 4500, total: 4500 }
        ],
        status: 'generated',
        approvalStatus: 'approved',
        approver: '김과장',
        approvalDate: '2024-01-15'
      },
      {
        id: 'INV-2024-002',
        flowId: 'XK8P2M',
        merchant: 'GS25 본사점',
        amount: 12000,
        date: '2024-01-15',
        department: '마케팅팀',
        category: '업무용품',
        items: [
          { name: 'A4용지', quantity: 2, price: 5000, total: 10000 },
          { name: '펜', quantity: 5, price: 400, total: 2000 }
        ],
        status: 'generated',
        approvalStatus: 'pending'
      },
      {
        id: 'INV-2024-003',
        flowId: 'XK8P2M',
        merchant: '맥도날드',
        amount: 8500,
        date: '2024-01-14',
        department: '개발팀',
        category: '식비',
        items: [
          { name: '빅맥 세트', quantity: 1, price: 8500, total: 8500 }
        ],
        status: 'generated',
        approvalStatus: 'approved',
        approver: '박팀장',
        approvalDate: '2024-01-14'
      },
      {
        id: 'INV-2024-004',
        flowId: 'XK8P2M',
        merchant: '올리브영',
        amount: 32000,
        date: '2024-01-14',
        department: '인사팀',
        category: '복리후생',
        items: [
          { name: '화장품 세트', quantity: 1, price: 32000, total: 32000 }
        ],
        status: 'generated',
        approvalStatus: 'rejected',
        approver: '이부장',
        approvalDate: '2024-01-14',
        notes: '복리후생 예산 초과'
      }
    ];

    setInvoices(mockInvoices);
  }, []);

  const generateInvoice = async (flowId: string) => {
    setIsGenerating(true);
    setGenerationStep(0);

    try {
      // 단계별 생성 시뮬레이션
      for (let i = 0; i < generationSteps.length; i++) {
        setGenerationStep(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 새로운 전표 생성
      const newInvoice: InvoiceData = {
        id: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
        flowId,
        merchant: '새로운 가맹점',
        amount: Math.floor(Math.random() * 50000) + 10000,
        date: new Date().toISOString().split('T')[0],
        department: '관리부',
        category: '기타',
        items: [
          { name: '상품', quantity: 1, price: 15000, total: 15000 }
        ],
        status: 'generated',
        approvalStatus: 'pending'
      };

      setInvoices(prev => [newInvoice, ...prev]);
      setSelectedInvoice(newInvoice);

    } catch (error) {
      console.error('전표 생성 중 오류:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const approveInvoice = (invoiceId: string, approved: boolean) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? {
            ...invoice,
            approvalStatus: approved ? 'approved' : 'rejected',
            approver: '김과장',
            approvalDate: new Date().toISOString().split('T')[0],
            notes: approved ? undefined : '승인 거부'
          }
        : invoice
    ));
  };

  const downloadInvoice = (invoice: InvoiceData) => {
    // PDF 생성 및 다운로드 시뮬레이션
    const content = `
      FlowPay 전표
      
      전표번호: ${invoice.id}
      Flow ID: ${invoice.flowId}
      가맹점: ${invoice.merchant}
      금액: ₩${invoice.amount.toLocaleString()}
      날짜: ${invoice.date}
      부서: ${invoice.department}
      카테고리: ${invoice.category}
      
      상품 내역:
      ${invoice.items.map(item => 
        `${item.name} x${item.quantity} - ₩${item.total.toLocaleString()}`
      ).join('\n')}
      
      승인 상태: ${invoice.approvalStatus}
      ${invoice.approver ? `승인자: ${invoice.approver}` : ''}
      ${invoice.approvalDate ? `승인일: ${invoice.approvalDate}` : ''}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-success-600 bg-success-100';
      case 'rejected':
        return 'text-error-600 bg-error-100';
      case 'pending':
        return 'text-warning-600 bg-warning-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XMarkIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="icon-container icon-container-primary">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">자동 전표 생성</h1>
          </div>
          <p className="text-gray-600">
            Flow ID 기반으로 자동 생성된 전표를 관리하고 승인 워크플로우를 처리합니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 전표 목록 */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">전표 목록</h2>
                <button
                  onClick={() => generateInvoice('XK8P2M')}
                  disabled={isGenerating}
                  className="btn-primary text-sm"
                >
                  {isGenerating ? '생성 중...' : '새 전표 생성'}
                </button>
              </div>

              {isGenerating && (
                <div className="mb-6 bg-gradient-to-r from-flow-50 to-flow-100 rounded-xl p-4 border border-flow-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-flow-500 border-t-transparent"></div>
                    <span className="font-semibold text-flow-700">{generationSteps[generationStep]}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-flow-500 to-flow-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                      selectedInvoice?.id === invoice.id
                        ? 'border-flow-500 bg-flow-50 shadow-flow-glow'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="icon-container bg-gradient-to-br from-flow-500 to-flow-600">
                          <DocumentTextIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{invoice.id}</h3>
                          <p className="text-sm text-gray-600">{invoice.merchant}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₩{invoice.amount.toLocaleString()}</p>
                        <p className="text-xs text-flow-600 font-mono">{invoice.flowId}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600">{invoice.date}</span>
                        <span className="text-gray-600">{invoice.department}</span>
                        <span className="text-gray-600">{invoice.category}</span>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.approvalStatus || 'pending')}`}>
                        {getStatusIcon(invoice.approvalStatus || 'pending')}
                        <span>{invoice.approvalStatus === 'approved' ? '승인됨' : 
                               invoice.approvalStatus === 'rejected' ? '거부됨' : '대기중'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
          </div>

          {/* 전표 상세 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">전표 상세</h2>

            <AnimatePresence mode="wait">
              {!selectedInvoice ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <DocumentMagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">전표를 선택하면 상세 정보를 확인할 수 있습니다.</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* 기본 정보 */}
                  <div className="bg-gradient-to-r from-flow-50 to-flow-100 rounded-xl p-4 border border-flow-200">
                    <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">전표번호:</span>
                        <span className="font-semibold">{selectedInvoice.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Flow ID:</span>
                        <span className="font-mono font-bold text-flow-600">{selectedInvoice.flowId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">가맹점:</span>
                        <span className="font-semibold">{selectedInvoice.merchant}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">금액:</span>
                        <span className="font-bold">₩{selectedInvoice.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">날짜:</span>
                        <span className="font-semibold">{selectedInvoice.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* 분류 정보 */}
                  <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-xl p-4 border border-success-200">
                    <h3 className="font-semibold text-gray-900 mb-3">자동 분류</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">부서:</span>
                        <span className="font-semibold">{selectedInvoice.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">카테고리:</span>
                        <span className="font-semibold">{selectedInvoice.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* 상품 내역 */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">상품 내역</h3>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-600">수량: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">₩{item.total.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">단가: ₩{item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 승인 상태 */}
                  <div className="bg-gradient-to-r from-warning-50 to-warning-100 rounded-xl p-4 border border-warning-200">
                    <h3 className="font-semibold text-gray-900 mb-3">승인 상태</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">상태:</span>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.approvalStatus || 'pending')}`}>
                          {getStatusIcon(selectedInvoice.approvalStatus || 'pending')}
                          <span>{selectedInvoice.approvalStatus === 'approved' ? '승인됨' : 
                                 selectedInvoice.approvalStatus === 'rejected' ? '거부됨' : '대기중'}</span>
                        </div>
                      </div>
                      {selectedInvoice.approver && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">승인자:</span>
                          <span className="font-semibold">{selectedInvoice.approver}</span>
                        </div>
                      )}
                      {selectedInvoice.approvalDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">승인일:</span>
                          <span className="font-semibold">{selectedInvoice.approvalDate}</span>
                        </div>
                      )}
                      {selectedInvoice.notes && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">비고:</span>
                          <span className="font-semibold text-error-600">{selectedInvoice.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="space-y-3">
                    {selectedInvoice.approvalStatus === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveInvoice(selectedInvoice.id, true)}
                          className="btn-success flex-1 text-sm"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => approveInvoice(selectedInvoice.id, false)}
                          className="btn-error flex-1 text-sm"
                        >
                          거부
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => downloadInvoice(selectedInvoice)}
                      className="w-full btn-secondary text-sm"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      전표 다운로드
                    </button>
                    
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="w-full btn-secondary text-sm"
                    >
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      미리보기
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </motion.div>
        </div>

        {/* 전표 생성 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">자동 전표 생성 시스템</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <SparklesIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">자동 생성</h4>
              <p className="text-xs text-gray-600">
                Flow ID 기반으로 결제 즉시 전표가 자동 생성됩니다
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">승인 워크플로우</h4>
              <p className="text-xs text-gray-600">
                부서별 승인자에게 자동으로 전달되어 승인 처리가 자동화됩니다
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">국세청 연동</h4>
              <p className="text-xs text-gray-600">
                승인된 전표는 국세청 API와 연동되어 세무 처리가 자동화됩니다
              </p>
            </div>
          </div>
        </motion.div>
    </div>
  );
};

export default InvoiceGenerator; 