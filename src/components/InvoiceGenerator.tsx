import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface InvoiceData {
  id: string;
  flowId: string;
  merchant: string;
  amount: number;
  date: string;
  department: string;
  category: string;
  items: Array<{ name: string; quantity: number; price: number; total: number }>;
  status: 'pending' | 'generated' | 'approved' | 'rejected';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvalDate?: string;
  notes?: string;
}

const generationSteps = [
  '데이터 수집 중...',
  '전표 형식 생성 중...',
  '부서 정보 매칭 중...',
  '승인 워크플로우 설정 중...',
  '국세청 연동 중...',
  '전표 생성 완료!',
];

const statusLabel = (s?: string) => (s === 'approved' ? '승인됨' : s === 'rejected' ? '거부됨' : '대기중');

const statusDotColor = (s?: string) => {
  if (s === 'approved') return 'bg-success-500';
  if (s === 'rejected') return 'bg-error-500';
  return 'bg-warning-500';
};

const StatusTag: React.FC<{ status?: string }> = ({ status }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
    <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(status)}`} />
    {statusLabel(status)}
  </span>
);

const InvoiceGenerator: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  useEffect(() => {
    setInvoices([
      {
        id: 'INV-2024-001', flowId: 'XK8P2M', merchant: '스타벅스 강남점', amount: 4500, date: '2024-01-15',
        department: '영업팀', category: '식비', items: [{ name: '아메리카노', quantity: 1, price: 4500, total: 4500 }],
        status: 'generated', approvalStatus: 'approved', approver: '김과장', approvalDate: '2024-01-15',
      },
      {
        id: 'INV-2024-002', flowId: 'XK8P2M', merchant: 'GS25 본사점', amount: 12000, date: '2024-01-15',
        department: '마케팅팀', category: '업무용품',
        items: [
          { name: 'A4용지', quantity: 2, price: 5000, total: 10000 },
          { name: '펜', quantity: 5, price: 400, total: 2000 },
        ],
        status: 'generated', approvalStatus: 'pending',
      },
      {
        id: 'INV-2024-003', flowId: 'XK8P2M', merchant: '맥도날드', amount: 8500, date: '2024-01-14',
        department: '개발팀', category: '식비', items: [{ name: '빅맥 세트', quantity: 1, price: 8500, total: 8500 }],
        status: 'generated', approvalStatus: 'approved', approver: '박팀장', approvalDate: '2024-01-14',
      },
      {
        id: 'INV-2024-004', flowId: 'XK8P2M', merchant: '올리브영', amount: 32000, date: '2024-01-14',
        department: '인사팀', category: '복리후생', items: [{ name: '화장품 세트', quantity: 1, price: 32000, total: 32000 }],
        status: 'generated', approvalStatus: 'rejected', approver: '이부장', approvalDate: '2024-01-14', notes: '복리후생 예산 초과',
      },
    ]);
  }, []);

  const generateInvoice = async (flowId: string) => {
    setIsGenerating(true);
    setGenerationStep(0);
    try {
      for (let i = 0; i < generationSteps.length; i++) {
        setGenerationStep(i);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      const newInvoice: InvoiceData = {
        id: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
        flowId, merchant: '새로운 가맹점', amount: Math.floor(Math.random() * 50000) + 10000,
        date: new Date().toISOString().split('T')[0], department: '관리부', category: '기타',
        items: [{ name: '상품', quantity: 1, price: 15000, total: 15000 }],
        status: 'generated', approvalStatus: 'pending',
      };
      setInvoices((prev) => [newInvoice, ...prev]);
      setSelectedInvoice(newInvoice);
    } catch (error) {
      console.error('전표 생성 중 오류:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const approveInvoice = (invoiceId: string, approved: boolean) => {
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              approvalStatus: approved ? 'approved' : 'rejected',
              approver: '김과장',
              approvalDate: new Date().toISOString().split('T')[0],
              notes: approved ? undefined : '승인 거부',
            }
          : invoice
      )
    );
    setSelectedInvoice((prev) =>
      prev && prev.id === invoiceId
        ? { ...prev, approvalStatus: approved ? 'approved' : 'rejected', approver: '김과장', approvalDate: new Date().toISOString().split('T')[0], notes: approved ? undefined : '승인 거부' }
        : prev
    );
  };

  const downloadInvoice = (invoice: InvoiceData) => {
    const content = `FlowPay 전표

전표번호: ${invoice.id}
Flow ID: ${invoice.flowId}
가맹점: ${invoice.merchant}
금액: ₩${invoice.amount.toLocaleString()}
날짜: ${invoice.date}
부서: ${invoice.department}
카테고리: ${invoice.category}

