import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  DocumentMagnifyingGlassIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useFlowPay } from '../store/FlowPayContext';
import { departmentName, projectName } from '../store/selectors';
import { categoryById, METHOD_LABELS } from '../data/constants';
import { formatDate, formatDateTime, won } from '../utils/format';
import { downloadFile, toCsv } from '../utils/csv';
import { EmptyState, Modal, Page, PageHeader, Row, Segmented, StatusTag, TaxTag, approvalLabel, fade, taxLabel, useToast } from './ui';
import { Invoice } from '../types';

type Tab = 'all' | 'pending' | 'approved' | 'rejected' | 'unfiled';

const generationSteps = ['거래 데이터 수집 중', '계정과목 매핑 중', '공급가액·부가세 계산 중', '부서 승인자 배정 중', '전표 생성 완료'];

const PAGE_SIZE = 30;

const InvoiceGenerator: React.FC = () => {
  const { state, setApproval, submitTax, createInvoices } = useFlowPay();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const selectedId = params.get('id');
  const selected = state.invoices.find((i) => i.id === selectedId) ?? null;

  const counts = useMemo(
    () => ({
      all: state.invoices.length,
      pending: state.invoices.filter((i) => i.approvalStatus === 'pending').length,
      approved: state.invoices.filter((i) => i.approvalStatus === 'approved').length,
      rejected: state.invoices.filter((i) => i.approvalStatus === 'rejected').length,
      unfiled: state.invoices.filter((i) => i.approvalStatus === 'approved' && i.taxStatus === 'not_submitted').length,
    }),
    [state.invoices]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.invoices.filter((i) => {
      const tabOk =
        tab === 'all' ||
        (tab === 'unfiled' ? i.approvalStatus === 'approved' && i.taxStatus === 'not_submitted' : i.approvalStatus === tab);
      return tabOk && (!q || [i.id, i.merchant, i.flowId, departmentName(state, i.departmentId)].some((v) => v.toLowerCase().includes(q)));
    });
  }, [state, tab, query]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
    setChecked(new Set());
  }, [tab, query]);

  const select = (id: string) => {
    setParams({ id }, { replace: true });
    if (window.innerWidth < 1024) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const toggleCheck = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const visible = filtered.slice(0, limit);
  const allChecked = visible.length > 0 && visible.every((i) => checked.has(i.id));
  const checkedList = state.invoices.filter((i) => checked.has(i.id));
  const approvable = checkedList.filter((i) => i.approvalStatus === 'pending').map((i) => i.id);
  const fileable = checkedList.filter((i) => i.approvalStatus === 'approved' && i.taxStatus === 'not_submitted').map((i) => i.id);

  const bulkApprove = () => {
    setApproval(approvable, 'approved');
    toast(`${approvable.length}건을 승인했습니다`);
    setChecked(new Set());
  };

  const bulkFile = () => {
    submitTax(fileable);
    toast(`${fileable.length}건을 국세청(홈택스)으로 전송합니다`, 'info');
    setChecked(new Set());
  };

  const exportCsv = () => {
    const csv = toCsv(
      ['전표번호', '거래일시', 'Flow ID', '가맹점', '공급가액', '부가세', '합계', '부서', '계정과목', '계정코드', '프로젝트', '승인자', '결재상태', '결재일', '반려사유', '국세청'],
      filtered.map((i) => [
        i.id,
        formatDateTime(i.date),
        i.flowId,
        i.merchant,
        i.supplyAmount,
        i.vat,
        i.amount,
        departmentName(state, i.departmentId),
        categoryById(i.categoryId).account,
        categoryById(i.categoryId).accountCode,
        i.projectId ? projectName(state, i.projectId) : '',
        i.approver,
        approvalLabel(i.approvalStatus),
        i.approvalDate ? formatDate(i.approvalDate) : '',
        i.rejectReason ?? '',
        taxLabel(i.taxStatus),
      ])
    );
    downloadFile(`FlowPay_전표_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <Page>
      <PageHeader
        title="전표"
        description="Flow ID 기반으로 생성된 전표를 결재하고, 승인된 전표를 국세청(홈택스)으로 전송합니다."
        actions={
          <>
            <button onClick={exportCsv} disabled={!filtered.length} className="btn-secondary text-sm py-2.5 px-4 disabled:opacity-40">
              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> CSV
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-2.5 px-4">
              <PlusIcon className="h-4 w-4 mr-1.5" /> 새 전표 생성
            </button>
          </>
        }
      />

      {/* 요약 */}
      <motion.div {...fade} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { id: 'pending' as Tab, label: '승인 대기', value: counts.pending },
          { id: 'approved' as Tab, label: '승인 완료', value: counts.approved },
          { id: 'unfiled' as Tab, label: '국세청 미전송', value: counts.unfiled },
          { id: 'rejected' as Tab, label: '반려', value: counts.rejected },
        ].map((s) => (
          <button key={s.id} onClick={() => setTab(s.id)} className={`card p-5 text-left card-hover ${tab === s.id ? 'ring-1 ring-flow-500 border-flow-500' : ''}`}>
            <p className="text-2xl font-semibold text-gray-900 tabular-nums">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* 전표 목록 */}
        <div className="lg:col-span-3 card">
          <Segmented
            className="mb-3"
            value={tab}
            onChange={(id) => setTab(id as Tab)}
            options={[
              { id: 'all', name: '전체', count: counts.all },
              { id: 'pending', name: '대기', count: counts.pending },
              { id: 'approved', name: '승인', count: counts.approved },
              { id: 'rejected', name: '반려', count: counts.rejected },
            ]}
          />
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input className="input-field pl-11" placeholder="전표번호, 가맹점, Flow ID, 부서 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {/* 일괄 처리 바 */}
          <div className="flex flex-wrap items-center gap-2 mb-3 min-h-[40px]">
            <label className="flex items-center gap-2 text-sm text-gray-500 mr-auto cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-flow-600 focus:ring-flow-500"
                checked={allChecked}
                onChange={() => setChecked(allChecked ? new Set() : new Set(visible.map((i) => i.id)))}
              />
              {checked.size ? `${checked.size}건 선택` : '전체 선택'}
            </label>
            {approvable.length > 0 && (
              <button onClick={bulkApprove} className="btn-success text-sm py-2 px-4">
                <CheckIcon className="h-4 w-4 mr-1" /> {approvable.length}건 승인
              </button>
            )}
            {fileable.length > 0 && (
              <button onClick={bulkFile} className="btn-accent text-sm py-2 px-4">
                <PaperAirplaneIcon className="h-4 w-4 mr-1" /> {fileable.length}건 국세청 전송
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={DocumentTextIcon} message="해당하는 전표가 없습니다." />
          ) : (
            <div className="space-y-2">
              {visible.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                    selected?.id === invoice.id ? 'border-flow-500 bg-flow-50/40 ring-1 ring-flow-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    aria-label={`${invoice.id} 선택`}
                    className="mt-1 rounded text-flow-600 focus:ring-flow-500"
                    checked={checked.has(invoice.id)}
                    onChange={() => toggleCheck(invoice.id)}
                  />
                  <button onClick={() => select(invoice.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{invoice.merchant}</h3>
                        <p className="text-xs text-gray-400 truncate">
                          {invoice.id} · {categoryById(invoice.categoryId).account}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900">{won(invoice.amount)}</p>
                        <p className="text-xs text-gray-400 font-mono">{invoice.flowId}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{formatDate(invoice.date)}</span>
                        <span>{departmentName(state, invoice.departmentId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {invoice.approvalStatus === 'approved' && <TaxTag status={invoice.taxStatus} />}
                        <StatusTag status={invoice.approvalStatus} />
                      </div>
                    </div>
                  </button>
                </div>
              ))}
              {filtered.length > limit && (
                <button onClick={() => setLimit((l) => l + PAGE_SIZE)} className="btn-secondary w-full text-sm">
                  더 보기 ({filtered.length - limit}건 남음)
                </button>
              )}
            </div>
          )}
        </div>

        {/* 전표 상세 */}
        <div ref={detailRef} className="lg:col-span-2 card lg:sticky lg:top-6 lg:self-start scroll-mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">전표 상세</h2>
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState icon={DocumentMagnifyingGlassIcon} message="전표를 선택하면 상세 정보를 확인할 수 있습니다." />
              </motion.div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <InvoiceDetail invoice={selected} onPreview={() => setShowPreview(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CreateInvoiceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(ids) => {
          const created = createInvoices(ids);
          if (created.length) {
            toast(`전표 ${created.length}건을 생성했습니다`);
            setTab('pending');
            setParams({ id: created[0].id }, { replace: true });
          }
          setShowCreate(false);
        }}
      />

      {selected && (
        <Modal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          title="전표 미리보기"
          size="lg"
          footer={
            <>
              <button onClick={() => setShowPreview(false)} className="btn-secondary flex-1 text-sm">
                닫기
              </button>
              <button onClick={() => window.print()} className="btn-primary flex-1 text-sm">
                <PrinterIcon className="h-4 w-4 mr-1.5" /> 인쇄 · PDF 저장
              </button>
            </>
          }
        >
          <PrintableInvoice invoice={selected} />
        </Modal>
      )}
    </Page>
  );
};

const InvoiceDetail: React.FC<{ invoice: Invoice; onPreview: () => void }> = ({ invoice, onPreview }) => {
  const { state, setApproval, submitTax } = useFlowPay();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const tx = state.transactions.find((t) => t.id === invoice.transactionId);
  const category = categoryById(invoice.categoryId);
  const hasEvidence = !!tx?.receiptId || tx?.method === 'flowpay';

  useEffect(() => {
    setRejecting(false);
    setReason('');
  }, [invoice.id]);

  const download = () => {
    const content = [
      'FlowPay 전표',
      '',
      `전표번호: ${invoice.id}`,
      `거래번호: ${invoice.transactionId}`,
      `Flow ID: ${invoice.flowId}`,
      `가맹점: ${invoice.merchant}`,
      `거래일시: ${formatDateTime(invoice.date)}`,
      `부서: ${departmentName(state, invoice.departmentId)}`,
      `계정과목: ${category.account} (${category.accountCode})`,
      `프로젝트: ${projectName(state, invoice.projectId)}`,
      '',
      `공급가액: ${won(invoice.supplyAmount)}`,
      `부가세: ${won(invoice.vat)}`,
      `합계: ${won(invoice.amount)}`,
      '',
      '품목:',
      ...invoice.items.map((it) => `  ${it.name} x${it.quantity} - ${won(it.price * it.quantity)}`),
      '',
      `승인자: ${invoice.approver}`,
      `결재 상태: ${approvalLabel(invoice.approvalStatus)}`,
      invoice.approvalDate ? `결재일: ${formatDate(invoice.approvalDate)}` : '',
      invoice.rejectReason ? `반려 사유: ${invoice.rejectReason}` : '',
      `국세청: ${taxLabel(invoice.taxStatus)}${invoice.ntsReference ? ` (${invoice.ntsReference})` : ''}`,
    ]
      .filter((l) => l !== undefined)
      .join('\n');
    downloadFile(`${invoice.id}.txt`, content, 'text/plain;charset=utf-8');
  };

  return (
    <div className="space-y-4">
      <div className="card-muted p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">기본 정보</h3>
        <div className="space-y-2 text-sm">
          <Row label="전표번호" value={invoice.id} />
          <Row
            label="거래"
            value={
              <Link to={`/transactions?id=${invoice.transactionId}`} className="text-flow-600">
                {invoice.transactionId}
              </Link>
            }
          />
          <Row label="Flow ID" value={invoice.flowId} mono />
          <Row label="가맹점" value={invoice.merchant} />
          <Row label="거래일시" value={formatDateTime(invoice.date)} />
          {tx && <Row label="결제 수단" value={METHOD_LABELS[tx.method]} />}
        </div>
      </div>

      <div className="card-muted p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">회계 처리</h3>
        <div className="space-y-2 text-sm">
          <Row label="부서" value={departmentName(state, invoice.departmentId)} />
          <Row label="계정과목" value={`${category.account} (${category.accountCode})`} />
          <Row label="프로젝트" value={projectName(state, invoice.projectId)} />
          <div className="border-t border-gray-200 my-1" />
          <Row label="공급가액" value={won(invoice.supplyAmount)} />
          <Row label="부가세" value={won(invoice.vat)} />
          <Row label="합계" value={won(invoice.amount)} bold />
          <Row
            label="증빙"
            value={hasEvidence ? (tx?.receiptId ? `영수증 ${tx.receiptId}` : 'PG 전자영수증') : '미첨부'}
            tone={hasEvidence ? 'default' : 'error'}
          />
        </div>
        {!hasEvidence && tx && (
          <Link to={`/receipt?tx=${tx.id}`} className="block text-xs text-flow-600 font-medium mt-2 text-right">
            영수증 첨부하기
          </Link>
        )}
      </div>

      <div className="card-muted p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">품목</h3>
        <div className="space-y-2">
          {invoice.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center bg-white rounded-xl px-3 py-2.5 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">
                  {won(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{won(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card-muted p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">결재 · 세무</h3>
        <div className="space-y-2.5 text-sm">
          <Row label="승인자" value={`${invoice.approver} (${departmentName(state, invoice.departmentId)})`} />
          <div className="flex justify-between items-center">
            <span className="text-gray-500">결재 상태</span>
            <StatusTag status={invoice.approvalStatus} />
          </div>
          {invoice.approvalDate && <Row label="결재일" value={formatDate(invoice.approvalDate)} />}
          {invoice.rejectReason && <Row label="반려 사유" value={invoice.rejectReason} tone="error" />}
          <div className="flex justify-between items-center">
            <span className="text-gray-500">국세청</span>
            <TaxTag status={invoice.taxStatus} />
          </div>
          {invoice.ntsReference && <Row label="접수번호" value={invoice.ntsReference} />}
        </div>
      </div>

      <div className="space-y-2">
        {invoice.approvalStatus === 'pending' &&
          (rejecting ? (
            <div className="space-y-2">
              <textarea
                className="input-field text-sm"
                rows={2}
                placeholder="반려 사유를 입력하세요 (필수)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setRejecting(false)} className="btn-secondary flex-1 text-sm">
                  취소
                </button>
                <button
                  disabled={!reason.trim()}
                  onClick={() => {
                    setApproval([invoice.id], 'rejected', reason.trim());
                    toast(`${invoice.id} 전표를 반려했습니다`, 'info');
                  }}
                  className="btn-error flex-1 text-sm disabled:opacity-40"
                >
                  반려 확정
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setApproval([invoice.id], 'approved');
                  toast(`${invoice.id} 전표를 승인했습니다`);
                }}
                className="btn-success flex-1 text-sm"
              >
                승인
              </button>
              <button onClick={() => setRejecting(true)} className="btn-error flex-1 text-sm">
                반려
              </button>
            </div>
          ))}
        {invoice.approvalStatus === 'approved' && invoice.taxStatus === 'not_submitted' && (
          <button
            onClick={() => {
              submitTax([invoice.id]);
              toast('국세청(홈택스)으로 전송합니다', 'info');
            }}
            className="btn-accent w-full text-sm"
          >
            <PaperAirplaneIcon className="h-4 w-4 mr-1.5" /> 국세청 전송
          </button>
        )}
        <div className="flex gap-2">
          <button onClick={download} className="btn-secondary flex-1 text-sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> 다운로드
          </button>
          <button onClick={onPreview} className="btn-secondary flex-1 text-sm">
            <PrinterIcon className="h-4 w-4 mr-1.5" /> 미리보기
          </button>
        </div>
      </div>
    </div>
  );
};

/** 인쇄용 지출결의서 양식 */
const PrintableInvoice: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
  const { state } = useFlowPay();
  const category = categoryById(invoice.categoryId);
  const cell = 'border border-gray-300 px-3 py-2 text-sm';
  return (
    <div className="print-area text-gray-900">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">지출결의서</h1>
          <p className="text-sm text-gray-500 mt-1">{invoice.id}</p>
        </div>
        <table className="border-collapse text-center">
          <tbody>
            <tr>
              <th className={`${cell} bg-gray-50 font-medium`}>작성</th>
              <th className={`${cell} bg-gray-50 font-medium`}>승인</th>
            </tr>
            <tr>
              <td className={`${cell} font-mono h-12`}>{invoice.flowId}</td>
              <td className={`${cell} h-12`}>
                {invoice.approver}
                <div className="text-xs text-gray-400">{approvalLabel(invoice.approvalStatus)}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className="w-full border-collapse mb-6">
        <tbody>
          {[
            ['부서', departmentName(state, invoice.departmentId), '거래일', formatDate(invoice.date)],
            ['계정과목', `${category.account} (${category.accountCode})`, '프로젝트', projectName(state, invoice.projectId)],
            ['거래처', invoice.merchant, '거래번호', invoice.transactionId],
          ].map(([a, b, c, d]) => (
            <tr key={a}>
              <th className={`${cell} bg-gray-50 font-medium w-24 text-left`}>{a}</th>
              <td className={cell}>{b}</td>
              <th className={`${cell} bg-gray-50 font-medium w-24 text-left`}>{c}</th>
              <td className={cell}>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-gray-50">
            <th className={`${cell} font-medium text-left`}>품목</th>
            <th className={`${cell} font-medium text-right w-16`}>수량</th>
            <th className={`${cell} font-medium text-right w-28`}>단가</th>
            <th className={`${cell} font-medium text-right w-28`}>금액</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, i) => (
            <tr key={i}>
              <td className={cell}>{it.name}</td>
              <td className={`${cell} text-right`}>{it.quantity}</td>
              <td className={`${cell} text-right`}>{won(it.price)}</td>
              <td className={`${cell} text-right`}>{won(it.price * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className={`${cell} text-right`} colSpan={3}>공급가액</td>
            <td className={`${cell} text-right`}>{won(invoice.supplyAmount)}</td>
          </tr>
          <tr>
            <td className={`${cell} text-right`} colSpan={3}>부가세</td>
            <td className={`${cell} text-right`}>{won(invoice.vat)}</td>
          </tr>
          <tr className="bg-gray-50">
            <td className={`${cell} text-right font-semibold`} colSpan={3}>합계</td>
            <td className={`${cell} text-right font-semibold`}>{won(invoice.amount)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="text-xs text-gray-400">
        본 전표는 FlowPay가 Flow ID 기반으로 자동 생성했습니다. 작성자는 개인정보 대신 익명 토큰으로 표시됩니다. ·{' '}
        세무 처리: {taxLabel(invoice.taxStatus)}
        {invoice.ntsReference ? ` (${invoice.ntsReference})` : ''}
      </p>
    </div>
  );
};

const CreateInvoiceModal: React.FC<{ open: boolean; onClose: () => void; onCreate: (ids: string[]) => void }> = ({
  open,
  onClose,
  onCreate,
}) => {
  const { state } = useFlowPay();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const candidates = useMemo(
    () => state.transactions.filter((t) => t.status === 'completed' && !t.invoiceId).slice(0, 50),
    [state.transactions]
  );

  useEffect(() => {
    if (!open) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPicked(new Set());
      setStep(null);
    }
  }, [open]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    const ids = Array.from(picked);
    setStep(0);
    generationSteps.forEach((_, i) => timers.current.push(setTimeout(() => setStep(i), i * 400)));
    timers.current.push(setTimeout(() => onCreate(ids), generationSteps.length * 400));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="새 전표 생성"
      footer={
        step === null ? (
          <>
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">
              취소
            </button>
            <button onClick={run} disabled={!picked.size} className="btn-primary flex-1 text-sm disabled:opacity-40">
              {picked.size ? `${picked.size}건 생성` : '거래를 선택하세요'}
            </button>
          </>
        ) : undefined
      }
    >
      {step !== null ? (
        <div className="py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent" />
            <span className="text-sm font-medium text-gray-900">{generationSteps[step]}…</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((step + 1) / generationSteps.length) * 100}%` }} />
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState icon={DocumentTextIcon} message="전표가 없는 거래가 없습니다. 모든 거래가 처리되었습니다." />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">전표가 아직 없는 거래입니다. 승인자는 부서별로 자동 배정됩니다.</p>
          <label className="flex items-center gap-2 text-sm text-gray-500 mb-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded text-flow-600 focus:ring-flow-500"
              checked={picked.size === candidates.length}
              onChange={() => setPicked(picked.size === candidates.length ? new Set() : new Set(candidates.map((t) => t.id)))}
            />
            전체 선택 ({candidates.length})
          </label>
          <div className="space-y-1.5">
            {candidates.map((t) => {
              const noEvidence = !t.receiptId && t.method !== 'flowpay';
              return (
                <label key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    className="rounded text-flow-600 focus:ring-flow-500"
                    checked={picked.has(t.id)}
                    onChange={() =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        next.has(t.id) ? next.delete(t.id) : next.add(t.id);
                        return next;
                      })
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.merchant}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(t.date)} · {departmentName(state, t.departmentId)} · {categoryById(t.categoryId).account}
                      {noEvidence && <span className="text-warning-700"> · 증빙 미첨부</span>}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{won(t.amount)}</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
};

export default InvoiceGenerator;
