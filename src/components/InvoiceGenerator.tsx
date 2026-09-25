import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownTrayIcon,
  PrinterIcon,
  DocumentMagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, Highlight, AutoColumnsPill } from './ui';

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

const statusBadge = (s?: string) => {
  if (s === 'approved') return 'badge-success';
  if (s === 'rejected') return 'badge-error';
  return 'badge-warning';
};

const StatusTag: React.FC<{ status?: string }> = ({ status }) => (
  <span className={`badge ${statusBadge(status)} gap-1`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current" />
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader
            eyebrow="Invoice"
            title={
              <>
                증빙·전표 처리를 <Highlight>자동화</Highlight>합니다
              </>
            }
            description="Flow ID로 연결된 결제를 전표로 만들고, 승인까지 한 화면에서 처리합니다."
            right={
              <button
                onClick={() => generateInvoice('XK8P2M')}
                disabled={isGenerating}
                className="btn-primary text-sm py-2.5 px-5 disabled:opacity-40 self-start sm:self-auto"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                {isGenerating ? '생성 중…' : '새 전표 생성'}
              </button>
            }
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 전표 목록 — 발표자료 전표 테이블 */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-baseline justify-between mb-4 gap-3">
                <h2 className="card-title">
                  관리부 <span className="text-gray-400 font-semibold">전표 목록</span>
                </h2>
                <span className="text-xs text-gray-400 whitespace-nowrap">{invoices.length}건</span>
              </div>

              {isGenerating && (
                <div className="rounded-2xl bg-flow-50 p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-6 h-6 rounded-full bg-flow-500 text-white text-xs font-bold flex items-center justify-center">
                      {generationStep + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{generationSteps[generationStep]}</span>
                  </div>
                  <div className="progress-bar bg-white">
                    <div className="progress-fill" style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="overflow-x-auto -mx-6 sm:-mx-7 px-3 sm:px-4">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="table-head">전표일</th>
                      <th className="table-head">전표 번호</th>
                      <AutoColumnsPill labels={['계정과목', '부서']} />
                      <th className="table-head">결제 금액</th>
                      <th className="table-head">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => {
                      const selected = selectedInvoice?.id === invoice.id;
                      return (
                        <tr
                          key={invoice.id}
                          onClick={() => setSelectedInvoice(invoice)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedInvoice(invoice);
                            }
                          }}
                          tabIndex={0}
                          aria-selected={selected}
                          className={`cursor-pointer transition-colors outline-none focus-visible:bg-flow-50 ${
                            selected ? 'bg-flow-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="table-cell tabular-nums text-gray-500">{invoice.date.replace(/-/g, '.')}</td>
                          <td className={`table-cell font-medium ${selected ? 'text-flow-700' : 'text-gray-900'}`}>{invoice.id}</td>
                          <td className="table-cell w-28">{invoice.category}</td>
                          <td className="table-cell w-28">{invoice.department}</td>
                          <td className="table-cell font-semibold text-gray-900 tabular-nums">{invoice.amount.toLocaleString()}</td>
                          <td className="table-cell"><StatusTag status={invoice.approvalStatus} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 전표 상세 */}
          <div className="card">
            <h2 className="card-title mb-5">전표 상세</h2>
            <AnimatePresence mode="wait">
              {!selectedInvoice ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-flow-50 flex items-center justify-center mx-auto mb-4">
                    <DocumentMagnifyingGlassIcon className="h-8 w-8 text-flow-500" />
                  </div>
                  <p className="text-sm text-gray-400">전표를 선택하면 상세 정보를 확인할 수 있습니다.</p>
                </motion.div>
              ) : (
                <motion.div key={selectedInvoice.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex items-end justify-between pb-4 border-b border-gray-100">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-1">{selectedInvoice.id}</p>
                      <p className="font-semibold text-gray-900 truncate">{selectedInvoice.merchant}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums whitespace-nowrap ml-3">
                      {selectedInvoice.amount.toLocaleString()} <span className="text-base">원</span>
                    </p>
                  </div>

                  <div className="card-muted p-4">
                    <h3 className="text-xs font-semibold text-gray-400 mb-3">기본 정보</h3>
                    <div className="space-y-2 text-sm">
                      <DetailRow label="Flow ID" value={selectedInvoice.flowId} mono />
                      <DetailRow label="전표일" value={selectedInvoice.date} />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-flow-50 p-4">
                    <h3 className="text-xs font-semibold text-flow-700 mb-3">자동 분류</h3>
                    <div className="space-y-2 text-sm">
                      <DetailRow label="계정과목" value={selectedInvoice.category} />
                      <DetailRow label="부서" value={selectedInvoice.department} />
                    </div>
                  </div>

                  <div className="card-muted p-4">
                    <h3 className="text-xs font-semibold text-gray-400 mb-3">상품 내역</h3>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white rounded-xl px-3 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400">수량 {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 tabular-nums">{item.total.toLocaleString()} 원</p>
                            <p className="text-xs text-gray-400 tabular-nums">단가 {item.price.toLocaleString()} 원</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-muted p-4">
                    <h3 className="text-xs font-semibold text-gray-400 mb-3">승인 상태</h3>
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

                  <div className="space-y-2 pt-1">
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
                    <div className="flex gap-2">
                      <button onClick={() => downloadInvoice(selectedInvoice)} className="btn-secondary flex-1 text-sm px-3">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> 다운로드
                      </button>
                      <button className="btn-secondary flex-1 text-sm px-3">
                        <PrinterIcon className="h-4 w-4 mr-1.5" /> 미리보기
                      </button>
                    </div>
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
    <span className={`${bold ? 'font-semibold' : 'font-medium'} ${mono ? 'tracking-wide text-flow-700' : 'text-gray-900'}`}>{value}</span>
  </div>
);

export default InvoiceGenerator;