상품 내역:
${invoice.items.map((item) => `${item.name} x${item.quantity} - ₩${item.total.toLocaleString()}`).join('\n')}

승인 상태: ${statusLabel(invoice.approvalStatus)}
${invoice.approver ? `승인자: ${invoice.approver}` : ''}
${invoice.approvalDate ? `승인일: ${invoice.approvalDate}` : ''}`;

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

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-2">전표 생성</h1>
          <p className="text-gray-500 max-w-2xl leading-relaxed">
            Flow ID 기반으로 생성된 전표를 관리하고 승인을 처리합니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 전표 목록 */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">전표 목록</h2>
                <button onClick={() => generateInvoice('XK8P2M')} disabled={isGenerating} className="btn-primary text-sm py-2.5 px-5 disabled:opacity-40">
                  {isGenerating ? '생성 중…' : '새 전표 생성'}
                </button>
              </div>

              {isGenerating && (
                <div className="card-muted p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent" />
                    <span className="text-sm font-medium text-gray-900">{generationSteps[generationStep]}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <button
                    key={invoice.id}
                    onClick={() => setSelectedInvoice(invoice)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedInvoice?.id === invoice.id ? 'border-flow-500 bg-flow-50/40 ring-1 ring-flow-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="icon-container icon-container-muted w-10 h-10">
                          <DocumentTextIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{invoice.id}</h3>
                          <p className="text-sm text-gray-500 truncate">{invoice.merchant}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-semibold text-gray-900">₩{invoice.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 font-mono">{invoice.flowId}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{invoice.date}</span>
                        <span>{invoice.department}</span>
                        <span>{invoice.category}</span>
                      </div>
                      <StatusTag status={invoice.approvalStatus} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 전표 상세 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">전표 상세</h2>
            <AnimatePresence mode="wait">
              {!selectedInvoice ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <DocumentMagnifyingGlassIcon className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-400">전표를 선택하면 상세 정보를 확인할 수 있습니다.</p>
                </motion.div>
              ) : (
                <motion.div key={selectedInvoice.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="card-muted p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">기본 정보</h3>
                    <div className="space-y-2 text-sm">
                      <DetailRow label="전표번호" value={selectedInvoice.id} />
                      <DetailRow label="Flow ID" value={selectedInvoice.flowId} mono />
                      <DetailRow label="가맹점" value={selectedInvoice.merchant} />
                      <DetailRow label="금액" value={`₩${selectedInvoice.amount.toLocaleString()}`} bold />
                      <DetailRow label="날짜" value={selectedInvoice.date} />
                    </div>
                  </div>

                  <div className="card-muted p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">자동 분류</h3>
                    <div className="space-y-2 text-sm">
                      <DetailRow label="부서" value={selectedInvoice.department} />
                      <DetailRow label="카테고리" value={selectedInvoice.category} />
                    </div>
                  </div>

                  <div className="card-muted p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">상품 내역</h3>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white rounded-xl px-3 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400">수량 {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">₩{item.total.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">단가 ₩{item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-muted p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">승인 상태</h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">상태</span>
                        <StatusTag status={selectedInvoice.approvalStatus} />
                      </div>
                      {selectedInvoice.approver && <DetailRow label="승인자" value={selectedInvoice.approver} />}
                      {selectedInvoice.approvalDate && <DetailRow label="승인일" value={selectedInvoice.approvalDate} />}
                      {selectedInvoice.notes && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">비고</span>
                          <span className="font-medium text-error-600">{selectedInvoice.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedInvoice.approvalStatus === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => approveInvoice(selectedInvoice.id, true)} className="btn-success flex-1 text-sm">
                          승인
                        </button>
                        <button onClick={() => approveInvoice(selectedInvoice.id, false)} className="btn-error flex-1 text-sm">
                          거부
                        </button>
                      </div>
                    )}
                    <button onClick={() => downloadInvoice(selectedInvoice)} className="btn-secondary w-full text-sm">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> 전표 다운로드
                    </button>
                    <button className="btn-secondary w-full text-sm">
                      <PrinterIcon className="h-4 w-4 mr-1.5" /> 미리보기
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string; bold?: boolean; mono?: boolean }> = ({ label, value, bold, mono }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className={`${bold ? 'font-semibold' : 'font-medium'} ${mono ? 'font-mono text-flow-600' : 'text-gray-900'}`}>{value}</span>
  </div>
);

export default InvoiceGenerator;
